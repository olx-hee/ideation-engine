/* [컨셉 엔진 테스트] 단일 vs 다중 — 어느 쪽이 더 다양한 컨셉 후보를 뽑나(객관 지표).
   같은 아이디어 풀(diversity-remeasure의 S 후보 재사용) + 같은 4렌즈.
   A 단일: Solar × 4렌즈 → 컨셉 4개.  B 다중: [Solar,Gemini,Kimi,Mistral] × 4렌즈(모델1개당 렌즈1개) → 컨셉 4개.
   측정: Vendi(임베딩)·평균 쌍거리·비용. "후보 다양성"은 기계축이 신뢰가능(사람축 아님).
   실행: cd ideation-engine && node benchmarks/concept-engine-test.mjs  결과: benchmarks/concept-engine-test.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const SOLAR = "upstage/solar-pro4", GEM = "google/gemini-2.5-flash", KIMI = "moonshotai/kimi-k2.5", MIS = "mistralai/mistral-medium-3";
const EMB = "openai/text-embedding-3-small";
const LENSES = [
  "실용성·저비용·빠른 실행을 최우선으로 한다.",
  "참신함·시장 차별화를 최우선으로 한다.",
  "기술적 실현가능성·확장성을 최우선으로 한다.",
  "전혀 다른 분야의 메커니즘을 결합한 의외성을 최우선으로 한다.",
];
const MULTI = [SOLAR, GEM, KIMI, MIS]; // 렌즈 i ↔ 모델 i
const SYS = "너는 아이디어 종합가다. 목표와 아래 [아이디어 풀]을 참고해, 주어진 렌즈 관점에서 풀의 아이디어 2~3개를 근거로 하나의 통합 제품 컨셉을 만든다. 형식: '컨셉명 — 요약(2문장 이내)'. 다른 렌즈의 컨셉과 겹치지 않게. 한국어.";
const prev = JSON.parse(fs.readFileSync("benchmarks/diversity-remeasure.json", "utf8"));
const GOALS = prev.perGoal.map((p) => ({ goal: p.goal, pool: p.S.candidates }));

async function concept(model, lens, goal, pool) {
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-ConceptEngine" }, body: JSON.stringify({ model, messages: [{ role: "system", content: SYS + " 렌즈: " + lens }, { role: "user", content: `목표: ${goal}\n\n[아이디어 풀]\n${pool.map((x, i) => `${i + 1}. ${x}`).join("\n")}` }], max_tokens: 300, temperature: 0.85, usage: { include: true } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${model} ${res.status}`);
      return { text: (d.choices?.[0]?.message?.content || "").trim().replace(/\*\*/g, ""), cost: (d.usage || {}).cost || 0 };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 400)); }
  }
  return { text: "", cost: 0 };
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

const acc = { single: { v: 0, pd: 0, n: 0, cost: 0 }, multi: { v: 0, pd: 0, n: 0, cost: 0 } };
const perGoal = [];
for (const G of GOALS) {
  const sTexts = [], mTexts = []; let sCost = 0, mCost = 0;
  for (let i = 0; i < LENSES.length; i++) {
    const rs = await concept(SOLAR, LENSES[i], G.goal, G.pool); sTexts.push(rs.text); sCost += rs.cost;
    const rm = await concept(MULTI[i], LENSES[i], G.goal, G.pool); mTexts.push(rm.text); mCost += rm.cost;
  }
  if (sTexts.some((t) => !t) || mTexts.some((t) => !t)) { console.log(`${G.goal.slice(0, 10)} 빈 컨셉 스킵`); continue; }
  const [sE, mE] = [await embed(sTexts), await embed(mTexts)];
  const sM = { vendi: +vendi(sE).toFixed(3), pd: +meanPairDist(sE).toFixed(3) };
  const mM = { vendi: +vendi(mE).toFixed(3), pd: +meanPairDist(mE).toFixed(3) };
  acc.single.v += sM.vendi; acc.single.pd += sM.pd; acc.single.cost += sCost; acc.single.n++;
  acc.multi.v += mM.vendi; acc.multi.pd += mM.pd; acc.multi.cost += mCost; acc.multi.n++;
  perGoal.push({ goal: G.goal, single: { ...sM, concepts: sTexts }, multi: { ...mM, concepts: mTexts } });
  console.log(`${G.goal.slice(0, 12)}  단일[V${sM.vendi} d${sM.pd}]  다중[V${mM.vendi} d${mM.pd}]  ${mM.vendi > sM.vendi ? "다중↑" : "단일↑"}`);
}
const av = (k, f) => acc[k].n ? +(acc[k][f] / acc[k].n).toFixed(3) : null;
const rows = [
  { engine: "single_Solar×4렌즈", vendi: av("single", "v"), pairwiseDist: av("single", "pd"), costAvg: +(acc.single.cost / (acc.single.n || 1)).toFixed(6) },
  { engine: "multi_4모델×4렌즈", vendi: av("multi", "v"), pairwiseDist: av("multi", "pd"), costAvg: +(acc.multi.cost / (acc.multi.n || 1)).toFixed(6) },
];
fs.writeFileSync("benchmarks/concept-engine-test.json", JSON.stringify({ ranAt: new Date().toISOString(), n: acc.single.n, lenses: LENSES, models_multi: MULTI, note: "컨셉 4개(렌즈4)의 다양성. Vendi 1~4. 후보 다양성=기계축 신뢰가능(사람축 아님).", rows, perGoal }, null, 2));
console.log(`\n=== 컨셉 엔진: 단일 vs 다중 (n=${acc.single.n}골, 컨셉 4개, Vendi 1~4) ===`);
rows.forEach((r) => console.log(`${r.engine.padEnd(20)} Vendi ${r.vendi}  쌍거리 ${r.pairwiseDist}  비용/골 $${r.costAvg}`));
const s = rows[0], m = rows[1];
console.log(`\n[판정] 다중 Vendi ${m.vendi} vs 단일 ${s.vendi} → ${m.vendi > s.vendi ? `다중이 +${(m.vendi - s.vendi).toFixed(2)} 더 다양 (비용 ${(m.costAvg / (s.costAvg || 1e-9)).toFixed(1)}배)` : `단일이 대등 이상 (다중은 비용 ${(m.costAvg / (s.costAvg || 1e-9)).toFixed(1)}배만 더 씀)`}`);
console.log("SAVED benchmarks/concept-engine-test.json");
