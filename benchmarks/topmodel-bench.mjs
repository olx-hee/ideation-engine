/* 상위(플래그십) 모델 대비 — 저가 픽(Solar·DeepSeek)이 분석·보고에서 얼마나 뒤지나(객관성 보강).
   후보 8: 우리픽(Solar·DeepSeek-V3.2) + 상위(Gemini-2.5-Pro·GPT-5.6-terra·Grok-4.6·Claude-Opus-4.1·DeepSeek-V4-Pro·Qwen3.8-max).
   과제: analyze(테마화) + report(종합·로드맵). 블라인드 심판 3(후보와 분리). n=4골. 품질+실비용.
   실행: cd ideation-engine && node benchmarks/topmodel-bench.mjs   결과: benchmarks/topmodel-bench.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const CAND = [
  { k: "Solar-Pro4", slug: "upstage/solar-pro4", tier: "우리(저가)" },
  { k: "DeepSeek-V3.2", slug: "deepseek/deepseek-v3.2", tier: "우리" },
  { k: "Gemini-2.5-Pro", slug: "google/gemini-2.5-pro", tier: "상위" },
  { k: "GPT-5.6-terra-pro", slug: "openai/gpt-5.6-terra-pro", tier: "상위" },
  { k: "Grok-4.6", slug: "x-ai/grok-4.6", tier: "상위" },
  { k: "Claude-Opus-4.1", slug: "anthropic/claude-opus-4.1", tier: "상위(최고가)" },
  { k: "DeepSeek-V4-Pro", slug: "deepseek/deepseek-v4-pro", tier: "상위" },
  { k: "Qwen3.8-max", slug: "qwen/qwen3.8-max", tier: "상위" },
];
const JUDGES = ["openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct", "mistralai/mistral-medium-3"];
const GOALS = [
  { goal: "1인 가구의 식단·장보기를 돕는 서비스", pool: ["냉장고 재고 인식 레시피 추천", "소분 공동구매", "유통기한 임박 나눔 매칭", "AI 주간 식단 자동편성", "특가 연동 최저가 장바구니", "남은 재료 요리 챌린지"], themes: ["재고·낭비 절감", "비용 최적화", "개인화 코칭"] },
  { goal: "중고 거래 사기를 줄이는 앱", pool: ["판매자 신뢰점수", "에스크로 기본", "AI 사기패턴 탐지", "영상통화 확인", "사기이력 블랙리스트", "송장 검증"], themes: ["신뢰 가시화", "거래 안전장치", "실시간 검증"] },
  { goal: "노인의 디지털 기기 사용을 돕는 서비스", pool: ["큰글씨·음성 간편모드", "가족 원격지원", "맞춤 홈", "보이스 대신걸기", "사기경고", "방문 도우미"], themes: ["접근성 UI", "관계 기반 지원", "안전"] },
  { goal: "프리랜서의 계약·정산을 돕는 서비스", pool: ["표준계약서·전자서명", "세금계산서 자동화", "미수금 독촉 자동", "시간·경비 추적", "에스크로 마일스톤", "수입 대시보드"], themes: ["계약 표준화", "정산 자동화", "가시성"] },
];
const SYS = {
  analyze: "너는 아이디어 분석가다. 목표와 제출된 아이디어들을 (1)3~4개 테마로 묶고 (2)각 테마의 공통 구조·핵심 인사이트를 요약하고 (3)실행 우선순위를 근거와 함께 제시하라. 한국어로 구조화.",
  report: "너는 정리·보고 담당이다. 목표·아이디어·테마를 종합해 (1)핵심 요약 3줄 (2)3단계 실행 로드맵 (3)우선순위 Top3+근거 (4)주요 리스크 2개+대응을 한국어로 구조화해 작성하라.",
};
const userMsg = (task, g) => task === "analyze"
  ? `목표: ${g.goal}\n\n[아이디어]\n${g.pool.map((x, i) => `${i + 1}. ${x}`).join("\n")}`
  : `목표: ${g.goal}\n\n[아이디어]\n${g.pool.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n[테마]\n${g.themes.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;

async function call(slug, messages, { maxTok = 1200, temp = 0.5 } = {}) {
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-TopModel" }, body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: temp, usage: { include: true } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status} ${JSON.stringify(d).slice(0, 90)}`);
      const text = (d.choices?.[0]?.message?.content || "").trim(); const cost = (d.usage || {}).cost || 0;
      if (!text && a === 0) { maxTok += 1500; continue; }
      return { text, cost };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 600)); }
  }
  return { text: "", cost: 0 };
}
const L = "ABCDEFGH".split("");
async function judge(jslug, task, g, items) {
  const dims = task === "analyze" ? "테마 그룹화 타당성·인사이트·우선순위 유용성·한국어" : "종합·구조화·로드맵 유용성·우선순위·리스크·한국어";
  for (let a = 0; a < 2; a++) {
    try {
      const listed = items.map((t, i) => `[${L[i]}]\n${(t || "(빈)").slice(0, 1100)}`).join("\n\n");
      const r = await call(jslug, [{ role: "system", content: `아래 ${items.length}개 '${task}' 결과를 각 1~5점(${dims}). 설명·코드블록 금지. JSON만: {${items.map((_, i) => `"${L[i]}":n`).join(",")}}` }, { role: "user", content: `목표: ${g.goal}\n\n${listed}` }], { maxTok: 150, temp: 0.2 });
      const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]); if (items.every((_, i) => p[L[i]] >= 1 && p[L[i]] <= 5)) return p;
    } catch { } await new Promise((s) => setTimeout(s, 350));
  }
  return null;
}

const acc = {}; for (const c of CAND) acc[c.k] = { analyze: { s: 0, n: 0 }, report: { s: 0, n: 0 }, cost: 0, cn: 0, empty: 0 };
for (const task of ["analyze", "report"]) {
  for (const g of GOALS) {
    const outs = {};
    for (const c of CAND) { const r = await call(c.slug, [{ role: "system", content: SYS[task] }, { role: "user", content: userMsg(task, g) }]); outs[c.k] = r; acc[c.k].cost += r.cost; acc[c.k].cn++; if (!r.text) acc[c.k].empty++; }
    const sh = CAND.map((c) => ({ k: c.k, text: outs[c.k].text })).map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const judged = []; for (const j of JUDGES) { const p = await judge(j, task, g, sh.map((x) => x.text)); if (p) judged.push(p); }
    if (!judged.length) { console.log(`${task} ${g.goal.slice(0, 8)} 심판실패`); continue; }
    sh.forEach((it, i) => { const vals = judged.map((p) => Number(p[L[i]])).filter((v) => v >= 1 && v <= 5); if (vals.length) { acc[it.k][task].s += vals.reduce((a, b) => a + b, 0) / vals.length; acc[it.k][task].n++; } });
    console.log(`${task} ${g.goal.slice(0, 10)} 심판${judged.length} 완료`);
  }
}
const q = (k, t) => acc[k][t].n ? +(acc[k][t].s / acc[k][t].n).toFixed(2) : null;
const rows = CAND.map((c) => ({ model: c.k, tier: c.tier, analyze: q(c.k, "analyze"), report: q(c.k, "report"), avg: +(((q(c.k, "analyze") || 0) + (q(c.k, "report") || 0)) / 2).toFixed(2), costAvg: +(acc[c.k].cost / (acc[c.k].cn || 1)).toFixed(6), empty: acc[c.k].empty }));
fs.writeFileSync("benchmarks/topmodel-bench.json", JSON.stringify({ ranAt: new Date().toISOString(), n: GOALS.length, tasks: ["analyze", "report"], judges: JUDGES, rows }, null, 2));
const solar = rows.find((r) => r.model === "Solar-Pro4");
console.log(`\n=== 상위모델 대비 (n=${GOALS.length}골 × analyze+report, 심판3) ===`);
[...rows].sort((a, b) => b.avg - a.avg).forEach((r) => {
  const mult = solar.costAvg ? (r.costAvg / solar.costAvg).toFixed(0) : "?";
  console.log(`${r.model.padEnd(17)} [${r.tier}] 평균 ${r.avg} (분석 ${r.analyze}/보고 ${r.report})  비용 $${r.costAvg} (Solar의 ${mult}배)  ${r.empty ? "빈" + r.empty : ""}`);
});
const top = [...rows].sort((a, b) => b.avg - a.avg)[0];
console.log(`\n>>> 최고 품질: ${top.model} 평균 ${top.avg} vs Solar ${solar.avg} → 격차 ${(top.avg - solar.avg).toFixed(2)}점, 비용 ${(top.costAvg / (solar.costAvg || 1e-9)).toFixed(0)}배`);
console.log("SAVED benchmarks/topmodel-bench.json");
