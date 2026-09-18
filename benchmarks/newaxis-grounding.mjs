/* 새 축 측정 ② 근거 충실도 — #7 AI 검증·현실성 (화면 8-5)
   기존 벤치는 '아이디어 품질'만 쟀다. 이 작업의 실패는 품질이 아니라 '지어내기'로 온다.
   docs/05 꼭지킬것 1: "이미 있나는 검색 결과에 있는 것만 요약하고 링크를 붙인다."
   실제 스키마(assets/js/mock.js review.detail): grade go|fix|re + exists/feasibility/missingSkills/need/timeline/comments

   자동으로 재는 것 (심판 LLM 없이 객관 판정):
     1) URL 환각      — 출력에 등장한 링크가 '제공한 검색결과 링크' 밖이면 환각
     2) 링크 인용      — exists.searchUrl 이 실제 제공 링크 중 하나인가 (안 넣거나 딴 걸 넣으면 실패)
     3) 숫자 환각      — exists.summary 의 '수치+단위'가 검색 스니펫에 없으면 지어낸 통계
                         (feasibility/timeline 등은 'LLM 추정'이 허용된 칸이라 제외 — 과잉 판정 방지)
     4) 근거 방향 일치 — 스니펫이 "비슷한 게 많다"인데 "없다"고 하면(또는 반대) 검색을 안 읽은 것
     5) 스키마 준수    — grade 값 범위 + 6개 관점 키·모양
     6) 등급 일관성    — 같은 입력 3회에 같은 등급이 나오는가 (화면에 등급이 전면 노출됨)
     7) 지연·비용
   실행: cd ideation-engine && node benchmarks/newaxis-grounding.mjs
   결과: benchmarks/newaxis-grounding.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const CANDIDATES = [
  { k: "DeepSeek-V3.2", slug: "deepseek/deepseek-v3.2" },          // 현행 reality/report
  { k: "Solar-Pro4",    slug: "upstage/solar-pro4" },               // 현행 analyze/idea
  { k: "GLM-4.6",       slug: "z-ai/glm-4.6" },                     // 구 flagship
  { k: "Kimi-K2.5",     slug: "moonshotai/kimi-k2.5" },
  { k: "Gemini-2.5-F",  slug: "google/gemini-2.5-flash" },
  { k: "Grok-4.3",      slug: "x-ai/grok-4.3" },
  { k: "Nemotron-3.5L", slug: "nvidia/nemotron-3.5-lightning" },
];
const REPS = 3;

const TEAM_SKILLS = "웹 화면 2명 · 백엔드 1명 · 기획 1명 (앱 개발 0명 · 데이터 분석 0명)";
const PERIOD = "남은 기간 3주, 각자 주 10시간";

/* 스니펫에 '수치+단위'를 일부러 넣지 않는다 → exists 요약에 수치가 나오면 지어낸 것.
   direction: 근거가 가리키는 방향. 모델이 이걸 뒤집으면 검색을 안 읽은 것. */
const CASES = [
  {
    id: "crowded", direction: "many", expectGrade: ["fix", "re"],
    idea: "과제 공지와 마감을 한곳에 모아 알려주는 웹",
    snippets: [
      { t: "학사 일정·과제 마감을 모아주는 대학생용 앱 다수 출시", s: "이미 여러 대학에서 비슷한 공지 모음 서비스가 운영되고 있으며, 후발 서비스가 차별화에 어려움을 겪는다는 분석이 나왔어요.", u: "https://news.example.com/a1" },
      { t: "LMS 연동 알림 기능, 주요 학사 플랫폼에 기본 탑재", s: "주요 학사관리 플랫폼이 과제 마감 알림을 기본 기능으로 제공하기 시작했어요.", u: "https://news.example.com/a2" },
      { t: "대학 공지 크롤링의 법적·기술적 제약", s: "학교 사이트 자동 수집은 이용약관 위반 소지가 있어 수동 링크 입력 방식을 택한 사례가 많아요.", u: "https://news.example.com/a3" },
    ],
    comments: "아쉬운 점 3건: 이미 쓰는 앱이 있다 / 학교마다 공지 형식이 다르다 / 알림이 너무 많아질까 걱정. 좋은 점 2건: 한곳에 모이면 편하다 / 마감 놓치는 일이 줄겠다.",
  },
  {
    id: "empty", direction: "none", expectGrade: ["go", "fix"],
    idea: "시험기간에만 여는 열람실·카페 빈자리와 콘센트 자리를 서로 제보하는 게시판",
    snippets: [
      { t: "도서관 좌석 예약 시스템 도입 확대", s: "대학 도서관이 좌석 예약 시스템을 늘리고 있지만, 교외 카페 좌석이나 콘센트 정보는 다루지 않아요.", u: "https://news.example.com/b1" },
      { t: "시험기간 카페 혼잡 민원 증가", s: "시험기간마다 학교 주변 카페 혼잡에 대한 불만이 반복된다는 지역 보도가 있어요. 관련 정보를 모으는 서비스는 확인되지 않았어요.", u: "https://news.example.com/b2" },
      { t: "이용자 제보형 정보 서비스의 초기 참여 문제", s: "제보에 의존하는 서비스는 초기 참여자가 적으면 정보가 비어 보이는 문제가 반복돼요.", u: "https://news.example.com/b3" },
    ],
    comments: "아쉬운 점 2건: 아무도 제보를 안 하면 빈 화면이다 / 정보가 금방 낡는다. 좋은 점 3건: 시험기간엔 누구나 겪는다 / 콘센트 자리는 실제로 찾아다닌다 / 만들기 어렵지 않아 보인다.",
  },
  {
    id: "heavyskill", direction: "adjacent", expectGrade: ["fix", "re"],
    idea: "강의 녹음을 올리면 자동으로 요약해 단톡방에 보내주는 앱",
    snippets: [
      { t: "회의록 자동 요약 서비스 경쟁 심화", s: "회의 녹음을 요약해주는 서비스가 여러 곳 나와 있으나 대학 강의·팀플 맥락에 맞춘 사례는 드물다는 평가예요.", u: "https://news.example.com/c1" },
      { t: "음성 인식 한국어 정확도, 전문용어에서 한계", s: "전공 용어가 많은 강의에서는 음성 인식 오류가 늘어난다는 지적이 있어요.", u: "https://news.example.com/c2" },
      { t: "강의 녹음 저작권·동의 문제", s: "강의 녹음을 공유하려면 교수자 동의가 필요한 경우가 많아요.", u: "https://news.example.com/c3" },
    ],
    comments: "아쉬운 점 4건: 녹음 동의 문제 / 음성 인식이 부정확할 듯 / 앱 개발자가 없다 / 요약이 틀리면 더 혼란. 좋은 점 1건: 복습에 도움된다.",
  },
];

const SYS = `너는 팀 아이디어 회의의 'AI 검증·현실성' 담당이다. 아래 아이디어를 제공된 검색 결과와 팀 정보만 근거로 검토하라.

[반드시 지킬 것]
- 검색 결과에 없는 사실·수치는 쓰지 마라. "이미 있나(exists)"는 제공된 검색 결과만 근거로 요약하고, searchUrl에는 제공된 링크 중 하나를 그대로 넣어라.
- 제공되지 않은 링크를 만들어내지 마라.
- 팀원 이름은 모른다. 팀 역량은 인원 수로만 말하라.
- 등급(grade)은 go(바로 해볼 만함) / fix(보완하면 좋음) / re(다시 생각) 중 하나.

JSON만 출력:
{"grade":"go|fix|re",
 "exists":{"label":"한 줄 판정","summary":"검색 결과 근거 요약 1~2문장","searchUrl":"제공된 링크 중 하나"},
 "feasibility":{"level":"상|중|하","summary":"팀 인원 수 기준 1~2문장"},
 "missingSkills":{"count":0,"summary":"없는 스킬과 대안 1문장"},
 "need":{"level":"상|중|하","summary":"수요 추정 1문장"},
 "timeline":{"verdict":"가능|촉박|무리","summary":"기간 판단 1문장"},
 "comments":{"summary":"댓글 요점 1~2문장"}}
말투는 "~해요"체.`;

function userMsg(c) {
  return `아이디어: ${c.idea}

[검색 결과]
${c.snippets.map((s, i) => `${i + 1}. ${s.t}\n   ${s.s}\n   링크: ${s.u}`).join("\n")}

[팀 역량] ${TEAM_SKILLS}
[기간] ${PERIOD}
[익명 댓글 요약] ${c.comments}`;
}

async function timedCall(slug, messages, maxTok = 1200) {
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-NewAxis-Grounding" },
      body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: 0.3, response_format: { type: "json_object" }, usage: { include: true } }),
    });
    const d = await res.json();
    const ms = Date.now() - t0;
    if (!res.ok) return { ms, ok: false, err: `${res.status} ${JSON.stringify(d.error || d).slice(0, 90)}`, text: "", cost: 0 };
    return { ms, ok: true, text: (d.choices?.[0]?.message?.content || "").trim(), finish: d.choices?.[0]?.finish_reason, cost: (d.usage || {}).cost || 0 };
  } catch (e) { return { ms: Date.now() - t0, ok: false, err: String(e).slice(0, 90), text: "", cost: 0 }; }
}

const parseJson = (t) => { try { return JSON.parse(t.match(/\{[\s\S]*\}/)[0]); } catch { return null; } };
const GRADES = ["go", "fix", "re"];
const LV = ["상", "중", "하"];

// 스키마: 6개 관점 키 + 모양
function checkSchema(p) {
  if (!p) return false;
  const s = (o, k) => o && typeof o[k] === "string" && o[k].trim().length > 0;
  return GRADES.includes(p.grade)
    && s(p.exists, "label") && s(p.exists, "summary") && s(p.exists, "searchUrl")
    && p.feasibility && LV.includes(p.feasibility.level) && s(p.feasibility, "summary")
    && p.missingSkills && Number.isFinite(Number(p.missingSkills.count)) && s(p.missingSkills, "summary")
    && p.need && LV.includes(p.need.level) && s(p.need, "summary")
    && p.timeline && ["가능", "촉박", "무리"].includes(p.timeline.verdict) && s(p.timeline, "summary")
    && p.comments && s(p.comments, "summary");
}

// 1) URL 환각: 출력 전체의 URL이 제공 링크 집합 안에 있는가
const URL_RE = /https?:\/\/[^\s"'),]+/g;
function urlHallucinated(raw, allowed) {
  const found = raw.match(URL_RE) || [];
  return found.some((u) => !allowed.includes(u.replace(/[.,]$/, "")));
}
// 3) 숫자 환각: exists.summary 의 '수치+단위'가 스니펫에 없으면 지어낸 통계
const NUM_RE = /\d[\d,.]*\s*(%|퍼센트|억|조|만\s*명|만명|명|원|달러|배|건|개월|년)/g;
function numberHallucinated(existsSummary, snippetText) {
  const hits = existsSummary.match(NUM_RE) || [];
  return hits.filter((h) => !snippetText.includes(h.replace(/\s+/g, "")) && !snippetText.includes(h));
}
// 4) 근거 방향: 스니펫이 many/none 인데 exists 판정이 뒤집혔는가
const NONE_WORDS = /없|드물|찾지 못|확인되지 않|미비|부재|아직/;
const MANY_WORDS = /있|많|다수|여러|경쟁|포화|이미/;
function directionMismatch(label, summary, direction) {
  const t = `${label} ${summary}`;
  if (direction === "many") return NONE_WORDS.test(t) && !MANY_WORDS.test(t);
  if (direction === "none") return !NONE_WORDS.test(t) && MANY_WORDS.test(t);
  return false; // adjacent = 어느 쪽이든 허용
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const pctile = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };

const out = [];
for (const c of CANDIDATES) {
  const lat = [];
  let cost = 0, calls = 0, fail = 0, firstErr = null;
  let schemaOk = 0, urlBad = 0, linkCited = 0, numBad = 0, dirBad = 0, gradeFit = 0, n = 0;
  const gradesByCase = {};
  const findings = [];

  for (const cs of CASES) {
    const allowed = cs.snippets.map((s) => s.u);
    const snippetText = cs.snippets.map((s) => `${s.t} ${s.s}`).join(" ") + " " + TEAM_SKILLS + " " + PERIOD + " " + cs.comments + " " + cs.idea;
    gradesByCase[cs.id] = [];
    for (let r = 0; r < REPS; r++) {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS }, { role: "user", content: userMsg(cs) }]);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      lat.push(res.ms);
      const p = parseJson(res.text);
      n++;
      const ok = checkSchema(p);
      if (ok) schemaOk++;
      if (urlHallucinated(res.text, allowed)) { urlBad++; if (findings.length < 6) findings.push({ case: cs.id, kind: "URL환각", detail: (res.text.match(URL_RE) || []).filter((u) => !allowed.includes(u)).slice(0, 2).join(" ") }); }
      if (ok && allowed.includes(p.exists.searchUrl)) linkCited++;
      if (ok) {
        const nb = numberHallucinated(p.exists.summary, snippetText);
        if (nb.length) { numBad++; if (findings.length < 6) findings.push({ case: cs.id, kind: "숫자환각", detail: `${nb.join(",")} / "${p.exists.summary.slice(0, 60)}"` }); }
        if (directionMismatch(p.exists.label, p.exists.summary, cs.direction)) { dirBad++; if (findings.length < 6) findings.push({ case: cs.id, kind: "근거역방향", detail: `${p.exists.label} | ${p.exists.summary.slice(0, 55)}` }); }
        if (cs.expectGrade.includes(p.grade)) gradeFit++;
        gradesByCase[cs.id].push(p.grade);
      }
    }
  }
  // 등급 일관성: 케이스마다 3회 중 최빈값 비율의 평균
  const consist = Object.values(gradesByCase).filter((a) => a.length).map((a) => {
    const cnt = {}; a.forEach((g) => (cnt[g] = (cnt[g] || 0) + 1));
    return Math.max(...Object.values(cnt)) / a.length;
  });
  const row = {
    model: c.k, slug: c.slug, calls, fail, firstErr,
    p50: pctile(lat, 50), p95: pctile(lat, 95),
    schemaPct: pct(schemaOk, n),
    urlHallucPct: pct(urlBad, n),
    linkCitedPct: pct(linkCited, n),
    numHallucPct: pct(numBad, n),
    dirMismatchPct: pct(dirBad, n),
    gradeFitPct: pct(gradeFit, n),
    gradeConsistPct: consist.length ? Math.round((consist.reduce((a, b) => a + b, 0) / consist.length) * 100) : 0,
    gradesByCase,
    costPerCall: calls ? +(cost / calls).toFixed(6) : 0,
    findings,
  };
  out.push(row);
  console.log(`${c.k.padEnd(14)} 스키마 ${String(row.schemaPct).padStart(3)}%  URL환각 ${String(row.urlHallucPct).padStart(3)}%  링크인용 ${String(row.linkCitedPct).padStart(3)}%  숫자환각 ${String(row.numHallucPct).padStart(3)}%  근거역방향 ${String(row.dirMismatchPct).padStart(3)}%  등급타당 ${String(row.gradeFitPct).padStart(3)}%  등급일관 ${String(row.gradeConsistPct).padStart(3)}%  p95 ${row.p95}ms  $${row.costPerCall}${row.fail ? `  실패${row.fail}` : ""}`);
}

fs.writeFileSync("benchmarks/newaxis-grounding.json", JSON.stringify({
  ranAt: new Date().toISOString(), reps: REPS, task: "#7 AI 검증·현실성",
  axes: ["스키마", "URL 환각", "링크 인용", "숫자 환각(exists)", "근거 방향", "등급 타당/일관", "지연", "비용"],
  note: "검색 스니펫은 고정 합성(Brave 대체). 스니펫에 수치를 넣지 않아 exists 요약의 수치는 곧 환각.",
  cases: CASES.map((c) => ({ id: c.id, idea: c.idea, direction: c.direction, expectGrade: c.expectGrade })),
  rows: out,
}, null, 2));

console.log("\n=== #7 적합도 (스키마·URL·근거 통과자 중 등급타당 높은 순) ===");
[...out].filter((r) => r.schemaPct >= 90 && r.urlHallucPct === 0 && r.dirMismatchPct === 0)
  .sort((a, b) => b.gradeFitPct - a.gradeFitPct || a.costPerCall - b.costPerCall)
  .forEach((r) => console.log(`${r.model.padEnd(14)} 등급타당 ${r.gradeFitPct}%  등급일관 ${r.gradeConsistPct}%  링크인용 ${r.linkCitedPct}%  p95 ${r.p95}ms  $${r.costPerCall}`));
console.log("SAVED benchmarks/newaxis-grounding.json");
