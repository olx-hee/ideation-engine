/* 검증된 다중LLM 패턴 대결 — 어느 게 우리 아이디어 작업에 진짜 이기나?
   A 단일 Flash-Lite / B 단일 Solar / C Self-MoA(Solar 3변주→Solar 종합, 약한모델 안 섞음) / D 캐스케이드(FL→점수→낮으면 Solar 승격).
   블라인드 심판 2개. n=8. 품질·비용·캐스케이드 승격률 측정.
   실행: cd ideation-engine && node benchmarks/patterns.mjs   결과: benchmarks/patterns.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const FL = "google/gemini-2.5-flash-lite", SOLAR = "upstage/solar-pro4";
const JUDGES = ["z-ai/glm-4.6", "meta-llama/llama-3.3-70b-instruct"];
const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스",
  "중고 거래의 사기를 줄이는 앱", "노인의 디지털 기기 사용을 돕는 서비스", "반려동물 산책 메이트를 연결하는 앱",
  "지역 축제 참여를 늘리는 플랫폼", "학원 강사의 학부모 소통을 돕는 도구",
];
const SYS_GEN = "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 겹치지 않는 새 아이디어 하나씩, 각 2문장 이내 한국어.";
const LENSES = ["실용성·수익성을 특히 강조하라.", "사용자경험·감성을 특히 강조하라.", "기술 참신성·차별화를 특히 강조하라."];

async function call(slug, messages, { maxTok = 600 } = {}) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Patterns" }, body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: 0.8, usage: { include: true } }) });
  const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status}`);
  return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
}
async function single(slug, g) { const r = await call(slug, [{ role: "system", content: SYS_GEN }, { role: "user", content: `목표: ${g}` }]); return { text: r.text, cost: r.cost }; }
async function selfMoA(g) { // Solar 3변주 → Solar 종합 (약한모델 없음)
  let cost = 0; const vs = [];
  for (const L of LENSES) { const r = await call(SOLAR, [{ role: "system", content: SYS_GEN + " " + L }, { role: "user", content: `목표: ${g}` }]); vs.push(r.text); cost += r.cost; await new Promise((s) => setTimeout(s, 120)); }
  const agg = await call(SOLAR, [{ role: "system", content: "너는 아이디어 종합가다. 아래 3개 버전을 종합해 각 버전의 강점을 살리고 중복 제거하여, 4관점을 커버하는 최고의 최종 아이디어 4개로 정리하라. 각 2문장 이내 한국어." }, { role: "user", content: `목표: ${g}\n\n[버전들]\n${vs.map((t, i) => `### 버전${i + 1}\n${t}`).join("\n\n")}` }]);
  return { text: agg.text, cost: cost + agg.cost };
}
async function cascade(g) { // FL 생성 → Solar 점수 → <4면 Solar 승격
  const fl = await call(FL, [{ role: "system", content: SYS_GEN }, { role: "user", content: `목표: ${g}` }]);
  let cost = fl.cost, escalated = false, text = fl.text;
  const sc = await call(SOLAR, [{ role: "system", content: "아래 아이디어 묶음의 품질을 1~5 정수 하나로만 답하라(숫자만)." }, { role: "user", content: `목표: ${g}\n\n${fl.text}` }], { maxTok: 10 });
  cost += sc.cost; const score = parseInt((sc.text.match(/[1-5]/) || [3])[0], 10);
  if (score < 4) { const r = await single(SOLAR, g); text = r.text; cost += r.cost; escalated = true; }
  return { text, cost, escalated };
}
async function judgeOne(slug, g, items) {
  const L = ["A", "B", "C", "D"]; const listed = items.map((x, i) => `[${L[i]}]\n${x}`).join("\n\n");
  try { const r = await call(slug, [{ role: "system", content: "아래 4개 아이디어 묶음을 각 1~5점(다양성·구체성·관점충실·한국어). 코드블록 없이 JSON만: {\"A\":n,\"B\":n,\"C\":n,\"D\":n}" }, { role: "user", content: `목표: ${g}\n\n${listed}` }], { maxTok: 200 }); const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]); if (L.every((l) => p[l] >= 1 && p[l] <= 5)) return p; } catch { } return null;
}
const cfg = ["A_FlashLite", "B_Solar", "C_SelfMoA", "D_Cascade"];
const acc = {}; for (const c of cfg) acc[c] = { s: 0, sn: 0, c: 0 }; let esc = 0, escN = 0;
for (const g of GOALS) {
  const a = await single(FL, g), b = await single(SOLAR, g), c = await selfMoA(g), d = await cascade(g);
  if (d.escalated) esc++; escN++;
  const raw = { A_FlashLite: a, B_Solar: b, C_SelfMoA: c, D_Cascade: d };
  const order = ["A_FlashLite", "B_Solar", "C_SelfMoA", "D_Cascade"];
  const sh = order.map((k) => ({ k, text: raw[k].text })).map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const per = [];
  for (const j of JUDGES) { const p = await judgeOne(j, g, sh.map((x) => x.text)); if (p) per.push({ p, sh }); }
  if (!per.length) { console.log(`${g.slice(0, 10)} 심판실패`); continue; }
  const L = ["A", "B", "C", "D"];
  sh.forEach((it, i) => { const vals = per.map((x) => Number(x.p[L[i]])).filter((v) => v >= 1 && v <= 5); if (vals.length) { acc[it.k].s += vals.reduce((x, y) => x + y, 0) / vals.length; acc[it.k].sn++; } });
  for (const k of order) acc[k].c += raw[k].cost;
  console.log(`${g.slice(0, 12)} 채점(심판 ${per.length}) 캐스케이드승격=${d.escalated}`);
}
const q = (k) => acc[k].sn ? +(acc[k].s / acc[k].sn).toFixed(2) : null;
const co = (k) => +(acc[k].c / GOALS.length).toFixed(6);
fs.writeFileSync("benchmarks/patterns.json", JSON.stringify({ ranAt: new Date().toISOString(), n: GOALS.length, escalationRate: +(esc / escN).toFixed(2), rows: cfg.map((k) => ({ config: k, quality: q(k), cost: co(k) })) }, null, 2));
console.log(`\n=== 패턴 대결 (n=${GOALS.length}) ===`);
cfg.map((k) => ({ k, q: q(k), c: co(k) })).sort((a, b) => (b.q || 0) - (a.q || 0)).forEach((r) => console.log(`${r.k.padEnd(14)} 품질 ${r.q}  비용 $${r.c}`));
console.log(`캐스케이드 승격률: ${(esc / escN * 100).toFixed(0)}%`);
console.log("SAVED benchmarks/patterns.json");
