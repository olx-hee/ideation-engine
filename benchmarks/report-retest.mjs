/* report(정리·보고) 재테스트 — analyze와 별도로, 더 무거운 '종합 보고서/로드맵' 과제.
   Grok 1733: report를 analyze와 동일 취급은 위험(출력 길이·종합 난이도 다름) → 별도 확인.
   후보 8종(analyze와 동일: 추론4+강범용4). 같은 입력(목표+아이디어+테마)으로 실행 로드맵 보고서 생성.
   심판 3종(후보와 분리) 블라인드·저온·재시도. n=5. report는 길어 max_tokens 2800.
   실행: cd ideation-engine && node benchmarks/report-retest.mjs   결과: benchmarks/report-retest.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const CANDIDATES = [
  { k: "GLM-4.6",      slug: "z-ai/glm-4.6" },                    // 현행 report baseline (추론)
  { k: "Nemotron-3.5L",slug: "nvidia/nemotron-3.5-lightning" },  // 추론
  { k: "DeepSeek-V3.2",slug: "deepseek/deepseek-v3.2" },         // 추론
  { k: "Qwen3.7-Plus", slug: "qwen/qwen3.7-plus" },              // 추론
  { k: "Solar-Pro4",   slug: "upstage/solar-pro4" },             // 강범용·최저가 (비추론)
  { k: "Kimi-K2.5",    slug: "moonshotai/kimi-k2.5" },           // 강범용
  { k: "Grok-4.3",     slug: "x-ai/grok-4.3" },                  // 강범용
  { k: "Gemini-2.5-F", slug: "google/gemini-2.5-flash" },        // 강범용
];
const JUDGES = ["openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct", "mistralai/mistral-medium-3"];

const SYS = "너는 팀 아이디어 세션의 정리·보고 담당이다. 아래 목표·아이디어·테마를 종합해 실행 가능한 보고서를 작성하라. 반드시 (1) 핵심 요약 3줄 (2) 3단계 실행 로드맵(단계별 목표·핵심활동) (3) 우선순위 Top3와 근거 (4) 주요 리스크 2개와 대응을 한국어로 구조화해 담아라.";
// 목표 + 아이디어 + (analyze 산출을 모사한) 테마 묶음 = report 입력
const GOALS = [
  { goal: "1인 가구의 식단·장보기를 돕는 서비스",
    ideas: ["냉장고 재고 인식 레시피 추천", "소분 공동구매", "유통기한 임박 나눔 매칭", "AI 주간 식단 자동편성", "특가 연동 최저가 장바구니", "남은 재료 요리 챌린지"],
    themes: ["재고·낭비 절감(인식/임박/나눔)", "비용 최적화(공동구매/특가)", "개인화 코칭(식단/챌린지)"] },
  { goal: "중고 거래 사기를 줄이는 앱",
    ideas: ["판매자 신뢰점수", "에스크로 기본", "AI 사기패턴 탐지", "영상통화 확인", "사기이력 블랙리스트", "송장 검증"],
    themes: ["신뢰 가시화(점수/블랙리스트)", "거래 안전장치(에스크로/송장)", "실시간 검증(AI/영상)"] },
  { goal: "노인의 디지털 기기 사용을 돕는 서비스",
    ideas: ["큰글씨·음성 간편모드", "가족 원격지원", "맞춤 홈", "보이스 대신걸기", "사기경고", "방문 도우미"],
    themes: ["접근성 UI(간편모드/맞춤홈)", "관계 기반 지원(가족/방문)", "안전(사기경고/보이스)"] },
  { goal: "지역 축제 참여를 늘리는 플랫폼",
    ideas: ["취향 추천·알림", "스탬프 투어 게임화", "혼잡도·주차 안내", "상점 연계 쿠폰", "봉사·부스 매칭", "후기 커뮤니티"],
    themes: ["발견·유입(추천/알림)", "현장 경험(게임화/혼잡도)", "지역 연계(쿠폰/봉사/커뮤니티)"] },
  { goal: "프리랜서의 계약·정산을 돕는 서비스",
    ideas: ["표준계약서·전자서명", "세금계산서 자동화", "미수금 독촉 자동", "시간·경비 추적", "에스크로 마일스톤", "수입 대시보드"],
    themes: ["계약 표준화(템플릿/서명)", "정산 자동화(세금/미수금/에스크로)", "가시성(추적/대시보드)"] },
];

async function call(slug, messages, { maxTok = 2800, temp = 0.5 } = {}) {
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-ReportRetest" }, body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: temp, usage: { include: true } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status} ${JSON.stringify(d).slice(0, 100)}`);
      const text = (d.choices?.[0]?.message?.content || "").trim();
      const cost = (d.usage || {}).cost || 0;
      if (!text && a === 0) { maxTok = 4000; continue; }
      return { text, cost };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 500)); }
  }
  return { text: "", cost: 0 };
}
async function runCandidate(c, G) {
  const user = `목표: ${G.goal}\n\n[아이디어]\n${G.ideas.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n[테마 묶음]\n${G.themes.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
  return call(c.slug, [{ role: "system", content: SYS }, { role: "user", content: user }]);
}
const LT = "ABCDEFGH".split("");
async function judgeOne(slug, G, items) {
  for (let a = 0; a < 2; a++) {
    try {
      const listed = items.map((t, i) => `[${LT[i]}]\n${(t || "(빈 응답)").slice(0, 1100)}`).join("\n\n");
      const sys = `아래 ${items.length}개의 '실행 보고서'를 각 1~5점으로 평가하라. 기준: 종합·구조화·요구항목 충실(요약/로드맵/우선순위/리스크)·실행 유용성·한국어 명료성. 설명·코드블록 금지. JSON만: {${items.map((_, i) => `"${LT[i]}":n`).join(",")}}`;
      const r = await call(slug, [{ role: "system", content: sys }, { role: "user", content: `목표: ${G.goal}\n\n${listed}` }], { maxTok: 150, temp: 0.2 });
      const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]);
      if (items.every((_, i) => p[LT[i]] >= 1 && p[LT[i]] <= 5)) return p;
    } catch { }
    await new Promise((s) => setTimeout(s, 400));
  }
  return null;
}

const acc = {}; for (const c of CANDIDATES) acc[c.k] = { s: 0, sn: 0, cost: 0, cn: 0, wins: 0, empty: 0 };
const perGoal = [];
for (const G of GOALS) {
  const outs = {};
  for (const c of CANDIDATES) {
    try { const r = await runCandidate(c, G); outs[c.k] = r; if (!r.text) acc[c.k].empty++; }
    catch (e) { outs[c.k] = { text: "", cost: 0 }; acc[c.k].empty++; console.log(`  ${c.k} 실패: ${String(e).slice(0, 70)}`); }
    acc[c.k].cost += outs[c.k].cost; acc[c.k].cn++;
  }
  const sh = CANDIDATES.map((c) => ({ k: c.k, text: outs[c.k].text })).map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const judged = [];
  for (const j of JUDGES) { const p = await judgeOne(j, G, sh.map((x) => x.text)); if (p) judged.push(p); }
  if (!judged.length) { console.log(`${G.goal.slice(0, 10)} 심판전부실패`); continue; }
  const gs = {};
  sh.forEach((it, i) => { const vals = judged.map((p) => Number(p[LT[i]])).filter((v) => v >= 1 && v <= 5); if (vals.length) { const avg = vals.reduce((a, b) => a + b, 0) / vals.length; acc[it.k].s += avg; acc[it.k].sn++; gs[it.k] = +avg.toFixed(2); } });
  const best = Object.entries(gs).sort((a, b) => b[1] - a[1])[0]; if (best) acc[best[0]].wins++;
  perGoal.push({ goal: G.goal, judges: judged.length, scores: gs, winner: best?.[0] });
  console.log(`${G.goal.slice(0, 12)} 심판${judged.length} 승자=${best?.[0]}  ${Object.entries(gs).sort((a,b)=>b[1]-a[1]).map(([k, v]) => k + v).join(" ")}`);
}
const q = (k) => acc[k].sn ? +(acc[k].s / acc[k].sn).toFixed(3) : null;
const co = (k) => acc[k].cn ? +(acc[k].cost / acc[k].cn).toFixed(6) : null;
const rows = CANDIDATES.map((c) => ({ model: c.k, slug: c.slug, quality: q(c.k), cost: co(c.k), wins: acc[c.k].wins, empty: acc[c.k].empty, judgedGoals: acc[c.k].sn }));
fs.writeFileSync("benchmarks/report-retest.json", JSON.stringify({ ranAt: new Date().toISOString(), n: GOALS.length, task: "report", judges: JUDGES, rows, perGoal }, null, 2));
console.log(`\n=== report 재테스트 (n=${GOALS.length}, 심판 3, 블라인드) ===`);
[...rows].sort((a, b) => (b.quality || 0) - (a.quality || 0)).forEach((r) => console.log(`${r.model.padEnd(14)} 품질 ${r.quality}  승 ${r.wins}/${r.judgedGoals}  비용 $${r.cost}  ${r.empty ? "빈응답" + r.empty : ""}`));
const cur = rows.find((r) => r.model === "GLM-4.6");
const solar = rows.find((r) => r.model === "Solar-Pro4");
const top = [...rows].sort((a, b) => (b.quality || 0) - (a.quality || 0))[0];
console.log(`\n현행 GLM-4.6: 품질 ${cur.quality} $${cur.cost}  |  Solar-Pro4: 품질 ${solar.quality} $${solar.cost}  |  최고: ${top.model} ${top.quality}`);
console.log(solar.quality >= cur.quality ? ">>> Solar ≥ GLM: report도 Solar 교체 근거" : ">>> GLM > Solar: report는 재검토 필요");
console.log("SAVED benchmarks/report-retest.json");
