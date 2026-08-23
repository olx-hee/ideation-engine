/* 품질 A/B 평가 — "분업(멀티모델) vs 단일모델"이 아이디어 발산에서 더 나은가?
   블라인드 LLM-judge(제3모델 GLM-4.6) + 비용 병행. 여러 goal로 반복(표본).
   실행: cd ideation-engine && node benchmarks/quality-eval.mjs
   결과: benchmarks/quality-eval.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

async function call(slug, messages, { maxTok = 400, reasoningOff = false } = {}) {
  const body = { model: slug, messages, max_tokens: maxTok, temperature: 0.7, usage: { include: true }, ...(reasoningOff ? { reasoning: { enabled: false } } : {}) };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-QualEval" }, body: JSON.stringify(body) });
  const d = await res.json();
  if (!res.ok) throw new Error(`${slug} ${res.status}: ${JSON.stringify(d.error || d).slice(0, 120)}`);
  const u = d.usage || {};
  return { text: (d.choices?.[0]?.message?.content || "").trim(), inTok: u.prompt_tokens || 0, outTok: u.completion_tokens || 0, cost: u.cost || 0 };
}

const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스",
  "대학생 팀 프로젝트 협업을 돕는 도구",
  "동네 소상공인의 단골 관리를 돕는 앱",
];
// 분업 = registry ANGLE_MODELS
const MULTI = [
  { angle: "사업성", slug: "google/gemini-2.5-flash-lite" },
  { angle: "사용자경험", slug: "upstage/solar-pro-3" },
  { angle: "기술", slug: "openai/gpt-4o-mini" },
  { angle: "참신함", slug: "google/gemini-2.5-flash" },
];
const SINGLE_SLUG = "google/gemini-2.5-flash"; // 단일 강모델 baseline

async function single(goal) {
  const sys = "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 서로 겹치지 않는 새 아이디어를 하나씩, 각 2문장 이내 한국어로 제안하라.";
  const r = await call(SINGLE_SLUG, [{ role: "system", content: sys }, { role: "user", content: `목표: ${goal}` }], { maxTok: 500 });
  return { text: r.text, cost: r.cost, inTok: r.inTok, outTok: r.outTok };
}
async function multi(goal) {
  let cost = 0, inTok = 0, outTok = 0; const parts = [];
  for (const m of MULTI) {
    const sys = `너는 아이디어 발산 워커다. '${m.angle}' 관점에서만 목표에 대한 새 아이디어 하나를 2문장 이내 한국어로 제안하라.`;
    const r = await call(m.slug, [{ role: "system", content: sys }, { role: "user", content: `목표: ${goal}` }], { maxTok: 200 });
    parts.push(`[${m.angle}] ${r.text}`); cost += r.cost; inTok += r.inTok; outTok += r.outTok;
    await new Promise((s) => setTimeout(s, 500));
  }
  return { text: parts.join("\n"), cost, inTok, outTok };
}
async function judge(goal, A, B) {
  const sys = "너는 엄격한 아이디어 심사위원이다. 두 시스템 A/B가 같은 목표에 낸 아이디어 묶음을 각 항목 1~5점으로 평가한다. 코드블록 없이 JSON만 출력하라.";
  const rubric = 'JSON 형식: {"A":{"diversity":n,"usefulness":n,"coverage":n,"korean":n,"overall":n},"B":{...같은키...},"winner":"A|B|tie","reason":"짧게"} — diversity=관점다양성, usefulness=구체성/실행가능, coverage=4관점충실, korean=한국어자연스러움';
  const user = `목표: ${goal}\n\n[시스템 A]\n${A}\n\n[시스템 B]\n${B}\n\n${rubric}`;
  const r = await call("z-ai/glm-4.6", [{ role: "system", content: sys }, { role: "user", content: user }], { maxTok: 800, reasoningOff: true });
  let parsed = null;
  const m = r.text.match(/\{[\s\S]*\}/);
  try { parsed = JSON.parse(m ? m[0] : r.text); } catch { parsed = { parseError: r.text.slice(0, 200) }; }
  return { parsed, cost: r.cost };
}

const rows = [];
for (const goal of GOALS) {
  console.log(`\n=== 목표: ${goal} ===`);
  const s = await single(goal); const mu = await multi(goal);
  // 블라인드: 무작위로 A/B 배정
  const singleIsA = Math.random() < 0.5;
  const A = singleIsA ? s.text : mu.text, B = singleIsA ? mu.text : s.text;
  const j = await judge(goal, A, B);
  const map = { A: singleIsA ? "single" : "multi", B: singleIsA ? "multi" : "single" };
  const p = j.parsed || {};
  const singleScore = p[singleIsA ? "A" : "B"], multiScore = p[singleIsA ? "B" : "A"];
  const winnerSys = p.winner === "A" ? map.A : p.winner === "B" ? map.B : "tie";
  console.log(`  단일비용 $${s.cost.toFixed(6)} / 분업비용 $${mu.cost.toFixed(6)}`);
  console.log(`  점수(단일):`, JSON.stringify(singleScore), `\n  점수(분업):`, JSON.stringify(multiScore));
  console.log(`  심판 승자: ${winnerSys}  (${p.reason || ""})`);
  rows.push({ goal, singleCost: s.cost, multiCost: mu.cost, singleScore, multiScore, winner: winnerSys, blindMap: map, judgeCost: j.cost, singleText: s.text, multiText: mu.text });
}
fs.writeFileSync("benchmarks/quality-eval.json", JSON.stringify({ ranAt: new Date().toISOString(), singleSlug: SINGLE_SLUG, multi: MULTI, rows }, null, 2));
// 집계
const wins = rows.reduce((a, r) => (a[r.winner] = (a[r.winner] || 0) + 1, a), {});
const avg = (k, s) => (rows.reduce((a, r) => a + ((r[s] && r[s][k]) || 0), 0) / rows.length).toFixed(2);
console.log(`\n=== 집계 (n=${rows.length}) ===`);
console.log(`승자 분포:`, JSON.stringify(wins));
console.log(`평균 overall — 단일 ${avg("overall", "singleScore")} / 분업 ${avg("overall", "multiScore")}`);
console.log(`평균 비용 — 단일 $${(rows.reduce((a, r) => a + r.singleCost, 0) / rows.length).toFixed(6)} / 분업 $${(rows.reduce((a, r) => a + r.multiCost, 0) / rows.length).toFixed(6)}`);
console.log("SAVED benchmarks/quality-eval.json");
