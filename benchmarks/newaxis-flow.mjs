/* 새 축 측정 ④ 재료→아이디어→인사이트 파이프라인 — #4,#5,#6,#9,#10,#12
   지금까지(①②③) 15개 작업 중 6개(#1,#3,#7,#11,#13,#15)만 재측정했다. 나머지 8개는
   옛 4~5종 role map(키워드=Flash-Lite 등)에 묻혀서 한 번도 직접 실측되지 않았다. 이 스크립트가
   그중 6개를 채운다: #4 재료 뽑기, #5 재료 묶기, #6 아이디어 추천, #9 숨은 공통점, #10 인사이트 카드, #12 겹친 질문.

   자동으로 재는 것(작업마다 다름, 심판 LLM 없이 객관 판정):
     #4: 그라운딩(원문 밖 숫자/사실 지어내기 금지) + 개인식별정보 avoid 표시 정확도
     #5: 그룹 3~5개 + id 유효성 + 커버리지 + 클러스터 순도(심어둔 3주제 기준)
     #6: 4개 이상 + 다양성(제목 자카드) + 근거 그라운딩(본인 재료 인용) + 타인 언급(이름누출) 금지
     #9: ≤3개 + 서로 다른 묶음 규칙 + 심어둔 교차연결 탐지 여부
     #10: 한 문단(문장수 제한) + 목록 아님 + 핵심 키워드 포함
     #12: 질문 2개(선택 옵션4·서술+예시) + 예시가 주제와 무관한 상용구가 아닌지
   실행: cd ideation-engine && node benchmarks/newaxis-flow.mjs
   결과: benchmarks/newaxis-flow.json */
import "dotenv/config";
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("KEY 없음"); process.exit(1); }

const CANDIDATES = [
  { k: "Flash-Lite",    slug: "google/gemini-2.5-flash-lite" },
  { k: "Gemini-2.5-F",  slug: "google/gemini-2.5-flash" },
  { k: "Solar-Pro4",    slug: "upstage/solar-pro4" },
  { k: "DeepSeek-V3.2", slug: "deepseek/deepseek-v3.2" },
  { k: "Llama-3.3",     slug: "meta-llama/llama-3.3-70b-instruct" },
  { k: "Mistral-Med-3", slug: "mistralai/mistral-medium-3" },
];
const REPS = 2;

async function timedCall(slug, messages, maxTok = 900) {
  const t0 = Date.now();
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 40000); // 40초 타임아웃(무한 행 방지)
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: ac.signal,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-NewAxis-Flow" },
      body: JSON.stringify({ model: slug, messages, max_tokens: maxTok, temperature: 0.4, response_format: { type: "json_object" }, usage: { include: true } }),
    });
    const d = await res.json();
    const ms = Date.now() - t0;
    if (!res.ok) return { ms, ok: false, err: `${res.status} ${JSON.stringify(d.error || d).slice(0, 90)}`, text: "", cost: 0 };
    return { ms, ok: true, text: (d.choices?.[0]?.message?.content || "").trim(), finish: d.choices?.[0]?.finish_reason, cost: (d.usage || {}).cost || 0 };
  } catch (e) { return { ms: Date.now() - t0, ok: false, err: String(e).slice(0, 90) + (ac.signal.aborted ? " [TIMEOUT40s]" : ""), text: "", cost: 0 }; }
  finally { clearTimeout(to); }
}
const parseJson = (t) => { try { return JSON.parse(t.match(/\{[\s\S]*\}/)[0]); } catch { return null; } };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const pctile = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); const i = [...A].filter((x) => B.has(x)).length; return i / (A.size + B.size - i || 1); };
const words = (t) => (t || "").replace(/[^가-힣a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 1);

/* ── #4 재료 뽑기 ─────────────────────────────────────────────────────────── */
const SYS_MAT = `너는 인터뷰 답에서 회의용 "재료 문장"을 뽑는 담당이다. 답에 없는 내용을 지어내지 마라.
이름·학교·학과·나이처럼 특정 개인을 알아볼 수 있는 정보가 담긴 문장은 avoid를 true로 표시하라.
JSON만 출력: {"materials":[{"text":"...","avoid":false}]}`;
const MAT_CASES = [
  { id: "id1", identify: ["김민준", "인하대", "컴퓨터공학과"],
    answer: "저는 인하대 컴퓨터공학과 3학년 김민준이에요. 자취를 하는데 장 볼 때마다 재료가 많이 남아서 아까워요. 특히 채소가 이틀이면 시들어서 버리게 돼요. 편의점 소분 채소도 일반 마트보다 비싸서 잘 안 사요." },
];

/* ── #5 재료 묶기 (3주제를 심어둠: 시간/소통/비용) ─────────────────────────── */
const MATERIALS_POOL = [
  { id: "m1", text: "과제 마감을 자꾸 깜빡해요", theme: "시간" },
  { id: "m2", text: "시험 기간엔 시간이 부족해서 계획을 못 지켜요", theme: "시간" },
  { id: "m3", text: "알람을 맞춰도 늦게 확인해요", theme: "시간" },
  { id: "m4", text: "팀플 할 때 단톡방에 공지가 묻혀요", theme: "소통" },
  { id: "m5", text: "누가 뭘 맡았는지 헷갈릴 때가 있어요", theme: "소통" },
  { id: "m6", text: "질문했는데 답이 늦게 와서 진행이 막혀요", theme: "소통" },
  { id: "m7", text: "소분 채소가 마트보다 비싸요", theme: "비용" },
  { id: "m8", text: "구독료가 여러 개 겹쳐서 부담돼요", theme: "비용" },
  { id: "m9", text: "배달비가 아까워서 직접 가서 사요", theme: "비용" },
];
const MAT_IDS = MATERIALS_POOL.map((m) => m.id);
const SYS_GROUP = `너는 여러 사람의 재료(이름 없음)를 회의용으로 묶는 담당이다.
[반드시 지킬 것] 3~5개 그룹으로 묶어라. 주어진 id 밖의 재료를 만들어내지 마라. 모든 재료를 어딘가에 포함시켜라.
JSON만 출력: {"groups":[{"title":"...","desc":"...","aiRecommended":true,"items":["m1","m2"]}]}`;

/* ── #6 아이디어 추천 (본인 재료만) ────────────────────────────────────────── */
const SYS_REC = `너는 발산 화면의 아이디어 추천 담당이다. 이 사람의 재료·프로필만 근거로 아이디어 4개를 추천하라.
[반드시 지킬 것] 추천 이유에는 이 사람의 재료만 인용해라. 다른 사람이 있다는 것처럼 말하지 마라(이 사람 답만 봤다).
JSON만 출력: {"ideas":[{"title":"...","reason":"..."}]} (정확히 4개)`;
const REC_CASE = {
  materials: ["장 볼 때 재료가 많이 남아서 아까워요", "채소가 이틀이면 시들어요", "편의점 소분 채소가 비싸요"],
  profile: "기술(개발) 각도, React 경험 있음",
  topic: "학생 자취 생활의 불편함 해결", criteria: "실현 가능성과 재미",
};

/* ── #9 숨은 공통점 (그룹 A/C에 교차 연결을 심어둠) ────────────────────────── */
const GROUPS_FOR_9 = [
  { id: "A", title: "시간 부족", memberCount: 3 },
  { id: "B", title: "소통 단절", memberCount: 2 },
  { id: "C", title: "비용 부담", memberCount: 2 },
];
const IDEAS_FOR_9 = [
  { id: "idea1", title: "장보기 시간과 비용을 한 번에 줄여주는 소분 정기배송" }, // A(시간)+C(비용) 교차
  { id: "idea2", title: "단톡방 공지를 정리해주는 봇" },                         // B만
  { id: "idea3", title: "바쁜 시험기간용 저가 소분 식재료 구독" },               // A+C 교차(연결 강화)
  { id: "idea4", title: "팀플 역할 분담 보드" },                                 // B만
];
const SYS_HIDDEN = `너는 서로 다른 재료 묶음과 제출된 아이디어를 보고 "숨은 공통점"을 찾는 담당이다.
[반드시 지킬 것] 서로 다른 두 묶음(id가 다른)에 걸쳐 있고, 2명 이상과 관련된 것만 공통점으로 인정한다.
최대 3개까지. 근거가 약하면 만들지 말고 빈 배열로 둬라.
JSON만 출력: {"commonalities":[{"text":"...","groups":["A","C"],"candidateIdeas":["idea1","idea3"]}]}`;

/* ── #10 결과 인사이트 카드 (위 #9의 A-C 연결을 그대로 입력) ───────────────── */
const SYS_INSIGHT = `너는 투표 결과 화면의 인사이트 카드 담당이다. 1위 아이디어와, 숨은 공통점으로 연결된
아이디어를 보고 "같은 뿌리"라는 걸 알려주는 한 문단을 써라. 목록이 아니라 이어지는 문장으로, 3문장 이내.
JSON만 출력: {"text":"..."}`;
const INSIGHT_CASE = { top1: "장보기 시간과 비용을 한 번에 줄여주는 소분 정기배송", linked: "바쁜 시험기간용 저가 소분 식재료 구독", theme: "시간 부족과 비용 부담" };

/* ── #12 겹친 파트 질문 만들기 ─────────────────────────────────────────────── */
const SYS_Q = `너는 겹친 후보에게 물어볼 질문을 만드는 담당이다. 주어진 파트·주제 정보만 근거로 질문 2개를 만들어라.
[반드시 지킬 것] choice는 보기 4개짜리 선택형, write는 3줄 정도 써야 하는 서술형이고 주제에 맞춘 한 줄 예시를 함께 줘라.
JSON만 출력: {"choice":{"text":"...","options":["a","b","c","d"]},"write":{"text":"...","example":"..."}}`;
const Q_CASE = { part: "화면 만들기 — 소분 식재료 정기배송 신청 화면", topic: "학생 자취 생활의 소분 식재료 정기배송" };

const out = [];
for (const c of CANDIDATES) {
  const lat = []; let cost = 0, calls = 0, fail = 0, firstErr = null;
  const M = { n: 0, schema: 0, avoidHit: 0, avoidLeak: 0, grounded: 0 };
  const G = { n: 0, schema: 0, validIds: 0, coverage: 0, purity: [] };
  const R = { n: 0, schema: 0, count4: 0, diverse: 0, grounded: 0, nameLeak: 0 };
  const H = { n: 0, schema: 0, capOk: 0, crossGroup: 0, foundLink: 0 };
  const I = { n: 0, schema: 0, sentOk: 0, notList: 0, mentionsBoth: 0 };
  const Q = { n: 0, schema: 0, fourOpts: 0, exampleGrounded: 0 };
  const samples = [];

  for (let r = 0; r < REPS; r++) {
    // #4
    for (const cs of MAT_CASES) {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_MAT }, { role: "user", content: `인터뷰 답: ${cs.answer}` }]);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; continue; }
      lat.push(res.ms); M.n++;
      const p = parseJson(res.text);
      const ok = p && Array.isArray(p.materials) && p.materials.length >= 2 && p.materials.every((m) => typeof m.text === "string" && typeof m.avoid === "boolean");
      if (!ok) continue; M.schema++;
      const avoidItems = p.materials.filter((m) => m.avoid);
      const hit = avoidItems.some((m) => cs.identify.some((tok) => m.text.includes(tok)));
      if (hit) M.avoidHit++;
      const leak = p.materials.filter((m) => !m.avoid).some((m) => cs.identify.some((tok) => m.text.includes(tok)));
      if (leak) M.avoidLeak++;
      const nonAvoid = p.materials.filter((m) => !m.avoid);
      const grounded = nonAvoid.length > 0 && nonAvoid.every((m) => words(m.text).some((w) => cs.answer.includes(w)));
      if (grounded) M.grounded++;
      if (r === 0) samples.push({ task: "#4", n: p.materials.length, avoid: avoidItems.length, sample: p.materials.slice(0, 2).map((m) => `${m.avoid ? "[avoid]" : ""}${m.text}`) });
    }
    // #5
    {
      const listTxt = MATERIALS_POOL.map((m) => `${m.id}: ${m.text}`).join("\n");
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_GROUP }, { role: "user", content: listTxt }], 700);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; }
      else {
        lat.push(res.ms); G.n++;
        const p = parseJson(res.text);
        const ok = p && Array.isArray(p.groups) && p.groups.length >= 3 && p.groups.length <= 5
          && p.groups.every((g) => g && typeof g.title === "string" && Array.isArray(g.items));
        if (ok) {
          G.schema++;
          const allItems = p.groups.flatMap((g) => g.items);
          const validIds = allItems.every((i) => MAT_IDS.includes(i));
          if (validIds) G.validIds++;
          const covered = new Set(allItems);
          const coverage = MAT_IDS.filter((id) => covered.has(id)).length / MAT_IDS.length;
          if (coverage >= 0.8) G.coverage++;
          // 클러스터 순도: 그룹마다 다수 테마 비율의 가중평균
          let weighted = 0, total = 0;
          for (const g of p.groups) {
            const themes = g.items.map((id) => MATERIALS_POOL.find((m) => m.id === id)?.theme).filter(Boolean);
            if (!themes.length) continue;
            const cnt = {}; themes.forEach((t) => (cnt[t] = (cnt[t] || 0) + 1));
            const maj = Math.max(...Object.values(cnt));
            weighted += maj; total += themes.length;
          }
          G.purity.push(total ? weighted / total : 0);
          if (r === 0) samples.push({ task: "#5", groups: p.groups.length, coverage: +coverage.toFixed(2), titles: p.groups.map((g) => g.title) });
        }
      }
    }
    // #6
    {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_REC }, { role: "user", content: `본인 재료: ${REC_CASE.materials.join(" / ")}\n프로필: ${REC_CASE.profile}\n주제: ${REC_CASE.topic}\n심사기준: ${REC_CASE.criteria}` }], 700);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; }
      else {
        lat.push(res.ms); R.n++;
        const p = parseJson(res.text);
        const ok = p && Array.isArray(p.ideas) && p.ideas.every((i) => typeof i.title === "string" && typeof i.reason === "string");
        if (ok) {
          R.schema++;
          if (p.ideas.length >= 4) R.count4++;
          const titleWords = p.ideas.map((i) => words(i.title));
          let pairs = 0, divPairs = 0;
          for (let a = 0; a < titleWords.length; a++) for (let b = a + 1; b < titleWords.length; b++) { pairs++; if (jaccard(titleWords[a], titleWords[b]) < 0.5) divPairs++; }
          if (pairs && divPairs / pairs >= 0.7) R.diverse++;
          const grounded = p.ideas.every((i) => REC_CASE.materials.some((m) => words(i.reason).some((w) => m.includes(w) && w.length > 1)));
          if (grounded) R.grounded++;
          if (/(님|씨)\b|팀원|다른 사람/.test(p.ideas.map((i) => i.reason).join(" "))) R.nameLeak++;
          if (r === 0) samples.push({ task: "#6", n: p.ideas.length, titles: p.ideas.map((i) => i.title) });
        }
      }
    }
    // #9
    {
      const gTxt = GROUPS_FOR_9.map((g) => `${g.id}: ${g.title} (관련 인원 ${g.memberCount}명)`).join("\n");
      const iTxt = IDEAS_FOR_9.map((i) => `${i.id}: ${i.title}`).join("\n");
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_HIDDEN }, { role: "user", content: `묶음:\n${gTxt}\n\n아이디어:\n${iTxt}` }], 500);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; }
      else {
        lat.push(res.ms); H.n++;
        const p = parseJson(res.text);
        const ok = p && Array.isArray(p.commonalities);
        if (ok) {
          H.schema++;
          if (p.commonalities.length <= 3) H.capOk++;
          const cross = p.commonalities.every((x) => Array.isArray(x.groups) && new Set(x.groups).size >= 2);
          if (cross || p.commonalities.length === 0) H.crossGroup++;
          const found = p.commonalities.some((x) => Array.isArray(x.groups) && x.groups.includes("A") && x.groups.includes("C"));
          if (found) H.foundLink++;
          if (r === 0) samples.push({ task: "#9", n: p.commonalities.length, items: p.commonalities.map((x) => `${(x.groups || []).join("+")}:${(x.text || "").slice(0, 30)}`) });
        }
      }
    }
    // #10
    {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_INSIGHT }, { role: "user", content: `1위: ${INSIGHT_CASE.top1}\n연결된 아이디어: ${INSIGHT_CASE.linked}\n공통 뿌리: ${INSIGHT_CASE.theme}` }], 300);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; }
      else {
        lat.push(res.ms); I.n++;
        const p = parseJson(res.text);
        const ok = p && typeof p.text === "string" && p.text.trim().length > 15;
        if (ok) {
          I.schema++;
          const sents = (p.text.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim().length > 1)).length;
          if (sents <= 4) I.sentOk++;
          if (!/^[-*\d]/.test(p.text.trim()) && !p.text.includes("\n-")) I.notList++;
          const mentions = words(p.text);
          const hitTop = words(INSIGHT_CASE.top1).some((w) => mentions.includes(w));
          const hitLinked = words(INSIGHT_CASE.linked).some((w) => mentions.includes(w));
          if (hitTop && hitLinked) I.mentionsBoth++;
          if (r === 0) samples.push({ task: "#10", text: p.text.slice(0, 90) });
        }
      }
    }
    // #12
    {
      const res = await timedCall(c.slug, [{ role: "system", content: SYS_Q }, { role: "user", content: `파트: ${Q_CASE.part}\n주제: ${Q_CASE.topic}` }], 500);
      calls++; cost += res.cost;
      if (!res.ok) { fail++; firstErr = firstErr || res.err; }
      else {
        lat.push(res.ms); Q.n++;
        const p = parseJson(res.text);
        const ok = p && p.choice && Array.isArray(p.choice.options) && p.write && typeof p.write.example === "string";
        if (ok) {
          Q.schema++;
          if (p.choice.options.length === 4) Q.fourOpts++;
          const topicWords = words(Q_CASE.topic);
          const exWords = words(p.write.example);
          if (topicWords.some((w) => exWords.includes(w)) && p.write.example.trim().length > 5) Q.exampleGrounded++;
          if (r === 0) samples.push({ task: "#12", choice: p.choice.text, example: p.write.example });
        }
      }
    }
  }

  const row = {
    model: c.k, slug: c.slug, calls, fail, firstErr,
    p50: pctile(lat, 50), p95: pctile(lat, 95),
    costPerCall: calls ? +(cost / calls).toFixed(6) : 0,
    "#4_재료뽑기": { schemaPct: pct(M.schema, M.n), avoidHitPct: pct(M.avoidHit, M.schema), avoidLeakPct: pct(M.avoidLeak, M.schema), groundedPct: pct(M.grounded, M.schema) },
    "#5_재료묶기": { schemaPct: pct(G.schema, G.n), validIdsPct: pct(G.validIds, G.schema), coveragePct: pct(G.coverage, G.schema), purityPct: G.purity.length ? Math.round((G.purity.reduce((a, b) => a + b, 0) / G.purity.length) * 100) : 0 },
    "#6_아이디어추천": { schemaPct: pct(R.schema, R.n), count4Pct: pct(R.count4, R.schema), diversePct: pct(R.diverse, R.schema), groundedPct: pct(R.grounded, R.schema), nameLeak: R.nameLeak },
    "#9_숨은공통점": { schemaPct: pct(H.schema, H.n), capOkPct: pct(H.capOk, H.schema), crossGroupPct: pct(H.crossGroup, H.schema), foundLinkPct: pct(H.foundLink, H.schema) },
    "#10_인사이트카드": { schemaPct: pct(I.schema, I.n), sentOkPct: pct(I.sentOk, I.schema), notListPct: pct(I.notList, I.schema), mentionsBothPct: pct(I.mentionsBoth, I.schema) },
    "#12_겹친질문": { schemaPct: pct(Q.schema, Q.n), fourOptsPct: pct(Q.fourOpts, Q.schema), exampleGroundedPct: pct(Q.exampleGrounded, Q.schema) },
    samples,
  };
  out.push(row);
  console.log(`${c.k.padEnd(14)} #4 ${String(row["#4_재료뽑기"].schemaPct).padStart(3)}%/${String(row["#4_재료뽑기"].avoidHitPct).padStart(3)}%  #5 ${String(row["#5_재료묶기"].purityPct).padStart(3)}%  #6 ${String(row["#6_아이디어추천"].diversePct).padStart(3)}%  #9 ${String(row["#9_숨은공통점"].foundLinkPct).padStart(3)}%  #10 ${String(row["#10_인사이트카드"].mentionsBothPct).padStart(3)}%  #12 ${String(row["#12_겹친질문"].exampleGroundedPct).padStart(3)}%  p95 ${row.p95}ms  $${row.costPerCall}${row.fail ? `  실패${row.fail}` : ""}`);
}

fs.writeFileSync("benchmarks/newaxis-flow.json", JSON.stringify({
  ranAt: new Date().toISOString(), reps: REPS,
  tasks: ["#4 재료 뽑기", "#5 재료 묶기", "#6 아이디어 추천", "#9 숨은 공통점", "#10 인사이트 카드", "#12 겹친 파트 질문"],
  rows: out,
}, null, 2));
console.log("SAVED benchmarks/newaxis-flow.json");
