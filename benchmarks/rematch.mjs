/* 재대결 — "어떻게든 다중이 단일을 이긴다" 탐색.
   S 단일Solar(챔피언) vs M1 Self-MoA렌즈 / M2 Self-MoA샘플링 / M3 이종강모델MoA / M4 Self-Refine.
   심판 3개+재시도+저온으로 지난 '심판1편중' 제거. n=10, 블라인드.
   실행: cd ideation-engine && node benchmarks/rematch.mjs   결과: benchmarks/rematch.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const SOLAR = "upstage/solar-pro4", GEM = "google/gemini-2.5-flash", MIS = "mistralai/mistral-medium-3";
const JUDGES = ["z-ai/glm-4.6", "meta-llama/llama-3.3-70b-instruct", "openai/gpt-4o-mini"];
const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스",
  "중고 거래의 사기를 줄이는 앱", "노인의 디지털 기기 사용을 돕는 서비스", "반려동물 산책 메이트를 연결하는 앱",
  "지역 축제 참여를 늘리는 플랫폼", "학원 강사의 학부모 소통을 돕는 도구", "탄소 배출을 줄이는 시민 참여 앱",
  "프리랜서의 계약·정산을 돕는 서비스",
];
const SYS = "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 겹치지 않는 새 아이디어 하나씩, 각 2문장 이내 한국어.";
const LENSES = ["실용성·수익성을 특히 강조하라.", "사용자경험·감성을 특히 강조하라.", "기술 참신성·차별화를 특히 강조하라."];
const AGG = "너는 아이디어 종합가다. 아래 여러 버전을 종합해 각 강점을 살리고 중복 제거하여, 4관점(사업성·UX·기술·참신함)을 커버하는 최고의 최종 아이디어 4개로 정리하라. 각 2문장 이내 한국어.";

async function call(slug, messages, { maxTok = 600, temp = 0.8 } = {}) {
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Rematch" }, body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: temp, usage: { include: true }, reasoning: { enabled: false } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status} ${JSON.stringify(d).slice(0, 120)}`);
      return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 400)); }
  }
}
async function synth(g, versions) {
  const r = await call(SOLAR, [{ role: "system", content: AGG }, { role: "user", content: `목표: ${g}\n\n${versions.map((t, i) => `### 버전${i + 1}\n${t}`).join("\n\n")}` }]);
  return r;
}
// 설정들 — 각기 {text, cost} 반환. 실패 시 null(그 골 스킵).
async function S_single(g) { const r = await call(SOLAR, [{ role: "system", content: SYS }, { role: "user", content: `목표: ${g}` }]); return { text: r.text, cost: r.cost }; }
async function M1_lens(g) { let c = 0; const vs = []; for (const L of LENSES) { const r = await call(SOLAR, [{ role: "system", content: SYS + " " + L }, { role: "user", content: `목표: ${g}` }]); vs.push(r.text); c += r.cost; } const a = await synth(g, vs); return { text: a.text, cost: c + a.cost }; }
async function M2_sample(g) { let c = 0; const vs = []; for (let i = 0; i < 4; i++) { const r = await call(SOLAR, [{ role: "system", content: SYS }, { role: "user", content: `목표: ${g}` }], { temp: 1.1 }); vs.push(r.text); c += r.cost; } const a = await synth(g, vs); return { text: a.text, cost: c + a.cost }; }
async function M3_hetero(g) { let c = 0; const vs = []; for (const m of [SOLAR, GEM, MIS]) { const r = await call(m, [{ role: "system", content: SYS }, { role: "user", content: `목표: ${g}` }]); vs.push(r.text); c += r.cost; } const a = await synth(g, vs); return { text: a.text, cost: c + a.cost }; }
async function M4_refine(g) {
  const d = await call(SOLAR, [{ role: "system", content: SYS }, { role: "user", content: `목표: ${g}` }]);
  const cr = await call(SOLAR, [{ role: "system", content: "너는 엄격한 아이디어 비평가다. 아래 아이디어들의 약점(진부함·모호함·관점누락)을 관점별로 짧게 지적하라." }, { role: "user", content: `목표: ${g}\n\n${d.text}` }]);
  const rv = await call(SOLAR, [{ role: "system", content: SYS + " 아래 비평을 반영해 더 구체적이고 참신하게 개선하라." }, { role: "user", content: `목표: ${g}\n\n[초안]\n${d.text}\n\n[비평]\n${cr.text}` }]);
  return { text: rv.text, cost: d.cost + cr.cost + rv.cost };
}
const CFG = [["S_single", S_single], ["M1_lens", M1_lens], ["M2_sample", M2_sample], ["M3_hetero", M3_hetero], ["M4_refine", M4_refine]];
const L5 = ["A", "B", "C", "D", "E"];
async function judgeOne(slug, g, items) {
  for (let a = 0; a < 2; a++) {
    try {
      const listed = items.map((x, i) => `[${L5[i]}]\n${x}`).join("\n\n");
      const r = await call(slug, [{ role: "system", content: `아래 5개 아이디어 묶음을 각 1~5점(다양성·구체성·관점충실·한국어 품질). 설명·코드블록 금지. JSON만: {"A":n,"B":n,"C":n,"D":n,"E":n}` }, { role: "user", content: `목표: ${g}\n\n${listed}` }], { maxTok: 120, temp: 0.2 });
      const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]);
      if (L5.every((l) => p[l] >= 1 && p[l] <= 5)) return p;
    } catch { }
    await new Promise((s) => setTimeout(s, 300));
  }
  return null;
}
const acc = {}; for (const [k] of CFG) acc[k] = { s: 0, sn: 0, c: 0, cn: 0, wins: 0 };
const perGoal = [];
for (const g of GOALS) {
  const outs = {};
  for (const [k, fn] of CFG) { try { outs[k] = await fn(g); } catch (e) { outs[k] = null; console.log(`  ${k} 실패: ${String(e).slice(0, 80)}`); } }
  const keys = CFG.map(([k]) => k).filter((k) => outs[k] && outs[k].text);
  if (keys.length < 2) { console.log(`${g.slice(0, 10)} 생성부족 스킵`); continue; }
  const sh = keys.map((k) => ({ k, text: outs[k].text })).map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const judged = [];
  for (const j of JUDGES) { const p = await judgeOne(j, g, sh.map((x) => x.text)); if (p) judged.push(p); }
  if (!judged.length) { console.log(`${g.slice(0, 10)} 심판전부실패`); continue; }
  const goalScore = {};
  sh.forEach((it, i) => { const vals = judged.map((p) => Number(p[L5[i]])).filter((v) => v >= 1 && v <= 5); if (vals.length) { const avg = vals.reduce((a, b) => a + b, 0) / vals.length; acc[it.k].s += avg; acc[it.k].sn++; goalScore[it.k] = +avg.toFixed(2); } });
  for (const k of keys) { acc[k].c += outs[k].cost; acc[k].cn++; }
  const best = Object.entries(goalScore).sort((a, b) => b[1] - a[1])[0]; if (best) acc[best[0]].wins++;
  perGoal.push({ goal: g, judges: judged.length, scores: goalScore, winner: best?.[0] });
  console.log(`${g.slice(0, 12)} 심판${judged.length}  승자=${best?.[0]}  ${Object.entries(goalScore).map(([k, v]) => k.split("_")[0] + v).join(" ")}`);
}
const q = (k) => acc[k].sn ? +(acc[k].s / acc[k].sn).toFixed(3) : null;
const co = (k) => acc[k].cn ? +(acc[k].c / acc[k].cn).toFixed(6) : null;
const rows = CFG.map(([k]) => ({ config: k, quality: q(k), cost: co(k), wins: acc[k].wins, judgedGoals: acc[k].sn }));
fs.writeFileSync("benchmarks/rematch.json", JSON.stringify({ ranAt: new Date().toISOString(), n: GOALS.length, judges: JUDGES, rows, perGoal }, null, 2));
console.log(`\n=== 재대결 (n=${GOALS.length}, 심판 3) ===`);
[...rows].sort((a, b) => (b.quality || 0) - (a.quality || 0)).forEach((r) => console.log(`${r.config.padEnd(11)} 품질 ${r.quality}  승 ${r.wins}/${r.judgedGoals}  비용 $${r.cost}`));
const s = q("S_single"), win = rows.filter((r) => r.config !== "S_single" && r.quality > s).sort((a, b) => b.quality - a.quality)[0];
console.log(win ? `\n>>> 단일(${s}) 넘은 다중: ${win.config} (${win.quality}) — 차 +${(win.quality - s).toFixed(3)}` : `\n>>> 단일 Solar(${s})를 넘은 다중 없음`);
console.log("SAVED benchmarks/rematch.json");
