/* 무거운 작업(analyze) 재테스트 — 어느 모델이 '아이디어 분석·구조화'를 가장 잘하나.
   후보 8종(추론4+강범용4, 8개 공급사). 같은 아이디어 묶음을 테마화→인사이트→우선순위로 분석.
   심판 3종(후보와 겹치지 않음: GPT-4o-mini·Llama-3.3·Mistral) 블라인드·저온·재시도. n=5.
   추론모델 빈응답 방지: max_tokens 넉넉 + 빈 응답 시 재시도. 애매하면 슬러그는 preflight로 이미 검증.
   실행: cd ideation-engine && node benchmarks/heavy-analyze.mjs   결과: benchmarks/heavy-analyze.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const CANDIDATES = [
  { k: "GLM-4.6",      slug: "z-ai/glm-4.6" },                    // 현행 baseline (추론)
  { k: "Nemotron-3.5L",slug: "nvidia/nemotron-3.5-lightning" },  // 지난 무거운벤치 상위 (추론)
  { k: "DeepSeek-V3.2",slug: "deepseek/deepseek-v3.2" },         // 추론
  { k: "Qwen3.7-Plus", slug: "qwen/qwen3.7-plus" },              // 추론
  { k: "Solar-Pro4",   slug: "upstage/solar-pro4" },             // 강범용·최저가 (비추론)
  { k: "Kimi-K2.5",    slug: "moonshotai/kimi-k2.5" },           // 강범용
  { k: "Grok-4.3",     slug: "x-ai/grok-4.3" },                  // 강범용
  { k: "Gemini-2.5-F", slug: "google/gemini-2.5-flash" },        // 강범용
];
const JUDGES = ["openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct", "mistralai/mistral-medium-3"];

const SYS = "너는 아이디어 분석가다. 아래 목표와 제출된 아이디어들을 (1) 3~4개 테마로 묶고 (2) 각 테마의 공통 구조·핵심 인사이트를 한두 문장으로 요약하고 (3) 실행 우선순위를 근거와 함께 제시하라. 한국어로 명확히 구조화해서 답하라.";
const GOALS = [
  { goal: "1인 가구의 식단·장보기를 돕는 서비스", ideas: ["냉장고 재고 사진 인식으로 남은 재료 기반 레시피 추천", "소분 공동구매로 1인분 장보기 낭비 감소", "유통기한 임박 알림 + 근처 나눔 매칭", "AI 식단 코치가 예산·영양 목표에 맞춰 주간 식단 자동 편성", "마트 특가 실시간 연동해 최저가 장바구니 구성", "남은 재료로 만들 수 있는 요리 게임화 챌린지"] },
  { goal: "중고 거래 사기를 줄이는 앱", ideas: ["판매자 신뢰점수(과거거래·인증) 공개", "안전결제 에스크로 기본 적용", "AI가 사기 패턴 문구·도용 이미지 탐지", "영상통화로 물품 실시간 확인", "사기 이력 번호 공유 블랙리스트", "택배 송장 검증 연동"] },
  { goal: "노인의 디지털 기기 사용을 돕는 서비스", ideas: ["큰 글씨·음성안내 간편 모드", "가족이 원격으로 화면 도와주기", "자주 쓰는 앱만 모은 맞춤 홈", "보이스로 문자·영상통화 대신 걸어주기", "사기 문자·전화 실시간 경고", "동네 디지털 도우미 방문 매칭"] },
  { goal: "지역 축제 참여를 늘리는 플랫폼", ideas: ["취향 기반 축제 추천·알림", "축제 미션·스탬프 투어 게임화", "실시간 혼잡도·주차 안내", "지역 상점 연계 할인 쿠폰", "자원봉사·부스 참여 매칭", "축제 후기·사진 커뮤니티"] },
  { goal: "프리랜서의 계약·정산을 돕는 서비스", ideas: ["표준 계약서 템플릿·전자서명", "세금계산서·원천징수 자동화", "미수금 알림·독촉 자동 발송", "프로젝트별 시간·경비 추적", "에스크로 마일스톤 정산", "수입 대시보드·세무 리포트"] },
];

async function call(slug, messages, { maxTok = 2000, temp = 0.5 } = {}) {
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-HeavyAnalyze" }, body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: temp, usage: { include: true } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status} ${JSON.stringify(d).slice(0, 100)}`);
      const text = (d.choices?.[0]?.message?.content || "").trim();
      const cost = (d.usage || {}).cost || 0;
      if (!text && a === 0) { maxTok = 3000; continue; } // 추론모델 빈응답 → 토큰 늘려 1회 재시도
      return { text, cost };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 500)); }
  }
  return { text: "", cost: 0 };
}
async function runCandidate(c, G) {
  const user = `목표: ${G.goal}\n\n[제출된 아이디어]\n${G.ideas.map((x, i) => `${i + 1}. ${x}`).join("\n")}`;
  return call(c.slug, [{ role: "system", content: SYS }, { role: "user", content: user }]);
}
const LT = "ABCDEFGH".split("");
async function judgeOne(slug, G, items) {
  for (let a = 0; a < 2; a++) {
    try {
      const listed = items.map((t, i) => `[${LT[i]}]\n${(t || "(빈 응답)").slice(0, 900)}`).join("\n\n");
      const sys = `아래 ${items.length}개의 '아이디어 분석' 결과를 각 1~5점으로 평가하라. 기준: 테마 그룹화 타당성·공통구조 통찰·실행 우선순위 유용성·한국어 명료성. 설명·코드블록 금지. JSON만: {${items.map((_, i) => `"${LT[i]}":n`).join(",")}}`;
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
  // 셔플 후 블라인드 채점
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
fs.writeFileSync("benchmarks/heavy-analyze.json", JSON.stringify({ ranAt: new Date().toISOString(), n: GOALS.length, task: "analyze", judges: JUDGES, rows, perGoal }, null, 2));
console.log(`\n=== analyze 재테스트 (n=${GOALS.length}, 심판 3, 블라인드) ===`);
[...rows].sort((a, b) => (b.quality || 0) - (a.quality || 0)).forEach((r) => console.log(`${r.model.padEnd(14)} 품질 ${r.quality}  승 ${r.wins}/${r.judgedGoals}  비용 $${r.cost}  ${r.empty ? "빈응답" + r.empty : ""}`));
const cur = rows.find((r) => r.model === "GLM-4.6");
const top = [...rows].sort((a, b) => (b.quality || 0) - (a.quality || 0))[0];
console.log(`\n현행 GLM-4.6: 품질 ${cur.quality} $${cur.cost}  |  최고: ${top.model} 품질 ${top.quality} $${top.cost}`);
console.log("SAVED benchmarks/heavy-analyze.json");
