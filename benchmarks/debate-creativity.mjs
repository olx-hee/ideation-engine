/* 토론이 창의성을 깎는가 + 단일토론 vs 다중토론 차이 검증.
   A 단일 Solar(토론없음) / B 단일 Solar 자기토론(초안→자기논쟁→합의) / C 다중 LLM 토론(Solar+Gemini+Kimi 제안→상호반박·수정→합의).
   측정: 창의성점수(참신·의외·독창, 심판3 블라인드) + 품질점수(트레이드오프) + 객관 어휘다양성(수렴하면↓) + 토큰·비용.
   실행: cd ideation-engine && node benchmarks/debate-creativity.mjs   결과: benchmarks/debate-creativity.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const SOLAR = "upstage/solar-pro4", GEM = "google/gemini-2.5-flash", KIMI = "moonshotai/kimi-k2.5";
const JUDGES = ["openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct", "mistralai/mistral-medium-3"];
const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스",
  "중고 거래의 사기를 줄이는 앱", "노인의 디지털 기기 사용을 돕는 서비스", "지역 축제 참여를 늘리는 플랫폼",
  "프리랜서의 계약·정산을 돕는 서비스",
];
const SYS = "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 겹치지 않는 새 아이디어 하나씩, 각 2문장 이내 한국어.";

async function call(slug, messages, { maxTok = 700, temp = 0.85 } = {}) {
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Debate" }, body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: temp, usage: { include: true } }) });
      const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status} ${JSON.stringify(d).slice(0, 90)}`);
      const text = (d.choices?.[0]?.message?.content || "").trim(); const u = d.usage || {};
      if (!text && a === 0) { maxTok += 800; continue; }
      return { text, cost: u.cost || 0, tok: u.total_tokens || 0 };
    } catch (e) { if (a === 1) throw e; await new Promise((s) => setTimeout(s, 400)); }
  }
  return { text: "", cost: 0, tok: 0 };
}
const gen = (slug, g) => call(slug, [{ role: "system", content: SYS }, { role: "user", content: `목표: ${g}` }]);

async function A_single(g) { const r = await gen(SOLAR, g); return { text: r.text, cost: r.cost, tok: r.tok }; }

async function B_selfdebate(g) { // 같은 모델로 초안→자기논쟁→합의(수렴)
  const d = await gen(SOLAR, g);
  const deb = await call(SOLAR, [{ role: "system", content: "너는 방금 낸 아이디어를 스스로 토론한다. 서로 상충하거나 약한 안을 짚고, 어느 방향이 더 나은지 근거로 논쟁하라." }, { role: "user", content: `목표: ${g}\n\n[내 초안]\n${d.text}` }]);
  const con = await call(SOLAR, [{ role: "system", content: SYS + " 위 토론을 반영해 논쟁 끝에 합의된 최종 4관점 아이디어로 정리하라." }, { role: "user", content: `목표: ${g}\n\n[초안]\n${d.text}\n\n[토론]\n${deb.text}` }]);
  return { text: con.text, cost: d.cost + deb.cost + con.cost, tok: d.tok + deb.tok + con.tok };
}

async function C_multidebate(g) { // 3모델 제안→상호반박·수정→합의(수렴)
  let cost = 0, tok = 0;
  const parts = [["Solar", SOLAR], ["Gemini", GEM], ["Kimi", KIMI]];
  const props = {};
  for (const [nm, slug] of parts) { const r = await gen(slug, g); props[nm] = r.text; cost += r.cost; tok += r.tok; }
  const revised = {};
  for (const [nm, slug] of parts) {
    const others = parts.filter((p) => p[0] !== nm).map(([o]) => `### ${o}의 안\n${props[o]}`).join("\n\n");
    const r = await call(slug, [{ role: "system", content: SYS + " 다른 참가자들의 안을 보고 토론하듯 네 안을 방어·보완해 더 나은 4관점 안으로 갱신하라." }, { role: "user", content: `목표: ${g}\n\n[내 안]\n${props[nm]}\n\n[다른 참가자]\n${others}` }]);
    revised[nm] = r.text; cost += r.cost; tok += r.tok;
  }
  const mod = await call(SOLAR, [{ role: "system", content: "너는 토론 사회자다. 세 참가자가 반박·수정을 거친 안들을 종합해, 논쟁 끝에 합의된 최종 4관점([사업성][사용자경험][기술][참신함]) 아이디어로 정리하라. 각 2문장 이내 한국어." }, { role: "user", content: `목표: ${g}\n\n${parts.map(([nm]) => `### ${nm}\n${revised[nm]}`).join("\n\n")}` }]);
  cost += mod.cost; tok += mod.tok;
  return { text: mod.text, cost, tok };
}

// ── 객관 어휘 지표 ──
const words = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 1);
const jac = (a, b) => { const A = new Set(a), B = new Set(b); let inter = 0; for (const x of A) if (B.has(x)) inter++; const uni = new Set([...A, ...B]).size; return uni ? inter / uni : 0; };
const unitsOf = (t) => t.split(/\n+/).map((l) => l.trim()).filter((l) => words(l).length >= 4);
function divWithin(t) { const u = unitsOf(t).map(words); if (u.length < 2) return null; let s = 0, n = 0; for (let i = 0; i < u.length; i++) for (let j = i + 1; j < u.length; j++) { s += jac(u[i], u[j]); n++; } return n ? +(1 - s / n).toFixed(3) : null; } // 높을수록 내부 다양(수렴하면↓)
function richness(t) { const w = words(t); return w.length ? +(new Set(w).size / w.length).toFixed(3) : null; } // 어휘 풍부도

const CFG = [["A_single", A_single], ["B_selfdebate", B_selfdebate], ["C_multidebate", C_multidebate]];
const L = ["A", "B", "C"];
async function judgeOne(slug, g, items) {
  for (let a = 0; a < 2; a++) {
    try {
      const listed = items.map((t, i) => `[${L[i]}]\n${t}`).join("\n\n");
      const r = await call(slug, [{ role: "system", content: `아래 3개 아이디어 묶음을 두 축으로 각 1~5점: c=창의성(참신·의외·독창), q=품질(구체·관점충실·실행). 설명·코드블록 금지. JSON만: {"A":{"c":n,"q":n},"B":{"c":n,"q":n},"C":{"c":n,"q":n}}` }, { role: "user", content: `목표: ${g}\n\n${listed}` }], { maxTok: 160, temp: 0.2 });
      const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]);
      if (L.every((l) => p[l] && p[l].c >= 1 && p[l].c <= 5 && p[l].q >= 1 && p[l].q <= 5)) return p;
    } catch { } await new Promise((s) => setTimeout(s, 350));
  }
  return null;
}

const acc = {}; for (const [k] of CFG) acc[k] = { c: 0, q: 0, n: 0, cost: 0, tok: 0, div: 0, rich: 0, mn: 0 };
const perGoal = [];
for (const g of GOALS) {
  const outs = {};
  for (const [k, fn] of CFG) { try { outs[k] = await fn(g); } catch (e) { outs[k] = { text: "", cost: 0, tok: 0 }; console.log(`  ${k} 실패: ${String(e).slice(0, 70)}`); } acc[k].cost += outs[k].cost; acc[k].tok += outs[k].tok; const dv = divWithin(outs[k].text), ri = richness(outs[k].text); if (dv != null) { acc[k].div += dv; acc[k].rich += ri; acc[k].mn++; } }
  const keys = CFG.map(([k]) => k).filter((k) => outs[k].text);
  if (keys.length < 2) { console.log(`${g.slice(0, 10)} 생성부족`); continue; }
  const sh = keys.map((k) => ({ k, text: outs[k].text })).map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const judged = [];
  for (const j of JUDGES) { const p = await judgeOne(j, g, sh.map((x) => x.text)); if (p) judged.push(p); }
  if (!judged.length) { console.log(`${g.slice(0, 10)} 심판실패`); continue; }
  const gs = {};
  sh.forEach((it, i) => { const cs = judged.map((p) => Number(p[L[i]].c)), qs = judged.map((p) => Number(p[L[i]].q)); const cAvg = cs.reduce((a, b) => a + b, 0) / cs.length, qAvg = qs.reduce((a, b) => a + b, 0) / qs.length; acc[it.k].c += cAvg; acc[it.k].q += qAvg; acc[it.k].n++; gs[it.k] = { c: +cAvg.toFixed(2), q: +qAvg.toFixed(2) }; });
  perGoal.push({ goal: g, judges: judged.length, scores: gs });
  console.log(`${g.slice(0, 12)} 심판${judged.length}  ${keys.map((k) => `${k.split("_")[0]}[창${gs[k]?.c} 질${gs[k]?.q}]`).join(" ")}`);
}
const avg = (k, f) => acc[k].n ? +(acc[k][f] / acc[k].n).toFixed(3) : null;
const mavg = (k, f) => acc[k].mn ? +(acc[k][f] / acc[k].mn).toFixed(3) : null;
const rows = CFG.map(([k]) => ({ config: k, creativity: avg(k, "c"), quality: avg(k, "q"), divWithin: mavg(k, "div"), richness: mavg(k, "rich"), tokAvg: Math.round(acc[k].tok / GOALS.length), costAvg: +(acc[k].cost / GOALS.length).toFixed(6) }));
fs.writeFileSync("benchmarks/debate-creativity.json", JSON.stringify({ ranAt: new Date().toISOString(), n: GOALS.length, judges: JUDGES, note: "divWithin↑=내부 다양(수렴하면↓), richness↑=어휘풍부", rows, perGoal }, null, 2));
console.log(`\n=== 토론 vs 창의성 (n=${GOALS.length}, 심판3) ===`);
rows.forEach((r) => console.log(`${r.config.padEnd(15)} 창의 ${r.creativity}  품질 ${r.quality}  내부다양 ${r.divWithin}  어휘풍부 ${r.richness}  토큰 ${r.tokAvg}  $${r.costAvg}`));
const A = rows.find((r) => r.config === "A_single"), B = rows.find((r) => r.config === "B_selfdebate"), C = rows.find((r) => r.config === "C_multidebate");
console.log(`\n[토론이 창의성 깎나?] 무토론 창의 ${A.creativity} vs 자기토론 ${B.creativity} vs 다중토론 ${C.creativity} · 내부다양 ${A.divWithin}/${B.divWithin}/${C.divWithin}`);
console.log(`[단일 vs 다중 토론 차이] 창의 ${B.creativity}→${C.creativity} · 품질 ${B.quality}→${C.quality} · 토큰 ${B.tokAvg}→${C.tokAvg}(${(C.tokAvg / B.tokAvg).toFixed(1)}배) · 비용 $${B.costAvg}→$${C.costAvg}(${(C.costAvg / (B.costAvg || 1e-9)).toFixed(1)}배)`);
console.log("SAVED benchmarks/debate-creativity.json");
