/* 무거운 작업(analyze) 벤치마크 — 21모델 × 3목표. 제출 아이디어를 테마로 묶고 분석.
   가벼운 작업과 달리 추론 ON 유지(max_tokens 2500 → 추론모델이 생각+분석 완주). "추론이 값을 하나" 실증.
   심판 2개(GLM-4.6 reasoning-off + Llama-3.3-70B) 블라인드 채점 + 배열길이 검증. 추론 길이·비용·지연 기록.
   실행: cd ideation-engine && node benchmarks/heavy.mjs   결과: benchmarks/heavy.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const MODELS = [
  { n: "GLM-4.6", s: "z-ai/glm-4.6", r: 1 }, { n: "Qwen3.7-Flash", s: "qwen/qwen3.7-flash", r: 1 },
  { n: "Trinity-Thinking", s: "arcee-ai/trinity-large-thinking", r: 1 }, { n: "Cogito-671B", s: "deepcogito/cogito-v2.1-671b", r: 1 },
  { n: "Nemotron-3.5-L", s: "nvidia/nemotron-3.5-lightning", r: 1 }, { n: "DeepSeek-V4-Flash", s: "deepseek/deepseek-v4-flash", r: 1 },
  { n: "Kimi-K2.5", s: "moonshotai/kimi-k2.5" }, { n: "MiniMax-01", s: "minimax/minimax-01" },
  { n: "Solar-Pro4", s: "upstage/solar-pro4" }, { n: "Gemini-2.5-Flash", s: "google/gemini-2.5-flash" },
  { n: "Gemini-Flash-Lite", s: "google/gemini-2.5-flash-lite" }, { n: "Grok-4.3", s: "x-ai/grok-4.3" },
  { n: "GPT-4o-mini", s: "openai/gpt-4o-mini" }, { n: "Claude-3-Haiku", s: "anthropic/claude-3-haiku" },
  { n: "Mistral-Medium-3", s: "mistralai/mistral-medium-3" }, { n: "Phi-4", s: "microsoft/phi-4" },
  { n: "Command-R7B", s: "cohere/command-r7b-12-2024" }, { n: "Llama-3.3-70B", s: "meta-llama/llama-3.3-70b-instruct" },
  { n: "Hermes-4-70B", s: "nousresearch/hermes-4-70b" }, { n: "Palmyra-X5", s: "writer/palmyra-x5" }, { n: "Nova-Lite", s: "amazon/nova-lite-v1" },
];
const GOALS = [
  { g: "비대면 팀 회의의 효율을 높이는 서비스", ideas: ["익명투표로 아이디어 선정", "AI 실시간 회의요약", "타임박스 타이머", "역할 랜덤배정", "발언 균형 대시보드", "자동 액션아이템 추적"] },
  { g: "동네 소상공인의 단골 관리를 돕는 앱", ideas: ["스탬프 적립", "단골 전용 쿠폰 푸시", "AI 재방문 예측", "리뷰 자동응답", "매출 대시보드", "생일 축하 메시지"] },
  { g: "1인 가구의 식단·장보기를 돕는 서비스", ideas: ["냉장고 재고 인식", "AI 식단 추천", "소분 장보기 공동구매", "유통기한 알림", "원클릭 재주문", "영양 밸런스 리포트"] },
];
const JUDGES = ["z-ai/glm-4.6", "meta-llama/llama-3.3-70b-instruct"];

async function call(slug, messages, { maxTok = 2500, reasoningOff = false } = {}) {
  const body = { model: slug, messages, max_tokens: maxTok, temperature: 0.6, usage: { include: true }, ...(reasoningOff ? { reasoning: { enabled: false } } : {}) };
  const t0 = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Heavy" }, body: JSON.stringify(body) });
  const d = await res.json(); if (!res.ok) throw new Error(`${res.status}`);
  const m = d.choices?.[0]?.message || {};
  return { text: (m.content || "").trim(), reasoningLen: (m.reasoning || "").length, cost: (d.usage || {}).cost || 0, ms: Date.now() - t0 };
}
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

const scoreSum = {}, scoreN = {}, costSum = {}, msSum = {}, reasonSum = {}, genN = {}, fails = {};
for (const m of MODELS) { scoreSum[m.n] = 0; scoreN[m.n] = 0; costSum[m.n] = 0; msSum[m.n] = 0; reasonSum[m.n] = 0; genN[m.n] = 0; }

for (const { g, ideas } of GOALS) {
  const analyses = [];
  for (const m of MODELS) {
    try {
      const r = await call(m.s, [
        { role: "system", content: "너는 분석가다. 제출된 아이디어들을 3~4개 테마로 묶고, 각 테마의 공통 구조와 핵심 통찰을 간결한 한국어로 분석하라." },
        { role: "user", content: `목표: ${g}\n제출 아이디어:\n- ${ideas.join("\n- ")}` },
      ]);
      if (r.text) { analyses.push({ model: m.n, text: r.text }); costSum[m.n] += r.cost; msSum[m.n] += r.ms; reasonSum[m.n] += r.reasoningLen; genN[m.n]++; }
      else fails[m.n] = (fails[m.n] || 0) + 1;
    } catch { fails[m.n] = (fails[m.n] || 0) + 1; }
    await new Promise((s) => setTimeout(s, 120));
  }
  if (analyses.length < 3) { console.log(`${g.slice(0, 12)} 생성부족(${analyses.length})`); continue; }
  const sh = shuffle(analyses);
  const listed = sh.map((x, i) => `### ${i + 1}\n${x.text.slice(0, 600)}`).join("\n\n");
  const per = [];
  for (const j of JUDGES) {
    try {
      const r = await call(j, [
        { role: "system", content: `너는 엄격한 심사위원이다. 아래 ${sh.length}개 '아이디어 분석'을 각각 1~5점(테마 적절성·구조·통찰·한국어). 코드블록 없이 JSON 배열만, 정확히 ${sh.length}개: [s1,...]` },
        { role: "user", content: `목표: ${g}\n\n${listed}` },
      ], { maxTok: 800, reasoningOff: true });
      const arr = JSON.parse(r.text.match(/\[[\s\S]*\]/)[0]);
      if (Array.isArray(arr) && arr.length === sh.length) per.push(arr.map(Number));
    } catch { }
  }
  if (!per.length) { console.log(`${g.slice(0, 12)} 심판실패`); continue; }
  sh.forEach((it, i) => { const vals = per.map((a) => a[i]).filter((v) => v >= 1 && v <= 5); if (vals.length) { scoreSum[it.model] += vals.reduce((x, y) => x + y, 0) / vals.length; scoreN[it.model]++; } });
  console.log(`${g.slice(0, 14)} — 생성 ${analyses.length}/${MODELS.length}, 심판 ${per.length}개`);
}

const rows = MODELS.map((m) => ({ model: m.n, reasoning: !!m.r, overall: scoreN[m.n] ? +(scoreSum[m.n] / scoreN[m.n]).toFixed(2) : null, costAvg: genN[m.n] ? +(costSum[m.n] / genN[m.n]).toFixed(6) : null, msAvg: genN[m.n] ? Math.round(msSum[m.n] / genN[m.n]) : null, reasonAvg: genN[m.n] ? Math.round(reasonSum[m.n] / genN[m.n]) : 0 }));
fs.writeFileSync("benchmarks/heavy.json", JSON.stringify({ ranAt: new Date().toISOString(), task: "analyze", judges: JUDGES, goals: GOALS.length, rows, fails }, null, 2));
const ranked = rows.filter((r) => r.overall != null).sort((a, b) => b.overall - a.overall);
console.log(`\n=== 무거운 작업(analyze) 품질 순위 ===`);
ranked.forEach((r, i) => console.log(`${String(i + 1).padStart(2)}. ${r.model.padEnd(18)} 품질 ${r.overall}  비용 $${r.costAvg}  ${r.msAvg}ms  추론 ${r.reasonAvg}자${r.reasoning ? " [추론형]" : ""}`));
console.log(`\n생성실패:`, JSON.stringify(fails));
console.log("SAVED benchmarks/heavy.json");
