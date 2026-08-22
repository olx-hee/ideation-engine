/* Langfuse가 실제로 기록했는지 교차확인 — 방금 보낸 generation들을 되읽어 모델·비용 합계 출력. */
import "dotenv/config";
import { Langfuse } from "langfuse";

const lf = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
});

await new Promise((r) => setTimeout(r, 6000)); // 서버 인제스트 지연 대기

const res = await lf.fetchObservations({ type: "GENERATION", limit: 15 });
const obs = res.data || [];
console.log(`\nLangfuse에 기록된 최근 generation: ${obs.length}건\n`);
let sum = 0;
for (const o of obs.slice(0, 12)) {
  const c = o.calculatedTotalCost ?? o.totalCost ?? 0;
  sum += c || 0;
  console.log(`  ${String(o.model || "?").padEnd(24)}  $${(c || 0).toFixed(6)}   [${o.name}]`);
}
console.log(`\nLangfuse 집계 합계(최근 12건): $${sum.toFixed(6)}`);
console.log("(대시보드 cloud.langfuse.com → 프로젝트 → Tracing 에서 동일 데이터 확인 가능)\n");
await lf.shutdownAsync();
