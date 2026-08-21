/* 오케스트레이터 — kind를 받아 레지스트리로 티어/모델을 정하고, 어댑터를 호출하고,
   미터에 기록한다. 발산(idea) 기본 = 단일 강모델 1콜. quality 플래그면 Self-Refine(같은 모델 3패스).
   ('다른 모델 섞기' fanout은 품질 반증되어 기본 경로에서 제거 — 창의모드용으로 registry에만 보존)
   B(임의 요청 분해)는 P4 — 여기서는 고정 목업 스텁만 둔다(설계 §9 과설계 금지). */

import { ROUTING, IDEA_QUALITY, FALLBACK, CONCEPT_LENSES, VERIFY } from "./registry.js";
import { callModel } from "./adapter.js";
import { makeMeter } from "./meter.js";

// "컨셉명: X\n요약..." → {title, summary}. 형식이 흔들려도 첫 줄=제목, 나머지=요약으로 폴백.
function parseConcept(text = "") {
  const t = text.trim();
  const m = t.match(/컨셉명\s*[:：]\s*(.+)/);
  if (m) {
    const title = m[1].split("\n")[0].replace(/\*\*/g, "").trim();
    const summary = t.slice(t.indexOf(m[0]) + m[0].length).replace(/\*\*/g, "").trim();
    return { title: title || "컨셉", summary: summary || t };
  }
  const lines = t.split("\n").filter((l) => l.trim());
  return { title: (lines[0] || "컨셉").replace(/\*\*/g, "").slice(0, 40).trim(), summary: lines.slice(1).join(" ").trim() || t };
}

// 세션별 상태(P1: 인메모리). meter + 이미 기록한 kind(멱등) + 최근접근(LRU).
const MAX_SESSIONS = 200;
const sessions = new Map(); // sessionId → { meter, kinds:Set, ts }

// 쓰기 경로에서만 생성. 상한 초과 시 가장 오래된 것 축출(Map은 삽입순 보존).
function getOrCreate(sessionId) {
  if (!sessions.has(sessionId)) {
    if (sessions.size >= MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
    sessions.set(sessionId, { meter: makeMeter(), kinds: new Set(), last: new Map(), ts: Date.now() });
  }
  const e = sessions.get(sessionId);
  e.ts = Date.now();
  return e;
}

export async function orchestrate({ sessionId, kind, goal = "", context = null, quality = false, pool = [], content = null }) {
  // sessionId 없으면 일회성(Map에 남기지 않음)
  const entry = sessionId ? getOrCreate(sessionId) : { meter: makeMeter(), kinds: new Set(), last: new Map() };

  // 멱등(S1 이중과금 차단): 같은 세션·같은 kind(+품질모드 여부) 재호출은 '실호출 없이' 캐시 반환.
  // StrictMode·재전송으로 두 번 들어와도 callModel(=실 API·크레딧)을 다시 치지 않는다.
  const cacheKey = quality ? `${kind}#q` : kind;
  if (entry.last.has(cacheKey)) {
    return { ...entry.last.get(cacheKey), deduped: true, meter: entry.meter.summary() };
  }

  const route = ROUTING[kind] || FALLBACK;
  let result;

  // [컨셉 엔진] 창의 후보 다중 생성 — 렌즈별로 다른 모델, 자동 합치기 없이 배열 반환(팀이 투표로 선택·이견 보존).
  if (kind === "concepts") {
    const poolText = (pool || []).map((p, i) => `${i + 1}. ${typeof p === "string" ? p : (p.title || p.text || "")}`).join("\n");
    const candidates = [];
    for (const lens of CONCEPT_LENSES) {
      const p = `목표: ${goal}\n\n[아이디어 풀]\n${poolText || "(풀 비어있음)"}\n\n[렌즈] ${lens.hint}`;
      let r = await callModel({ model: lens.model, tier: "small", kind: "concept", prompt: p });
      if (!r.text || r.text.trim().length < 15) r = await callModel({ model: lens.model, tier: "small", kind: "concept", prompt: p }); // 빈응답(추론모델 잘림) 1회 재시도
      entry.meter.record({ purpose: "generate", kind, role: `컨셉·${lens.label}`, model: lens.model, tier: "small", usageTokens: r.usageTokens });
      const { title, summary } = parseConcept(r.text);
      candidates.push({ id: `c-${lens.key}`, lens: lens.key, lensLabel: lens.label, title, summary, model: lens.model });
    }
    result = { kind, mode: "concepts", candidates, deduped: false };
  }
  // [독립 검증] 생성자와 다른 모델(VERIFY)이 결과물의 결함을 점검(방법론적 독립).
  else if (kind === "verify") {
    const r = await callModel({ model: VERIFY.model, tier: VERIFY.tier, kind: "verify", prompt: `[결과물]\n${content || goal}` });
    entry.meter.record({ purpose: "verify", kind, role: VERIFY.role, model: VERIFY.model, tier: VERIFY.tier, usageTokens: r.usageTokens });
    result = { kind, mode: "verify", model: VERIFY.model, tier: VERIFY.tier, issues: r.text, deduped: false };
  }
  // 발산 품질모드: Self-Refine(초안→비평→수정) — 같은 강모델을 3패스. rematch 품질 1위, Grok 채택.
  else if (kind === "idea" && quality) {
    const q = IDEA_QUALITY;
    const draft = await callModel({ model: q.model, tier: q.tier, kind: "idea", prompt: goal });
    entry.meter.record({ purpose: "generate", kind, role: "발산·초안", model: q.model, tier: q.tier, usageTokens: draft.usageTokens });
    const crit = await callModel({ model: q.model, tier: q.tier, kind: "critique", prompt: `목표: ${goal}\n\n[초안]\n${draft.text}` });
    entry.meter.record({ purpose: "refine", kind, role: "발산·비평", model: q.model, tier: q.tier, usageTokens: crit.usageTokens });
    const rev = await callModel({ model: q.model, tier: q.tier, kind: "revise", prompt: `목표: ${goal}\n\n[초안]\n${draft.text}\n\n[비평]\n${crit.text}` });
    entry.meter.record({ purpose: "refine", kind, role: "발산·수정", model: q.model, tier: q.tier, usageTokens: rev.usageTokens });
    result = { kind, mode: "self-refine", model: q.model, tier: q.tier, text: rev.text, draft: draft.text, critique: crit.text, passes: q.passes, deduped: false };
  } else {
    // 단일 역할(기본) — idea 포함 모든 kind가 단일 모델 1콜.
    const r = await callModel({ model: route.model, tier: route.tier, kind, prompt: goal });
    entry.meter.record({ purpose: "generate", kind, role: route.role, model: route.model, tier: route.tier, usageTokens: r.usageTokens });
    result = { kind, mode: "single", role: route.role, model: route.model, tier: route.tier, text: r.text, deduped: false };
  }

  entry.kinds.add(kind);
  entry.last.set(cacheKey, result); // 다음 재호출은 이 캐시를 반환(실호출 스킵)
  return { ...result, meter: entry.meter.summary() };
}

// 읽기 전용 — 없으면 빈 요약 반환(조회만으로 Map 엔트리를 생성하지 않는다).
export function sessionMeter(sessionId) {
  const e = sessions.get(sessionId);
  return e ? e.meter.summary() : makeMeter().summary();
}

// [B / P4 스텁] 임의 요청을 서브작업으로 분해 — 지금은 '고정 목업 배열'만 (엔진 미구현).
export function planStub(request = "") {
  return {
    stub: true,
    note: "실시간 난이도 분류기는 P4(경로 B). 아래는 고정 예시 분해입니다.",
    subtasks: [
      { kind: "keyword", label: "자료조사·팀원 능력 파악", tier: "small" },
      { kind: "idea", label: "아이디어 발산", tier: "small" },
      { kind: "analyze", label: "테마 분석", tier: "small" },
      { kind: "report", label: "로드맵·보고서", tier: "flagship" },
    ],
  };
}
