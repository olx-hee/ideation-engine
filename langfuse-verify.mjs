/* 최소 비용검증 — 우리 role-map 모델을 '실제로' 호출해 OpenRouter 실비용($)을 받고,
   각 호출을 Langfuse에 기록한다. 그 뒤 "전부 최고급 모델(Opus 단가) 가정"과 비교해 절감률을 낸다.
   실행: node langfuse-verify.mjs   (실제 API 과금 발생 · 소액) */
import "dotenv/config";
import { callModel } from "./server/orchestrator/adapter.js";
import { ROUTING, CONCEPT_LENSES, VERIFY } from "./server/orchestrator/registry.js";
import { shutdownLangfuse, LANGFUSE_ON } from "./server/orchestrator/langfuse.js";

const GOAL = "저녁 시간 외로움을 느끼는 1인 가구를 위한 서비스 아이디어";
const POOL = ["저녁 15분 음성 동행", "동네 같은 시간대 매칭", "감정 로그 주간 리포트"];
const CONTENT = "이 서비스는 모든 1인 가구의 외로움을 100% 해결하며, 출시 즉시 500만 명이 가입할 것이다.";

// 최고급 모델 가정 단가(예: Claude-Opus 급, 공개가) — counterfactual '계산'용 ($/1M tokens)
const FLAGSHIP = { in: 15, out: 75 };
const usd = (n) => `$${n.toFixed(6)}`;

const rows = [];
async function run(label, kind, model, tier, prompt) {
  process.stdout.write(`  · ${label.padEnd(16)} (${model}) ... `);
  const r = await callModel({ model, tier, kind, prompt });
  const real = typeof r.usageCost === "number" ? r.usageCost : null;
  const flag = (r.usageTokensIn / 1e6) * FLAGSHIP.in + (r.usageTokensOut / 1e6) * FLAGSHIP.out;
  rows.push({ label, model, mock: r.mock, inTok: r.usageTokensIn, outTok: r.usageTokensOut, real, flag });
  console.log(r.mock ? "목업(키/슬러그 문제)" : `${real === null ? "cost=null" : usd(real)}  (tok ${r.usageTokensIn}/${r.usageTokensOut})`);
}

console.log(`\n[Langfuse ${LANGFUSE_ON ? "ON" : "OFF"}] 최소 비용검증 시작 — 실제 호출\n`);

// 우리 role map 실행
await run("키워드", "keyword", ROUTING.keyword.model, ROUTING.keyword.tier, GOAL);
await run("아이스", "ice", ROUTING.ice.model, ROUTING.ice.tier, GOAL);
await run("발산", "idea", ROUTING.idea.model, ROUTING.idea.tier, GOAL);
await run("분석", "analyze", ROUTING.analyze.model, ROUTING.analyze.tier, `${GOAL}\n\n아이디어들:\n${POOL.join("\n")}`);
await run("보고", "report", ROUTING.report.model, ROUTING.report.tier, `${GOAL}\n\n${POOL.join(", ")}`);
await run("검증", "verify", VERIFY.model, VERIFY.tier, CONTENT);
for (const lens of CONCEPT_LENSES) {
  await run(`컨셉·${lens.label}`, "concept", lens.model, "small", `목표:${GOAL}\n풀:${POOL.join(", ")}\n렌즈:${lens.hint}`);
}

// 집계
const real = rows.filter((r) => !r.mock);
const anyNull = real.some((r) => r.real === null);
const ourTotal = real.reduce((s, r) => s + (r.real ?? 0), 0);
const flagTotal = real.reduce((s, r) => s + r.flag, 0);
const saved = flagTotal > 0 ? (1 - ourTotal / flagTotal) * 100 : 0;

console.log("\n────────────── 결과 ──────────────");
console.log(`실호출 성공: ${real.length}/${rows.length}${real.length < rows.length ? " (일부 목업=슬러그/키 문제)" : ""}`);
console.log(`우리 실제 비용(OpenRouter 실측):     ${usd(ourTotal)}${anyNull ? "  ⚠️ 일부 cost=null(합계 과소)" : ""}`);
console.log(`전부 최고급(Opus 단가) 가정 비용:    ${usd(flagTotal)}  (실행 안 함·계산)`);
console.log(`→ 절감률:  약 ${saved.toFixed(1)}%`);
console.log("──────────────────────────────────");
console.log(`(같은 세션 트레이스가 Langfuse에 기록됨: 모델별 실비용을 대시보드에서 교차확인 가능)\n`);

await shutdownLangfuse();
console.log("Langfuse flush 완료.");
