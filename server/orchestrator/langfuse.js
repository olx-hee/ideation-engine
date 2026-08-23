/* Langfuse(비용 관측) 연동 — 키 있으면 각 실호출을 generation으로 전송, 없으면 no-op.
   목적: 외부 도구가 '호출별 실비용($)'을 독립적으로 기록 → "우리끼리 계산 아님" 신뢰(사업성① 검증).
   키는 .env(LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST)에서만 읽음. 없으면 조용히 비활성. */
import { Langfuse } from "langfuse";

const enabled = !!(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
export const LANGFUSE_ON = enabled;

const lf = enabled
  ? new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
    })
  : null;

// 실호출 1건 기록. cost = OpenRouter 실비용($); 있으면 usage.totalCost로 전달(대시보드 집계용).
export function logGeneration({ kind, role, model, tier, inTok, outTok, total, cost, prompt, output, sessionId }) {
  if (!lf) return;
  try {
    const gen = lf.generation({
      name: kind || "call",
      model,
      input: prompt ? String(prompt).slice(0, 1500) : undefined,
      output: output ? String(output).slice(0, 1500) : undefined,
      metadata: { role, tier, sessionId, provider: "openrouter" },
      usage: {
        input: inTok ?? undefined,
        output: outTok ?? undefined,
        total: total ?? undefined,
        unit: "TOKENS",
        ...(typeof cost === "number" ? { totalCost: cost } : {}),
      },
    });
    gen.end();
  } catch (e) {
    console.warn("[langfuse] 기록 실패:", e.message);
  }
}

export async function shutdownLangfuse() {
  if (lf) await lf.shutdownAsync();
}
