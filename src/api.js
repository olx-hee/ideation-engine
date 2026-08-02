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

  ai: (kind, goal, context) =>
    fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, goal, context }) }).then(j),
};
