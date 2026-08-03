/* 티어별 '목업' 단가 ($/1K tokens). P1은 추정치로 절감을 계산해 보여준다.
   ⚠️ 실측 단가는 실연동(P2) 후 provider usage로 대체 — 그전까지 화면에 '추정(목업)' 배지 필수. */

export const TIER_PRICE = {
  small: 0.0002,    // 예: DeepSeek Flash·gpt-oss·Nano 급
  mid: 0.001,       // 중가
  flagship: 0.006,  // 예: GLM 5.2·DeepSeek Pro 급
};

export function estCost(tier, tokens) {
  const per1k = TIER_PRICE[tier] ?? TIER_PRICE.mid;
  return per1k * (tokens / 1000);
}

export const PRICING_MODE = "estimate-mock"; // 실연동 후 "measured"로 전환
