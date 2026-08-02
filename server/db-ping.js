import "dotenv/config";
import { initStore } from "./store.js";

/* MongoDB 연결 점검 스크립트.
   .env에 MONGODB_URI를 넣은 뒤:  npm run db:ping
   실제로 쓰기→읽기→삭제 왕복을 해보고, 성공/실패를 사람이 읽기 쉽게 알려준다. */

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI가 없습니다. 프로젝트 루트에 .env 파일을 만들고 MONGODB_URI=... 를 넣어주세요.");
  process.exit(1);
}

try {
  const store = await initStore();

  if (store.kind !== "mongodb") {
    console.error("❌ MongoDB에 연결되지 못했습니다 (인메모리로 폴백됨).");
    console.error("   URI의 사용자/비밀번호, 그리고 Atlas의 Network Access(IP 허용)를 확인하세요.");
    process.exit(1);
  }

  // 쓰기 → 읽기 → 삭제 왕복 (테스트 문서는 정리됨)
  const created = await store.create({ goal: "__db_ping__", _test: true });
  const got = await store.get(created.id);
  const ok = got && got.goal === "__db_ping__";
  await store.delete(created.id);

  if (!ok) {
    console.error("❌ 연결은 됐지만 쓰기/읽기 검증에 실패했습니다.");
    process.exit(1);
  }

  console.log("✅ MongoDB 연결 성공! 쓰기·읽기·삭제까지 정상 확인 (테스트 문서는 삭제됨).");
  console.log("   이제 'npm run dev:all'로 실행하면 세션이 이 DB에 영구 저장됩니다.");
  process.exit(0);
} catch (e) {
  console.error("❌ 연결 중 오류:", e.message);
  console.error("   흔한 원인: 비밀번호 오타, Atlas Network Access에 내 IP 미허용, URI 형식 오류.");
  process.exit(1);
}
