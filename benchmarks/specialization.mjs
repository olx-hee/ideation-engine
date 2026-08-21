/* 특화 분리 실험 — "특정 모델이 특정 관점에 진짜 강한가?"
   모델×관점 매트릭스: 각 goal·각 관점에서 4개 모델이 아이디어 생성 → 블라인드 심판이 4개 중 best 선택 + 각 1~5점.
   집계: 관점별로 어느 모델이 자주 1등인가. 특정 모델이 특정 관점을 지배하면 '특화 실재', 고르게 흩어지면 '특화 근거 약함'.
   실행: cd ideation-engine && node benchmarks/specialization.mjs   결과: benchmarks/specialization.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

async function call(slug, messages, { maxTok = 200, reasoningOff = false } = {}) {
  const body = { model: slug, messages, max_tokens: maxTok, temperature: 0.7, usage: { include: true }, ...(reasoningOff ? { reasoning: { enabled: false } } : {}) };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Spec" }, body: JSON.stringify(body) });
  const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status}`);
  return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
}
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

const GOALS = ["비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스", "중고 거래의 사기를 줄이는 앱"];
const ANGLES = ["사업성", "사용자경험", "기술", "참신함"];
const MODELS = [
  { name: "Gemini-Flash-Lite", slug: "google/gemini-2.5-flash-lite" }, { name: "Solar-Pro-3", slug: "upstage/solar-pro-3" },
  { name: "GPT-4o-mini", slug: "openai/gpt-4o-mini" }, { name: "Gemini-2.5-Flash", slug: "google/gemini-2.5-flash" },
];
const JUDGE = "z-ai/glm-4.6";

// 집계 구조: wins[angle][model], scoreSum[angle][model], scoreN
const wins = {}, scoreSum = {}, scoreN = {};
for (const a of ANGLES) { wins[a] = {}; scoreSum[a] = {}; scoreN[a] = {}; for (const m of MODELS) { wins[a][m.name] = 0; scoreSum[a][m.name] = 0; scoreN[a][m.name] = 0; } }
const detail = [];

for (const goal of GOALS) {
  for (const angle of ANGLES) {
    // 4개 모델 생성
    const ideas = [];
    for (const m of MODELS) {
      const sys = `너는 아이디어 발산 워커다. '${angle}' 관점에서만 목표에 대한 새 아이디어 하나를 2문장 이내 한국어로.`;
      try { const r = await call(m.slug, [{ role: "system", content: sys }, { role: "user", content: `목표: ${goal}` }]); ideas.push({ model: m.name, text: r.text }); }
      catch { ideas.push({ model: m.name, text: "(생성 실패)" }); }
      await new Promise((s) => setTimeout(s, 250));
    }
    const shuffled = shuffle(ideas); // 위치 편향 제거
    const listed = shuffled.map((x, i) => `${i + 1}. ${x.text}`).join("\n");
    const sys = "너는 심사위원이다. 같은 관점의 아이디어 4개 중 가장 우수한 것을 고르고 각각 1~5점 매긴다. 코드블록 없이 JSON만.";
    const user = `목표: ${goal}\n관점: ${angle}\n${listed}\n\nJSON: {"best": 1~4, "scores":[s1,s2,s3,s4]}`;
    let p = null;
    try { const r = await call(JUDGE, [{ role: "system", content: sys }, { role: "user", content: user }], { maxTok: 400, reasoningOff: true }); p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]); } catch { }
    if (p && p.best >= 1 && p.best <= 4) {
      const winner = shuffled[p.best - 1].model; wins[angle][winner]++;
      if (Array.isArray(p.scores)) p.scores.forEach((sc, i) => { const mn = shuffled[i].model; scoreSum[angle][mn] += Number(sc) || 0; scoreN[angle][mn]++; });
      detail.push({ goal, angle, winner, order: shuffled.map((x) => x.model) });
      console.log(`${angle.padEnd(6)} best=${winner.padEnd(18)} ${goal.slice(0, 16)}`);
    } else console.log(`${angle.padEnd(6)} (심판 파싱 실패) ${goal.slice(0, 16)}`);
  }
}
// 관점별 평균 점수
const avgScore = {};
for (const a of ANGLES) { avgScore[a] = {}; for (const m of MODELS) avgScore[a][m.name] = scoreN[a][m.name] ? +(scoreSum[a][m.name] / scoreN[a][m.name]).toFixed(2) : null; }
fs.writeFileSync("benchmarks/specialization.json", JSON.stringify({ ranAt: new Date().toISOString(), goals: GOALS.length, wins, avgScore, detail }, null, 2));
console.log(`\n=== 관점별 1등 횟수 (goal ${GOALS.length}개 중) ===`);
for (const a of ANGLES) console.log(`${a.padEnd(6)}`, ANGLES && JSON.stringify(wins[a]));
console.log(`\n=== 관점별 평균 점수 ===`);
for (const a of ANGLES) console.log(`${a.padEnd(6)}`, JSON.stringify(avgScore[a]));
console.log("SAVED benchmarks/specialization.json");
