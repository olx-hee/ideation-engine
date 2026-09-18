/* 새 축 측정 ③-보강 — #13 '동점' 정밀 측정
   assign 벤치에서 동점 감지율이 거의 0%로 나왔다. 여기서 두 가지를 분리해 확인한다.
     (A) 동점을 동점이라 말하는가 (tie=true)
     (B) 동점일 때 추천이 회차마다 흔들리는가 (같은 입력 · 같은 온도로 반복)
   (B)가 크면 화면에 "AI 추천"을 그대로 띄우는 순간, 새로고침마다 추천이 바뀌는 셈이 된다.
   대조군으로 '명백한' 케이스도 같이 돌려, 흔들림이 동점 상황에서만 생기는지 본다.
   실행: cd ideation-engine && node benchmarks/newaxis-tie.mjs
   결과: benchmarks/newaxis-tie.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const CANDIDATES = [
  { k: "Solar-Pro4",   slug: "upstage/solar-pro4" },
  { k: "Flash-Lite",   slug: "google/gemini-2.5-flash-lite" },
  { k: "Gemini-2.5-F", slug: "google/gemini-2.5-flash" },
  { k: "Grok-4.3",     slug: "x-ai/grok-4.3" },
];
const REPS = 6;

const SYS = `너는 팀 프로젝트의 배치 도우미다. 한 파트에 후보가 여럿이라 팀장이 고르기 쉽게 '추천'을 돕는다.

[반드시 지킬 것]
- 너는 결정권자가 아니다. 추천 1명과 그 이유 한 줄만 제시한다. 팀장이 바꿀 수 있다는 것을 전제로 한다.
- 사람은 P번호로만 가리킨다. 주어진 후보 밖의 번호를 쓰지 마라.
- 근거는 한 줄(80자 이내), 후보의 답 내용에 근거해야 한다. 성격·능력을 평가하는 말은 쓰지 마라.
- 우열을 가리기 어려우면 tie 를 true 로 하고, 근거에 비슷하다는 점을 담아라.

JSON만 출력: {"recommend":"P4","reason":"한 줄 근거","tie":false}`;

const CASES = [
  { id: "tie(동점)", cands: ["P4", "P5"], part: "발표 자료 만들기",
    answers: `P4: 지난 학기 팀 발표를 맡아서 자료를 만들고 발표까지 했어요.\nP5: 자료 조사와 슬라이드 정리를 여러 번 해봤고, 발표도 해본 적 있어요.` },
  { id: "clear(명백)", cands: ["P1", "P2"], part: "화면 만들기 — 공지 목록과 마감 알림 화면",
    answers: `P1: 이번 학기에 React로 팀 과제 사이트를 만들어 봤어요. 목록 화면과 필터를 직접 붙였어요.\nP2: React는 수업에서 배운 정도예요. CSS로 모양 잡는 건 자신 있어요.` },
];

async function call(slug, cs) {
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-NewAxis-Tie" },
      body: JSON.stringify({
        model: slug, max_tokens: 400, temperature: 0.3, response_format: { type: "json_object" }, usage: { include: true },
        messages: [{ role: "system", content: SYS }, { role: "user", content: `파트: ${cs.part}\n후보: ${cs.cands.join(", ")}\n\n[후보들의 답 (이름 없음)]\n${cs.answers}` }],
      }),
    });
    const d = await res.json();
    if (!res.ok) return { ok: false, ms: Date.now() - t0 };
    const t = (d.choices?.[0]?.message?.content || "").trim();
    const p = JSON.parse(t.match(/\{[\s\S]*\}/)[0]);
    return { ok: true, ms: Date.now() - t0, rec: p.recommend, tie: p.tie, reason: p.reason, cost: (d.usage || {}).cost || 0 };
  } catch { return { ok: false, ms: Date.now() - t0 }; }
}

const rows = [];
for (const c of CANDIDATES) {
  const row = { model: c.k, slug: c.slug, cases: {} };
  for (const cs of CASES) {
    const recs = [], ties = [], reasons = [];
    let cost = 0, fail = 0;
    for (let r = 0; r < REPS; r++) {
      const v = await call(c.slug, cs);
      if (!v.ok) { fail++; continue; }
      recs.push(v.rec); ties.push(v.tie); cost += v.cost;
      if (reasons.length < 3) reasons.push(v.reason);
    }
    const cnt = {}; recs.forEach((x) => (cnt[x] = (cnt[x] || 0) + 1));
    const top = Math.max(0, ...Object.values(cnt));
    row.cases[cs.id] = {
      n: recs.length, fail,
      // 추천 안정성 = 최빈 추천이 차지하는 비율. 100%면 늘 같은 사람, 50%면 반반으로 흔들림
      stabilityPct: recs.length ? Math.round((top / recs.length) * 100) : 0,
      distribution: cnt,
      tieTruePct: ties.length ? Math.round((ties.filter(Boolean).length / ties.length) * 100) : 0,
      costPerCall: recs.length ? +(cost / recs.length).toFixed(6) : 0,
      reasons,
    };
  }
  rows.push(row);
  const t = row.cases["tie(동점)"], cl = row.cases["clear(명백)"];
  console.log(`${c.k.padEnd(13)} 동점: 추천안정 ${String(t.stabilityPct).padStart(3)}% ${JSON.stringify(t.distribution)} tie선언 ${t.tieTruePct}%   |   명백: 추천안정 ${String(cl.stabilityPct).padStart(3)}% ${JSON.stringify(cl.distribution)}`);
}

fs.writeFileSync("benchmarks/newaxis-tie.json", JSON.stringify({
  ranAt: new Date().toISOString(), reps: REPS, temperature: 0.3,
  task: "#13 겹친 후보 추천 — 동점 처리",
  meaning: "stabilityPct=같은 입력 반복 시 최빈 추천 비율(100%=일관, 50%=반반 흔들림) / tieTruePct=동점이라고 스스로 말한 비율",
  rows,
}, null, 2));
console.log("SAVED benchmarks/newaxis-tie.json");
