/* 새 축 측정 ①-v2 실시간 저지연 — #1 꼬리질문 판단, #3 뜻풀이
   v1에서 드러난 두 가지를 고치고 재측정한다.
     (1) 전 모델이 '자세한 답'에도 enough=false → 모델 탓이 아니라 '충분함 기준'을 안 준 프롬프트 탓.
         → 기준(구체성·빈도·이유 중 2개 이상)을 명시.
     (2) Solar는 JSON 지시를 무시하고 산문 반환, Nemotron은 추론에 토큰을 다 써 빈 응답.
         → response_format: json_object 로 스키마를 '강제'하고, max_tokens를 넉넉히(600).
   v1(강제 없음) 대비 스키마 준수율 변화 = "structured output이 필요한가"의 답.
   실행: cd ideation-engine && node benchmarks/newaxis-latency2.mjs
   결과: benchmarks/newaxis-latency2.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const CANDIDATES = [
  { k: "Flash-Lite",    slug: "google/gemini-2.5-flash-lite" },
  { k: "Gemini-2.5-F",  slug: "google/gemini-2.5-flash" },
  { k: "Solar-Pro4",    slug: "upstage/solar-pro4" },
  { k: "GPT-4o-mini",   slug: "openai/gpt-4o-mini" },
  { k: "Llama-3.3",     slug: "meta-llama/llama-3.3-70b-instruct" },
  { k: "Nemotron-3.5L", slug: "nvidia/nemotron-3.5-lightning" },
  { k: "Mistral-Med-3", slug: "mistralai/mistral-medium-3" },
];
const REPS = 3;
const MAXTOK = 600;

/* ── #1 꼬리질문 판단 ─────────────────────────────────────────────────────────── */
const SYS_FOLLOWUP = `너는 팀 아이디어 회의의 1:1 인터뷰 진행자다. 아래 질문과 답을 보고 더 캐물을 필요가 있는지 판단하라.

[충분함 기준] 답에 다음 3가지 중 2가지 이상이 담겼으면 "충분"이다.
 (a) 구체적인 상황이나 예시
 (b) 얼마나 자주/얼마나 심한지
 (c) 왜 불편한지(이유나 감정)
2가지 이상이면 enough=true 로 하고 꼬리질문을 하지 마라. 1가지 이하일 때만 enough=false.

JSON만 출력: {"enough": true 또는 false, "followup": "꼬리질문 한 문장 (enough=true면 빈 문자열)"}
꼬리질문은 "~해요"체 한 문장.`;
const FOLLOWUP_CASES = [
  { id: "thin", expect: false, q: "요즘 일상에서 가장 불편한 게 뭐예요?", a: "배달이요." },
  { id: "rich", expect: true, q: "요즘 일상에서 가장 불편한 게 뭐예요?", a: "자취를 하는데 장을 보면 항상 재료가 남아요. 1인분만 파는 게 거의 없어서 큰 걸 사고, 절반은 결국 버려요. 특히 채소가 이틀이면 시들어서 매번 아까워요." },
  { id: "mid", expect: null, q: "요즘 일상에서 가장 불편한 게 뭐예요?", a: "장 볼 때 재료가 많이 남아서 좀 아까워요." }, // 애매 — 채점 안 하고 관찰만
];

/* ── #3 "이게 뭐예요?" 뜻풀이 ────────────────────────────────────────────────── */
const SYS_EXPLAIN = `너는 쉬운 말 설명 도우미다. 아래 카드 내용에 나온 단어를 처음 듣는 사람에게 설명하라.
JSON만 출력: {"text": "2~3문장 설명"}
조건: 한국어 "~해요"체, 2~3문장, 어려운 용어를 다른 어려운 용어로 바꾸지 말 것.`;
const EXPLAIN_CASES = [
  { id: "sku", word: "SKU", card: "1인 가구용 소용량 제품 SKU가 3년 새 2배로 늘었고, 편의점이 소분 채소 판매를 확대하고 있어요." },
  { id: "escrow", word: "에스크로", card: "중고 거래 플랫폼들이 에스크로 결제를 기본값으로 바꾸면서 분쟁 접수가 줄었다는 보도가 나왔어요." },
];

async function timedCall(slug, messages) {
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-NewAxis-Latency2" },
      body: JSON.stringify({
        model: slug, messages, max_tokens: MAXTOK, temperature: 0.3,
        response_format: { type: "json_object" },   // ← v1과의 유일한 차이(+기준 프롬프트)
        usage: { include: true },
      }),
    });
    const d = await res.json();
    const ms = Date.now() - t0;
    if (!res.ok) return { ms, ok: false, err: `${res.status} ${JSON.stringify(d.error || d).slice(0, 80)}`, text: "", cost: 0 };
    return { ms, ok: true, text: (d.choices?.[0]?.message?.content || "").trim(), finish: d.choices?.[0]?.finish_reason, cost: (d.usage || {}).cost || 0 };
  } catch (e) {
    return { ms: Date.now() - t0, ok: false, err: String(e).slice(0, 80), text: "", cost: 0 };
  }
}

const parseJson = (t) => { try { return JSON.parse(t.match(/\{[\s\S]*\}/)[0]); } catch { return null; } };
const isKorean = (t) => /[가-힣]/.test(t) && (t.match(/[가-힣]/g) || []).length > (t.match(/[a-zA-Z]/g) || []).length * 0.5;
const sentenceCount = (t) => (t.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim().length > 1)).length || 1;

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const pctile = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };

const out = [];
for (const c of CANDIDATES) {
  const lat = [];
  let cost = 0, calls = 0, fail = 0, firstErr = null, lengthCut = 0;
  const fu = { schema: 0, correct: 0, n: 0, scored: 0 };
  const ex = { schema: 0, style: 0, n: 0 };
  const samples = [];
  const midEnough = [];

  for (let r = 0; r < REPS; r++) {
    for (const cs of FOLLOWUP_CASES) {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_FOLLOWUP }, { role: "user", content: `질문: ${cs.q}\n답: ${cs.a}` }]);
      calls++; cost += res.cost;
      if (res.finish === "length") lengthCut++;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      lat.push(res.ms);
      const p = parseJson(res.text);
      const okSchema = !!p && typeof p.enough === "boolean" && typeof p.followup === "string"
        && (p.enough === true || p.followup.trim().length > 0);
      fu.n++; if (okSchema) fu.schema++;
      if (cs.expect === null) { if (okSchema) midEnough.push(p.enough); }
      else { fu.scored++; if (okSchema && p.enough === cs.expect) fu.correct++; }
      if (r === 0) samples.push({ task: "followup", case: cs.id, expect: cs.expect, got: p?.enough, followup: (p?.followup || "").slice(0, 55), raw: okSchema ? undefined : res.text.slice(0, 90) });
    }
    for (const cs of EXPLAIN_CASES) {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_EXPLAIN }, { role: "user", content: `카드: ${cs.card}\n설명할 단어: ${cs.word}` }]);
      calls++; cost += res.cost;
      if (res.finish === "length") lengthCut++;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      lat.push(res.ms);
      const p = parseJson(res.text);
      const okSchema = !!p && typeof p.text === "string" && p.text.trim().length > 10;
      const n = okSchema ? sentenceCount(p.text) : 0;
      const okStyle = okSchema && isKorean(p.text) && n >= 2 && n <= 4;
      ex.n++; if (okSchema) ex.schema++; if (okStyle) ex.style++;
      if (r === 0) samples.push({ task: "explain", case: cs.id, sents: n, sample: (p?.text || "").slice(0, 75), raw: okSchema ? undefined : res.text.slice(0, 90) });
    }
  }

  const row = {
    model: c.k, slug: c.slug, calls, fail, firstErr, lengthCut,
    p50: pctile(lat, 50), p95: pctile(lat, 95),
    schemaPct: pct(fu.schema + ex.schema, fu.n + ex.n),
    followupAccPct: pct(fu.correct, fu.scored),
    explainStylePct: pct(ex.style, ex.n),
    midAnswerEnough: midEnough,            // 애매한 답을 충분하다고 봤는지(관찰)
    costPerCall: calls ? +(cost / calls).toFixed(7) : 0,
    samples,
  };
  out.push(row);
  console.log(`${c.k.padEnd(14)} p50 ${String(row.p50).padStart(5)}ms  p95 ${String(row.p95).padStart(6)}ms  스키마 ${String(row.schemaPct).padStart(3)}%  꼬리질문정확 ${String(row.followupAccPct).padStart(3)}%  뜻풀이문체 ${String(row.explainStylePct).padStart(3)}%  $${row.costPerCall}${row.lengthCut ? `  토큰소진${row.lengthCut}` : ""}${row.fail ? `  실패${row.fail}` : ""}`);
}

fs.writeFileSync("benchmarks/newaxis-latency2.json", JSON.stringify({
  ranAt: new Date().toISOString(), reps: REPS, maxTokens: MAXTOK,
  change: "v1 대비: (1) 충분함 기준 명시 (2) response_format=json_object 강제 (3) max_tokens 600",
  tasks: ["#1 인터뷰 꼬리질문 판단", "#3 이게 뭐예요 뜻풀이"],
  note: "지연은 네트워크·OpenRouter 라우팅 변동 포함. 비스트리밍 총 응답시간.",
  rows: out,
}, null, 2));

console.log("\n=== 실시간 작업 적합도 (스키마 100% · 정확 100% 통과자 중 p95 낮은 순) ===");
[...out].filter((r) => r.schemaPct >= 95 && r.followupAccPct >= 95 && r.p95).sort((a, b) => a.p95 - b.p95)
  .forEach((r) => console.log(`${r.model.padEnd(14)} p95 ${r.p95}ms  p50 ${r.p50}ms  $${r.costPerCall}`));
console.log("SAVED benchmarks/newaxis-latency2.json");
