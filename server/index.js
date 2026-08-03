import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { initStore } from "./store.js";
import { orchestrate, sessionMeter, planStub } from "./orchestrator/index.js";
import { ORCHESTRATOR_KINDS } from "./orchestrator/registry.js";

/* IdeationEngine 백엔드 (스캐폴드)
   - 키·DB 없이도 실행됨 (인메모리 + AI 목업)
   - MONGODB_URI / ANTHROPIC_API_KEY 를 넣으면 실서비스 경로로 전환

   ── 이번에 적용한 하드닝(A): 풀 UUID id, CORS 화이트리스트(env),
      body 크기 제한, 입력 검증·신뢰필드 제거, PATCH allowlist,
      Mongo $set-only(주입 차단), 에러 래퍼, /api/ai 레이트리밋+kind 검증,
      health 정직화(프로덕션 정보 축소).

   ── 추가 하드닝(6차 검수 반영): helmet 적용, 프로덕션 CORS_ORIGIN 필수화,
      프로덕션 Mongo 폴백 금지(store.js), mins·deadlineAt 정규화.

   ── TODO(B) — 프론트 연동·배포 시점에 결정과 함께 구현 (지금은 자리만):
      [B1] 참가자/호스트 인증 토큰 + 뮤테이션 인가 (지금은 누구나 호출 가능)
      [B2] 쿠키/CSRF 설계 (httpOnly·Secure·SameSite)
      [B3] 동시성: get→update 대신 Mongo $push/$addToSet 또는 낙관적 락
      [B-deploy] 리버스 프록시 뒤 배포 시 app.set("trust proxy", …) 설정 */

const app = express();
const isProd = process.env.NODE_ENV === "production";

// 프로덕션에서 CORS_ORIGIN 미설정 시 전체 허용(fail-open) 방지 — 기동 자체를 실패시킨다
if (isProd && !process.env.CORS_ORIGIN) {
  console.error("[config] 프로덕션에는 CORS_ORIGIN(허용 오리진)이 반드시 필요합니다. 종료.");
  process.exit(1);
}

app.use(helmet());
// CORS: CORS_ORIGIN(쉼표구분) 있으면 화이트리스트, 없으면(비프로덕션) 요청 오리진 반영
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "64kb" }));

const store = await initStore(); // top-level await (ESM)

/* async 라우트 에러를 한 곳에서 처리 (미처리 throw로 프로세스가 죽지 않도록) */
const h = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => {
    console.error("[api error]", e?.message || e);
    res.status(500).json({ error: "internal error" });
  });
const bad = (res, msg) => res.status(400).json({ error: msg });

/* 멤버 입력 정규화 — 클라이언트가 isHost 같은 신뢰 필드를 넣지 못하게 (그 필드는 서버만 설정) */
const cleanMember = (m = {}) => ({
  id: String(m.id || "").slice(0, 64),
  name: String(m.name || "").slice(0, 40),
  initial: String(m.initial || "").slice(0, 2),
  ...(typeof m.color === "string" ? { color: m.color.slice(0, 60) } : {}),
  skills: Array.isArray(m.skills) ? m.skills.slice(0, 12).map((s) => String(s).slice(0, 20)) : [],
});

/* 헬스체크 — 공개 응답은 ok만, 상세(store/ai)는 비프로덕션에서만 */
app.get("/api/health", (req, res) => {
  const body = { ok: true };
  if (!isProd) {
    body.store = store.kind;
    // 실제 LLM 호출은 아직 미구현이므로 키가 있어도 'mock-pending'으로 정직 표기
    body.ai = process.env.ANTHROPIC_API_KEY ? "mock-pending" : "mock";
    body.time = new Date().toISOString();
  }
  res.json(body);
});

/* 세션 생성 */
app.post("/api/sessions", h(async (req, res) => {
  const b = req.body || {};
  const host = b.host ? { ...cleanMember(b.host), isHost: true } : null;
  if (b.host && !host.id) return bad(res, "host.id required");
  const session = await store.create({
    goal: String(b.goal || "").slice(0, 500),
    mins: Math.min(180, Math.max(5, Number(b.mins) || 60)),
    mode: b.mode === "online" ? "online" : "offline",
    method: ["brain", "scamper", "sixhats"].includes(b.method) ? b.method : "brain",
    deadlineAt: Number.isFinite(Number(b.deadlineAt)) ? Number(b.deadlineAt) : null,
    phase: 0, members: host ? [host] : [], ice: [], ideas: [], votes: {},
  });
  res.status(201).json(session);
}));

/* 세션 조회 */
app.get("/api/sessions/:id", h(async (req, res) => {
  const s = await store.get(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });
  res.json(s);
}));

/* 세션 부분 갱신 — 허용 필드만 (임의 필드/연산자 교체 차단). TODO(B1): 호스트 인가 */
const PATCHABLE = ["phase", "deadlineAt"];
app.patch("/api/sessions/:id", h(async (req, res) => {
  const b = req.body || {};
  const patch = {};
  for (const k of PATCHABLE) if (k in b) patch[k] = b[k];
  if ("phase" in patch) patch.phase = Math.min(3, Math.max(0, Number(patch.phase) || 0));
  if ("deadlineAt" in patch) { const n = Number(patch.deadlineAt); if (Number.isFinite(n)) patch.deadlineAt = n; else delete patch.deadlineAt; }
  const s = await store.update(req.params.id, patch);
  if (!s) return res.status(404).json({ error: "session not found" });
  res.json(s);
}));

/* 콘텐츠 뮤테이션 공통 가드 (B1 인증 전 응급): 레이트리밋 + 세션당 항목 상한.
   cid: 클라이언트가 보낸 상관 id를 그대로 entry id로 보존 → 낙관적 로컬 항목과 중복 방지 */
const contentLimiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });
const MAX_ENTRIES = 300;
const useCid = (b) => (Number.isFinite(Number(b?.cid)) ? Number(b.cid) : Date.now());

/* 팀원 입장 — isHost는 정규화에서 제거됨(클라이언트가 못 붙임). TODO(B1): 서버 발급 memberId */
app.post("/api/sessions/:id/join", contentLimiter, h(async (req, res) => {
  const s = await store.get(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });
  const member = cleanMember(req.body);
  if (!member.id) return bad(res, "member.id required");
  const members = [...(s.members || []).filter((m) => m.id !== member.id), member];
  res.json(await store.update(req.params.id, { members })); // TODO(B3): 동시성
}));

/* 아이스브레이킹 답변 제출 — id는 cid 보존, likes는 서버가 확정 */
app.post("/api/sessions/:id/ice", contentLimiter, h(async (req, res) => {
  const s = await store.get(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });
  const b = req.body || {};
  if (!b.memberId || !b.text) return bad(res, "memberId and text required");
  if ((s.ice || []).length >= MAX_ENTRIES) return res.status(429).json({ error: "too many entries" });
  const entry = {
    id: useCid(b),
    memberId: String(b.memberId).slice(0, 64),
    name: String(b.name || "").slice(0, 40),
    text: String(b.text).slice(0, 500),
    likes: 0,
  };
  res.json(await store.update(req.params.id, { ice: [entry, ...(s.ice || [])] })); // TODO(B3)
}));

/* 아이디어 제출 — id는 cid 보존, likes는 서버가 확정 */
app.post("/api/sessions/:id/ideas", contentLimiter, h(async (req, res) => {
  const s = await store.get(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });
  const b = req.body || {};
  if (!b.memberId || !b.title) return bad(res, "memberId and title required");
  if ((s.ideas || []).length >= MAX_ENTRIES) return res.status(429).json({ error: "too many entries" });
  const idea = {
    id: useCid(b),
    memberId: String(b.memberId).slice(0, 64),
    name: String(b.name || "").slice(0, 40),
    title: String(b.title).slice(0, 300),
    tags: Array.isArray(b.tags) ? b.tags.slice(0, 8).map((t) => String(t).slice(0, 20)) : [],
    likes: 0,
  };
  res.json(await store.update(req.params.id, { ideas: [idea, ...(s.ideas || [])] })); // TODO(B3)
}));

/* 투표 — themeIds는 숫자 배열, 인당 최대 3개로 상한. TODO(B1): memberId 신원 바인딩 */
app.post("/api/sessions/:id/votes", contentLimiter, h(async (req, res) => {
  const s = await store.get(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });
  const b = req.body || {};
  if (!b.memberId) return bad(res, "memberId required");
  const themeIds = Array.isArray(b.themeIds)
    ? b.themeIds.map(Number).filter(Number.isFinite).slice(0, 3)
    : [];
  const votes = { ...(s.votes || {}), [String(b.memberId).slice(0, 64)]: themeIds };
  res.json(await store.update(req.params.id, { votes })); // TODO(B3)
}));

/* AI 오케스트레이터 프록시 — 레이트리밋 + kind 화이트리스트 + 크기 제한.
   kind에 따라 티어/모델을 정해 호출하고, 비용 미터를 세션에 누적한다(P1: 목업).
   TODO(B1): 세션 멤버만 호출하도록 인가, 일일 쿼터 */
const aiLimiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });
app.post("/api/ai", aiLimiter, h(async (req, res) => {
  const b = req.body || {};
  if (b.kind && !ORCHESTRATOR_KINDS.includes(b.kind)) return bad(res, "invalid kind");
  const goal = String(b.goal || "").slice(0, 500);
  const context = typeof b.context === "string" ? b.context.slice(0, 2000) : null;
  // sessionId는 '실제 존재하는 세션'일 때만 미터에 누적(임의 id로 미터 오염·Map 증식 방지)
  let sessionId = b.sessionId ? String(b.sessionId).slice(0, 64) : null;
  if (sessionId && !(await store.get(sessionId))) sessionId = null;
  res.json(await orchestrate({ sessionId, kind: b.kind || "idea", goal, context }));
}));

/* 세션 AI 비용 미터 요약 (발표 패널). 읽기 전용(조회로 미터 생성 안 함) + 레이트리밋 */
app.get("/api/sessions/:id/ai-meter", aiLimiter, h(async (req, res) => {
  res.json(sessionMeter(String(req.params.id).slice(0, 64)));
}));

/* [B/P4 스텁] 임의 요청 분해 미리보기 (엔진 미구현 — 고정 목업) */
app.post("/api/ai/plan", aiLimiter, h(async (req, res) => {
  res.json(planStub(String((req.body || {}).request || "").slice(0, 500)));
}));

/* JSON 파싱 등 미들웨어 에러를 400으로 통일 (스택 비노출) */
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: "bad request" });
  next();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`[server] http://localhost:${PORT}  (store=${store.kind}, cors=${corsOrigin === true ? "dev-reflect" : "whitelist"})`)
);
