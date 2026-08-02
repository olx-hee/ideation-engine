/* 비용 미터 — 호출을 purpose별로 로깅하고, 세션별 '절감'을 정직하게 계산한다(설계 §5).
   purpose: generate(사용자에게 가는 생성) | route | escalate | verify | repair
   절감 공식의 기준은 'generate'만. 나머지는 오버헤드로 분리 표기(숨은 이중과금 방지). */

import { estCost, TIER_PRICE, PRICING_MODE } from "./pricing.js";

export function makeMeter() {
  const calls = [];
  return {
    record(entry) {
      const { purpose = "generate", kind, role, model, tier, usageTokens = 0, escalated = false } = entry;
      calls.push({ purpose, kind, role, model, tier, usageTokens, escalated, estCost: estCost(tier, usageTokens) });
    },
    summary() {
      const gen = calls.filter((c) => c.purpose === "generate");
      const overhead = calls.filter((c) => c.purpose !== "generate");
      const ourCost = gen.reduce((s, c) => s + c.estCost, 0);
      // 가상 비교: 같은 생성 콜을 '전부 flagship'으로 돌렸다면 (실제로는 안 돌림)
      const allFlagshipCost = gen.reduce((s, c) => s + estCost("flagship", c.usageTokens), 0);
      const overheadCost = overhead.reduce((s, c) => s + c.estCost, 0);
      const savedPct = allFlagshipCost > 0 ? Math.round((1 - ourCost / allFlagshipCost) * 100) : 0;
      const escalateRate = gen.length ? Math.round((gen.filter((c) => c.escalated).length / gen.length) * 100) : 0;
      return {
        calls,
        counts: { total: calls.length, generate: gen.length, overhead: overhead.length },
        ourCost: round(ourCost),
        overheadCost: round(overheadCost),
        allFlagshipCost: round(allFlagshipCost), // 가상
        savedPct,
        escalateRate,
        baselineNote: "‘전부 고가’는 실제로 돌리지 않은 가상 비교입니다",
        pricingMode: PRICING_MODE, // "estimate-mock" → 화면에 '추정(목업)' 배지
        tierPrice: TIER_PRICE,
      };
    },
  };
}

const round = (n) => Math.round(n * 1e5) / 1e5;
