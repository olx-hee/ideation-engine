/* 품질 A/B v2 — 공정·확대판. n=10 goal, 예산 대칭(단일 600 / 분업 각 150), 심판 2개(GLM-4.6 + Llama-3.3-70B, 둘 다 비참가·블라인드) 평균.
   실행: cd ideation-engine && node benchmarks/quality-eval-v2.mjs   결과: benchmarks/quality-eval-v2.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

async function call(slug, messages, { maxTok = 400, reasoningOff = false } = {}) {
  const body = { model: slug, messages, max_tokens: maxTok, temperature: 0.7, usage: { include: true }, ...(reasoningOff ? { reasoning: { enabled: false } } : {}) };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-QualEval2" }, body: JSON.stringify(body) });
  const d = await res.json();
  if (!res.ok) throw new Error(`${slug} ${res.status}`);
  const u = d.usage || {};
  return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: u.cost || 0 };
}

const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스", "대학생 팀 프로젝트 협업을 돕는 도구", "동네 소상공인의 단골 관리를 돕는 앱",
  "1인 가구의 식단·장보기를 돕는 서비스", "중고 거래의 사기를 줄이는 앱", "직장인의 사내 스터디를 활성화하는 도구",
  "노인의 디지털 기기 사용을 돕는 서비스", "반려동물 산책 메이트를 연결하는 앱", "지역 축제 참여를 늘리는 플랫폼",
  "학원 강사의 학부모 소통을 돕는 도구",
];
const MULTI = [
  { angle: "사업성", slug: "google/gemini-2.5-flash-lite" }, { angle: "사용자경험", slug: "upstage/solar-pro-3" },
  { angle: "기술", slug: "openai/gpt-4o-mini" }, { angle: "참신함", slug: "google/gemini-2.5-flash" },
];
const SINGLE_SLUG = "google/gemini-2.5-flash";
const JUDGES = ["z-ai/glm-4.6", "meta-llama/llama-3.3-70b-instruct"]; // 둘 다 비참가

async function single(goal) {
  const sys = "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 겹치지 않는 새 아이디어 하나씩, 각 2문장 이내 한국어.";
  return call(SINGLE_SLUG, [{ role: "system", content: sys }, { role: "user", content: `목표: ${goal}` }], { maxTok: 600 });
}
async function multi(goal) {
  let cost = 0; const parts = [];
  for (const m of MULTI) {
    const sys = `너는 아이디어 발산 워커다. '${m.angle}' 관점에서만 목표에 대한 새 아이디어 하나를 2문장 이내 한국어로.`;
    const r = await call(m.slug, [{ role: "system", content: sys }, { role: "user", content: `목표: ${goal}` }], { maxTok: 150 });
    parts.push(`[${m.angle}] ${r.text}`); cost += r.cost; await new Promise((s) => setTimeout(s, 300));
  }
  return { text: parts.join("\n"), cost };
}
async function judgeOne(slug, goal, A, B) {
  const sys = "너는 엄격한 아이디어 심사위원이다. 두 시스템 A/B의 아이디어 묶음을 각 1~5점 평가한다. 코드블록 없이 JSON만.";
  const rubric = 'JSON: {"A":{"diversity":n,"usefulness":n,"coverage":n,"korean":n,"overall":n},"B":{같은키},"winner":"A|B|tie"}';
  const user = `목표: ${goal}\n\n[A]\n${A}\n\n[B]\n${B}\n\n${rubric}`;
  try {
    const r = await call(slug, [{ role: "system", content: sys }, { role: "user", content: user }], { maxTok: 700, reasoningOff: true });
    const m = r.text.match(/\{[\s\S]*\}/); return { p: JSON.parse(m[0]), cost: r.cost };
  } catch { return { p: null, cost: 0 }; }
}

const rows = [];
for (const goal of GOALS) {
  const s = await single(goal), mu = await multi(goal);
  const singleIsA = Math.random() < 0.5;
  const A = singleIsA ? s.text : mu.text, B = singleIsA ? mu.text : s.text;
  const sScores = [], mScores = []; let winS = 0, winM = 0, tie = 0;
  for (const jslug of JUDGES) {
    const { p } = await judgeOne(jslug, goal, A, B); if (!p) continue;
    const sc = p[singleIsA ? "A" : "B"], mc = p[singleIsA ? "B" : "A"];
    if (sc?.overall) sScores.push(sc.overall); if (mc?.overall) mScores.push(mc.overall);
    const w = p.winner === "A" ? (singleIsA ? "s" : "m") : p.winner === "B" ? (singleIsA ? "m" : "s") : "t";
    if (w === "s") winS++; else if (w === "m") winM++; else tie++;
  }
  const sAvg = sScores.reduce((a, b) => a + b, 0) / (sScores.length || 1), mAvg = mScores.reduce((a, b) => a + b, 0) / (mScores.length || 1);
  const winner = winS > winM ? "single" : winM > winS ? "multi" : "tie";
  rows.push({ goal, singleCost: s.cost, multiCost: mu.cost, singleOverall: +sAvg.toFixed(2), multiOverall: +mAvg.toFixed(2), winner });
  console.log(`${winner.padEnd(6)} 단일 ${sAvg.toFixed(2)} / 분업 ${mAvg.toFixed(2)}  ($${s.cost.toFixed(6)} vs $${mu.cost.toFixed(6)})  ${goal.slice(0, 18)}`);
}
const wins = rows.reduce((a, r) => (a[r.winner] = (a[r.winner] || 0) + 1, a), {});
const mean = (k) => (rows.reduce((a, r) => a + r[k], 0) / rows.length);
fs.writeFileSync("benchmarks/quality-eval-v2.json", JSON.stringify({ ranAt: new Date().toISOString(), judges: JUDGES, n: rows.length, rows }, null, 2));
console.log(`\n=== 집계 n=${rows.length} ===`);
console.log(`승자:`, JSON.stringify(wins));
console.log(`평균 overall — 단일 ${mean("singleOverall").toFixed(2)} / 분업 ${mean("multiOverall").toFixed(2)}`);
console.log(`평균 비용 — 단일 $${mean("singleCost").toFixed(6)} / 분업 $${mean("multiCost").toFixed(6)}  (분업이 ${(mean("singleCost") / mean("multiCost")).toFixed(1)}배 저렴)`);
console.log("SAVED benchmarks/quality-eval-v2.json");
