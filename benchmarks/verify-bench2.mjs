/* 검증 벤치 v2 — (Part1) 미묘 결함 변별력 재측정 + (Part2) self vs other 독립성 A/B.
   Part1: 은근한 결함 심은 결과물 → 후보 검토 → recall (변별력 확인).
   Part2: Solar가 결과물 생성 → Solar-self 검증 vs Llama/DeepSeek-other 검증 → 심판이 "other가 self 놓친 유효결함 잡았나" 비교.
   실행: cd ideation-engine && node benchmarks/verify-bench2.mjs   결과: benchmarks/verify-bench2.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const SOLAR = "upstage/solar-pro4", LLAMA = "meta-llama/llama-3.3-70b-instruct", DEEPSEEK = "deepseek/deepseek-v3.2";
const CANDIDATES = [
  { k: "GLM-4.6", slug: "z-ai/glm-4.6" }, { k: "Llama-3.3", slug: LLAMA }, { k: "DeepSeek-V3.2", slug: DEEPSEEK },
  { k: "Kimi-K2.5", slug: "moonshotai/kimi-k2.5" }, { k: "Gemini-2.5-F", slug: "google/gemini-2.5-flash" },
  { k: "Solar-Pro4", slug: SOLAR }, { k: "Qwen3.7-Plus", slug: "qwen/qwen3.7-plus" },
];
const JUDGES = ["openai/gpt-4o-mini", "mistralai/mistral-medium-3"];

// 미묘한 결함(노골 X): 근거 약한 과장·미세 논리비약·조용한 누락·경계선 수치
const ITEMS = [
  { text: `[중고거래 사기 방지 앱 분석]\n블록체인 에스크로를 도입하면 거래는 대체로 몇 초 안에 확정돼 사용자 이탈을 크게 줄인다. 익명성을 보장하므로 참여율이 높고, 익명이기에 사용자들이 오히려 더 책임감 있게 행동한다. 초기 신뢰 점수는 가입 즉시 정확히 산출되며, MVP는 2주면 충분히 만들 수 있다.`,
    flaws: [
      { id: "F1", desc: "'블록체인 거래가 대체로 몇 초 안에 확정' — 체인·혼잡도에 따라 다르며 일반화 오류" },
      { id: "F2", desc: "'익명이라 오히려 더 책임감 있게 행동' — 근거 없는 비약(익명은 보통 책임감↓)" },
      { id: "F3", desc: "'가입 즉시 신뢰 점수를 정확히 산출' — 거래 이력 없이 정확 산출은 불가에 가까움" },
      { id: "F4", desc: "'MVP 2주면 충분' — 결제·에스크로·인증 포함이면 경계선/낙관" },
    ] },
  { text: `[1인 가구 식단 앱 분석]\n냉장고 사진 인식은 대부분의 식재료를 잘 잡아내며, 유통기한도 상당히 정확히 추정한다. 무료로 시작해 사용자를 빠르게 모은 뒤 자연스럽게 유료로 전환하면 수익성은 크게 걱정할 필요가 없다. 개인 식이 데이터는 민감하지만 익명 처리만 하면 대체로 규제에서 자유롭다.`,
    flaws: [
      { id: "F1", desc: "'유통기한도 상당히 정확히 추정' — 사진만으로 유통기한 추정은 근거 약한 과장" },
      { id: "F2", desc: "'유료 전환하면 수익성 걱정 없다' — 전환율 근거 없이 낙관" },
      { id: "F3", desc: "'익명 처리만 하면 대체로 규제 자유' — 건강·식이 데이터 규제를 과소평가" },
      { id: "F4", desc: "'대부분의 식재료를 잘 잡아낸다' — 검증 없는 성능 단정" },
    ] },
  { text: `[노인 디지털 도우미 분석]\n음성 인터페이스를 도입하면 대부분의 노인이 큰 어려움 없이 사용할 수 있다. 가족 원격 지원 기능이 있으면 사실상 별도 교육은 거의 필요 없다. 접근성 설정은 기본값으로도 충분한 편이라 초기엔 우선순위가 낮아도 된다. 사용자 확보는 복지관 제휴로 어렵지 않게 이룰 수 있다.`,
    flaws: [
      { id: "F1", desc: "'대부분의 노인이 큰 어려움 없이' — 근거 약한 일반화" },
      { id: "F2", desc: "'별도 교육은 거의 필요 없다' — 원격지원이 교육을 대체한다는 비약" },
      { id: "F3", desc: "'접근성은 기본값으로 충분·우선순위 낮아도' — 코어 가치를 과소평가" },
      { id: "F4", desc: "'복지관 제휴로 어렵지 않게' — 확보 난이도 낙관" },
    ] },
  { text: `[팀 회의 퍼실리테이터 분석]\nAI가 발언을 요약하면 회의 시간은 대체로 절반 가까이 줄어든다. 익명 입력을 도입하면 심리적 안전이 확보되어 갈등은 거의 발생하지 않는다. 감정 분석은 텍스트 기반이라 민감 정보 이슈에서 대체로 자유롭다. 기존 협업툴과 달리 차별성이 분명해 초기 확보도 수월하다.`,
    flaws: [
      { id: "F1", desc: "'회의 시간이 대체로 절반 가까이 준다' — 근거 없는 수치 과장" },
      { id: "F2", desc: "'익명이라 갈등이 거의 발생하지 않는다' — 비약(익명이 갈등을 없애지 않음)" },
      { id: "F3", desc: "'텍스트 기반이라 민감정보 이슈에서 자유' — 발언 내용도 민감할 수 있음" },
      { id: "F4", desc: "'차별성이 분명해 초기 확보 수월' — 근거 약한 낙관" },
    ] },
  { text: `[프리랜서 정산 분석]\n스마트컨트랙트로 정산을 자동화하면 분쟁은 대체로 크게 줄어든다. 표준 계약서 템플릿만 제공해도 대부분의 계약 상황을 무난히 커버한다. 세무 처리는 자동화로 대체로 해결되므로 별도 자문 부담은 크지 않다. 개발은 3주 정도면 핵심 기능을 낼 수 있다.`,
    flaws: [
      { id: "F1", desc: "'분쟁이 대체로 크게 줄어든다' — 스마트컨트랙트가 해석·이행 분쟁을 없애진 않음" },
      { id: "F2", desc: "'템플릿만으로 대부분의 계약 상황 커버' — 과장(맞춤 조항 필요)" },
      { id: "F3", desc: "'세무는 자동화로 대체로 해결, 자문 부담 작다' — 세무 복잡성 과소평가" },
      { id: "F4", desc: "'3주면 핵심 기능' — 결제·서명·정산 포함이면 경계선 낙관" },
    ] },
];
const GOALS = ["중고 거래 사기를 줄이는 앱", "1인 가구의 식단·장보기를 돕는 서비스", "노인의 디지털 기기 사용을 돕는 서비스", "비대면 팀 회의의 효율을 높이는 서비스", "프리랜서의 계약·정산을 돕는 서비스"];

async function call(slug, messages, { maxTok = 800, temp = 0.3 } = {}) {
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Verify2" }, body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: temp, usage: { include: true } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status}`);
      const text = (d.choices?.[0]?.message?.content || "").trim(); const cost = (d.usage || {}).cost || 0;
      if (!text && a === 0) { maxTok += 1000; continue; }
      return { text, cost };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 500)); }
  }
  return { text: "", cost: 0 };
}
const REVIEW_SYS = "너는 결과물 검증가다. 아래 [결과물]에서 근거 약한 과장·사실오류·논리 비약·조용한 누락·비현실적 수치를 모두 찾아 번호로 지적하라. 각 지적은 '어떤 문장이 왜 문제인지'를 한 줄로. 은근한 결함도 놓치지 말 것.";
const review = (slug, text) => call(slug, [{ role: "system", content: REVIEW_SYS }, { role: "user", content: `[결과물]\n${text}` }]);

// ── Part 1: 미묘 결함 recall ──
async function judgeCaught(judgeSlug, item, reviewText) {
  const flaws = item.flaws.map((f) => `${f.id}: ${f.desc}`).join("\n");
  const sys = `[원본]에 심어진 [결함 목록]과 [검토자가 찾은 것]을 비교. 각 결함을 검토자가 (표현 달라도 의미상) 지적했으면 true. JSON만: {${item.flaws.map((f) => `"${f.id}":true`).join(",")}}`;
  for (let a = 0; a < 2; a++) {
    try {
      const r = await call(judgeSlug, [{ role: "system", content: sys }, { role: "user", content: `[원본]\n${item.text}\n\n[결함 목록]\n${flaws}\n\n[검토자]\n${reviewText || "(빈)"}` }], { maxTok: 120, temp: 0.1 });
      const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]); if (item.flaws.every((f) => typeof p[f.id] === "boolean")) return p;
    } catch { } await new Promise((s) => setTimeout(s, 250));
  }
  return null;
}
// ── Part 2: self vs other 비교 판정 ──
async function judgeCompare(judgeSlug, output, selfReview, otherReview) {
  const sys = `Solar가 만든 [결과물]을, [자기검증(self)]과 [타모델검증(other)]이 각각 지적했다. 오직 '유효한(실제로 타당한) 결함'만 세어라. JSON만: {"otherCaught_selfMissed":n,"selfCaught_otherMissed":n,"bothCaught":n} (n=정수, other가 잡았고 self는 놓친 유효결함 수 / 반대 / 둘 다 잡은 수)`;
  for (let a = 0; a < 2; a++) {
    try {
      const r = await call(judgeSlug, [{ role: "system", content: sys }, { role: "user", content: `[결과물]\n${output}\n\n[자기검증 self]\n${selfReview || "(빈)"}\n\n[타모델검증 other]\n${otherReview || "(빈)"}` }], { maxTok: 100, temp: 0.1 });
      const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]);
      if (["otherCaught_selfMissed", "selfCaught_otherMissed", "bothCaught"].every((k) => Number.isFinite(+p[k]))) return { o: +p.otherCaught_selfMissed, s: +p.selfCaught_otherMissed, b: +p.bothCaught };
    } catch { } await new Promise((s) => setTimeout(s, 250));
  }
  return null;
}

// ===== Part 1 =====
const totalFlaws = ITEMS.reduce((s, it) => s + it.flaws.length, 0);
const acc = {}; for (const c of CANDIDATES) acc[c.k] = { caught: 0, cost: 0, empty: 0 };
console.log("── Part 1: 미묘 결함 recall ──");
for (const it of ITEMS) {
  for (const c of CANDIDATES) {
    const rv = await review(c.slug, it.text); acc[c.k].cost += rv.cost; if (!rv.text) acc[c.k].empty++;
    const votes = []; for (const j of JUDGES) { const p = await judgeCaught(j, it, rv.text); if (p) votes.push(p); }
    if (!votes.length) continue;
    for (const f of it.flaws) { const credit = votes.map((p) => (p[f.id] ? 1 : 0)).reduce((a, b) => a + b, 0) / votes.length; acc[c.k].caught += credit; }
  }
  console.log(`  ${it.text.slice(1, 12)} 완료`);
}
const p1 = CANDIDATES.map((c) => ({ model: c.k, recall: +(acc[c.k].caught / totalFlaws).toFixed(3), costAvg: +(acc[c.k].cost / ITEMS.length).toFixed(6), empty: acc[c.k].empty }));

// ===== Part 2 =====
console.log("── Part 2: self vs other (Solar 생성물 검증) ──");
const OTHERS = [{ k: "Llama-3.3", slug: LLAMA }, { k: "DeepSeek-V3.2", slug: DEEPSEEK }];
const p2acc = {}; for (const o of OTHERS) p2acc[o.k] = { o: 0, s: 0, b: 0, n: 0 };
const p2rows = [];
for (const g of GOALS) {
  const gen = await call(SOLAR, [{ role: "system", content: "너는 분석가다. 목표에 대한 대표 아이디어 하나를 잡아 시장성·차별성·실현성을 4~5문장으로 자신 있게 분석하라. 한국어." }, { role: "user", content: `목표: ${g}` }], { maxTok: 400, temp: 0.8 });
  const selfRev = await review(SOLAR, gen.text);
  for (const o of OTHERS) {
    const otherRev = await review(o.slug, gen.text);
    const votes = []; for (const j of JUDGES) { const c = await judgeCompare(j, gen.text, selfRev.text, otherRev.text); if (c) votes.push(c); }
    if (!votes.length) continue;
    const avg = (k) => votes.reduce((a, v) => a + v[k], 0) / votes.length;
    p2acc[o.k].o += avg("o"); p2acc[o.k].s += avg("s"); p2acc[o.k].b += avg("b"); p2acc[o.k].n++;
    p2rows.push({ goal: g.slice(0, 12), other: o.k, otherCaught_selfMissed: +avg("o").toFixed(2), selfCaught_otherMissed: +avg("s").toFixed(2), both: +avg("b").toFixed(2) });
  }
  console.log(`  ${g.slice(0, 12)} 완료`);
}
const p2 = OTHERS.map((o) => ({ other: o.k, otherCaught_selfMissed_avg: +(p2acc[o.k].o / (p2acc[o.k].n || 1)).toFixed(2), selfCaught_otherMissed_avg: +(p2acc[o.k].s / (p2acc[o.k].n || 1)).toFixed(2), bothCaught_avg: +(p2acc[o.k].b / (p2acc[o.k].n || 1)).toFixed(2) }));

fs.writeFileSync("benchmarks/verify-bench2.json", JSON.stringify({ ranAt: new Date().toISOString(), part1_subtleRecall: { items: ITEMS.length, totalFlaws, rows: p1 }, part2_selfVsOther: { note: "Solar 생성물을 Solar-self vs other가 검증. otherCaught_selfMissed>selfCaught_otherMissed면 독립이 더 잡음.", rows: p2, perGoal: p2rows } }, null, 2));

console.log(`\n=== Part 1: 미묘 결함 recall (결함 ${totalFlaws}개) ===`);
[...p1].sort((a, b) => b.recall - a.recall).forEach((r) => console.log(`${r.model.padEnd(14)} recall ${(r.recall * 100).toFixed(0)}%  $${r.costAvg}  ${r.empty ? "빈" + r.empty : ""}`));
console.log(`\n=== Part 2: self(Solar) vs other 독립성 ===`);
p2.forEach((r) => console.log(`other=${r.other.padEnd(14)}  other가 잡고 self가 놓친 유효결함 ${r.otherCaught_selfMissed_avg}  vs  self만 잡은 것 ${r.selfCaught_otherMissed_avg}  (둘다 ${r.bothCaught_avg}) → ${r.otherCaught_selfMissed_avg > r.selfCaught_otherMissed_avg ? "독립이 더 잡음 ✅" : "독립 이득 없음"}`));
console.log("SAVED benchmarks/verify-bench2.json");
