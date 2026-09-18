/* Brave Search — 시중검색 게이트용. 원본 URL·스니펫을 받아 '이미 있나' 판정에 쓴다.
   BRAVE_API_KEY 없으면 no-op(빈 결과). 스니펫은 HTML 제거·길이 상한(프롬프트 인젝션 완화, Grok 1700).
   도메인 다양성(도메인당 1개)으로 한 사이트 도배를 막는다. */
const KEY = process.env.BRAVE_API_KEY;
export const BRAVE_ON = !!KEY;

const strip = (s = "") => String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 200);

export async function braveSearch(query, { count = 5, top = 3 } = {}) {
  if (!KEY) return [];
  try {
    const url = "https://api.search.brave.com/res/v1/web/search?q=" +
      encodeURIComponent(String(query).slice(0, 120)) + `&count=${count}&country=KR&search_lang=ko`;
    const r = await fetch(url, { headers: { Accept: "application/json", "X-Subscription-Token": KEY } });
    if (!r.ok) return [];
    const d = await r.json();
    const web = d?.web?.results || [];
    const seen = new Set();
    const out = [];
    for (const w of web) {
      let dom = "";
      try { dom = new URL(w.url).hostname.replace(/^www\./, ""); } catch {}
      if (dom && seen.has(dom)) continue; // 도메인 다양성
      if (dom) seen.add(dom);
      out.push({ title: strip(w.title), url: w.url, snippet: strip(w.description) });
      if (out.length >= top) break;
    }
    return out;
  } catch {
    return [];
  }
}
