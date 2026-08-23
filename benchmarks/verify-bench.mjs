/* 검증(verification) 벤치 — 어느 모델이 결과물의 '결함'을 가장 잘 잡나 (정답형=AI 객관 축).
   일부러 결함(사실오류·환각·논리모순·누락·비현실)을 심은 결과물 5개 → 후보 7종이 검토 → 심어진 결함을 잡았는지 recall 측정.
   심판 2종(후보와 겹치지 않음)이 결함별 caught 판정. recall = Σ(심판평균 caught)/총결함.
   실행: cd ideation-engine && node benchmarks/verify-bench.mjs   결과: benchmarks/verify-bench.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const CANDIDATES = [
  { k: "GLM-4.6", slug: "z-ai/glm-4.6" },
  { k: "Llama-3.3", slug: "meta-llama/llama-3.3-70b-instruct" },
  { k: "DeepSeek-V3.2", slug: "deepseek/deepseek-v3.2" },
  { k: "Kimi-K2.5", slug: "moonshotai/kimi-k2.5" },
  { k: "Gemini-2.5-F", slug: "google/gemini-2.5-flash" },
  { k: "Solar-Pro4", slug: "upstage/solar-pro4" },
  { k: "Qwen3.7-Plus", slug: "qwen/qwen3.7-plus" },
];
const JUDGES = ["openai/gpt-4o-mini", "mistralai/mistral-medium-3"];

// 결함이 심어진 결과물 (검토자는 text만 봄; 심판은 flaws도 봄)
const ITEMS = [
  { text: `[중고거래 사기 방지 앱 분석]\n이 아이디어는 시장에 전혀 없는 세계 최초의 접근이다. 블록체인 에스크로를 쓰면 수수료가 신용카드보다 항상 낮고 즉시 정산된다. 익명 거래로 심리적 안전을 주는 동시에, 모든 사용자의 실명·주소를 전면 공개해 신뢰를 높인다. 실시간 AI 미세표정 분석 기능까지 3일 안에 구현 가능하다. 결제 시스템만 잘 만들면 된다.`,
    flaws: [
      { id: "F1", type: "환각", desc: "'시장에 전혀 없는 세계 최초'라는 주장 — 유사 서비스가 이미 많음" },
      { id: "F2", type: "사실오류", desc: "'블록체인 수수료가 신용카드보다 항상 낮고 즉시 정산' — 가스비·변동성으로 항상 낮지 않음" },
      { id: "F3", type: "논리모순", desc: "'익명으로 안전' 과 '실명·주소 전면 공개' 가 동시에 성립한다는 모순" },
      { id: "F4", type: "비현실", desc: "'실시간 미세표정 분석을 3일 안에 구현' — 비현실적 일정" },
      { id: "F5", type: "누락", desc: "개인정보 보호·규제·수익모델에 대한 언급 누락" },
    ] },
  { text: `[1인 가구 식단 앱 분석]\nAI가 사진만으로 모든 식재료와 정확한 유통기한을 100% 정확히 인식한다. 이런 앱은 아직 세상에 존재하지 않는다. 완전 무료로 제공하면서 동시에 월 구독료로 안정적 수익을 낸다. 개인 건강·식이 데이터를 다루지만 별도의 동의나 규제 절차는 필요 없다. 출시 첫 주에 사용자 100만 명을 확보할 수 있다.`,
    flaws: [
      { id: "F1", type: "과장", desc: "'사진만으로 유통기한을 100% 정확히 인식' — 기술적으로 불가능한 과장" },
      { id: "F2", type: "환각", desc: "'세상에 존재하지 않는다' — 유사 앱이 이미 다수 존재" },
      { id: "F3", type: "논리모순", desc: "'완전 무료'와 '월 구독료 수익'이 동시에 성립한다는 모순" },
      { id: "F4", type: "사실오류", desc: "'건강데이터에 동의·규제 절차 불필요' — 개인정보·건강정보 규제 대상" },
      { id: "F5", type: "비현실", desc: "'첫 주 100만 사용자' — 비현실적 목표" },
    ] },
  { text: `[노인 디지털 도우미 분석]\n노인은 모두 스마트폰을 싫어하므로 음성만으로 모든 기능을 완벽히 대체하면 된다. 이 서비스는 경쟁자가 전혀 없다. 접근성(글자 크기·대비) 고려는 핵심이 아니므로 나중에 추가해도 된다. 노인 대상이라 데이터 보안은 상대적으로 덜 중요하다. 일단 만들고 반응을 보자.`,
    flaws: [
      { id: "F1", type: "과일반화", desc: "'노인은 모두 스마트폰을 싫어한다' — 과도한 일반화" },
      { id: "F2", type: "과장", desc: "'음성만으로 모든 기능을 완벽히 대체' — 과장" },
      { id: "F3", type: "환각", desc: "'경쟁자가 전혀 없다' — 유사 서비스 존재" },
      { id: "F4", type: "우선순위오류", desc: "접근성이 이 제품의 코어인데 '핵심 아님·나중에'로 폄하" },
      { id: "F5", type: "사실오류", desc: "'노인 대상이라 보안 덜 중요' — 오히려 취약계층 보안이 더 중요" },
    ] },
  { text: `[팀 회의 퍼실리테이터 분석]\nAI가 회의 분위기를 100% 정확히 읽어 팀 내 갈등을 완전히 없앤다. Zoom·Teams 같은 경쟁 제품은 존재하지 않는다. 익명 입력이라 악용 가능성은 0이다. 실시간 감정·표정 분석은 어떤 규제와도 무관하다. 수익모델은 굳이 지금 정하지 않아도 된다.`,
    flaws: [
      { id: "F1", type: "과장", desc: "'분위기를 100% 정확히 읽어 갈등을 완전히 없앤다' — 과장" },
      { id: "F2", type: "환각", desc: "'Zoom·Teams 같은 경쟁 제품이 존재하지 않는다' — 명백히 존재" },
      { id: "F3", type: "사실오류", desc: "'익명이라 악용 가능성 0' — 익명은 오히려 악용 위험 존재" },
      { id: "F4", type: "사실오류", desc: "'감정·표정 분석이 규제와 무관' — 생체정보로 규제 대상" },
      { id: "F5", type: "누락", desc: "수익모델 부재를 정당화 — 중요한 누락" },
    ] },
  { text: `[프리랜서 계약·정산 분석]\n블록체인 스마트컨트랙트는 법적 효력이 항상 완전히 보장된다. 이런 정산 서비스는 세계 최초다. 자동 정산이라 분쟁은 절대 발생하지 않는다. 세무·법률 자문 없이 바로 서비스를 출시해도 문제없다. 개발은 1주면 충분하다.`,
    flaws: [
      { id: "F1", type: "사실오류", desc: "'스마트컨트랙트 법적 효력 항상 완전 보장' — 관할·법제도 따라 다름" },
      { id: "F2", type: "환각", desc: "'세계 최초' — 유사 서비스 다수 존재(LaborX 등)" },
      { id: "F3", type: "과장", desc: "'분쟁 절대 발생하지 않는다' — 비현실적 단언" },
      { id: "F4", type: "리스크누락", desc: "'세무·법률 자문 없이 출시 문제없다' — 규제 리스크 무시" },
      { id: "F5", type: "비현실", desc: "'개발 1주면 충분' — 비현실적 일정" },
    ] },
];

async function call(slug, messages, { maxTok = 800, temp = 0.3 } = {}) {
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Verify" }, body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: temp, usage: { include: true } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status} ${JSON.stringify(d).slice(0, 90)}`);
      const text = (d.choices?.[0]?.message?.content || "").trim(); const cost = (d.usage || {}).cost || 0;
      if (!text && a === 0) { maxTok += 1000; continue; }
      return { text, cost };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 500)); }
  }
  return { text: "", cost: 0 };
}
const REVIEW_SYS = "너는 결과물 검증가다. 아래 [결과물]에서 사실오류·환각(없는 걸 있다고 하거나 과장)·논리모순·중요한 누락·비현실적 주장을 모두 찾아 번호로 지적하라. 각 지적은 '어떤 문장이 왜 문제인지'를 한 줄로. 문제 없다고 넘어가지 말고 꼼꼼히.";
async function review(slug, item) { return call(slug, [{ role: "system", content: REVIEW_SYS }, { role: "user", content: `[결과물]\n${item.text}` }]); }

async function judgeCaught(judgeSlug, item, reviewText) {
  const flaws = item.flaws.map((f) => `${f.id}(${f.type}): ${f.desc}`).join("\n");
  const sys = `아래 [원본 결과물]에 실제로 심어진 [결함 목록]과, [검토자가 찾은 것]을 비교하라. 각 결함을 검토자가 (표현이 달라도 의미상) 지적했으면 true, 놓쳤으면 false. 오직 JSON만: {${item.flaws.map((f) => `"${f.id}":true`).join(",")}}`;
  for (let a = 0; a < 2; a++) {
    try {
      const r = await call(judgeSlug, [{ role: "system", content: sys }, { role: "user", content: `[원본 결과물]\n${item.text}\n\n[결함 목록]\n${flaws}\n\n[검토자가 찾은 것]\n${reviewText || "(빈 응답)"}` }], { maxTok: 150, temp: 0.1 });
      const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]);
      if (item.flaws.every((f) => typeof p[f.id] === "boolean")) return p;
    } catch { } await new Promise((s) => setTimeout(s, 300));
  }
  return null;
}

const totalFlaws = ITEMS.reduce((s, it) => s + it.flaws.length, 0);
const acc = {}; for (const c of CANDIDATES) acc[c.k] = { caught: 0, cost: 0, byType: {}, empty: 0 };
const typeTotals = {};
for (const it of ITEMS) for (const f of it.flaws) typeTotals[f.type] = (typeTotals[f.type] || 0) + 1;
const perItem = [];

for (const it of ITEMS) {
  const row = { itemHead: it.text.slice(0, 24), byModel: {} };
  for (const c of CANDIDATES) {
    const rv = await review(c.slug, it); acc[c.k].cost += rv.cost; if (!rv.text) acc[c.k].empty++;
    const votes = [];
    for (const j of JUDGES) { const p = await judgeCaught(j, it, rv.text); if (p) votes.push(p); }
    if (!votes.length) { row.byModel[c.k] = "심판실패"; continue; }
    let caughtHere = 0;
    for (const f of it.flaws) {
      const yes = votes.map((p) => (p[f.id] ? 1 : 0)); const credit = yes.reduce((a, b) => a + b, 0) / yes.length; // 0~1
      acc[c.k].caught += credit; caughtHere += credit;
      acc[c.k].byType[f.type] = (acc[c.k].byType[f.type] || 0) + credit;
    }
    row.byModel[c.k] = +caughtHere.toFixed(2) + "/" + it.flaws.length;
  }
  perItem.push(row);
  console.log(`${it.text.slice(1, 14)} 채점: ${CANDIDATES.map((c) => c.k.split("-")[0] + row.byModel[c.k]).join(" ")}`);
}

const rows = CANDIDATES.map((c) => ({
  model: c.k, recall: +(acc[c.k].caught / totalFlaws).toFixed(3),
  costAvg: +(acc[c.k].cost / ITEMS.length).toFixed(6), empty: acc[c.k].empty,
  byType: Object.fromEntries(Object.entries(acc[c.k].byType).map(([t, v]) => [t, +(v / typeTotals[t]).toFixed(2)])),
}));
fs.writeFileSync("benchmarks/verify-bench.json", JSON.stringify({ ranAt: new Date().toISOString(), items: ITEMS.length, totalFlaws, judges: JUDGES, note: "recall=심어진 결함을 잡은 비율(심판2 평균). 정답형=AI객관축.", rows, typeTotals, perItem }, null, 2));
console.log(`\n=== 검증 벤치 (결과물 ${ITEMS.length}개, 심어진 결함 ${totalFlaws}개, 심판 2) ===`);
[...rows].sort((a, b) => b.recall - a.recall).forEach((r) => console.log(`${r.model.padEnd(14)} recall ${(r.recall * 100).toFixed(0)}%  비용/건 $${r.costAvg}  ${r.empty ? "빈응답" + r.empty : ""}`));
const top = [...rows].sort((a, b) => b.recall - a.recall)[0];
console.log(`\n>>> 검증자 롤 1위: ${top.model} (결함 ${(top.recall * 100).toFixed(0)}% 포착)`);
console.log("유형별 포착(1위 모델):", JSON.stringify(top.byType));
console.log("SAVED benchmarks/verify-bench.json");
