/* P2 반영분 end-to-end 검증 — orchestrate 통해 각 kind 실호출 + S1 멱등(이중과금 차단) 확인.
   실행: cd ideation-engine && node benchmarks/verify-e2e.mjs */
import "dotenv/config";
import { orchestrate } from "../server/orchestrator/index.js";

const sid = "verify-" + Date.now();
const goal = "비대면 팀 회의가 목소리 큰 사람에게만 쏠리는 문제를 줄이고 싶다";
const isMock = (t = "") => /^\[.+\]/.test(t.trim()); // 목업 폴백은 "[모델명] ..." 형태

console.log("=== 각 kind 실호출 (실제 모델 응답이면 mock=false) ===");
for (const kind of ["ice", "keyword", "idea", "analyze", "report"]) {
  const r = await orchestrate({ sessionId: sid, kind, goal });
  if (r.mode === "fanout") {
    console.log(`\n[idea fanout]`);
    for (const a of r.results) console.log(`  ${a.angle.padEnd(6)} ${a.model.padEnd(22)} mock=${isMock(a.text)} :: ${a.text.replace(/\s+/g, " ").slice(0, 46)}`);
  } else {
    console.log(`[${kind.padEnd(8)}] ${r.model.padEnd(22)} mock=${isMock(r.text)} :: ${r.text.replace(/\s+/g, " ").slice(0, 46)}`);
  }
}

const meterAfterAll = (await orchestrate({ sessionId: sid, kind: "keyword", goal })).meter; // keyword 재호출=멱등
console.log(`\n=== S1 멱등 검증 (같은 kind 재호출) ===`);
const r1 = await orchestrate({ sessionId: sid, kind: "ice", goal });
console.log(`ice 재호출 deduped=${r1.deduped}  (true여야 = 실호출 스킵)`);
console.log(`미터 총 콜 수=${r1.meter.counts.total}  (재호출로 늘지 않아야 정상)`);
console.log(`\n요약: mock=false가 모두면 슬러그 정상 / deduped=true면 이중과금 차단 성공`);
