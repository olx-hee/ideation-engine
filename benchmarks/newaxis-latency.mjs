/* 새 축 측정 ① 실시간 저지연 — #1 인터뷰 꼬리질문 판단, #3 "이게 뭐예요?" 뜻풀이
   docs/05-AI-작업-목록.md: 이 둘만 '요청 안'에서 처리 = 사람이 화면 앞에서 기다린다.
   → 선택 기준이 품질이 아니라 지연. 기존 벤치(confound/rematch/heavy-analyze/report-retest)는
     품질·비용만 쟀고 지연을 한 번도 안 쟀다. 여기서 p50/p95 + 스키마 준수 + 한국어/길이 규칙을 본다.
   슬러그 유효성(404) 프리플라이트 역할도 겸한다.
   실행: cd ideation-engine && node benchmarks/newaxis-latency.mjs
   결과: benchmarks/newaxis-latency.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const CANDIDATES = [
  { k: "Flash-Lite",    slug: "google/gemini-2.5-flash-lite" },     // 현행 ice/keyword
  { k: "Gemini-2.5-F",  slug: "google/gemini-2.5-flash" },
  { k: "Solar-Pro4",    slug: "upstage/solar-pro4" },                // 현행 idea/analyze
  { k: "GPT-4o-mini",   slug: "openai/gpt-4o-mini" },
  { k: "Llama-3.3",     slug: "meta-llama/llama-3.3-70b-instruct" }, // 현행 verify
  { k: "Nemotron-3.5L", slug: "nvidia/nemotron-3.5-lightning" },
  { k: "Mistral-Med-3", slug: "mistralai/mistral-medium-3" },
];
const REPS = 5;

/* ── #1 꼬리질문 판단: 질문+답 → 충분한지 / 꼬리질문 1개 ───────────────────────── */
const SYS_FOLLOWUP = `너는 팀 아이디어 회의의 1:1 인터뷰 진행자다. 아래 질문과 답을 보고 더 캐물을 필요가 있는지 판단하라.
설명·코드블록 금지. JSON만 출력: {"enough": true|false, "followup": "꼬리질문 한 문장(enough=true면 빈 문자열)"}
말투는 "~해요"체, 꼬리질문은 한 문장.`;
const FOLLOWUP_CASES = [
  // thin=true → 답이 빈약해 꼬리질문이 나오는 게 정답
  { id: "thin", thin: true, q: "요즘 일상에서 가장 불편한 게 뭐예요?", a: "배달이요." },
  { id: "rich", thin: false, q: "요즘 일상에서 가장 불편한 게 뭐예요?", a: "자취를 하는데 장을 보면 항상 재료가 남아요. 1인분만 파는 게 거의 없어서 큰 걸 사고, 절반은 결국 버려요. 특히 채소가 이틀이면 시들어서 매번 아까워요." },
];

/* ── #3 "이게 뭐예요?" 뜻풀이: 카드 + 단어 → 2~3문장 쉬운 설명 ────────────────── */
const SYS_EXPLAIN = `너는 쉬운 말 설명 도우미다. 아래 카드 내용에 나온 단어를 처음 듣는 사람에게 설명하라.
설명·코드블록 금지. JSON만 출력: {"text": "2~3문장 설명"}
조건: 한국어 "~해요"체, 2~3문장, 어려운 용어를 다른 어려운 용어로 바꾸지 말 것.`;
const EXPLAIN_CASES = [
  { id: "sku", word: "SKU", card: "1인 가구용 소용량 제품 SKU가 3년 새 2배로 늘었고, 편의점이 소분 채소 판매를 확대하고 있어요." },
  { id: "escrow", word: "에스크로", card: "중고 거래 플랫폼들이 에스크로 결제를 기본값으로 바꾸면서 분쟁 접수가 줄었다는 보도가 나왔어요." },
];

async function timedCall(slug, messages, maxTok) {
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-NewAxis-Latency" },
      body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: 0.3, usage: { include: true } }),
    });
    const d = await res.json();
    const ms = Date.now() - t0;
    if (!res.ok) return { ms, ok: false, err: `${res.status} ${JSON.stringify(d.error || d).slice(0, 80)}`, text: "", cost: 0 };
    return { ms, ok: true, text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
  } catch (e) {
    return { ms: Date.now() - t0, ok: false, err: String(e).slice(0, 80), text: "", cost: 0 };
  }
}

const parseJson = (t) => { try { return JSON.parse(t.match(/\{[\s\S]*\}/)[0]); } catch { return null; } };
const isKorean = (t) => /[가-힣]/.test(t) && (t.match(/[가-힣]/g) || []).length > (t.match(/[a-zA-Z]/g) || []).length * 0.5;
const sentenceCount = (t) => (t.match(/[.!?요다]\s|[.!?]$|요$|다$/g) || []).length || 1;

// #1 스키마: enough(boolean) + followup(string). enough=false면 followup 비어있으면 안 됨
function checkFollowup(raw, c) {
  const p = parseJson(raw);
  if (!p) return { schema: false, logic: false };
  const schema = typeof p.enough === "boolean" && typeof p.followup === "string"
    && (p.enough === true || p.followup.trim().length > 0);
  // 빈약한 답인데 enough=true라고 하면(=캐묻지 않음) 인터뷰가 헐거워진다 → 판단 정확도
  const logic = schema && (c.thin ? p.enough === false : p.enough === true);
  return { schema, logic, enough: p.enough, followup: (p.followup || "").slice(0, 60) };
}
// #3 스키마: text(string) + 한국어 + 2~4문장(3문장 규칙에 ±1 허용)
function checkExplain(raw) {
  const p = parseJson(raw);
  if (!p) return { schema: false, style: false };
  const schema = typeof p.text === "string" && p.text.trim().length > 10;
  const n = schema ? sentenceCount(p.text) : 0;
  const style = schema && isKorean(p.text) && n >= 2 && n <= 4;
  return { schema, style, sents: n, sample: (p.text || "").slice(0, 70) };
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const pctile = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };

const out = [];
for (const c of CANDIDATES) {
  const lat = [];
  let cost = 0, calls = 0, fail = 0;
  const fu = { schema: 0, logic: 0, n: 0 };
  const ex = { schema: 0, style: 0, n: 0 };
  let firstErr = null;
  const samples = [];

  for (let r = 0; r < REPS; r++) {
    for (const cs of FOLLOWUP_CASES) {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_FOLLOWUP }, { role: "user", content: `질문: ${cs.q}\n답: ${cs.a}` }], 160);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      lat.push(res.ms);
      const v = checkFollowup(res.text, cs); fu.n++; if (v.schema) fu.schema++; if (v.logic) fu.logic++;
      if (r === 0) samples.push({ task: "followup", case: cs.id, enough: v.enough, followup: v.followup });
    }
    for (const cs of EXPLAIN_CASES) {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_EXPLAIN }, { role: "user", content: `카드: ${cs.card}\n설명할 단어: ${cs.word}` }], 260);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      lat.push(res.ms);
      const v = checkExplain(res.text); ex.n++; if (v.schema) ex.schema++; if (v.style) ex.style++;
      if (r === 0) samples.push({ task: "explain", case: cs.id, sents: v.sents, sample: v.sample });
    }
  }

  const row = {
    model: c.k, slug: c.slug, calls, fail, firstErr,
    p50: pctile(lat, 50), p95: pctile(lat, 95), avg: lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : null,
    schemaPct: pct(fu.schema + ex.schema, fu.n + ex.n),
    followupLogicPct: pct(fu.logic, fu.n),
    explainStylePct: pct(ex.style, ex.n),
    costPerCall: calls ? +(cost / calls).toFixed(7) : 0,
    samples,
  };
  out.push(row);
  console.log(`${c.k.padEnd(14)} p50 ${String(row.p50).padStart(5)}ms  p95 ${String(row.p95).padStart(5)}ms  스키마 ${row.schemaPct}%  꼬리질문판단 ${row.followupLogicPct}%  뜻풀이문체 ${row.explainStylePct}%  $${row.costPerCall}${row.fail ? `  실패${row.fail} ${row.firstErr}` : ""}`);
}

fs.writeFileSync("benchmarks/newaxis-latency.json", JSON.stringify({
  ranAt: new Date().toISOString(), reps: REPS,
  tasks: ["#1 인터뷰 꼬리질문 판단", "#3 이게 뭐예요 뜻풀이"],
  axes: ["지연 p50/p95", "스키마 준수", "판단 정확도", "문체 규칙", "호출당 비용"],
  note: "지연은 네트워크·OpenRouter 라우팅 변동 포함. 비스트리밍 총 응답시간.",
  rows: out,
}, null, 2));

console.log("\n=== 지연 순위(p95 낮은 순, 스키마 90%↑만) ===");
[...out].filter((r) => r.schemaPct >= 90 && r.p95).sort((a, b) => a.p95 - b.p95)
  .forEach((r) => console.log(`${r.model.padEnd(14)} p95 ${r.p95}ms  판단 ${r.followupLogicPct}%  $${r.costPerCall}`));
console.log("SAVED benchmarks/newaxis-latency.json");
