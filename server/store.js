import { randomUUID } from "crypto";
import dns from "dns";

/* ══════════════════════════════════════════════════════════════
   세션 스토어 — 하나의 async 인터페이스로 두 백엔드를 감춘다.
   · MONGODB_URI 있음 → MongoDB(Mongoose)
   · 없음            → 인메모리 Map (키·DB 없이 지금 바로 실행/테스트용)
   프론트·라우트는 이 인터페이스만 알면 되므로, 나중에 DB만 꽂으면 됨.
   ════════════════════════════════════════════════════════════════ */

// 세션 id는 추측/열거를 막기 위해 전체 UUID(122bit) 사용
const newId = () => randomUUID();

/* ---- 인메모리 폴백 (서버 재시작 시 초기화됨) ---- */
function createMemoryStore() {
  const sessions = new Map();
  return {
    kind: "memory",
    async create(data) {
      const id = data.id || newId();
      const s = { ...data, id, createdAt: Date.now() };
      sessions.set(id, s);
      return s;
    },
    async get(id) {
      return sessions.get(id) || null;
    },
    async update(id, patch) {
      const s = sessions.get(id);
      if (!s) return null;
      const next = { ...s, ...patch };
      sessions.set(id, next);
      return next;
    },
    async delete(id) {
      return sessions.delete(id);
    },
    async all() {
      return [...sessions.values()];
    },
  };
}

/* ---- MongoDB (MONGODB_URI 설정 시 자동 사용) ---- */
async function createMongoStore(uri) {
  // 일부 환경에서 시스템 DNS가 SRV(mongodb+srv) 조회를 거부(ECONNREFUSED)해 연결이 실패한다.
  // 공개 DNS(구글·클라우드플레어)를 우선 사용하도록 지정해 회피하고, 시스템 DNS는 뒤에 둔다.
  if (uri.startsWith("mongodb+srv")) {
    try { dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]); } catch {}
  }
  const mongoose = (await import("mongoose")).default;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  // strict:false → 세션 스키마가 자유롭게 진화해도 그대로 저장
  const schema = new mongoose.Schema({ _id: String }, { strict: false, minimize: false, _id: false });
  const Session = mongoose.models.Session || mongoose.model("Session", schema);
  const clean = (doc) => { if (!doc) return null; const o = { ...doc, id: doc._id }; delete o._id; delete o.__v; return o; };
  return {
    kind: "mongodb",
    async create(data) {
      const id = data.id || newId();
      const doc = await Session.create({ ...data, _id: id, createdAt: Date.now() });
      return clean(doc.toObject());
    },
    async get(id) {
      return clean(await Session.findById(id).lean());
    },
    async update(id, patch) {
      // patch를 항상 $set으로 감싸 업데이트 연산자 주입($unset/$rename 등) 차단
      return clean(await Session.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean());
    },
    async delete(id) {
      const r = await Session.findByIdAndDelete(id);
      return !!r;
    },
    async all() {
      return (await Session.find().lean()).map(clean);
    },
  };
}

export async function initStore() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      const store = await createMongoStore(uri);
      console.log("[store] MongoDB 연결됨");
      return store;
    } catch (e) {
      // 프로덕션에서 조용한 인메모리 폴백은 '저장된 줄 착각 + 재시작 시 소실' 사고 → 기동 실패
      if (process.env.NODE_ENV === "production") {
        console.error("[store] 프로덕션 MongoDB 연결 실패 — 폴백 금지, 종료:", e.message);
        throw e;
      }
      console.warn("[store] MongoDB 연결 실패 → 인메모리로 폴백:", e.message);
    }
  } else {
    console.log("[store] MONGODB_URI 없음 → 인메모리 스토어 사용 (재시작 시 초기화)");
  }
  return createMemoryStore();
}
