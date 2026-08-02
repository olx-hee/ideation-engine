/* 역할/티어 레지스트리 — kind(작업)마다 어느 티어·모델·역할로 보낼지 정하는 '정적 표'.
   이게 사업성① "고정 티어 표(A)"의 실체. 판단 로직 없이 결정적으로 배분.
   (모델명은 라벨일 뿐 — P1은 실제 호출 안 함. 후보는 MODEL-ROSTER.md 참고) */

// tier: "small"(저가) | "mid"(중가) | "flagship"(고가)
export const ROUTING = {
  keyword: { tier: "small",    model: "gpt-oss-120b",   role: "키워드 추출" },
  ice:     { tier: "small",    model: "Nemotron-Nano",  role: "발산 워커" },
  idea:    { tier: "small",    model: "DeepSeek-Flash", role: "발산", fanout: "angles" }, // 각도별 fan-out
  analyze: { tier: "flagship", model: "GLM-5.2",        role: "분석·그룹화" },
  report:  { tier: "flagship", model: "GLM-5.2",        role: "정리·보고" },
};

// 발산(idea)에서 각도별로 '다른 모델'을 써 다양성을 시연 (창의성 스토리)
export const ANGLE_MODELS = {
  biz:   { tier: "small", model: "Qwen3-Flash" },
  ux:    { tier: "small", model: "Solar-Pro-2" },   // 한국어 강한 국산 모델
  tech:  { tier: "small", model: "Nemotron-Nano" },
  novel: { tier: "small", model: "DeepSeek-Flash" },
};

export const FALLBACK = { tier: "mid", model: "Llama-3.3", role: "일반" };

export const ORCHESTRATOR_KINDS = Object.keys(ROUTING);
