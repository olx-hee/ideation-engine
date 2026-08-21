/* ice 상위 후보 일관성 테스트 — 같은 프롬프트를 모델별 3회 반복해 한국어 품질·토큰 변동 확인.
   Qwen이 한 번은 깔끔, 한 번은 중국어 혼입 → 반복으로 신뢰성 판정. */
import "dotenv/config";
import fs from "node:fs";

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const PROMPT = "회의가 목소리 큰 사람에게만 쏠리는 문제를 줄이고 싶다";
const SYSTEM = "너는 아이스브레이킹 진행자다. 참가자가 떠올릴 짧은 발상의 씨앗을 한 문장으로만 준다.";
const MODELS = [
  { label: "Qwen2.5-7B", slug: "qwen/qwen-2.5-7b-instruct" },
  { label: "Gemini-2.5-Flash-Lite", slug: "google/gemini-2.5-flash-lite" },
  { label: "GPT-4o-mini", slug: "openai/gpt-4o-mini" },
];
const REPS = 3;
// 비한글(한자 등) 혼입 대략 탐지 — CJK 통합한자 영역
const hasHanzi = (s) => /[一-鿿]/.test(s);

async function once(slug) {
  const body = { model: slug, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: `아래 목표에 답하라.\n<<<GOAL>>>\n${PROMPT}\n<<<END>>>` }], max_tokens: 256, temperature: 0.7, usage: { include: true } };
  const t0 = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Bench" }, body: JSON.stringify(body) });
  const ms = Date.now() - t0; const d = await res.json();
  if (!res.ok) return { ok: false, err: JSON.stringify(d.error || d).slice(0, 120), ms };
  const t = (d.choices?.[0]?.message?.content || "").replace(/\s+/g, " ").trim();
  const u = d.usage || {};
  return { ok: true, ms, out: u.completion_tokens, cost: u.cost, hanzi: hasHanzi(t), text: t.slice(0, 90) };
}

const out = [];
for (const m of MODELS) {
  const runs = [];
  for (let i = 0; i < REPS; i++) {
    const r = await once(m.slug);
    runs.push(r);
    console.log(`${m.label.padEnd(24)} #${i + 1}  ${r.ok ? `out${r.out} ${r.ms}ms 한자혼입:${r.hanzi} :: ${r.text}` : "FAIL " + r.err}`);
    await new Promise((s) => setTimeout(s, 700));
  }
  const oks = runs.filter((r) => r.ok);
  const hanziCount = oks.filter((r) => r.hanzi).length;
  out.push({ label: m.label, slug: m.slug, reps: REPS, ok: oks.length, hanziRuns: hanziCount, avgOut: Math.round(oks.reduce((a, r) => a + r.out, 0) / (oks.length || 1)), avgMs: Math.round(oks.reduce((a, r) => a + r.ms, 0) / (oks.length || 1)), runs });
  console.log(`  → ${m.label}: 한자혼입 ${hanziCount}/${oks.length}회, 평균 out ${out[out.length - 1].avgOut}토큰, 평균 ${out[out.length - 1].avgMs}ms\n`);
}
fs.writeFileSync("benchmarks/consistency.json", JSON.stringify({ ranAt: new Date().toISOString(), out }, null, 2));
console.log("SAVED benchmarks/consistency.json");
