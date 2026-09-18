/* 새 축 측정 ④ 보고서 — #15 보고서 만들기 (화면 9-5)
   기존 report-retest(2026-08-19)에서 DeepSeek 4.57 / Solar 4.53 로 결론이 났다. 그런데 새 스펙은
   출력이 훨씬 커졌다: "A4 2쪽 (요약 + 워크플로우 4단계 + 넘겨주기)" + 확정 배치까지 담는다.
   → 여기서는 품질 점수를 다시 매기지 않는다(이미 쟀고, 심판 LLM 재측정은 비용만 든다).
     커진 분량에서 '구조가 무너지지 않는가'만 자동으로 본다.

   자동으로 재는 것:
     1) 스키마       — 요약 3줄 / 워크플로우 정확히 4단계 / 넘겨주기(다음 할 일·리스크) / 배치
     2) 분량         — A4 2쪽에 해당하는 글자 수 범위에 드는가 (너무 짧으면 빈 보고서, 너무 길면 안 들어감)
     3) P번호 유효성 — 배치에 없는 사람을 만들어내지 않는가
     4) 입력 밖 수치 — 투표수 등 입력에 없는 수치를 지어내는가 (관찰 지표)
     5) 지연·비용
   #7/#11에서 스키마 0~56%로 반복 탈락한 GLM·Kimi·Nemotron은 제외(사유: 추론 토큰 소진).
   실행: cd ideation-engine && node benchmarks/newaxis-report.mjs
   결과: benchmarks/newaxis-report.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const CANDIDATES = [
  { k: "DeepSeek-V3.2", slug: "deepseek/deepseek-v3.2" },   // 기존 report 1위
  { k: "Solar-Pro4",    slug: "upstage/solar-pro4" },        // 기존 공동 1위·최저가
  { k: "Gemini-2.5-F",  slug: "google/gemini-2.5-flash" },
  { k: "Flash-Lite",    slug: "google/gemini-2.5-flash-lite" }, // 싼 모델로도 되나(비용)
  { k: "Grok-4.3",      slug: "x-ai/grok-4.3" },
];
const REPS = 2;
const TEAM_IDS = ["P1", "P2", "P3", "P4", "P5"];

const SYS = `너는 팀 아이디어 회의의 마무리 보고서 담당이다. 아래 회의 결과를 A4 2쪽 분량의 보고서로 정리하라.

[반드시 지킬 것]
- 주어진 내용에 없는 사실·수치를 만들어내지 마라. 투표수·댓글수는 주어진 것만 쓴다.
- 사람은 P번호로만 가리킨다. 주어진 번호 밖의 사람을 만들지 마라.
- 워크플로우는 정확히 4단계.
- 말투는 "~해요"체, 쉬운 말로.

JSON만 출력:
{"summary":["핵심 요약 1","핵심 요약 2","핵심 요약 3"],
 "workflow":[{"step":1,"name":"단계 이름","goal":"이 단계 목표","activities":"핵심 활동 2~3문장"}],
 "assignment":[{"person":"P1","part":"맡은 파트","why":"이 배치의 이유 1문장"}],
 "handoff":{"nextSteps":["바로 할 일 1","바로 할 일 2"],"risks":["리스크와 대응 1","리스크와 대응 2"]}}`;

const CASES = [
  {
    id: "notice",
    body: `[확정 주제] 과제 공지와 마감을 한곳에 모아 알려주는 웹

[투표 결과] 1위 과제 공지 모음 웹 3표 · 2위 학교 행사 소식 알림 2표 · 3위 팀플 할 일 정리 1표

[AI 검증 요약] 등급 go. 일정 관리 앱은 많지만 여러 학교 공지를 모으는 건 드물어요. 학교 사이트 자동 수집은 약관 문제가 있어 링크 붙여넣기 방식으로 대신해요. 팀에 없는 스킬은 메일·LMS 자동 연동이고, 이번 범위에서는 빼기로 했어요.

[댓글 요약] 아쉬운 점 3건(이미 쓰는 앱이 있다 / 학교마다 공지 형식이 다르다 / 알림이 너무 많아질까 걱정), 좋은 점 2건(한곳에 모이면 편하다 / 마감 놓치는 일이 줄겠다)

[숨은 공통점] 1위와 3위는 "팀플에서 누가 무엇을 했는지 한곳에 남지 않는다"는 같은 뿌리에서 나왔어요.

[확정 배치] P1 공지 목록 화면 · P2 마감 알림 화면과 스타일 · P3 서버와 DB · P4 발표 자료 · P5 학교별 공지 형식 조사

[기간] 남은 3주, 각자 주 10시간`,
  },
  {
    id: "seat",
    body: `[확정 주제] 시험기간에만 여는 열람실·카페 빈자리와 콘센트 자리 제보 게시판

[투표 결과] 1위 빈자리 제보 게시판 4표 · 2위 과제 마감 알림 2표

[AI 검증 요약] 등급 fix. 도서관 좌석 예약은 늘고 있지만 교외 카페 좌석·콘센트 정보는 다루지 않아요. 제보에 의존하는 서비스는 초기 참여가 적으면 화면이 비어 보이는 문제가 반복돼요. 팀에 없는 스킬은 모바일 앱 개발이라 웹으로 만들기로 했어요.

[댓글 요약] 아쉬운 점 2건(아무도 제보를 안 하면 빈 화면이다 / 정보가 금방 낡는다), 좋은 점 3건(시험기간엔 누구나 겪는다 / 콘센트 자리는 실제로 찾아다닌다 / 만들기 어렵지 않아 보인다)

[숨은 공통점] 두 후보 모두 "시험기간에 정보가 흩어져 시간을 버린다"에서 출발했어요.

[확정 배치] P1 제보 목록 화면 · P2 지도와 자리 표시 화면 · P3 서버와 제보 저장 · P4 발표 자료 · P5 초기 데이터 채우기와 카페 목록 조사

[기간] 남은 3주, 각자 주 10시간`,
  },
];

async function timedCall(slug, body) {
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-NewAxis-Report" },
      body: JSON.stringify({
        model: slug, max_tokens: 3000, temperature: 0.4, response_format: { type: "json_object" }, usage: { include: true },
        messages: [{ role: "system", content: SYS }, { role: "user", content: body }],
      }),
    });
    const d = await res.json();
    const ms = Date.now() - t0;
    if (!res.ok) return { ms, ok: false, err: `${res.status} ${JSON.stringify(d.error || d).slice(0, 90)}` };
    return { ms, ok: true, text: (d.choices?.[0]?.message?.content || "").trim(), finish: d.choices?.[0]?.finish_reason, cost: (d.usage || {}).cost || 0 };
  } catch (e) { return { ms: Date.now() - t0, ok: false, err: String(e).slice(0, 90) }; }
}
const parseJson = (t) => { try { return JSON.parse(t.match(/\{[\s\S]*\}/)[0]); } catch { return null; } };
const NUM_RE = /\d[\d,.]*\s*(%|퍼센트|억|조|만\s*명|만명|명|원|달러|배|건|표|시간|주|개월|년)/g;

function checkReport(p, caseBody) {
  if (!p) return { schema: false };
  const okSummary = Array.isArray(p.summary) && p.summary.length === 3 && p.summary.every((s) => typeof s === "string" && s.trim().length > 5);
  const okWf = Array.isArray(p.workflow) && p.workflow.length === 4
    && p.workflow.every((w) => w && typeof w.name === "string" && w.name.trim() && typeof w.goal === "string" && w.goal.trim() && typeof w.activities === "string" && w.activities.trim().length > 10);
  const okAssign = Array.isArray(p.assignment) && p.assignment.length >= 3
    && p.assignment.every((a) => a && typeof a.person === "string" && typeof a.part === "string" && a.part.trim());
  const okHandoff = p.handoff && Array.isArray(p.handoff.nextSteps) && p.handoff.nextSteps.length >= 2
    && Array.isArray(p.handoff.risks) && p.handoff.risks.length >= 2;
  const schema = okSummary && okWf && okAssign && okHandoff;
  const all = JSON.stringify(p);
  const chars = (all.match(/[가-힣]/g) || []).length;
  const badPerson = okAssign ? p.assignment.filter((a) => !TEAM_IDS.includes(a.person)).map((a) => a.person) : [];
  const nums = (all.match(NUM_RE) || []).map((x) => x.replace(/\s+/g, ""));
  const unsupported = [...new Set(nums.filter((x) => !caseBody.replace(/\s+/g, "").includes(x)))];
  return { schema, okSummary, okWf, okAssign, okHandoff, chars, badPerson, unsupported, wfLen: Array.isArray(p.workflow) ? p.workflow.length : 0 };
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const pctile = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };

const out = [];
for (const c of CANDIDATES) {
  const lat = [], charsArr = [], unsupAll = [];
  let cost = 0, calls = 0, fail = 0, firstErr = null, n = 0;
  let schemaOk = 0, wf4 = 0, personOk = 0, lenOk = 0, cut = 0;
  const partials = [];

  for (let r = 0; r < REPS; r++) {
    for (const cs of CASES) {
      const res = await timedCall(c.slug, cs.body);
      calls++; cost += res.cost || 0;
      if (res.finish === "length") cut++;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      lat.push(res.ms);
      const v = checkReport(parseJson(res.text), cs.body);
      n++;
      if (v.schema) schemaOk++;
      if (v.wfLen === 4) wf4++;
      if (v.badPerson && v.badPerson.length === 0) personOk++;
      if (v.chars >= 900 && v.chars <= 3200) lenOk++;   // A4 2쪽 근방(한글 글자 수)
      if (v.chars) charsArr.push(v.chars);
      if (v.unsupported?.length) unsupAll.push(...v.unsupported);
      if (!v.schema && partials.length < 3) partials.push({ case: cs.id, okSummary: v.okSummary, okWf: v.okWf, wfLen: v.wfLen, okAssign: v.okAssign, okHandoff: v.okHandoff, finish: res.finish });
    }
  }
  const row = {
    model: c.k, slug: c.slug, calls, fail, firstErr, tokenCut: cut,
    p50: pctile(lat, 50), p95: pctile(lat, 95),
    schemaPct: pct(schemaOk, n), workflow4Pct: pct(wf4, n), personValidPct: pct(personOk, n), lengthOkPct: pct(lenOk, n),
    charsAvg: charsArr.length ? Math.round(charsArr.reduce((a, b) => a + b, 0) / charsArr.length) : null,
    unsupportedNumbers: [...new Set(unsupAll)].slice(0, 8),
    costPerCall: calls ? +(cost / calls).toFixed(6) : 0,
    partials,
  };
  out.push(row);
  console.log(`${c.k.padEnd(14)} 스키마 ${String(row.schemaPct).padStart(3)}%  4단계 ${String(row.workflow4Pct).padStart(3)}%  P번호유효 ${String(row.personValidPct).padStart(3)}%  분량적정 ${String(row.lengthOkPct).padStart(3)}%(평균 ${row.charsAvg}자)  입력밖수치 ${row.unsupportedNumbers.length}종  p95 ${row.p95}ms  $${row.costPerCall}${row.tokenCut ? ` 토큰소진${row.tokenCut}` : ""}${row.fail ? ` 실패${row.fail}` : ""}`);
}

fs.writeFileSync("benchmarks/newaxis-report.json", JSON.stringify({
  ranAt: new Date().toISOString(), reps: REPS, task: "#15 보고서 만들기 (A4 2쪽)",
  note: "품질 점수는 report-retest(2026-08-19)에서 이미 측정. 여기서는 커진 분량에서의 구조 유지만 본다.",
  excluded: "GLM-4.6·Kimi-K2.5·Nemotron-3.5L — #7/#11에서 반복 스키마 실패(추론 토큰 소진)",
  rows: out,
}, null, 2));
console.log("\n=== #15 적합도 (스키마·4단계·P번호 100% 중 비용 낮은 순) ===");
[...out].filter((r) => r.schemaPct >= 95 && r.workflow4Pct >= 95 && r.personValidPct >= 95)
  .sort((a, b) => a.costPerCall - b.costPerCall)
  .forEach((r) => console.log(`${r.model.padEnd(14)} 분량 ${r.charsAvg}자  입력밖수치 ${r.unsupportedNumbers.length}종 ${JSON.stringify(r.unsupportedNumbers)}  p95 ${r.p95}ms  $${r.costPerCall}`));
console.log("SAVED benchmarks/newaxis-report.json");
