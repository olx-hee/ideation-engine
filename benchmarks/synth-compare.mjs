/* 종합(reduce) 모델 비교 — Map-Reduce의 종합 콜을 싼 모델로 바꿔도 품질이 유지되나?
   같은 fanout 원안에 종합모델만 교체(Flash/Flash-Lite/GPT-4o-mini/Solar) + 단일 baseline. 블라인드 심판 2개. n=6.
   실행: cd ideation-engine && node benchmarks/synth-compare.mjs   결과: benchmarks/synth-compare.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const SINGLE = "google/gemini-2.5-flash";
const FANOUT = [
  { a: "사업성", s: "upstage/solar-pro4" }, { a: "사용자경험", s: "google/gemini-2.5-flash-lite" },
  { a: "기술", s: "openai/gpt-4o-mini" }, { a: "참신함", s: "mistralai/mistral-medium-3" },
];
const SYNTHS = [ // 종합 모델 후보 (비용순)
  { n: "MR-FlashLite", s: "google/gemini-2.5-flash-lite" },
  { n: "MR-Solar", s: "upstage/solar-pro4" },
  { n: "MR-GPT4omini", s: "openai/gpt-4o-mini" },
  { n: "MR-Flash(현재)", s: "google/gemini-2.5-flash" },
];
const JUDGES = ["z-ai/glm-4.6", "meta-llama/llama-3.3-70b-instruct"];
const GOALS = [
  "비대면 팀 회의의 효율을 높이는 서비스", "동네 소상공인의 단골 관리를 돕는 앱", "1인 가구의 식단·장보기를 돕는 서비스",
  "중고 거래의 사기를 줄이는 앱", "노인의 디지털 기기 사용을 돕는 서비스", "반려동물 산책 메이트를 연결하는 앱",
];

async function call(slug, messages, { maxTok = 600, reasoningOff = false } = {}) {
  const body = { model: slug, messages, max_tokens: maxTok, temperature: 0.7, usage: { include: true }, ...(reasoningOff ? { reasoning: { enabled: false } } : {}) };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-SynthCmp" }, body: JSON.stringify(body) });
  const d = await res.json(); if (!res.ok) throw new Error(`${slug} ${res.status}`);
  return { text: (d.choices?.[0]?.message?.content || "").trim(), cost: (d.usage || {}).cost || 0 };
}
const SYS_SYNTH = "너는 아이디어 종합 편집자다. 4개 관점에서 각각 독립 생성된 원안을 종합해 (1)중복 제거 (2)4관점 고루 커버 (3)부족 보완하여, 서로 겹치지 않는 세련된 최종 아이디어 4개로 정리한다. 각 2문장 이내 한국어.";

const acc = {}; // config → {scoreSum, scoreN, costSum, costN}
const cfgs = ["단일", ...SYNTHS.map((x) => x.n)];
for (const c of cfgs) acc[c] = { s: 0, sn: 0, c: 0, cn: 0 };

for (const g of GOALS) {
  // fanout 원안 1회 (공유)
  let fanCost = 0; const parts = [];
  for (const f of FANOUT) { const r = await call(f.s, [{ role: "system", content: `너는 아이디어 발산 워커다. '${f.a}' 관점에서만 목표에 대한 새 아이디어 하나를 2문장 이내 한국어로.` }, { role: "user", content: `목표: ${g}` }], { maxTok: 150 }); parts.push(`[${f.a}] ${r.text}`); fanCost += r.cost; await new Promise((s) => setTimeout(s, 150)); }
  const raw = parts.join("\n");
  // 단일 baseline
  const single = await call(SINGLE, [{ role: "system", content: "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 겹치지 않는 새 아이디어 하나씩, 각 2문장 이내 한국어." }, { role: "user", content: `목표: ${g}` }]);
  const items = [{ cfg: "단일", text: single.text, cost: single.cost }];
  for (const sy of SYNTHS) { const r = await call(sy.s, [{ role: "system", content: SYS_SYNTH }, { role: "user", content: `목표: ${g}\n\n[생성된 원안]\n${raw}` }]); items.push({ cfg: sy.n, text: r.text, cost: fanCost + r.cost }); await new Promise((s) => setTimeout(s, 150)); }
  // 블라인드 라벨
  const sh = items.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const labels = ["A", "B", "C", "D", "E"].slice(0, sh.length);
  const listed = sh.map((x, i) => `[${labels[i]}]\n${x.text}`).join("\n\n");
  const per = [];
  for (const j of JUDGES) {
    try { const r = await call(j, [{ role: "system", content: `아래 ${sh.length}개 아이디어 묶음을 각 1~5점(다양성·구체성·관점충실·한국어). 코드블록 없이 JSON만: {"A":n,...}` }, { role: "user", content: `목표: ${g}\n\n${listed}` }], { maxTok: 300, reasoningOff: true }); const p = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]); if (labels.every((L) => p[L] >= 1 && p[L] <= 5)) per.push(p); } catch { }
  }
  if (!per.length) { console.log(`${g.slice(0, 10)} 심판실패`); continue; }
  sh.forEach((it, i) => { const L = labels[i]; const vals = per.map((p) => Number(p[L])).filter((v) => v >= 1 && v <= 5); if (vals.length) { acc[it.cfg].s += vals.reduce((a, b) => a + b, 0) / vals.length; acc[it.cfg].sn++; } acc[it.cfg].c += it.cost; acc[it.cfg].cn++; });
  console.log(`${g.slice(0, 12)} 채점완료 (심판 ${per.length})`);
}
const rows = cfgs.map((c) => ({ config: c, quality: acc[c].sn ? +(acc[c].s / acc[c].sn).toFixed(2) : null, cost: acc[c].cn ? +(acc[c].c / acc[c].cn).toFixed(6) : null }));
fs.writeFileSync("benchmarks/synth-compare.json", JSON.stringify({ ranAt: new Date().toISOString(), single: SINGLE, fanout: FANOUT, synths: SYNTHS, n: GOALS.length, rows }, null, 2));
console.log(`\n=== 종합모델 비교 (n=${GOALS.length}) ===`);
rows.sort((a, b) => (b.quality || 0) - (a.quality || 0)).forEach((r) => console.log(`${r.config.padEnd(16)} 품질 ${r.quality}  비용 $${r.cost}`));
console.log("SAVED benchmarks/synth-compare.json");
