import express from "express";
import cors from "cors";
import { initStore } from "./store.js";
import { generate } from "./ai.js";

/* IdeationEngine 백엔드 (초기 스캐폴드)
   - 키·DB 없이도 실행됨 (인메모리 + AI 목업)
   - MONGODB_URI / ANTHROPIC_API_KEY 를 넣으면 자동으로 실서비스 경로로 전환 */

const app = express();
app.use(cors());
app.use(express.json());

const store = await initStore(); // top-level await (ESM)

/* 헬스체크 — 현재 어떤 스토어/AI 모드인지 한눈에 */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    store: store.kind,
    ai: process.env.ANTHROPIC_API_KEY ? "configured" : "mock",
    time: new Date().toISOString(),
  });
});

/* 세션 생성 */
app.post("/api/sessions", async (req, res) => {
  const { goal = "", mins = 60, mode = "offline", method = "brain", deadlineAt = null, host = null } = req.body || {};
  const session = await store.create({
    goal, mins, mode, method, deadlineAt,
    phase: 0,
    members: host ? [{ ...host, isHost: true }] : [],
    ice: [], ideas: [], votes: {},
  });
  res.status(201).json(session);
});

/* 세션 조회 (프론트가 폴링/동기화에 사용할 진입점) */
app.get("/api/sessions/:id", async (req, res) => {
  const s = await store.get(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });
  res.json(s);
});

/* 세션 부분 갱신 (단계 이동 등) */
app.patch("/api/sessions/:id", async (req, res) => {
  const s = await store.update(req.params.id, req.body || {});
  if (!s) return res.status(404).json({ error: "session not found" });
  res.json(s);
});

/* 팀원 입장 (같은 id면 갱신) */
app.post("/api/sessions/:id/join", async (req, res) => {
  const s = await store.get(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });
  const member = req.body || {};
  const members = [...(s.members || []).filter((m) => m.id !== member.id), member];
  res.json(await store.update(req.params.id, { members }));
});

/* 아이디어 제출 */
app.post("/api/sessions/:id/ideas", async (req, res) => {
  const s = await store.get(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });
  const idea = { id: Date.now(), likes: 0, ...(req.body || {}) };
  res.json(await store.update(req.params.id, { ideas: [idea, ...(s.ideas || [])] }));
});

/* 투표 설정 (memberId → themeId 배열) */
app.post("/api/sessions/:id/votes", async (req, res) => {
  const s = await store.get(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });
  const { memberId, themeIds } = req.body || {};
  const votes = { ...(s.votes || {}), [memberId]: themeIds || [] };
  res.json(await store.update(req.params.id, { votes }));
});

/* AI 프록시 (키는 서버에만) */
app.post("/api/ai", async (req, res) => {
  res.json(await generate(req.body || {}));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}  (store=${store.kind})`));
