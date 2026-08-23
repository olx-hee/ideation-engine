/* Map-Reduce 검증 — "분업 + 종합"이 조율 실패를 풀어 분업을 의미있게 만드나?
   A 단일(강모델 1개가 4관점) / B 분업만(4모델 각도별, 조율X) / C 분업+종합(4병렬 → 1모델이 병합·보완).
   블라인드 심판 2개(GLM+Llama) 채점 + 비용. n=6 goal.
   실행: cd ideation-engine && node benchmarks/mapreduce.mjs   결과: benchmarks/mapreduce.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const SINGLE = "google/gemini-2.5-flash";
const SYNTH = "google/gemini-2.5-flash";        // 종합(reduce) 모델
const FANOUT = [                                  // 각도별 다른 모델(다양성)
  { a: "사업성", s: "upstage/solar-pro4" }, { a: "사용자경험", s: "google/gemini-2.5-flash-lite" },
  { a: "기술", s: "openai/gpt-4o-mini" }, { a: "참신함", s: "mistralai/mistral-medium-3" },
];
const JUDGES = ["z-ai/glm-4.6", "meta-llama/llama-3.3-70b-instruct"];
const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스",
  "중고 거래의 사기를 줄이는 앱", "노인의 디지털 기기 사용을 돕는 서비스", "반려동물 산책 메이트를 연결하는 앱",
];

async function call(slug, messages, { maxTok = 500, reasoningOff = false } = {}) {
  const body = { model: slug, messages, max_tokens: maxTok, temperature: 0.7, usage: { include: true }, ...(reasoningOff ? { reasoning: { enabled: false } } : {}) };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-MapReduce" }, body: JSON.stringify(body) });
  const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status}`);
  return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
}
async function armSingle(g) {
  const r = await call(SINGLE, [{ role: "system", content: "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 겹치지 않는 새 아이디어 하나씩, 각 2문장 이내 한국어." }, { role: "user", content: `목표: ${g}` }], { maxTok: 600 });
  return { text: r.text, cost: r.cost };
}
async function armFanout(g) {
  let cost = 0; const parts = [];
  for (const f of FANOUT) { const r = await call(f.s, [{ role: "system", content: `너는 아이디어 발산 워커다. '${f.a}' 관점에서만 목표에 대한 새 아이디어 하나를 2문장 이내 한국어로.` }, { role: "user", content: `목표: ${g}` }], { maxTok: 150 }); parts.push(`[${f.a}] ${r.text}`); cost += r.cost; await new Promise((s) => setTimeout(s, 200)); }
  return { raw: parts.join("\n"), text: parts.join("\n"), cost };
}
async function armMapReduce(g, fan) {
  const r = await call(SYNTH, [
    { role: "system", content: "너는 아이디어 종합 편집자다. 아래는 4개 관점에서 각각 독립 생성된 아이디어다. 이들을 종합해 (1) 중복 제거 (2) 4관점을 고루 커버 (3) 부족한 부분 보완하여, 서로 겹치지 않는 세련된 최종 아이디어 4개로 정리하라. 각 2문장 이내 한국어." },
    { role: "user", content: `목표: ${g}\n\n[생성된 원안]\n${fan.raw}` },
  ], { maxTok: 600 });
  return { text: r.text, cost: fan.cost + r.cost }; // 분업 비용 + 종합 비용
}
async function judgeOne(slug, g, X, Y, Z) {
  const user = `목표: ${g}\n\n[X]\n${X}\n\n[Y]\n${Y}\n\n[Z]\n${Z}\n\nJSON: {"X":{"overall":n},"Y":{"overall":n},"Z":{"overall":n},"winner":"X|Y|Z"} — overall 1~5(다양성·구체성·관점충실·한국어 종합)`;
  try { const r = await call(slug, [{ role: "system", content: "세 아이디어 묶음 X/Y/Z를 각 1~5점. 코드블록 없이 JSON만." }, { role: "user", content: user }], { maxTok: 400, reasoningOff: true }); return JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]); } catch { return null; }
}

const rows = [];
for (const g of GOALS) {
  const a = await armSingle(g), b = await armFanout(g); const c = await armMapReduce(g, b);
  const arms = shuffleLabels({ single: a.text, fanout: b.text, mapreduce: c.text });
  let wS = 0, wF = 0, wM = 0; const sc = { single: [], fanout: [], mapreduce: [] };
  for (const j of JUDGES) {
    const p = await judgeOne(j, g, arms.X.text, arms.Y.text, arms.Z.text); if (!p) continue;
    for (const L of ["X", "Y", "Z"]) { const arm = arms[L].arm; if (p[L]?.overall) sc[arm].push(p[L].overall); }
    const w = arms[p.winner]?.arm; if (w === "single") wS++; else if (w === "fanout") wF++; else if (w === "mapreduce") wM++;
  }
  const avg = (arr) => arr.length ? +(arr.reduce((x, y) => x + y, 0) / arr.length).toFixed(2) : null;
  const winner = wM >= wS && wM >= wF && wM > 0 ? "mapreduce" : wS >= wF ? "single" : "fanout";
  rows.push({ goal: g, single: avg(sc.single), fanout: avg(sc.fanout), mapreduce: avg(sc.mapreduce), costSingle: a.cost, costFanout: b.cost, costMapReduce: c.cost, winner });
  console.log(`${winner.padEnd(9)} 단일 ${avg(sc.single)} / 분업 ${avg(sc.fanout)} / 맵리듀스 ${avg(sc.mapreduce)}  ($${a.cost.toFixed(5)}/$${b.cost.toFixed(5)}/$${c.cost.toFixed(5)})  ${g.slice(0, 14)}`);
}
function shuffleLabels(obj) { const arms = Object.entries(obj).map(([arm, text]) => ({ arm, text })); const sh = arms.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]); return { X: sh[0], Y: sh[1], Z: sh[2] }; }
const mean = (k) => { const v = rows.map((r) => r[k]).filter((x) => x != null); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null; };
const wins = rows.reduce((a, r) => (a[r.winner] = (a[r.winner] || 0) + 1, a), {});
fs.writeFileSync("benchmarks/mapreduce.json", JSON.stringify({ ranAt: new Date().toISOString(), single: SINGLE, synth: SYNTH, fanout: FANOUT, judges: JUDGES, n: rows.length, rows, wins }, null, 2));
console.log(`\n=== 집계 n=${rows.length} ===`);
console.log(`승자:`, JSON.stringify(wins));
console.log(`평균 품질 — 단일 ${mean("single")} / 분업만 ${mean("fanout")} / 맵리듀스 ${mean("mapreduce")}`);
console.log(`평균 비용 — 단일 $${mean("costSingle")} / 분업만 $${mean("costFanout")} / 맵리듀스 $${mean("costMapReduce")}`);
console.log("SAVED benchmarks/mapreduce.json");
