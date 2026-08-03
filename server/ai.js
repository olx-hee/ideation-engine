/* ══════════════════════════════════════════════════════════════
   LLM 프록시 — API 키는 '서버에만' 둔다 (프론트 번들에 절대 노출 X).
   · ANTHROPIC_API_KEY 있음 → 실제 Claude 호출 (아래 TODO 지점 구현)
   · 없음                  → 목업 응답 (지금 상태: 키 없이도 UI가 돎)
   호출부는 kind로 어떤 도움을 원하는지 지정한다.
   ════════════════════════════════════════════════════════════════ */

const MOCKS = {
  // 아이스브레이킹 답변에서 키워드 뽑기
  ice: (goal) => [
    { type: "keyword", title: "공통 키워드 감지", text: `"${goal || "세션 목표"}"와 연결되는 반복 불편이 보입니다.` },
    { type: "connect", title: "숨은 연결", text: "서로 다른 답변이 '반복되는 판단 부담'이라는 공통 구조를 공유합니다." },
  ],
  // 아이디어 발산 자극
  idea: () => [
    { type: "expand", title: "확장 제안", text: "지금 나온 방향을 '다른 사용자·상황'에 적용하면 새 아이디어가 나옵니다." },
  ],
  // 테마 그룹화 요약
  analyze: (goal) => ({
    summary: `제출된 아이디어들이 "${goal || "목표"}" 관점에서 몇 개의 테마로 묶입니다.`,
  }),
  // 최종 보고서 요약
  report: (goal) => ({
    title: "세션 요약(초안)",
    text: `"${goal || "목표"}"에 대한 발산·투표 결과를 바탕으로 한 요약 초안입니다.`,
  }),
};

/* 허용되는 요청 종류 (라우트에서 화이트리스트 검증에 사용) */
export const AI_KINDS = Object.keys(MOCKS);

export async function generate({ kind = "idea", goal = "", context = null } = {}) {
  const key = process.env.ANTHROPIC_API_KEY;
  const payload = (MOCKS[kind] || MOCKS.idea)(goal, context);

  if (!key) {
    return { mock: true, note: "AI 키 미설정 — 목업 응답", kind, data: payload };
  }

  // TODO(키 준비 시): 실제 Claude Messages API 호출로 payload 대체.
  //   import Anthropic from "@anthropic-ai/sdk";
  //   const client = new Anthropic({ apiKey: key });
  //   const msg = await client.messages.create({ model: "claude-sonnet-5", ... });
  //   return { mock: false, kind, data: parse(msg) };
  return { mock: true, note: "실제 호출 미구현 — 목업 반환", kind, data: payload };
}
