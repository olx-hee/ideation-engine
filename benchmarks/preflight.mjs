/* 슬러그 프리플라이트 — 후보 모델에 작은 콜을 날려 유효/404 확인. 본실험 전 낭비 방지.
   실행: cd ideation-engine && node benchmarks/preflight.mjs */
import "dotenv/config";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const CANDIDATES = [
  "z-ai/glm-4.6", "deepseek/deepseek-chat-v3", "moonshotai/kimi-k2", "upstage/solar-pro-4",
  "qwen/qwen-2.5-72b-instruct", "google/gemini-2.5-flash", "google/gemini-2.5-flash-lite",
  "openai/gpt-4o-mini", "mistralai/mistral-medium", "meta-llama/llama-3.3-70b-instruct",
  "openai/gpt-oss-120b", "nvidia/nemotron-nano-9b-v2",
];
for (const slug of CANDIDATES) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: slug, messages: [{ role: "user", content: "한국어로 'ok'만 답해" }], max_tokens: 10, usage: { include: true } }) });
    const d = await res.json();
    if (res.ok) console.log(`✅ ${slug.padEnd(38)} out=${(d.usage || {}).completion_tokens} cost=${(d.usage || {}).cost}`);
    else console.log(`❌ ${slug.padEnd(38)} ${res.status}: ${JSON.stringify(d.error || d).slice(0, 90)}`);
  } catch (e) { console.log(`❌ ${slug.padEnd(38)} ERR ${e.message}`); }
  await new Promise((s) => setTimeout(s, 300));
}
