/* 새 축 측정 ⑥ 방향 결정 실험 — #8 AI가 모은 아이디어 (화면 8-6, "AI가 모은 아이디어")
   #8은 2026-09-18 스코핑 보고서에서 "그냥 측정"이 아니라 "방향 결정이 필요한 작업"으로 분류됐다.
   이유: 예전 ④번 실험(모델선정-테스트기록.md)에서 "여러 아이디어를 AI가 자동으로 섞으면 더 창의적"이
   틀렸다고 반증됐다 — 오히려 밋밋해졌다. #8은 정의상 "여러 사람 아이디어를 AI가 종합"하는 작업이라
   같은 함정에 빠질 위험이 가장 큰 자리다. 그래서 이 스크립트는 모델 비교가 아니라 "프롬프트 전략 비교"다.

   전략 A(naive)      = "좋은 점을 살려서 새 아이디어를 만들어라" (제약 없음 — ④의 실패 조건 재현)
   전략 B(constrained) = 정확히 서로 다른 소스 2개 이상을 인용 + 아쉬운 점 중 1개 이상을 구체적으로
                         어떻게 줄였는지 + 원본에 없던 새 디테일(누가·언제·어떻게) 1개 이상 추가 — 강제

   자동으로 재는 것 (전략 A vs B를 같은 모델 안에서 비교):
     1) 스키마 준수 · 개수(≤2)
     2) 출처 유효성 — sourceIds가 실제 제공한 소스 안에 있고 2개 이상인가
     3) 아쉬운점 대응 — improvement가 인용한 소스의 concern 키워드를 언급하는가(그냥 무시했는지)
     4) 새 디테일 추가 — 제목+improvement에 원본(제목·praise·concern) 밖의 내용어가 있는가(그냥 이어붙이기 감지)
     5) 밋밋함(자카드) — 새 아이디어 제목이 소스 제목들과 얼마나 겹치는가(낮을수록 새로움)
   실행: cd ideation-engine && node benchmarks/newaxis-aggregate.mjs
   결과: benchmarks/newaxis-aggregate.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const CANDIDATES = [
  { k: "Solar-Pro4",    slug: "upstage/solar-pro4" },
  { k: "DeepSeek-V3.2", slug: "deepseek/deepseek-v3.2" },
  { k: "Gemini-2.5-F",  slug: "google/gemini-2.5-flash" },
  { k: "Llama-3.3",     slug: "meta-llama/llama-3.3-70b-instruct" },
];
const REPS = 3;

const SOURCES = [
  { id: "s1", title: "장보기 시간과 비용을 줄이는 소분 정기배송", praise: "한곳에 모이면 편하다", concern: "구독료가 부담될 수 있다" },
  { id: "s2", title: "자취생끼리 남는 식재료를 나누는 나눔 게시판", praise: "돈 안 들이고 재료를 아낄 수 있다", concern: "아무도 안 올리면 빈 게시판이 된다" },
];
const SRC_IDS = SOURCES.map((s) => s.id);
const SRC_TXT = SOURCES.map((s) => `${s.id}: "${s.title}" (좋은 점: ${s.praise} / 아쉬운 점: ${s.concern})`).join("\n");

const SYS_NAIVE = `아래는 팀원들이 댓글로 좋은 점을 받은 아이디어들이다. 좋은 점을 살려서 새로운 아이디어를 최대 2개까지 만들어라.
JSON만 출력: {"ideas":[{"title":"...","sourceIds":["s1"],"improvement":"..."}]}`;
const SYS_CONSTRAINED = `아래는 팀원들이 댓글로 좋은 점·아쉬운 점을 받은 아이디어들이다.
[반드시 지킬 것]
- 새 아이디어는 2개 이하.
- 각 아이디어는 서로 다른 소스 2개 이상을 sourceIds로 인용해라(한 소스만 우려먹지 마라).
- improvement에는 인용한 소스들의 "아쉬운 점" 중 최소 1개를 구체적으로 어떻게 줄였는지 적어라.
- 그냥 두 아이디어를 이어붙이지 말고, 원본에는 없던 구체적 실행 방법(누가·언제·어떻게) 1개 이상을 새로 추가해라.
JSON만 출력: {"ideas":[{"title":"...","sourceIds":["s1","s2"],"improvement":"..."}]}`;

async function timedCall(slug, sys) {
  const t0 = Date.now();
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 40000);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: ac.signal,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-NewAxis-Aggregate" },
      body: JSON.stringify({
        model: slug,
        messages: [{ role: "system", content: sys }, { role: "user", content: `소스 아이디어:\n${SRC_TXT}` }],
        max_tokens: 700, temperature: 0.5, response_format: { type: "json_object" }, usage: { include: true },
      }),
    });
    const d = await res.json();
    const ms = Date.now() - t0;
    if (!res.ok) return { ms, ok: false, err: `${res.status} ${JSON.stringify(d.error || d).slice(0, 90)}`, text: "", cost: 0 };
    return { ms, ok: true, text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
  } catch (e) { return { ms: Date.now() - t0, ok: false, err: String(e).slice(0, 90) + (ac.signal.aborted ? " [TIMEOUT40s]" : ""), text: "", cost: 0 }; }
  finally { clearTimeout(to); }
}
const parseJson = (t) => { try { return JSON.parse(t.match(/\{[\s\S]*\}/)[0]); } catch { return null; } };
const words = (t) => (t || "").replace(/[^가-힣a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 1);
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); const i = [...A].filter((x) => B.has(x)).length; return i / (A.size + B.size - i || 1); };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const ALL_ORIG_WORDS = new Set(SOURCES.flatMap((s) => words(`${s.title} ${s.praise} ${s.concern}`)));

function evalStrategy(text) {
  const p = parseJson(text);
  const schema = p && Array.isArray(p.ideas) && p.ideas.length >= 1 && p.ideas.length <= 2
    && p.ideas.every((i) => typeof i.title === "string" && Array.isArray(i.sourceIds) && typeof i.improvement === "string");
  if (!schema) return { schema: false };
  const validSrc = p.ideas.every((i) => i.sourceIds.length >= 2 && i.sourceIds.every((id) => SRC_IDS.includes(id)));
  const addressesConcern = p.ideas.every((i) => {
    const cited = SOURCES.filter((s) => i.sourceIds.includes(s.id));
    return cited.some((s) => words(s.concern).some((w) => i.improvement.includes(w)));
  });
  const newWords = p.ideas.flatMap((i) => words(`${i.title} ${i.improvement}`)).filter((w) => !ALL_ORIG_WORDS.has(w));
  const addedDetail = newWords.length >= 3; // 원문 밖 내용어가 최소 3개는 있어야 "그냥 이어붙이기"가 아님
  const overlaps = p.ideas.map((i) => jaccard(words(i.title), SOURCES.flatMap((s) => words(s.title))));
  const avgOverlap = overlaps.length ? overlaps.reduce((a, b) => a + b, 0) / overlaps.length : 1;
  return { schema: true, count: p.ideas.length, validSrc, addressesConcern, addedDetail, avgOverlap, titles: p.ideas.map((i) => i.title), improvements: p.ideas.map((i) => i.improvement.slice(0, 70)) };
}

const out = [];
for (const c of CANDIDATES) {
  for (const strat of [{ name: "naive", sys: SYS_NAIVE }, { name: "constrained", sys: SYS_CONSTRAINED }]) {
    let cost = 0, calls = 0, fail = 0, firstErr = null;
    const agg = { n: 0, schema: 0, validSrc: 0, concern: 0, detail: 0, overlaps: [] };
    const samples = [];
    for (let r = 0; r < REPS; r++) {
      const res = await timedCall(c.slug, strat.sys);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      agg.n++;
      const v = evalStrategy(res.text);
      if (!v.schema) { if (samples.length < 2) samples.push({ bad: true, raw: res.text.slice(0, 140) }); continue; }
      agg.schema++;
      if (v.validSrc) agg.validSrc++;
      if (v.addressesConcern) agg.concern++;
      if (v.addedDetail) agg.detail++;
      agg.overlaps.push(v.avgOverlap);
      if (r === 0) samples.push({ titles: v.titles, improvements: v.improvements, overlap: +v.avgOverlap.toFixed(2) });
    }
    const row = {
      model: c.k, strategy: strat.name, calls, fail, firstErr,
      schemaPct: pct(agg.schema, agg.n), validSrcPct: pct(agg.validSrc, agg.schema),
      addressesConcernPct: pct(agg.concern, agg.schema), addedDetailPct: pct(agg.detail, agg.schema),
      avgTitleOverlap: agg.overlaps.length ? +(agg.overlaps.reduce((a, b) => a + b, 0) / agg.overlaps.length).toFixed(2) : null,
      costPerCall: calls ? +(cost / calls).toFixed(6) : 0, samples,
    };
    out.push(row);
    console.log(`${c.k.padEnd(14)} [${strat.name.padEnd(11)}] 스키마 ${String(row.schemaPct).padStart(3)}%  출처유효 ${String(row.validSrcPct).padStart(3)}%  아쉬운점대응 ${String(row.addressesConcernPct).padStart(3)}%  새디테일 ${String(row.addedDetailPct).padStart(3)}%  제목겹침 ${row.avgTitleOverlap}  $${row.costPerCall}${row.fail ? `  실패${row.fail}` : ""}`);
  }
}

fs.writeFileSync("benchmarks/newaxis-aggregate.json", JSON.stringify({
  ranAt: new Date().toISOString(), reps: REPS, task: "#8 AI가 모은 아이디어 (전략 비교: naive vs constrained)",
  sources: SOURCES, rows: out,
}, null, 2));

console.log("\n=== naive vs constrained 평균 비교 ===");
for (const name of ["naive", "constrained"]) {
  const rows = out.filter((r) => r.strategy === name && r.schemaPct > 0);
  const avg = (k) => rows.length ? +(rows.reduce((a, r) => a + (r[k] || 0), 0) / rows.length).toFixed(2) : null;
  console.log(`${name.padEnd(12)} 아쉬운점대응 ${avg("addressesConcernPct")}%  새디테일 ${avg("addedDetailPct")}%  제목겹침(낮을수록 새로움) ${avg("avgTitleOverlap")}`);
}
console.log("SAVED benchmarks/newaxis-aggregate.json");
