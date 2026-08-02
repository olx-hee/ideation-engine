/* 공급사 어댑터 — 실제 LLM 호출이 들어갈 자리(설계 §6).
   P1은 '목업' 구현: 그럴듯한 응답 + (재현 가능한) 목업 usage 토큰을 반환한다.
   P2에서 이 함수 하나만 OpenRouter/공급사 실호출로 바꾸면 됨. */

// 모델별 capability 자리(설계 §6) — P2에서 실제 값으로 채운다. 지금은 기본 스텁.
export const MODEL_CAPS = {
  default: { supportsJsonSchema: false, supportsTools: false, authStyle: "bearer" },
};
export const capsOf = (model) => MODEL_CAPS[model] || MODEL_CAPS.default;

// TODO(P2): 실연동 시 사용자 입력(goal/context)을 delimiter로 격리하고 시스템 지시와 분리한다.
//   function buildPrompt({ system, userGoal, context }) {
//     return [{ role: "system", content: system },
//             { role: "user", content: `<<<USER_INPUT>>>\n${userGoal}\n<<<END>>>` }];
//   }

const MOCK_BY_KIND = {
  keyword: (m) => `[${m}] 핵심 키워드: 반복 판단·인지 부하·자동화`,
  ice: (m) => `[${m}] 최근 겪은 반복적 불편에서 아이디어의 씨앗을 찾아보세요.`,
  idea: (m) => `[${m}] 이 각도에서 떠오르는 새로운 접근을 제안합니다.`,
  analyze: (m) => `[${m}] 제출된 아이디어를 4개 테마로 묶고 공통 구조를 요약했습니다.`,
  report: (m) => `[${m}] 세션 결과를 종합한 보고서 초안입니다.`,
};

// kind+model 기반 결정적 해시 → 목업 usage를 재현 가능하게(발표 재현성, §8)
function stableOut(kind, model) {
  const s = `${kind}|${model}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 120 + (h % 300); // 120~419
}

export async function callModel({ model, tier, kind, prompt = "" }) {
  const make = MOCK_BY_KIND[kind] || ((m) => `[${m}] 응답(목업)`);
  const text = make(model);
  // 입력은 길이 비례(결정적), 출력은 kind+model 해시(결정적) — 실측은 provider usage로 대체
  const inTok = Math.min(2000, 40 + Math.floor(prompt.length / 3));
  const outTok = stableOut(kind, model);
  return { text, model, tier, usageTokensIn: inTok, usageTokensOut: outTok, usageTokens: inTok + outTok, mock: true };
}
