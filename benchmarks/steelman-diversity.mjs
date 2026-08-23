/* [steelman-M] 다중에게 마지막 기회 — 각 모델에 '발산 렌즈'를 강제해 수렴 방지.
   S(단일)는 diversity-remeasure.json 값 재사용(동일 baseline). M-steel만 새로 생성.
   렌즈: 극한제약 / 역발상·통념파괴 / 이질적결합. 각 모델 3개 = 9개(통제). A(Vendi·임베딩·어휘)만 측정.
   실행: cd ideation-engine && node benchmarks/steelman-diversity.mjs  결과: benchmarks/steelman-diversity.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const EMB = "openai/text-embedding-3-small";
const LENSES = [
  { model: "upstage/solar-pro4", lens: "극한 제약 렌즈: 예산·인력·기술이 거의 없는 극한 제약 상황에서만 가능한, 검소하고 의외인 접근만 낸다." },
  { model: "google/gemini-2.5-flash", lens: "역발상 렌즈: 이 분야의 통념·당연한 전제를 정반대로 뒤집는 반직관적 접근만 낸다." },
  { model: "moonshotai/kimi-k2.5", lens: "이질적 결합 렌즈: 전혀 무관한 분야(게임·자연생태·예술·오프라인 의식 등)의 메커니즘을 이 문제에 이식한 접근만 낸다." },
];
const prev = JSON.parse(fs.readFileSync("benchmarks/diversity-remeasure.json", "utf8"));
const GOALS = prev.perGoal.map((p) => ({ goal: p.goal, S: p.S.candidates }));

async function gen(model, lens, g) {
  const sys = `너는 아이디어 발산 전문가다. ${lens} 목표에 대해 서로 겹치지 않는 아이디어 정확히 3개를 각 1~2문장으로 "1." "2." "3." 번호를 붙여 제시하라. 흔하고 통념적인 아이디어는 금지. 설명 없이 후보만.`;
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Steelman" }, body: JSON.stringify({ model, messages: [{ role: "system", content: sys }, { role: "user", content: `목표: ${g}` }], max_tokens: 500, temperature: 0.95, usage: { include: true } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${model} ${res.status}`);
      return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 400)); }
  }
  return { text: "", cost: 0 };
}
function parse3(text) {
  const c = [];
  for (const l of text.split(/\n/).map((x) => x.trim())) { const m = l.match(/^\s*\d+[\.\)]\s*(.+)/); if (m && m[1].trim()) c.push(m[1].replace(/\*\*/g, "").trim()); }
  return c.slice(0, 3);
}
async function embed(texts) {
  const r = await fetch("https://openrouter.ai/api/v1/embeddings", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: EMB, input: texts }) });
  const d = await r.json(); if (!r.ok) throw new Error(`emb ${r.status}`); return d.data.map((x) => x.embedding);
}
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const cos = (a, b) => { const n = Math.sqrt(dot(a, a) * dot(b, b)); return n ? dot(a, b) / n : 0; };
const meanPairDist = (E) => { let s = 0, c = 0; for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) { s += 1 - cos(E[i], E[j]); c++; } return c ? s / c : 0; };
function jacobiEig(S) { const n = S.length; const a = S.map((r) => r.slice()); for (let sw = 0; sw < 60; sw++) { let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j]; if (off < 1e-13) break; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) { if (Math.abs(a[p][q]) < 1e-15) continue; const th = (a[q][q] - a[p][p]) / (2 * a[p][q]); const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)); const c = 1 / Math.sqrt(t * t + 1), s = t * c; for (let k = 0; k < n; k++) { const kp = a[k][p], kq = a[k][q]; a[k][p] = c * kp - s * kq; a[k][q] = s * kp + c * kq; } for (let k = 0; k < n; k++) { const pk = a[p][k], qk = a[q][k]; a[p][k] = c * pk - s * qk; a[q][k] = s * pk + c * qk; } } } return a.map((r, i) => r[i]); }
function vendi(E) { const n = E.length; const S = Array.from({ length: n }, () => Array(n).fill(0)); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) S[i][j] = cos(E[i], E[j]); const K = S.map((r) => r.map((v) => v / n)); const ev = jacobiEig(K).filter((x) => x > 1e-12); const sum = ev.reduce((a, b) => a + b, 0) || 1; const p = ev.map((x) => x / sum); const H = -p.reduce((a, x) => a + (x > 0 ? x * Math.log(x) : 0), 0); return Math.exp(H); }
const words = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 1);
const meanJac = (cs) => { const W = cs.map((c) => new Set(words(c))); let s = 0, n = 0; for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) { let it = 0; for (const x of W[i]) if (W[j].has(x)) it++; const u = new Set([...W[i], ...W[j]]).size; s += 1 - (u ? it / u : 0); n++; } return n ? +(s / n).toFixed(3) : null; };

const acc = { S: { v: 0, pd: 0, jd: 0, n: 0 }, M: { v: 0, pd: 0, jd: 0, n: 0, cost: 0 } };
const perGoal = [];
for (const G of GOALS) {
  const mParts = []; let mCost = 0;
  for (const { model, lens } of LENSES) { const r = await gen(model, lens, G.goal); mCost += r.cost; parse3(r.text).forEach((t) => mParts.push({ src: model.split("/")[1], text: t })); }
  const mCands = mParts.map((x) => x.text);
  // 공정: S와 M을 같은 개수로 맞춰 비교 (min)
  const K = Math.min(G.S.length, mCands.length);
  if (K < 4) { console.log(`${G.goal.slice(0, 10)} 후보부족 S${G.S.length}/M${mCands.length}`); continue; }
  const sUse = G.S.slice(0, K), mUse = mCands.slice(0, K);
  const [sE, mE] = [await embed(sUse), await embed(mUse)];
  const sM = { vendi: +vendi(sE).toFixed(3), pd: +meanPairDist(sE).toFixed(3), jd: meanJac(sUse) };
  const mM = { vendi: +vendi(mE).toFixed(3), pd: +meanPairDist(mE).toFixed(3), jd: meanJac(mUse) };
  acc.S.v += sM.vendi; acc.S.pd += sM.pd; acc.S.jd += sM.jd; acc.S.n++;
  acc.M.v += mM.vendi; acc.M.pd += mM.pd; acc.M.jd += mM.jd; acc.M.n++; acc.M.cost += mCost;
  perGoal.push({ goal: G.goal, K, S: sM, Msteel: mM, Mcandidates: mParts });
  console.log(`${G.goal.slice(0, 12)}  S[V${sM.vendi}]  M-steel[V${mM.vendi}]  (K=${K}, ${mM.vendi > sM.vendi ? "M↑" : "S↑"})`);
}
const av = (k, f) => acc[k].n ? +(acc[k][f] / acc[k].n).toFixed(3) : null;
const rows = [{ config: "S_single", vendi: av("S", "v"), pairwiseDist: av("S", "pd"), jaccardDist: av("S", "jd") }, { config: "M_steelman", vendi: av("M", "v"), pairwiseDist: av("M", "pd"), jaccardDist: av("M", "jd"), costAvg: +(acc.M.cost / (acc.M.n || 1)).toFixed(6) }];
fs.writeFileSync("benchmarks/steelman-diversity.json", JSON.stringify({ ranAt: new Date().toISOString(), n: acc.S.n, note: "M=렌즈 강제(극한제약/역발상/이질결합) 3모델. S=diversity-remeasure 재사용. 공정 위해 K=min(S,M) 개수 맞춤.", lenses: LENSES.map((l) => l.lens), rows, perGoal }, null, 2));
console.log(`\n=== steelman-M 다양성 (n=${acc.S.n}골, 개수 맞춤) ===`);
rows.forEach((r) => console.log(`${r.config.padEnd(12)} Vendi ${r.vendi}  쌍거리 ${r.pairwiseDist}  어휘거리 ${r.jaccardDist}`));
const S = rows[0], M = rows[1];
console.log(`\n[steelman 판정] M-steel Vendi ${M.vendi} vs S ${S.vendi} → ${M.vendi > S.vendi ? `★ 다중(강제분산)이 +${(M.vendi - S.vendi).toFixed(2)} 더 다양 = 규칙상 B+A 성립 가능` : "여전히 단일이 더 다양 = 다중, A에서도 최종 패"}`);
console.log("SAVED benchmarks/steelman-diversity.json");
