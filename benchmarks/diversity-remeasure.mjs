/* [기준점 재측정 — A 다양성축] 확정 프로토콜로 S vs M 다양성을 제대로 측정.
   S 단일 Solar 후보 9개 / M 다중(Solar+Gemini+Kimi 각3) 풀 9개 — 자동종합 없이 이견 보존, 개수 통제.
   지표: Vendi Score(임베딩) · 평균 쌍거리(cosine) · distinct-bigram · 어휘 Jaccard 거리.
   D(LLM-judge)는 이번 축에서 안 씀. B(사람)는 별도 시트. C(검색)는 다음.
   실행: cd ideation-engine && node benchmarks/diversity-remeasure.mjs  결과: benchmarks/diversity-remeasure.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const SOLAR = "upstage/solar-pro4", GEM = "google/gemini-2.5-flash", KIMI = "moonshotai/kimi-k2.5";
const EMB = "openai/text-embedding-3-small";
const N = 9; // 통제된 후보 개수 (S=9, M=3+3+3)
const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스",
  "중고 거래의 사기를 줄이는 앱", "노인의 디지털 기기 사용을 돕는 서비스", "프리랜서의 계약·정산을 돕는 서비스",
];
const sysN = (n) => `너는 아이디어 발산 전문가다. 목표에 대해 서로 겹치지 않는 새로운 아이디어 후보 ${n}개를 각 1~2문장으로 번호를 매겨 제시하라. 종합·요약·설명 없이 후보만 나열.`;

async function call(slug, n, g, maxTok) {
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-DivRemeasure" }, body: JSON.stringify({ model: slug, messages: [{ role: "system", content: sysN(n) }, { role: "user", content: `목표: ${g}` }], max_tokens: maxTok, temperature: 0.85, usage: { include: true } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status} ${JSON.stringify(d).slice(0, 90)}`);
      return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 400)); }
  }
  return { text: "", cost: 0 };
}
function parseCands(text, want) {
  const lines = text.split(/\n/).map((l) => l.trim());
  const c = [];
  for (const l of lines) { const m = l.match(/^\s*\d+[\.\)]\s*(.+)/); if (m && m[1].trim()) c.push(m[1].replace(/\*\*/g, "").trim()); }
  if (c.length < want) for (const l of lines) { if (c.length >= want) break; if (l && !/^\s*\d+[\.\)]/.test(l) && l.replace(/[^가-힣a-zA-Z]/g, "").length >= 6) c.push(l.replace(/\*\*/g, "").trim()); }
  return c.slice(0, want);
}
async function embed(texts) {
  const r = await fetch("https://openrouter.ai/api/v1/embeddings", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: EMB, input: texts }) });
  const d = await r.json(); if (!r.ok) throw new Error(`emb ${r.status} ${JSON.stringify(d).slice(0, 120)}`);
  return d.data.map((x) => x.embedding);
}
// ── 벡터/지표 ──
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const cos = (a, b) => { const n = Math.sqrt(dot(a, a) * dot(b, b)); return n ? dot(a, b) / n : 0; };
function meanPairDist(E) { let s = 0, c = 0; for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) { s += 1 - cos(E[i], E[j]); c++; } return c ? s / c : 0; }
function jacobiEig(S) { // 대칭행렬 고유값 (cyclic Jacobi)
  const n = S.length; const a = S.map((r) => r.slice());
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
    if (off < 1e-13) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-15) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
    }
  }
  return a.map((r, i) => r[i]);
}
function vendi(E) { // 효과적 '서로 다른 아이디어 개수' (1~n)
  const n = E.length; const S = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) S[i][j] = cos(E[i], E[j]);
  const K = S.map((r) => r.map((v) => v / n));
  const ev = jacobiEig(K).filter((x) => x > 1e-12); const sum = ev.reduce((a, b) => a + b, 0) || 1;
  const p = ev.map((x) => x / sum); const H = -p.reduce((a, x) => a + (x > 0 ? x * Math.log(x) : 0), 0);
  return Math.exp(H);
}
const words = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 1);
const bigrams = (ws) => { const b = []; for (let i = 0; i < ws.length - 1; i++) b.push(ws[i] + "_" + ws[i + 1]); return b; };
function distinctBigram(cands) { const all = []; for (const c of cands) all.push(...bigrams(words(c))); return all.length ? +(new Set(all).size / all.length).toFixed(3) : null; }
function meanJaccardDist(cands) { const W = cands.map((c) => new Set(words(c))); let s = 0, n = 0; for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) { let inter = 0; for (const x of W[i]) if (W[j].has(x)) inter++; const uni = new Set([...W[i], ...W[j]]).size; s += 1 - (uni ? inter / uni : 0); n++; } return n ? +(s / n).toFixed(3) : null; }

const acc = { S: mk(), M: mk() }; function mk() { return { vendi: 0, pd: 0, db: 0, jd: 0, n: 0, cost: 0 }; }
const perGoal = [];
for (const g of GOALS) {
  // S: Solar 9개
  const sr = await call(SOLAR, N, g, 800); const sCands = parseCands(sr.text, N);
  // M: Solar/Gemini/Kimi 각 3개 (이견 보존, 종합 없음)
  const mParts = []; let mCost = 0;
  for (const [nm, slug] of [["Solar", SOLAR], ["Gemini", GEM], ["Kimi", KIMI]]) { const r = await call(slug, 3, g, 350); mCost += r.cost; parseCands(r.text, 3).forEach((t) => mParts.push({ src: nm, text: t })); }
  const mCands = mParts.map((x) => x.text).slice(0, N);
  if (sCands.length < 4 || mCands.length < 4) { console.log(`${g.slice(0, 10)} 후보부족 S${sCands.length}/M${mCands.length}`); continue; }
  const [sE, mE] = [await embed(sCands), await embed(mCands)];
  const sM = { vendi: +vendi(sE).toFixed(3), pd: +meanPairDist(sE).toFixed(3), db: distinctBigram(sCands), jd: meanJaccardDist(sCands) };
  const mM = { vendi: +vendi(mE).toFixed(3), pd: +meanPairDist(mE).toFixed(3), db: distinctBigram(mCands), jd: meanJaccardDist(mCands) };
  for (const [k, mm, cst] of [["S", sM, sr.cost], ["M", mM, mCost]]) { acc[k].vendi += mm.vendi; acc[k].pd += mm.pd; acc[k].db += mm.db; acc[k].jd += mm.jd; acc[k].cost += cst; acc[k].n++; }
  perGoal.push({ goal: g, S: { metrics: sM, candidates: sCands }, M: { metrics: mM, candidates: mParts } });
  console.log(`${g.slice(0, 12)}  S[V${sM.vendi} 거리${sM.pd}]  M[V${mM.vendi} 거리${mM.pd}]  (S${sCands.length}/M${mCands.length}개)`);
}
const avg = (k, f) => acc[k].n ? +(acc[k][f] / acc[k].n).toFixed(3) : null;
const rows = ["S", "M"].map((k) => ({ config: k, vendi: avg(k, "vendi"), pairwiseDist: avg(k, "pd"), distinctBigram: avg(k, "db"), jaccardDist: avg(k, "jd"), costAvg: +(acc[k].cost / (acc[k].n || 1)).toFixed(6), goals: acc[k].n }));
fs.writeFileSync("benchmarks/diversity-remeasure.json", JSON.stringify({ ranAt: new Date().toISOString(), n: GOALS.length, N, note: "A축(다양성)만. Vendi/거리 높을수록 다양. D(LLM-judge) 미사용. B(사람)·C(검색) 별도.", rows, perGoal }, null, 2));
console.log(`\n=== 다양성 재측정 A축 (n=${acc.S.n}골, 후보 ${N}개 통제) ===`);
rows.forEach((r) => console.log(`${r.config === "S" ? "S 단일" : "M 다중"}  Vendi ${r.vendi}(효과적 서로다른개수/${N})  쌍거리 ${r.pairwiseDist}  distinct-bigram ${r.distinctBigram}  어휘거리 ${r.jaccardDist}`));
const S = rows[0], M = rows[1];
console.log(`\n[다양성 판정] M(다중) Vendi ${M.vendi} vs S(단일) ${S.vendi} → ${M.vendi > S.vendi ? `다중이 +${(M.vendi - S.vendi).toFixed(2)} 더 다양` : "다중 우위 없음"}`);
console.log("SAVED benchmarks/diversity-remeasure.json (원본 후보 포함 → 블라인드 채점 시트 재료)");
