/* 새 축 측정 ③ 배치 — #11 파트 나누기 + 후보 찾기 (화면 9-1), #13 겹친 후보 (화면 9-3)
   #13은 2026-09-18 사용자 결정으로 스펙이 바뀌었다:
     기존 docs/05 = "누가 맡을지 + 비공개 근거"  →  변경 = "추천 1명 + 공개 근거 한 줄"
     (AI가 사람을 심판하지 않는다 · 팀장이 근거를 보고 고칠 수 있어야 한다)
   그래서 #13은 기존 측정이 없을 뿐 아니라 '스펙 자체가 신규'다.

   자동으로 재는 것:
     1) 스키마 준수   — parts[] 모양, effort 3종 커버, #13의 recommend/reason 모양
     2) 후보 유효성   — candidates 가 제공한 P번호 집합 안에 있는가 (사람을 만들어내면 실패)
     3) 이름 미사용   — 출력에 P번호 아닌 사람 이름꼴이 섞이는가 (익명 규칙 위반)
     4) 없는 스킬 대안 — 팀에 0명인 스킬이 필요한 파트에 대안을 제시했는가 ("후보 없음"만 던지지 않기)
     5) 근거 한 줄    — #13 reason 이 한 줄(80자 이내·줄바꿈 없음)인가
     6) 지연·비용
   실행: cd ideation-engine && node benchmarks/newaxis-assign.mjs
   결과: benchmarks/newaxis-assign.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

/* GLM은 #7에서 스키마 0%였다 — 원인을 남기기 위해 실패 원문을 캡처하며 함께 돌린다.
   Kimi는 #7에서 p95 161초로 실시간·배치 모두 탈락이라 제외(시간·비용 낭비 방지). */
const CANDIDATES = [
  { k: "Solar-Pro4",    slug: "upstage/solar-pro4" },
  { k: "DeepSeek-V3.2", slug: "deepseek/deepseek-v3.2" },
  { k: "Gemini-2.5-F",  slug: "google/gemini-2.5-flash" },
  { k: "Flash-Lite",    slug: "google/gemini-2.5-flash-lite" },   // 싼 모델로도 되는지(비용 절감 확인)
  { k: "Grok-4.3",      slug: "x-ai/grok-4.3" },
  { k: "GLM-4.6",       slug: "z-ai/glm-4.6" },
];
const REPS = 2;

/* 팀 스킬은 이름 없이 P번호 + 인원 수로만 (docs/05 꼭지킬것 2) */
const TEAM = [
  { id: "P1", skills: ["웹 화면(React)", "디자인 감각"] },
  { id: "P2", skills: ["웹 화면(React)", "CSS"] },
  { id: "P3", skills: ["백엔드(Node)", "DB"] },
  { id: "P4", skills: ["기획", "발표"] },
  { id: "P5", skills: ["기획", "자료 조사"] },
];
const TEAM_IDS = TEAM.map((t) => t.id);
const TEAM_TXT = TEAM.map((t) => `${t.id}: ${t.skills.join(" · ")}`).join("\n");

/* ── #11 파트 나누기 ─────────────────────────────────────────────────────────── */
const SYS_PARTS = `너는 팀 프로젝트의 파트 나누기 담당이다. 확정된 주제와 팀 역량을 보고 일을 파트로 나누고 후보를 찾아라.

[반드시 지킬 것]
- 팀원 이름은 모른다. 사람은 반드시 P1~P5 같은 번호로만 가리켜라.
- 주어진 번호 밖의 사람을 만들어내지 마라.
- 팀에 없는 스킬이 필요한 파트는 candidates 를 빈 배열로 두고, altIfMissing 에 "그 스킬 없이 가는 대안"을 반드시 적어라.
- effort 는 핵심 / 보통 / 작은일 중 하나이고, 세 종류가 모두 한 번 이상 나와야 한다.

JSON만 출력:
{"parts":[{"name":"파트 이름","effort":"핵심|보통|작은일","doing":"하는 일 1문장","skills":["필요 스킬"],"candidates":["P1"],"altIfMissing":"없는 스킬이면 대안, 아니면 빈 문자열"}]}
파트는 4~6개. 말투는 "~해요"체.`;
const PARTS_CASES = [
  {
    id: "web", needsMissing: false,
    topic: "과제 공지와 마감을 한곳에 모아 알려주는 웹",
    review: "등급 go. 비슷한 서비스가 있지만 여러 학교 공지를 모으는 건 드물어요. 학교 사이트 자동 수집은 약관 문제가 있어 링크 붙여넣기로 대신해요. 팀에 없는 스킬: 메일·LMS 자동 연동.",
  },
  {
    id: "app", needsMissing: true,   // 앱 개발 0명 → 대안 필수
    topic: "강의 녹음을 올리면 요약해 단톡방에 보내주는 모바일 앱",
    review: "등급 fix. 회의록 요약 서비스는 많지만 강의·팀플 맥락은 드물어요. 음성 인식 정확도와 녹음 동의가 걸림돌이에요. 팀에 없는 스킬: 모바일 앱 개발(0명), 음성 인식(0명).",
  },
];

/* ── #13 겹친 후보 → 추천 + 근거 한 줄 (사용자 결정 반영 스펙) ───────────────── */
const SYS_PICK = `너는 팀 프로젝트의 배치 도우미다. 한 파트에 후보가 여럿이라 팀장이 고르기 쉽게 '추천'을 돕는다.

[반드시 지킬 것]
- 너는 결정권자가 아니다. 추천 1명과 그 이유 한 줄만 제시한다. 팀장이 바꿀 수 있다는 것을 전제로 한다.
- 사람은 P번호로만 가리킨다. 이름을 만들어내지 마라. 주어진 후보 밖의 번호를 쓰지 마라.
- 근거는 한 줄(80자 이내, 줄바꿈 없음)이고, 후보의 답 내용에 근거해야 한다. 사람의 성격·능력을 평가하는 말은 쓰지 마라.
- 우열을 가리기 어려우면 tie 를 true 로 하고 recommend 는 그대로 한 명을 적되, 근거에 "비슷해요"를 담아라.

JSON만 출력: {"recommend":"P3","reason":"한 줄 근거","tie":false}`;
const PICK_CASES = [
  {
    id: "clear", cands: ["P1", "P2"],
    part: "화면 만들기 — 공지 목록과 마감 알림 화면",
    answers: `P1: 이번 학기에 React로 팀 과제 사이트를 만들어 봤어요. 목록 화면과 필터를 직접 붙였어요.\nP2: React는 수업에서 배운 정도예요. CSS로 모양 잡는 건 자신 있어요.`,
  },
  {
    id: "tie", cands: ["P4", "P5"],
    part: "발표 자료 만들기",
    answers: `P4: 지난 학기 팀 발표를 맡아서 자료를 만들고 발표까지 했어요.\nP5: 자료 조사와 슬라이드 정리를 여러 번 해봤고, 발표도 해본 적 있어요.`,
  },
];

async function timedCall(slug, messages, maxTok = 1400) {
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-NewAxis-Assign" },
      body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: 0.3, response_format: { type: "json_object" }, usage: { include: true } }),
    });
    const d = await res.json();
    const ms = Date.now() - t0;
    if (!res.ok) return { ms, ok: false, err: `${res.status} ${JSON.stringify(d.error || d).slice(0, 90)}`, text: "", cost: 0 };
    return { ms, ok: true, text: (d.choices?.[0]?.message?.content || "").trim(), finish: d.choices?.[0]?.finish_reason, cost: (d.usage || {}).cost || 0 };
  } catch (e) { return { ms: Date.now() - t0, ok: false, err: String(e).slice(0, 90), text: "", cost: 0 }; }
}
const parseJson = (t) => { try { return JSON.parse(t.match(/\{[\s\S]*\}/)[0]); } catch { return null; } };
const EFFORTS = ["핵심", "보통", "작은일"];
// 사람 이름꼴: 2~4자 한글 뒤에 조사/구분자 — P번호 규칙을 어겼는지 본다
const NAMEISH = /(님|씨)\b|[가-힣]{2,4}\s*(이|가|은|는)\s*(맡|담당|하면)/;

function checkParts(p, cs) {
  if (!p || !Array.isArray(p.parts) || p.parts.length < 3) return null;
  const shape = p.parts.every((x) => x && typeof x.name === "string" && x.name.trim()
    && EFFORTS.includes(x.effort) && typeof x.doing === "string" && Array.isArray(x.skills)
    && Array.isArray(x.candidates) && typeof x.altIfMissing === "string");
  if (!shape) return { schema: false };
  const covers = EFFORTS.every((e) => p.parts.some((x) => x.effort === e));
  const allCands = p.parts.flatMap((x) => x.candidates);
  const validCands = allCands.every((c) => TEAM_IDS.includes(c));
  // 팀에 없는 스킬이 필요한 케이스: candidates 비었으면 altIfMissing 이 채워져 있어야 한다
  const emptyParts = p.parts.filter((x) => x.candidates.length === 0);
  const altOk = cs.needsMissing
    ? emptyParts.length > 0 && emptyParts.every((x) => x.altIfMissing.trim().length > 3)
    : emptyParts.every((x) => x.altIfMissing.trim().length > 3);
  return { schema: true, covers, validCands, altOk, emptyCount: emptyParts.length, partCount: p.parts.length };
}
function checkPick(p, cs) {
  if (!p) return { schema: false };
  const schema = typeof p.recommend === "string" && typeof p.reason === "string" && typeof p.tie === "boolean";
  if (!schema) return { schema: false };
  return {
    schema: true,
    validCand: cs.cands.includes(p.recommend),
    oneLine: !p.reason.includes("\n") && p.reason.length <= 80 && p.reason.trim().length > 5,
    reasonLen: p.reason.length,
    tie: p.tie,
    reason: p.reason.slice(0, 70),
  };
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const pctile = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };

const out = [];
for (const c of CANDIDATES) {
  const lat = [];
  let cost = 0, calls = 0, fail = 0, firstErr = null;
  const P = { n: 0, schema: 0, covers: 0, valid: 0, alt: 0, nameLeak: 0 };
  const K = { n: 0, schema: 0, valid: 0, oneLine: 0, tieRight: 0, tieN: 0 };
  const raws = [], reasons = [];

  for (let r = 0; r < REPS; r++) {
    for (const cs of PARTS_CASES) {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_PARTS }, { role: "user", content: `확정 주제: ${cs.topic}\n\nAI 검증 결과 요약: ${cs.review}\n\n팀 역량(이름 없음):\n${TEAM_TXT}` }]);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      lat.push(res.ms);
      P.n++;
      const v = checkParts(parseJson(res.text), cs);
      if (!v || !v.schema) { if (raws.length < 3) raws.push({ task: "parts", case: cs.id, raw: res.text.slice(0, 160), finish: res.finish }); continue; }
      P.schema++;
      if (v.covers) P.covers++;
      if (v.validCands) P.valid++;
      if (v.altOk) P.alt++;
      if (NAMEISH.test(res.text)) P.nameLeak++;
    }
    for (const cs of PICK_CASES) {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_PICK }, { role: "user", content: `파트: ${cs.part}\n후보: ${cs.cands.join(", ")}\n\n[후보들의 답 (이름 없음)]\n${cs.answers}` }], 400);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      lat.push(res.ms);
      K.n++;
      const v = checkPick(parseJson(res.text), cs);
      if (!v.schema) { if (raws.length < 3) raws.push({ task: "pick", case: cs.id, raw: res.text.slice(0, 160), finish: res.finish }); continue; }
      K.schema++;
      if (v.validCand) K.valid++;
      if (v.oneLine) K.oneLine++;
      if (cs.id === "tie") { K.tieN++; if (v.tie === true) K.tieRight++; }
      if (reasons.length < 4) reasons.push({ case: cs.id, rec: v.recommend || "", tie: v.tie, len: v.reasonLen, reason: v.reason });
    }
  }

  const row = {
    model: c.k, slug: c.slug, calls, fail, firstErr,
    p50: pctile(lat, 50), p95: pctile(lat, 95),
    parts: { schemaPct: pct(P.schema, P.n), effortCoverPct: pct(P.covers, P.n), validCandPct: pct(P.valid, P.n), altForMissingPct: pct(P.alt, P.n), nameLeak: P.nameLeak },
    pick: { schemaPct: pct(K.schema, K.n), validCandPct: pct(K.valid, K.n), oneLinePct: pct(K.oneLine, K.n), tieDetectPct: pct(K.tieRight, K.tieN) },
    costPerCall: calls ? +(cost / calls).toFixed(6) : 0,
    reasons, failRaws: raws,
  };
  out.push(row);
  console.log(`${c.k.padEnd(14)} [#11] 스키마 ${String(row.parts.schemaPct).padStart(3)}% 난이도커버 ${String(row.parts.effortCoverPct).padStart(3)}% 후보유효 ${String(row.parts.validCandPct).padStart(3)}% 없는스킬대안 ${String(row.parts.altForMissingPct).padStart(3)}% 이름누출 ${row.parts.nameLeak}  [#13] 스키마 ${String(row.pick.schemaPct).padStart(3)}% 후보유효 ${String(row.pick.validCandPct).padStart(3)}% 한줄 ${String(row.pick.oneLinePct).padStart(3)}% 동점감지 ${String(row.pick.tieDetectPct).padStart(3)}%  p95 ${row.p95}ms $${row.costPerCall}${row.fail ? ` 실패${row.fail}` : ""}`);
}

fs.writeFileSync("benchmarks/newaxis-assign.json", JSON.stringify({
  ranAt: new Date().toISOString(), reps: REPS,
  tasks: ["#11 파트 나누기+후보", "#13 겹친 후보 추천+근거 한 줄(2026-09-18 스펙 변경)"],
  spec13: "AI는 결정하지 않는다 — 추천 1명 + 공개 근거 한 줄 + 동점이면 tie",
  team: TEAM, rows: out,
}, null, 2));

console.log("\n=== 배치 작업 적합도 (#11 스키마·후보유효 90%↑ & #13 한줄 90%↑) ===");
[...out].filter((r) => r.parts.schemaPct >= 90 && r.parts.validCandPct >= 90 && r.pick.oneLinePct >= 90)
  .sort((a, b) => (b.parts.altForMissingPct - a.parts.altForMissingPct) || (a.costPerCall - b.costPerCall))
  .forEach((r) => console.log(`${r.model.padEnd(14)} 없는스킬대안 ${r.parts.altForMissingPct}%  동점감지 ${r.pick.tieDetectPct}%  p95 ${r.p95}ms  $${r.costPerCall}`));
console.log("SAVED benchmarks/newaxis-assign.json");
