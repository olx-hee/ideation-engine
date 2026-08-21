/* 섞기 검증 — "단일 Solar가 정말 최선인가? 여러 모델을 역할/섞기로 쓰면 이기나?"
   문헌의 '좋은 섞기'(희석 아닌) 2형태를 단일·자기정제와 대결:
   S 단일Solar / SR Solar Self-Refine(같은모델 3패스) /
   XR 교차정제(Solar 초안→Kimi 비평→Solar 수정, 외부시각 주입) /
   SEL 관점별 선택(Solar+Gemini+Kimi 각자 4관점→관점마다 최고 선택, 평균 아님).
   심판 3(생성모델과 겹치지 않음: GPT-4o-mini·Llama·Mistral) 블라인드·저온·재시도. n=7.
   실행: cd ideation-engine && node benchmarks/mixing-verify.mjs   결과: benchmarks/mixing-verify.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const SOLAR = "upstage/solar-pro4", KIMI = "moonshotai/kimi-k2.5", GEM = "google/gemini-2.5-flash";
const JUDGES = ["openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct", "mistralai/mistral-medium-3"];
const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스",
  "중고 거래의 사기를 줄이는 앱", "노인의 디지털 기기 사용을 돕는 서비스", "지역 축제 참여를 늘리는 플랫폼",
  "프리랜서의 계약·정산을 돕는 서비스",
];
const SYS = "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 겹치지 않는 새 아이디어 하나씩, 각 2문장 이내 한국어.";

async function call(slug, messages, { maxTok = 600, temp = 0.8 } = {}) {
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-MixVerify" }, body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: temp, usage: { include: true } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status} ${JSON.stringify(d).slice(0, 90)}`);
      const text = (d.choices?.[0]?.message?.content || "").trim(); const cost = (d.usage || {}).cost || 0;
      if (!text && a === 0) { maxTok += 800; continue; }
      return { text, cost };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 400)); }
  }
  return { text: "", cost: 0 };
}
const gen = (slug, g) => call(slug, [{ role: "system", content: SYS }, { role: "user", content: `목표: ${g}` }]);

async function S_single(g) { const r = await gen(SOLAR, g); return { text: r.text, cost: r.cost }; }
async function SR_selfrefine(g) {
  const d = await gen(SOLAR, g);
  const c = await call(SOLAR, [{ role: "system", content: "너는 엄격한 아이디어 비평가다. 아래 아이디어들의 약점(진부함·모호함·관점 누락·실현성)을 관점별로 짧게 지적하라." }, { role: "user", content: `목표: ${g}\n\n[초안]\n${d.text}` }]);
  const r = await call(SOLAR, [{ role: "system", content: SYS + " 아래 비평을 반영해 더 구체적이고 참신하게 개선하라." }, { role: "user", content: `목표: ${g}\n\n[초안]\n${d.text}\n\n[비평]\n${c.text}` }]);
  return { text: r.text, cost: d.cost + c.cost + r.cost };
}
async function XR_crossrefine(g) { // Solar 초안 → Kimi 비평(외부시각) → Solar 수정
  const d = await gen(SOLAR, g);
  const c = await call(KIMI, [{ role: "system", content: "너는 엄격하고 관점이 다른 외부 아이디어 비평가다. 아래 아이디어들의 약점과 놓친 각도를 관점별로 날카롭게 지적하라." }, { role: "user", content: `목표: ${g}\n\n[초안]\n${d.text}` }]);
  const r = await call(SOLAR, [{ role: "system", content: SYS + " 아래 외부 비평을 반영해 더 구체적이고 참신하게 개선하라." }, { role: "user", content: `목표: ${g}\n\n[초안]\n${d.text}\n\n[외부 비평]\n${c.text}` }]);
  return { text: r.text, cost: d.cost + c.cost + r.cost };
}
async function SEL_perperspective(g) { // 3모델 각자 4관점 → 관점마다 최고 선택(평균/재작성 아님)
  let cost = 0; const vs = [];
  for (const [name, slug] of [["Solar", SOLAR], ["Gemini", GEM], ["Kimi", KIMI]]) { const r = await gen(slug, g); vs.push(`### ${name}\n${r.text}`); cost += r.cost; }
  const sel = await call(SOLAR, [{ role: "system", content: "너는 편집장이다. 세 모델이 각각 [사업성][사용자경험][기술][참신함] 4관점 아이디어를 냈다. 각 관점에서 세 버전 중 '가장 좋은 하나'를 골라 거의 그대로(최소 편집) 제시하라. 새로 지어내지 말고 선택하라. 4관점 최종만 한국어로." }, { role: "user", content: `목표: ${g}\n\n${vs.join("\n\n")}` }]);
  return { text: sel.text, cost: cost + sel.cost };
}
const CFG = [["S_single", S_single], ["SR_selfrefine", SR_selfrefine], ["XR_crossrefine", XR_crossrefine], ["SEL_perspective", SEL_perperspective]];
const L = ["A", "B", "C", "D"];
async function judgeOne(slug, g, items) {
  for (let a = 0; a < 2; a++) {
    try {
      const listed = items.map((t, i) => `[${L[i]}]\n${t}`).join("\n\n");
      const r = await call(slug, [{ role: "system", content: `아래 4개 아이디어 묶음을 각 1~5점(다양성·구체성·관점충실·한국어 품질). 설명·코드블록 금지. JSON만: {"A":n,"B":n,"C":n,"D":n}` }, { role: "user", content: `목표: ${g}\n\n${listed}` }], { maxTok: 120, temp: 0.2 });
      const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]);
      if (L.every((l) => p[l] >= 1 && p[l] <= 5)) return p;
    } catch { } await new Promise((s) => setTimeout(s, 350));
  }
  return null;
}
const acc = {}; for (const [k] of CFG) acc[k] = { s: 0, sn: 0, c: 0, cn: 0, wins: 0 };
const perGoal = [];
for (const g of GOALS) {
  const outs = {};
  for (const [k, fn] of CFG) { try { outs[k] = await fn(g); } catch (e) { outs[k] = { text: "", cost: 0 }; console.log(`  ${k} 실패: ${String(e).slice(0, 70)}`); } acc[k].c += outs[k].cost; acc[k].cn++; }
  const keys = CFG.map(([k]) => k).filter((k) => outs[k].text);
  if (keys.length < 2) { console.log(`${g.slice(0, 10)} 생성부족`); continue; }
  const sh = keys.map((k) => ({ k, text: outs[k].text })).map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const judged = [];
  for (const j of JUDGES) { const p = await judgeOne(j, g, sh.map((x) => x.text)); if (p) judged.push(p); }
  if (!judged.length) { console.log(`${g.slice(0, 10)} 심판실패`); continue; }
  const gs = {};
  sh.forEach((it, i) => { const vals = judged.map((p) => Number(p[L[i]])).filter((v) => v >= 1 && v <= 5); if (vals.length) { const avg = vals.reduce((a, b) => a + b, 0) / vals.length; acc[it.k].s += avg; acc[it.k].sn++; gs[it.k] = +avg.toFixed(2); } });
  const best = Object.entries(gs).sort((a, b) => b[1] - a[1])[0]; if (best) acc[best[0]].wins++;
  perGoal.push({ goal: g, judges: judged.length, scores: gs, winner: best?.[0] });
  console.log(`${g.slice(0, 12)} 심판${judged.length} 승자=${best?.[0]}  ${Object.entries(gs).sort((a,b)=>b[1]-a[1]).map(([k, v]) => k.split("_")[0] + v).join(" ")}`);
}
const q = (k) => acc[k].sn ? +(acc[k].s / acc[k].sn).toFixed(3) : null;
const co = (k) => acc[k].cn ? +(acc[k].c / acc[k].cn).toFixed(6) : null;
const rows = CFG.map(([k]) => ({ config: k, quality: q(k), cost: co(k), wins: acc[k].wins, judgedGoals: acc[k].sn }));
fs.writeFileSync("benchmarks/mixing-verify.json", JSON.stringify({ ranAt: new Date().toISOString(), n: GOALS.length, judges: JUDGES, rows, perGoal }, null, 2));
console.log(`\n=== 섞기 검증 (n=${GOALS.length}, 심판 3) ===`);
[...rows].sort((a, b) => (b.quality || 0) - (a.quality || 0)).forEach((r) => console.log(`${r.config.padEnd(16)} 품질 ${r.quality}  승 ${r.wins}/${r.judgedGoals}  비용 $${r.cost}`));
const s = q("S_single"), sr = q("SR_selfrefine");
const mixWin = rows.filter((r) => ["XR_crossrefine", "SEL_perspective"].includes(r.config) && r.quality > Math.max(s, sr)).sort((a, b) => b.quality - a.quality)[0];
console.log(mixWin ? `\n>>> 섞기(${mixWin.config})가 단일·자기정제 최고(${Math.max(s, sr)})를 넘음: ${mixWin.quality}` : `\n>>> 섞기(XR/SEL)가 단일/자기정제를 못 넘음 — Solar 중심이 여전히 최선`);
console.log("SAVED benchmarks/mixing-verify.json");
