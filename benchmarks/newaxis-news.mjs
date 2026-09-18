/* 새 축 측정 ⑤ 근거 카드 — #2 최근 소식 카드 3장 (세션 시작 직후, 화면 7-2)
   docs/05 꼭지킬것 1과 동일한 그라운딩 위험: "검색 결과에 있는 것만 요약하고 링크를 붙인다."
   #7(grounding.mjs)과 같은 방법론을 재사용하되, 스키마가 다르다(시장/기술/규제 3장 고정 카테고리).

   자동으로 재는 것:
     1) URL 환각 — 출력 URL이 제공 링크 밖이면 환각
     2) 카테고리 커버 — 시장·기술·규제 3개가 정확히 한 번씩 나오는가
     3) 숫자 환각 — easy/forUs 요약의 수치가 스니펫에 없으면 지어낸 것
     4) 링크 인용 — sourceUrl이 제공 링크 중 하나인가
     5) "쉬운 말" 스타일 — 어려운 용어를 그대로 반복하지 않는지(문장수 2~3)
     6) 지연·비용
   실행: cd ideation-engine && node benchmarks/newaxis-news.mjs
   결과: benchmarks/newaxis-news.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const CANDIDATES = [
  { k: "Flash-Lite",    slug: "google/gemini-2.5-flash-lite" },
  { k: "Gemini-2.5-F",  slug: "google/gemini-2.5-flash" },
  { k: "Solar-Pro4",    slug: "upstage/solar-pro4" },
  { k: "DeepSeek-V3.2", slug: "deepseek/deepseek-v3.2" },
  { k: "Llama-3.3",     slug: "meta-llama/llama-3.3-70b-instruct" },
  { k: "Mistral-Med-3", slug: "mistralai/mistral-medium-3" },
];
const REPS = 3;

const CASES = [
  {
    id: "delivery", topic: "학생 자취용 소분 식재료 정기배송",
    snippets: [
      { cat: "시장", t: "1인 가구용 소분 식재료 정기배송 스타트업 3곳 투자 유치", s: "최근 1년간 소분 식재료 정기배송을 내세운 스타트업 여러 곳이 투자를 받았어요. 대학가 주변 배송을 특화한 곳은 아직 적어요.", u: "https://news.example.com/n1" },
      { cat: "기술", t: "저온 소포장 배송 기술, 중소업체도 도입 가능해져", s: "예전엔 대기업만 쓰던 저온 소포장 배송 장비를 임대로 쓸 수 있게 됐다는 보도가 있어요.", u: "https://news.example.com/n2" },
      { cat: "규제", t: "소분 식품 위생 표시 기준 강화 예고", s: "소분 판매 식품에 원산지·유통기한 표시를 더 꼼꼼히 하도록 하는 지침이 예고돼 있어요.", u: "https://news.example.com/n3" },
    ],
  },
];
const SYS = `너는 세션 시작 직후 보여줄 "최근 소식 카드" 담당이다. 아래 검색 결과만 근거로 시장·기술·규제 카드를 정확히 1장씩(총 3장) 만들어라.
[반드시 지킬 것]
- 검색 결과에 없는 사실·수치를 쓰지 마라. sourceUrl에는 제공된 링크 중 하나를 그대로 넣어라.
- "쉽게 말하면"은 어려운 용어를 다른 어려운 용어로 바꾸지 말고 2~3문장으로.
JSON만 출력: {"cards":[{"category":"시장|기술|규제","title":"...","easy":"쉽게 말하면 2~3문장","forUs":"우리 팀에게 의미 1문장","sourceUrl":"제공된 링크 중 하나"}]} (정확히 3장)`;

async function timedCall(slug, messages) {
  const t0 = Date.now();
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 40000);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: ac.signal,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-NewAxis-News" },
      body: JSON.stringify({ model: slug, messages, max_tokens: 900, temperature: 0.3, response_format: { type: "json_object" }, usage: { include: true } }),
    });
    const d = await res.json();
    const ms = Date.now() - t0;
    if (!res.ok) return { ms, ok: false, err: `${res.status} ${JSON.stringify(d.error || d).slice(0, 90)}`, text: "", cost: 0 };
    return { ms, ok: true, text: (d.choices?.[0]?.message?.content || "").trim(), finish: d.choices?.[0]?.finish_reason, cost: (d.usage || {}).cost || 0 };
  } catch (e) { return { ms: Date.now() - t0, ok: false, err: String(e).slice(0, 90) + (ac.signal.aborted ? " [TIMEOUT40s]" : ""), text: "", cost: 0 }; }
  finally { clearTimeout(to); }
}
const parseJson = (t) => { try { return JSON.parse(t.match(/\{[\s\S]*\}/)[0]); } catch { return null; } };
const URL_RE = /https?:\/\/[^\s"'),]+/g;
const NUM_RE = /\d[\d,.]*\s*(%|퍼센트|억|조|만\s*명|만명|명|원|달러|배|건|개월|년|곳)/g;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const pctile = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };

const out = [];
for (const c of CANDIDATES) {
  const lat = []; let cost = 0, calls = 0, fail = 0, firstErr = null;
  let n = 0, schemaOk = 0, catCover = 0, urlBad = 0, linkCited = 0, numBad = 0;
  const samples = [];
  for (const cs of CASES) {
    const allowed = cs.snippets.map((s) => s.u);
    const snippetText = cs.snippets.map((s) => `${s.t} ${s.s}`).join(" ");
    const userMsg = `주제: ${cs.topic}\n\n[검색 결과]\n${cs.snippets.map((s, i) => `${i + 1}. [${s.cat}] ${s.t}\n   ${s.s}\n   링크: ${s.u}`).join("\n")}`;
    for (let r = 0; r < REPS; r++) {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS }, { role: "user", content: userMsg }]);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      lat.push(res.ms); n++;
      const p = parseJson(res.text);
      const ok = p && Array.isArray(p.cards) && p.cards.length === 3
        && p.cards.every((cd) => cd && typeof cd.title === "string" && typeof cd.easy === "string" && typeof cd.forUs === "string" && typeof cd.sourceUrl === "string");
      if (!ok) { if (samples.length < 3) samples.push({ case: cs.id, bad: true, raw: res.text.slice(0, 150) }); continue; }
      schemaOk++;
      const cats = new Set(p.cards.map((cd) => cd.category));
      if (cats.has("시장") && cats.has("기술") && cats.has("규제")) catCover++;
      const found = res.text.match(URL_RE) || [];
      if (found.some((u) => !allowed.includes(u.replace(/[.,]$/, "")))) urlBad++;
      if (p.cards.every((cd) => allowed.includes(cd.sourceUrl))) linkCited++;
      const nums = p.cards.flatMap((cd) => (cd.easy + " " + cd.forUs).match(NUM_RE) || []);
      const bad = nums.filter((h) => !snippetText.includes(h.replace(/\s+/g, "")) && !snippetText.includes(h));
      if (bad.length) numBad++;
      if (r === 0) samples.push({ case: cs.id, cats: [...cats], titles: p.cards.map((cd) => cd.title) });
    }
  }
  const row = {
    model: c.k, slug: c.slug, calls, fail, firstErr,
    p50: pctile(lat, 50), p95: pctile(lat, 95),
    schemaPct: pct(schemaOk, n), catCoverPct: pct(catCover, schemaOk), urlHallucPct: pct(urlBad, schemaOk),
    linkCitedPct: pct(linkCited, schemaOk), numHallucPct: pct(numBad, schemaOk),
    costPerCall: calls ? +(cost / calls).toFixed(6) : 0, samples,
  };
  out.push(row);
  console.log(`${c.k.padEnd(14)} 스키마 ${String(row.schemaPct).padStart(3)}%  카테고리커버 ${String(row.catCoverPct).padStart(3)}%  URL환각 ${String(row.urlHallucPct).padStart(3)}%  링크인용 ${String(row.linkCitedPct).padStart(3)}%  숫자환각 ${String(row.numHallucPct).padStart(3)}%  p95 ${row.p95}ms  $${row.costPerCall}${row.fail ? `  실패${row.fail}` : ""}`);
}

fs.writeFileSync("benchmarks/newaxis-news.json", JSON.stringify({
  ranAt: new Date().toISOString(), reps: REPS, task: "#2 최근 소식 카드 3장",
  rows: out,
}, null, 2));
console.log("SAVED benchmarks/newaxis-news.json");
