/* 공급사 어댑터 — 실제 LLM 호출이 들어갈 자리(설계 §6).
   P1은 '목업' 구현: 그럴듯한 응답 + 가짜 usage 토큰을 반환한다.
   P2에서 이 함수 하나만 OpenRouter/공급사 실호출로 바꾸면 됨.

   capability 플래그(supportsJsonSchema/authStyle 등)는 실연동 때 여기 레지스트리로 추가. */

const MOCK_BY_KIND = {
  keyword: (m) => `[${m}] 핵심 키워드: 반복 판단·인지 부하·자동화`,
  ice: (m) => `[${m}] 최근 겪은 반복적 불편에서 아이디어의 씨앗을 찾아보세요.`,
  idea: (m) => `[${m}] 이 각도에서 떠오르는 새로운 접근을 제안합니다.`,
  analyze: (m) => `[${m}] 제출된 아이디어를 4개 테마로 묶고 공통 구조를 요약했습니다.`,
  report: (m) => `[${m}] 세션 결과를 종합한 보고서 초안입니다.`,
};

export async function callModel({ model, tier, kind, prompt = "" }) {
  // 실호출처럼 약간의 지연(선택) 없이 즉시 목업 반환
  const make = MOCK_BY_KIND[kind] || ((m) => `[${m}] 응답(목업)`);
  const text = make(model);
  // 목업 usage — 입력 길이에 대충 비례 + 랜덤. 실측은 provider usage 필드로 대체.
  const inTok = Math.min(2000, 40 + Math.floor(prompt.length / 3));
  const outTok = 120 + Math.floor(Math.random() * 300);
  return { text, model, tier, usageTokens: inTok + outTok, mock: true };
}
