/* 다양한 모델 대규모 실험 — 12모델 × 4관점 × 3목표.
   각 (목표,관점)에서 12모델 생성 → 심판(GLM-4.6, 블라인드 셔플)이 각 1~5점 → 관점별 모델 평균점수.
   + 다양성: 관점별 12아이디어의 평균 쌍별 단어 자카드 유사도(낮을수록 다양) → "모델 바꾸면 진짜 다른가".
   실행: cd ideation-engine && node benchmarks/diverse.mjs   결과: benchmarks/diverse.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const MODELS = [
  { n: "GLM-4.6", s: "z-ai/glm-4.6", tag: "추론·코딩" }, { n: "DeepSeek-V3", s: "deepseek/deepseek-chat-v3", tag: "에이전트·코딩" },
  { n: "Kimi-K2", s: "moonshotai/kimi-k2", tag: "장문·에이전트" }, { n: "Solar-Pro4", s: "upstage/solar-pro4", tag: "한국어·에이전트" },
  { n: "Qwen2.5-72B", s: "qwen/qwen-2.5-72b-instruct", tag: "다국어" }, { n: "Gemini-2.5-Flash", s: "google/gemini-2.5-flash", tag: "범용" },
  { n: "Gemini-Flash-Lite", s: "google/gemini-2.5-flash-lite", tag: "가성비" }, { n: "GPT-4o-mini", s: "openai/gpt-4o-mini", tag: "안정" },
  { n: "Mistral-Medium-3", s: "mistralai/mistral-medium-3", tag: "균형(EU)" }, { n: "Llama-3.3-70B", s: "meta-llama/llama-3.3-70b-instruct", tag: "범용" },
  { n: "gpt-oss-120b", s: "openai/gpt-oss-120b", tag: "초저가" }, { n: "Nemotron-3.5-L", s: "nvidia/nemotron-3.5-lightning", tag: "추론(신형)" },
];
const ANGLES = ["사업성", "사용자경험", "기술", "참신함"];
const GOALS = ["비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스"];
const JUDGE = "z-ai/glm-4.6";

async function call(slug, messages, { maxTok = 150, reasoningOff = false } = {}) {
  const body = { model: slug, messages, max_tokens: maxTok, temperature: 0.7, usage: { include: true }, ...(reasoningOff ? { reasoning: { enabled: false } } : {}) };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Diverse" }, body: JSON.stringify(body) });
  const d = await res.json(); if (!res.ok) throw new Error(`${res.status}`);
  return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
}
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const words = (t) => new Set(t.toLowerCase().split(/[^가-힣a-z0-9]+/).filter((w) => w.length > 1));
function avgPairSim(texts) {
  const ws = texts.map(words); let sum = 0, n = 0;
  for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) {
    const inter = [...ws[i]].filter((x) => ws[j].has(x)).length, uni = new Set([...ws[i], ...ws[j]]).size;
    sum += uni ? inter / uni : 0; n++;
  }
  return n ? +(sum / n).toFixed(3) : 0;
}

const scoreSum = {}, scoreN = {}, diversity = {}, cost = { gen: 0, judge: 0 };
for (const a of ANGLES) { scoreSum[a] = {}; scoreN[a] = {}; diversity[a] = []; for (const m of MODELS) { scoreSum[a][m.n] = 0; scoreN[a][m.n] = 0; } }

for (const goal of GOALS) {
  for (const angle of ANGLES) {
    const ideas = [];
    for (const m of MODELS) {
      try { const r = await call(m.s, [{ role: "system", content: `너는 아이디어 발산 워커다. '${angle}' 관점에서만 목표에 대한 새 아이디어 하나를 2문장 이내 한국어로.` }, { role: "user", content: `목표: ${goal}` }]); ideas.push({ model: m.n, text: r.text }); cost.gen += r.cost; }
      catch { /* 생성 실패 스킵 */ }
      await new Promise((s) => setTimeout(s, 120));
    }
    if (ideas.length < 2) { console.log(`${angle} ${goal.slice(0, 12)} — 생성 부족`); continue; }
    diversity[angle].push(avgPairSim(ideas.map((x) => x.text)));
    const sh = shuffle(ideas);
    const listed = sh.map((x, i) => `${i + 1}. ${x.text}`).join("\n");
    try {
      const r = await call(JUDGE, [{ role: "system", content: "너는 심사위원이다. 같은 관점의 아이디어들을 각각 1~5점. 코드블록 없이 JSON 배열만: [s1,s2,...]" }, { role: "user", content: `목표: ${goal}\n관점: ${angle}\n${listed}` }], { maxTok: 500, reasoningOff: true });
      cost.judge += r.cost;
      const arr = JSON.parse(r.text.match(/\[[\s\S]*\]/)[0]);
      arr.forEach((sc, i) => { if (sh[i]) { scoreSum[angle][sh[i].model] += Number(sc) || 0; scoreN[angle][sh[i].model]++; } });
      console.log(`${angle.padEnd(6)} ${goal.slice(0, 12)} — ${ideas.length}개 채점, 다양성 ${diversity[angle].at(-1)}`);
    } catch (e) { console.log(`${angle} ${goal.slice(0, 12)} — 심판 실패`); }
  }
}
const avgScore = {};
for (const a of ANGLES) { avgScore[a] = {}; for (const m of MODELS) avgScore[a][m.n] = scoreN[a][m.n] ? +(scoreSum[a][m.n] / scoreN[a][m.n]).toFixed(2) : null; }
const avgDiv = {}; for (const a of ANGLES) avgDiv[a] = diversity[a].length ? +(diversity[a].reduce((x, y) => x + y, 0) / diversity[a].length).toFixed(3) : null;
fs.writeFileSync("benchmarks/diverse.json", JSON.stringify({ ranAt: new Date().toISOString(), models: MODELS, goals: GOALS.length, avgScore, avgDiversity: avgDiv, cost }, null, 2));
console.log(`\n=== 관점별 평균점수(모델별) ===`);
for (const a of ANGLES) { const sorted = Object.entries(avgScore[a]).filter(([, v]) => v != null).sort((x, y) => y[1] - x[1]); console.log(`\n[${a}] 다양성(유사도 낮을수록↑)=${avgDiv[a]}`); sorted.forEach(([m, v], i) => console.log(`  ${i + 1}. ${m.padEnd(18)} ${v}`)); }
console.log(`\n비용 gen=$${cost.gen.toFixed(5)} judge=$${cost.judge.toFixed(5)}`);
console.log("SAVED benchmarks/diverse.json");
