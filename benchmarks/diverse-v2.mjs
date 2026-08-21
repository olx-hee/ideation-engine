/* 초다양 모델 실험 v2 — 24모델(18+ 공급사) × 4관점 × 3목표.
   개선(Grok 반영): 생성 reasoning OFF(공정), 심판 2개(GLM+Llama)+배열길이 검증, scoreN 저장, 창작 파인튠 포함.
   실행: cd ideation-engine && node benchmarks/diverse-v2.mjs   결과: benchmarks/diverse-v2.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const MODELS = [
  { n: "Solar-Pro4", s: "upstage/solar-pro4" }, { n: "Gemini-Flash-Lite", s: "google/gemini-2.5-flash-lite" },
  { n: "Claude-3-Haiku", s: "anthropic/claude-3-haiku" }, { n: "Command-R7B", s: "cohere/command-r7b-12-2024" },
  { n: "Jamba-Large-1.7", s: "ai21/jamba-large-1.7" }, { n: "Nova-Lite", s: "amazon/nova-lite-v1" },
  { n: "Phi-4", s: "microsoft/phi-4" }, { n: "Palmyra-X5", s: "writer/palmyra-x5" },
  { n: "Hermes-4-70B", s: "nousresearch/hermes-4-70b" }, { n: "Grok-4.3", s: "x-ai/grok-4.3" },
  { n: "GLM-4.7-Flash", s: "z-ai/glm-4.7-flash" }, { n: "DeepSeek-V4-Flash", s: "deepseek/deepseek-v4-flash" },
  { n: "Kimi-K2.5", s: "moonshotai/kimi-k2.5" }, { n: "Qwen3.7-Flash", s: "qwen/qwen3.7-flash" },
  { n: "MiniMax-01", s: "minimax/minimax-01" }, { n: "Step-3.7-Flash", s: "stepfun/step-3.7-flash" },
  { n: "Seed-2.0-Mini", s: "bytedance-seed/seed-2.0-mini" }, { n: "MiMo-v2.5", s: "xiaomi/mimo-v2.5" },
  { n: "Euryale-70B", s: "sao10k/l3.3-euryale-70b" }, { n: "MythoMax-13B", s: "gryphe/mythomax-l2-13b" },
  { n: "Rocinante-12B", s: "thedrummer/rocinante-12b" }, { n: "OLMo-3-Think", s: "allenai/olmo-3-32b-think" },
  { n: "Reka-Flash-3", s: "rekaai/reka-flash-3" }, { n: "Granite-4.1-8B", s: "ibm-granite/granite-4.1-8b" },
];
const ANGLES = ["사업성", "사용자경험", "기술", "참신함"];
const GOALS = ["비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스"];
const JUDGES = ["z-ai/glm-4.6", "meta-llama/llama-3.3-70b-instruct"];

async function call(slug, messages, { maxTok = 150 } = {}) {
  const body = { model: slug, messages, max_tokens: maxTok, temperature: 0.7, usage: { include: true }, reasoning: { enabled: false } };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-DiverseV2" }, body: JSON.stringify(body) });
  const d = await res.json(); if (!res.ok) throw new Error(`${res.status}`);
  return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
}
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const words = (t) => new Set(t.toLowerCase().split(/[^가-힣a-z0-9]+/).filter((w) => w.length > 1));
function avgPairSim(texts) { const ws = texts.map(words); let s = 0, n = 0; for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) { const inter = [...ws[i]].filter((x) => ws[j].has(x)).length, uni = new Set([...ws[i], ...ws[j]]).size; s += uni ? inter / uni : 0; n++; } return n ? +(s / n).toFixed(3) : 0; }

const scoreSum = {}, scoreN = {}, div = {}, cost = { gen: 0, judge: 0 }, fails = {};
for (const a of ANGLES) { scoreSum[a] = {}; scoreN[a] = {}; div[a] = []; for (const m of MODELS) { scoreSum[a][m.n] = 0; scoreN[a][m.n] = 0; } }

for (const goal of GOALS) {
  for (const angle of ANGLES) {
    const ideas = [];
    for (const m of MODELS) {
      try { const r = await call(m.s, [{ role: "system", content: `너는 아이디어 발산 워커다. '${angle}' 관점에서만 목표에 대한 새 아이디어 하나를 2문장 이내 한국어로.` }, { role: "user", content: `목표: ${goal}` }]); if (r.text) { ideas.push({ model: m.n, text: r.text }); cost.gen += r.cost; } else fails[m.n] = (fails[m.n] || 0) + 1; }
      catch { fails[m.n] = (fails[m.n] || 0) + 1; }
      await new Promise((s) => setTimeout(s, 80));
    }
    if (ideas.length < 3) { console.log(`${angle} ${goal.slice(0, 10)} 생성부족(${ideas.length})`); continue; }
    div[angle].push(avgPairSim(ideas.map((x) => x.text)));
    const sh = shuffle(ideas);
    const listed = sh.map((x, i) => `${i + 1}. ${x.text}`).join("\n");
    const perJudge = []; // 각 심판의 점수 배열(길이 검증)
    for (const jslug of JUDGES) {
      try {
        const r = await call(jslug, [{ role: "system", content: `너는 심사위원이다. 아래 ${sh.length}개 아이디어를 각각 1~5점. 코드블록 없이 JSON 배열만, 정확히 ${sh.length}개: [s1,...]` }, { role: "user", content: `목표: ${goal}\n관점: ${angle}\n${listed}` }], { maxTok: 900 });
        cost.judge += r.cost;
        const arr = JSON.parse(r.text.match(/\[[\s\S]*\]/)[0]);
        if (Array.isArray(arr) && arr.length === sh.length) perJudge.push(arr.map(Number)); // 길이 일치만 채택(Grok)
      } catch { }
    }
    if (!perJudge.length) { console.log(`${angle} ${goal.slice(0, 10)} 심판 실패`); continue; }
    sh.forEach((it, i) => { const vals = perJudge.map((a) => a[i]).filter((v) => v >= 1 && v <= 5); if (vals.length) { scoreSum[angle][it.model] += vals.reduce((x, y) => x + y, 0) / vals.length; scoreN[angle][it.model]++; } });
    console.log(`${angle.padEnd(6)} ${goal.slice(0, 10)} — 생성 ${ideas.length}/${MODELS.length}, 심판 ${perJudge.length}개, 다양성 ${div[angle].at(-1)}`);
  }
}
const avgScore = {}; for (const a of ANGLES) { avgScore[a] = {}; for (const m of MODELS) avgScore[a][m.n] = scoreN[a][m.n] ? +(scoreSum[a][m.n] / scoreN[a][m.n]).toFixed(2) : null; }
const avgDiv = {}; for (const a of ANGLES) avgDiv[a] = div[a].length ? +(div[a].reduce((x, y) => x + y, 0) / div[a].length).toFixed(3) : null;
fs.writeFileSync("benchmarks/diverse-v2.json", JSON.stringify({ ranAt: new Date().toISOString(), models: MODELS.length, judges: JUDGES, goals: GOALS.length, avgScore, scoreN, avgDiversity: avgDiv, fails, cost }, null, 2));
console.log(`\n=== 관점별 상위 5 (심판2 평균) ===`);
for (const a of ANGLES) { const sorted = Object.entries(avgScore[a]).filter(([, v]) => v != null).sort((x, y) => y[1] - x[1]); console.log(`\n[${a}] 다양성=${avgDiv[a]}`); sorted.slice(0, 6).forEach(([m, v], i) => console.log(`  ${i + 1}. ${m.padEnd(18)} ${v}`)); }
console.log(`\n생성실패:`, JSON.stringify(fails));
console.log(`비용 gen=$${cost.gen.toFixed(4)} judge=$${cost.judge.toFixed(4)}`);
console.log("SAVED benchmarks/diverse-v2.json");
