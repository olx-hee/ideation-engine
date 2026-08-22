/* 전체(무거운) 비용검증 — 여러 목표 × 전체 role-map × 품질모드(Self-Refine) × '실제' 최고급 대결.
   우리 모델 vs Claude-Opus-4.1을 같은 프롬프트로 실호출해 '진짜' 절감을 잰다(가정 아님).
   전부 Langfuse에 기록. Langfuse 무료 한도(50,000 units/월·하드캡) 근처면 안전정지.
   실행: node langfuse-verify-full.mjs   (실제 API 과금 발생 · 소액, 플래그십 포함이라 1차보다 큼) */
import "dotenv/config";
import { callModel, OPENROUTER_SLUGS } from "./server/orchestrator/adapter.js";
import { ROUTING, CONCEPT_LENSES, VERIFY, IDEA_QUALITY } from "./server/orchestrator/registry.js";
import { shutdownLangfuse, LANGFUSE_ON } from "./server/orchestrator/langfuse.js";

// 플래그십 슬러그 등록(런타임) — 우리 callModel 경로로 '같은 프롬프트' 대결 + Langfuse 자동기록
OPENROUTER_SLUGS["Claude-Opus-4.1"] = "anthropic/claude-opus-4.1";
const FLAGSHIP = "Claude-Opus-4.1";

// Langfuse 무료 한도 안전정지 (units ≈ 호출수, 하드캡 50k) — 10%에서 멈춤
const MAX_UNITS = 5000;
let units = 0;
const bump = (n = 1) => { units += n; };

const GOALS = [
  { g: "저녁 시간 외로움을 느끼는 1인 가구를 위한 서비스", pool: ["저녁 15분 음성 동행", "동네 같은 시간대 매칭", "감정 로그 주간 리포트"],
    claim: "이 서비스는 모든 1인 가구의 외로움을 100% 해결하며 출시 즉시 500만 명이 가입한다." },
  { g: "대학생 팀 프로젝트의 무임승차 문제를 줄이는 도구", pool: ["기여도 실시간 로그", "익명 상호평가", "작업 자동 분배 봇"],
    claim: "이 도구는 무임승차를 완전히 없애고 모든 조원 만족도를 100%로 만든다." },
];
const usd = (n) => `$${n.toFixed(6)}`;
const rows = [];

async function one(scope, goalIdx, label, kind, model, tier, prompt) {
  if (units >= MAX_UNITS) return null;
  process.stdout.write(`  [${scope}] ${label.padEnd(16)} (${model}) ... `);
  const r = await callModel({ model, tier, kind, prompt });
  bump(1);
  const cost = typeof r.usageCost === "number" ? r.usageCost : null;
  rows.push({ scope, goalIdx, label, kind, model, mock: r.mock, inTok: r.usageTokensIn, outTok: r.usageTokensOut, cost });
  console.log(r.mock ? "목업(슬러그/키 문제)" : `${cost === null ? "cost=null" : usd(cost)} (tok ${r.usageTokensIn}/${r.usageTokensOut})`);
  return r;
}

console.log(`\n[Langfuse ${LANGFUSE_ON ? "ON" : "OFF"}] 전체 비용검증 시작 — 우리 role-map + 품질모드 + 실제 Opus 대결\n`);

for (let i = 0; i < GOALS.length; i++) {
  const { g, pool, claim } = GOALS[i];
  const poolText = pool.join("\n");
  console.log(`\n─ 목표 ${i + 1}: ${g}`);

  // (1) 우리 role map
  await one("ours", i, "키워드", "keyword", ROUTING.keyword.model, ROUTING.keyword.tier, g);
  await one("ours", i, "아이스", "ice", ROUTING.ice.model, ROUTING.ice.tier, g);
  const idea = await one("ours", i, "발산", "idea", ROUTING.idea.model, ROUTING.idea.tier, g);
  await one("ours", i, "분석", "analyze", ROUTING.analyze.model, ROUTING.analyze.tier, `${g}\n\n아이디어:\n${poolText}`);
  await one("ours", i, "보고", "report", ROUTING.report.model, ROUTING.report.tier, `${g}\n\n${pool.join(", ")}`);
  await one("ours", i, "검증", "verify", VERIFY.model, VERIFY.tier, claim);
  for (const lens of CONCEPT_LENSES)
    await one("ours", i, `컨셉·${lens.label}`, "concept", lens.model, "small", `목표:${g}\n풀:${pool.join(", ")}\n렌즈:${lens.hint}`);

  // (2) 품질모드 Self-Refine (같은 Solar, 3패스) — '무거운' 경로
  if (idea) {
    const crit = await one("ours-quality", i, "품질·비평", "critique", IDEA_QUALITY.model, IDEA_QUALITY.tier, `목표:${g}\n초안:${idea.text}`);
    if (crit) await one("ours-quality", i, "품질·수정", "revise", IDEA_QUALITY.model, IDEA_QUALITY.tier, `목표:${g}\n초안:${idea.text}\n비평:${crit.text}`);
  }

  // (3) 실제 최고급(Opus) 대결 — 같은 프롬프트, content 작업만
  await one("flagship", i, "발산", "idea", FLAGSHIP, "flagship", g);
  await one("flagship", i, "분석", "analyze", FLAGSHIP, "flagship", `${g}\n\n아이디어:\n${poolText}`);
  await one("flagship", i, "보고", "report", FLAGSHIP, "flagship", `${g}\n\n${pool.join(", ")}`);
  await one("flagship", i, "컨셉·실용", "concept", FLAGSHIP, "flagship", `목표:${g}\n풀:${pool.join(", ")}\n렌즈:${CONCEPT_LENSES[0].hint}`);
}

// ── 집계 ──
const real = rows.filter((r) => !r.mock && r.cost !== null);
const nullCost = rows.filter((r) => !r.mock && r.cost === null).length;
const sum = (arr) => arr.reduce((s, r) => s + r.cost, 0);

const CONTENT = new Set(["idea", "analyze", "report", "concept"]);
const ourContent = real.filter((r) => r.scope === "ours" && CONTENT.has(r.kind) && ["idea", "analyze", "report"].includes(r.kind) || (r.scope === "ours" && r.kind === "concept" && r.label.includes("실용")));
// 공정 대결: 같은 4작업(발산·분석·보고·컨셉실용)만 our vs flagship
const ourCmp = real.filter((r) => r.scope === "ours" && ((["idea", "analyze", "report"].includes(r.kind)) || (r.kind === "concept" && r.label.includes("실용"))));
const flagCmp = real.filter((r) => r.scope === "flagship");
const ourCmpCost = sum(ourCmp), flagCmpCost = sum(flagCmp);
const realSave = flagCmpCost > 0 ? (1 - ourCmpCost / flagCmpCost) * 100 : 0;

const ourAll = sum(real.filter((r) => r.scope === "ours"));
const ourQuality = sum(real.filter((r) => r.scope === "ours-quality"));

console.log("\n══════════════ 전체 결과 ══════════════");
console.log(`총 호출: ${rows.length} · 실측 성공: ${real.length}${nullCost ? ` · cost=null ${nullCost}건` : ""} · Langfuse units 사용≈${units}/${MAX_UNITS} (무료 50k중)`);
console.log(`\n[핵심] 같은 4작업(발산·분석·보고·컨셉) '실제' 대결:`);
console.log(`  우리 모델 실비용:     ${usd(ourCmpCost)}`);
console.log(`  Claude-Opus 실비용:  ${usd(flagCmpCost)}`);
console.log(`  → 실측 절감:  약 ${realSave.toFixed(1)}%  (가정 아님, 둘 다 실제로 돌림)`);
console.log(`\n[전체 파이프라인] 우리 role-map 총 실비용(${GOALS.length}목표): ${usd(ourAll)}`);
console.log(`  그중 품질모드(Self-Refine) 추가분:                 ${usd(ourQuality)}`);
console.log("═══════════════════════════════════════");
console.log(units >= MAX_UNITS ? "⚠️ 안전정지: Langfuse units 한도 근처 도달." : "Langfuse 무료 한도 여유(정지 없이 완주).");

await shutdownLangfuse();
console.log("Langfuse flush 완료.\n");
