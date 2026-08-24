/* 프론트 → 백엔드 API 헬퍼.
   dev에서는 vite proxy가 /api 를 http://localhost:3001 로 넘긴다(vite.config.js).
   아직 App은 목업 플로우로 동작하며, 이 헬퍼는 백엔드 연동 단계에서 사용한다. */

const j = async (res) => {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

export const api = {
  health: () => fetch("/api/health").then(j),

  createSession: (data) =>
    fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(j),

  getSession: (id) => fetch(`/api/sessions/${id}`).then(j),

  patchSession: (id, patch) =>
    fetch(`/api/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).then(j),

  join: (id, member) =>
    fetch(`/api/sessions/${id}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(member) }).then(j),

  addIce: (id, entry) =>
    fetch(`/api/sessions/${id}/ice`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) }).then(j),

  addIdea: (id, idea) =>
    fetch(`/api/sessions/${id}/ideas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(idea) }).then(j),

  setVotes: (id, memberId, themeIds) =>
    fetch(`/api/sessions/${id}/votes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId, themeIds }) }).then(j),

  ai: (kind, goal, context, sessionId, quality = false) =>
    fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, goal, context, sessionId, quality }) }).then(j),

  // 컨셉 후보 다중 생성(렌즈별 다른 모델, 합치기 없음) — pool=발산 아이디어 텍스트 배열
  concepts: (goal, pool, sessionId) =>
    fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "concepts", goal, pool, sessionId }) }).then(j),

  // 독립 검증(생성자와 다른 모델) — content=검증할 결과물 텍스트
  verify: (content, sessionId) =>
    fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "verify", content, sessionId }) }).then(j),

  // 현실성 패스 — 발산 아이디어(pool)에 실현가능성·왜없나·수요를 붙임(③⑤는 추정, 시중검색 전)
  reality: (goal, pool, sessionId) =>
    fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "reality", goal, pool, sessionId }) }).then(j),

  // 시중검색 게이트 — 각 아이디어를 Brave로 실제 검색해 '이미있음/유사/공백' 판정(추정을 실측 보강)
  market: (goal, pool, sessionId) =>
    fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "market", goal, pool, sessionId }) }).then(j),

  getAiMeter: (id) => fetch(`/api/sessions/${id}/ai-meter`).then(j),
};
