/* TOP4 도구를 우리 실제 세팅에 넣어보는 미니 실험 (실호출·실비용·Langfuse 기록).
   1) OpenRouter 프롬프트 캐싱  2) 수동/요약 압축  3) 동적 난이도 라우팅  (4)는 tiktoken 별도)
   실행: node top4-experiments.mjs   (실제 API 소액 과금) */
import "dotenv/config";
import { logGeneration, shutdownLangfuse } from "./server/orchestrator/langfuse.js";

const KEY = process.env.OPENROUTER_API_KEY;
const usd = (n) => `$${n.toFixed(6)}`;

async function call(slug, kind, messages, maxTok = 400) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Top4" },
    body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: 0.3, usage: { include: true } }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`${slug} ${res.status} ${JSON.stringify(d).slice(0,120)}`);
  const u = d.usage || {};
  const cost = typeof u.cost === "number" ? u.cost : null;
  const cached = u.prompt_tokens_details?.cached_tokens ?? 0;
  logGeneration({ kind, model: slug, tier: "exp", inTok: u.prompt_tokens, outTok: u.completion_tokens, total: u.total_tokens, cost, prompt: messages.map(m=>m.content).join(" ").slice(0,300), output: d.choices?.[0]?.message?.content });
  return { text: d.choices?.[0]?.message?.content ?? "", inTok: u.prompt_tokens ?? 0, outTok: u.completion_tokens ?? 0, cost, cached };
}

// 회의가 누적된 '긴 정적 컨텍스트'(퍼실리테이션 규칙 + 아이디어 로그) — 캐싱/압축 실험용
const RULES = `너는 팀 아이디어 회의 퍼실리테이터다. 규칙: (1) 참가자 시드를 존중하고 (2) 뻔한 아이디어를 피하며 (3) 겹치지 않는 관점으로 확장하고 (4) 실현가능성과 참신함을 균형있게 보고 (5) 이견을 보존한다. 아래는 지금까지 회의에서 나온 아이디어 로그다.`;
const IDEAS = Array.from({length: 22}, (_,i) => `${i+1}. 저녁 시간대 1인 가구를 위한 아이디어 후보 ${i+1}: 사용자의 외로움과 고립감을 완화하기 위해 정해진 시간에 상호작용을 유도하는 방식으로, 음성/텍스트/매칭/기록 등 다양한 접근을 결합해 실현가능성과 참신함을 함께 고려한 제안이다.`).join("\n");
const BIG_CONTEXT = `${RULES}\n\n${IDEAS}`;
// 요약본(압축) — 같은 정보를 짧게
const SUMMARY = `${RULES}\n\n[아이디어 로그 요약] 22개 후보는 (a)정시 음성동행 (b)이웃 시간대매칭 (c)감정로그 리포트 (d)라디오 사연답장 4계열로 수렴. 외로움 완화가 공통 목표.`;

const results = {};

console.log("\n=== TOP4 미니 실험 (실호출) ===\n");

// ── 실험1: OpenRouter 프롬프트 캐싱 (같은 긴 프리픽스 2회) ──
console.log("[1] 프롬프트 캐싱 — DeepSeek에 같은 긴 프롬프트 2회");
const q1 = [{ role: "user", content: `${BIG_CONTEXT}\n\n질문: 위 아이디어들을 3개 테마로 묶어줘.` }];
const c1a = await call("deepseek/deepseek-v3.2", "cache-1st", q1, 300);
const c1b = await call("deepseek/deepseek-v3.2", "cache-2nd", q1, 300);
console.log(`   1회차: ${usd(c1a.cost)} (입력 ${c1a.inTok}, 캐시된 ${c1a.cached})`);
console.log(`   2회차: ${usd(c1b.cost)} (입력 ${c1b.inTok}, 캐시된 ${c1b.cached})`);
const cacheSave = c1a.cost > 0 ? (1 - c1b.cost / c1a.cost) * 100 : 0;
console.log(`   → 2회차 비용변화: ${cacheSave >= 0 ? "-" : "+"}${Math.abs(cacheSave).toFixed(1)}%  (캐시 적중 시 저렴해짐)`);
results.cache = { first: c1a.cost, second: c1b.cost, cachedTokens: c1b.cached, savePct: cacheSave };

// ── 실험2: 요약 압축 (긴 원본 vs 요약본 → 같은 분석) ──
console.log("\n[2] 요약 압축 — Solar에 원본 vs 요약본으로 분석");
const sys2 = { role: "system", content: "너는 분석가다. 아이디어들을 3~4개 테마로 묶고 공통구조를 요약한다." };
const full2 = await call("upstage/solar-pro4", "compress-full", [sys2, { role: "user", content: BIG_CONTEXT }], 350);
const sum2 = await call("upstage/solar-pro4", "compress-sum", [sys2, { role: "user", content: SUMMARY }], 350);
console.log(`   원본:  ${usd(full2.cost)} (입력 ${full2.inTok})`);
console.log(`   요약본: ${usd(sum2.cost)} (입력 ${sum2.inTok})`);
const compSave = full2.cost > 0 ? (1 - sum2.cost / full2.cost) * 100 : 0;
console.log(`   → 입력 ${(100*(1-sum2.inTok/full2.inTok)).toFixed(0)}% 감소 · 비용 ${compSave.toFixed(1)}% 감소`);
results.compress = { fullCost: full2.cost, sumCost: sum2.cost, inFull: full2.inTok, inSum: sum2.inTok, savePct: compSave };

// ── 실험3: 동적 난이도 라우팅 (쉬운 analyze를 Solar→Flash-Lite로) ──
console.log("\n[3] 동적 라우팅 — analyze를 Solar vs 더 싼 Flash-Lite");
const uContent = { role: "user", content: SUMMARY };
const solarA = await call("upstage/solar-pro4", "route-solar", [sys2, uContent], 350);
const liteA = await call("google/gemini-2.5-flash-lite", "route-lite", [sys2, uContent], 350);
console.log(`   Solar:      ${usd(solarA.cost)}`);
console.log(`   Flash-Lite: ${usd(liteA.cost)}`);
const routeSave = solarA.cost > 0 ? (1 - liteA.cost / solarA.cost) * 100 : 0;
// 중립 심판으로 품질 비교
const judge = await call("meta-llama/llama-3.3-70b-instruct", "route-judge",
  [{ role: "user", content: `두 분석 결과 A/B를 각 1~5점(테마화 명확성·정확성). JSON {"A":n,"B":n}만.\n[A]\n${solarA.text}\n\n[B]\n${liteA.text}` }], 100);
console.log(`   비용변화: ${routeSave.toFixed(1)}% 저렴 · 품질심판: ${judge.text.replace(/\s+/g,' ').slice(0,60)}`);
results.route = { solar: solarA.cost, lite: liteA.cost, savePct: routeSave, judge: judge.text.slice(0,80) };

console.log("\n════════ 요약 ════════");
console.log(`1) 캐싱:   2회차 ${results.cache.savePct.toFixed(1)}% 변화 (캐시토큰 ${results.cache.cachedTokens})`);
console.log(`2) 요약압축: 비용 ${results.compress.savePct.toFixed(1)}% 감소 (입력 ${results.compress.inFull}→${results.compress.inSum})`);
console.log(`3) 동적라우팅: ${results.route.savePct.toFixed(1)}% 저렴, 품질 ${results.route.judge}`);
console.log("═════════════════════");

await shutdownLangfuse();
console.log("Langfuse flush 완료.\n");
