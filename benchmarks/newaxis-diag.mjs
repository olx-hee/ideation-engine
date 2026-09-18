/* 진단용 — 스키마 실패 모델의 '원문'을 그대로 본다. (Solar/Llama/Nemotron이 뜻풀이에서 JSON 깨짐)
   실행: node benchmarks/newaxis-diag.mjs */
import "dotenv/config";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const SYS_EXPLAIN = `너는 쉬운 말 설명 도우미다. 아래 카드 내용에 나온 단어를 처음 듣는 사람에게 설명하라.
설명·코드블록 금지. JSON만 출력: {"text": "2~3문장 설명"}
조건: 한국어 "~해요"체, 2~3문장, 어려운 용어를 다른 어려운 용어로 바꾸지 말 것.`;
const USER = `카드: 1인 가구용 소용량 제품 SKU가 3년 새 2배로 늘었고, 편의점이 소분 채소 판매를 확대하고 있어요.\n설명할 단어: SKU`;

for (const [k, slug] of [["Solar-Pro4", "upstage/solar-pro4"], ["Llama-3.3", "meta-llama/llama-3.3-70b-instruct"], ["Nemotron-3.5L", "nvidia/nemotron-3.5-lightning"]]) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Diag" },
    body: JSON.stringify({ model: slug, messages: [{ role: "system", content: SYS_EXPLAIN }, { role: "user", content: USER }], max_tokens: 260, temperature: 0.3 }),
  });
  const d = await res.json();
  const t = d.choices?.[0]?.message?.content ?? "(null)";
  console.log(`\n===== ${k} (finish=${d.choices?.[0]?.finish_reason}) =====\n${JSON.stringify(t)}`);
}
