/* 교란 제거 — MR-Solar 우위가 "구조" 덕인가 "Solar 강함" 덕인가?
   A 단일Solar(4관점 혼자) / B MR-Solar(fanout에 Solar 포함=교란) / C MR-Solar(fanout에서 Solar 제외=깨끗한 구조).
   블라인드 심판 2개(GLM+Llama). n=8.
   해석: C>A면 구조가 진짜 이득 / A≈C면 그냥 Solar / B>C면 fanout Solar 이중노출이 부풀림.
   실행: cd ideation-engine && node benchmarks/confound.mjs   결과: benchmarks/confound.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }
const SOLAR = "upstage/solar-pro4";
const FAN_B = [{ a: "사업성", s: "upstage/solar-pro4" }, { a: "사용자경험", s: "google/gemini-2.5-flash-lite" }, { a: "기술", s: "openai/gpt-4o-mini" }, { a: "참신함", s: "mistralai/mistral-medium-3" }];
const FAN_C = [{ a: "사업성", s: "google/gemini-2.5-flash" }, { a: "사용자경험", s: "google/gemini-2.5-flash-lite" }, { a: "기술", s: "openai/gpt-4o-mini" }, { a: "참신함", s: "mistralai/mistral-medium-3" }]; // Solar 제외(biz→Gemini-Flash)
const JUDGES = ["z-ai/glm-4.6", "meta-llama/llama-3.3-70b-instruct"];
const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스",
  "중고 거래의 사기를 줄이는 앱", "노인의 디지털 기기 사용을 돕는 서비스", "반려동물 산책 메이트를 연결하는 앱",
  "지역 축제 참여를 늘리는 플랫폼", "학원 강사의 학부모 소통을 돕는 도구",
];
async function call(slug, messages, { maxTok = 600 } = {}) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-Confound" }, body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: 0.7, usage: { include: true } }) });
  const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status}`);
  return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
}
const SYS_SYNTH = "너는 아이디어 종합 편집자다. 4개 관점 원안을 종합해 중복 제거·4관점 커버·부족 보완하여 서로 겹치지 않는 최종 아이디어 4개로 정리한다. 각 2문장 이내 한국어.";
async function fanSynth(fan, g) {
  let cost = 0; const parts = [];
  for (const f of fan) { const r = await call(f.s, [{ role: "system", content: `너는 아이디어 발산 워커다. '${f.a}' 관점에서만 목표에 대한 새 아이디어 하나를 2문장 이내 한국어로.` }, { role: "user", content: `목표: ${g}` }], { maxTok: 150 }); parts.push(`[${f.a}] ${r.text}`); cost += r.cost; await new Promise((s) => setTimeout(s, 130)); }
  const sr = await call(SOLAR, [{ role: "system", content: SYS_SYNTH }, { role: "user", content: `목표: ${g}\n\n[생성된 원안]\n${parts.join("\n")}` }]);
  return { text: sr.text, cost: cost + sr.cost };
}
const acc = { A: { s: 0, n: 0, c: 0 }, B: { s: 0, n: 0, c: 0 }, C: { s: 0, n: 0, c: 0 } };
for (const g of GOALS) {
  const a = await call(SOLAR, [{ role: "system", content: "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 겹치지 않는 새 아이디어 하나씩, 각 2문장 이내 한국어." }, { role: "user", content: `목표: ${g}` }]);
  const b = await fanSynth(FAN_B, g); const c = await fanSynth(FAN_C, g);
  const items = [{ k: "A", text: a.text, cost: a.cost }, { k: "B", text: b.text, cost: b.cost }, { k: "C", text: c.text, cost: c.cost }];
  const sh = items.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const L = ["X", "Y", "Z"]; const listed = sh.map((x, i) => `[${L[i]}]\n${x.text}`).join("\n\n");
  const per = [];
  for (const j of JUDGES) { try { const r = await call(j, [{ role: "system", content: "세 아이디어 묶음을 각 1~5점(다양성·구체성·관점충실·한국어). 코드블록 없이 JSON만: {\"X\":n,\"Y\":n,\"Z\":n}" }, { role: "user", content: `목표: ${g}\n\n${listed}` }], { maxTok: 200 }); const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]); if (L.every((l) => p[l] >= 1 && p[l] <= 5)) per.push(p); } catch { } }
  if (!per.length) { console.log(`${g.slice(0, 10)} 심판실패`); continue; }
  sh.forEach((it, i) => { const vals = per.map((p) => Number(p[L[i]])).filter((v) => v >= 1 && v <= 5); if (vals.length) { acc[it.k].s += vals.reduce((x, y) => x + y, 0) / vals.length; acc[it.k].n++; } acc[it.k].c += it.cost; });
  console.log(`${g.slice(0, 12)} 채점 (심판 ${per.length})`);
}
const q = (k) => acc[k].n ? +(acc[k].s / acc[k].n).toFixed(2) : null;
const co = (k) => +(acc[k].c / GOALS.length).toFixed(6);
fs.writeFileSync("benchmarks/confound.json", JSON.stringify({ ranAt: new Date().toISOString(), n: GOALS.length, A: { q: q("A"), cost: co("A") }, B: { q: q("B"), cost: co("B") }, C: { q: q("C"), cost: co("C") } }, null, 2));
console.log(`\n=== 교란 제거 (n=${GOALS.length}) ===`);
console.log(`A 단일Solar              품질 ${q("A")}  비용 $${co("A")}`);
console.log(`B MR-Solar(fanout에 Solar) 품질 ${q("B")}  비용 $${co("B")}`);
console.log(`C MR-Solar(fanout서 Solar빼) 품질 ${q("C")}  비용 $${co("C")}`);
console.log(`\n해석: C>A → 구조가 진짜 이득 / A≈C → 그냥 Solar / B>C → fanout Solar가 부풀림`);
console.log("SAVED benchmarks/confound.json");
