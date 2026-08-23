/* 통제실험 — "분업 구조 자체"가 이득인가? 모델을 고정(gemini-2.5-flash)하고
   SPLIT(같은 모델 ×4, 각도별) vs SINGLE(같은 모델 ×1, 4관점 한 프롬프트) 비교.
   → 모델 강도 혼입 제거. 심판 2개(GLM+Llama, 블라인드). n=8.
   실행: cd ideation-engine && node benchmarks/controlled.mjs   결과: benchmarks/controlled.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const MODEL = "google/gemini-2.5-flash"; // 양팔 동일
const JUDGES = ["z-ai/glm-4.6", "meta-llama/llama-3.3-70b-instruct"];
const ANGLES = ["사업성", "사용자경험", "기술", "참신함"];
const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스",
  "중고 거래의 사기를 줄이는 앱", "직장인의 사내 스터디를 활성화하는 도구", "노인의 디지털 기기 사용을 돕는 서비스",
  "반려동물 산책 메이트를 연결하는 앱", "학원 강사의 학부모 소통을 돕는 도구",
];

async function call(slug, messages, { maxTok = 200, reasoningOff = false } = {}) {
  const body = { model: slug, messages, max_tokens: maxTok, temperature: 0.7, usage: { include: true }, ...(reasoningOff ? { reasoning: { enabled: false } } : {}) };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Controlled" }, body: JSON.stringify(body) });
  const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status}`);
  return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
}
async function splitArm(goal) { // 같은 모델을 각도별로 4번
  let cost = 0; const parts = [];
  for (const a of ANGLES) {
    const r = await call(MODEL, [{ role: "system", content: `너는 아이디어 발산 워커다. '${a}' 관점에서만 목표에 대한 새 아이디어 하나를 2문장 이내 한국어로.` }, { role: "user", content: `목표: ${goal}` }], { maxTok: 150 });
    parts.push(`[${a}] ${r.text}`); cost += r.cost; await new Promise((s) => setTimeout(s, 250));
  }
  return { text: parts.join("\n"), cost };
}
async function singleArm(goal) { // 같은 모델 1번, 4관점
  const r = await call(MODEL, [{ role: "system", content: "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 겹치지 않는 새 아이디어 하나씩, 각 2문장 이내 한국어." }, { role: "user", content: `목표: ${goal}` }], { maxTok: 600 });
  return { text: r.text, cost: r.cost };
}
async function judgeOne(slug, goal, A, B) {
  const user = `목표: ${goal}\n\n[A]\n${A}\n\n[B]\n${B}\n\nJSON: {"A":{"diversity":n,"usefulness":n,"coverage":n,"korean":n,"overall":n},"B":{같은키},"winner":"A|B|tie"}`;
  try { const r = await call(slug, [{ role: "system", content: "두 시스템 A/B의 아이디어 묶음을 각 1~5점. 코드블록 없이 JSON만." }, { role: "user", content: user }], { maxTok: 700, reasoningOff: true }); return JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]); } catch { return null; }
}

const rows = [];
for (const goal of GOALS) {
  const sp = await splitArm(goal), si = await singleArm(goal);
  const splitIsA = Math.random() < 0.5;
  const A = splitIsA ? sp.text : si.text, B = splitIsA ? si.text : sp.text;
  const spS = [], siS = []; let wSp = 0, wSi = 0, tie = 0;
  for (const j of JUDGES) {
    const p = await judgeOne(j, goal, A, B); if (!p) continue;
    const sc = p[splitIsA ? "A" : "B"], ic = p[splitIsA ? "B" : "A"];
    if (sc?.overall) spS.push(sc.overall); if (ic?.overall) siS.push(ic.overall);
    const w = p.winner === "A" ? (splitIsA ? "sp" : "si") : p.winner === "B" ? (splitIsA ? "si" : "sp") : "t";
    if (w === "sp") wSp++; else if (w === "si") wSi++; else tie++;
  }
  const spAvg = spS.reduce((a, b) => a + b, 0) / (spS.length || 1), siAvg = siS.reduce((a, b) => a + b, 0) / (siS.length || 1);
  const winner = wSp > wSi ? "split" : wSi > wSp ? "single" : "tie";
  rows.push({ goal, splitCost: sp.cost, singleCost: si.cost, splitOverall: +spAvg.toFixed(2), singleOverall: +siAvg.toFixed(2), winner });
  console.log(`${winner.padEnd(6)} split ${spAvg.toFixed(2)} / single ${siAvg.toFixed(2)}  ($${sp.cost.toFixed(6)} vs $${si.cost.toFixed(6)})  ${goal.slice(0, 16)}`);
}
const wins = rows.reduce((a, r) => (a[r.winner] = (a[r.winner] || 0) + 1, a), {});
const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
fs.writeFileSync("benchmarks/controlled.json", JSON.stringify({ ranAt: new Date().toISOString(), model: MODEL, judges: JUDGES, n: rows.length, rows }, null, 2));
console.log(`\n=== 통제실험 집계 n=${rows.length} (모델 고정=${MODEL}) ===`);
console.log(`승자:`, JSON.stringify(wins));
console.log(`평균 overall — 분업 ${mean("splitOverall").toFixed(2)} / 단일 ${mean("singleOverall").toFixed(2)}`);
console.log(`평균 비용 — 분업 $${mean("splitCost").toFixed(6)} / 단일 $${mean("singleCost").toFixed(6)}  (분업이 ${(mean("splitCost") / mean("singleCost")).toFixed(2)}배)`);
console.log("SAVED benchmarks/controlled.json");
