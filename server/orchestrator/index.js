/* 오케스트레이터 — kind를 받아 레지스트리로 티어/모델을 정하고, 어댑터를 호출하고,
   미터에 기록한다. 발산(idea)은 각도별로 다른 모델을 써 다양성을 시연한다.
   B(임의 요청 분해)는 P4 — 여기서는 고정 목업 스텁만 둔다(설계 §9 과설계 금지). */

import { ROUTING, ANGLE_MODELS, FALLBACK } from "./registry.js";
import { callModel } from "./adapter.js";
import { makeMeter } from "./meter.js";

// 세션별 미터 (P1: 인메모리). sessionId 없으면 일회성.
const meters = new Map();
function meterFor(sessionId) {
  if (!sessionId) return makeMeter();
  if (!meters.has(sessionId)) meters.set(sessionId, makeMeter());
  return meters.get(sessionId);
}

export async function orchestrate({ sessionId, kind, goal = "", context = null }) {
  const meter = meterFor(sessionId);
  const route = ROUTING[kind] || FALLBACK;

  // 발산: 각도(biz/ux/tech/novel)별로 다른 모델 호출 → "어느 모델이 어느 각도를 맡았나"
  if (route.fanout === "angles") {
    const results = [];
    for (const [angle, m] of Object.entries(ANGLE_MODELS)) {
      const r = await callModel({ model: m.model, tier: m.tier, kind, prompt: goal });
      meter.record({ purpose: "generate", kind, role: `발산·${angle}`, model: m.model, tier: m.tier, usageTokens: r.usageTokens });
      results.push({ angle, model: m.model, tier: m.tier, text: r.text });
    }
    return { kind, mode: "fanout", results, meter: meter.summary() };
  }

  // 단일 역할
  const r = await callModel({ model: route.model, tier: route.tier, kind, prompt: goal });
  meter.record({ purpose: "generate", kind, role: route.role, model: route.model, tier: route.tier, usageTokens: r.usageTokens });
  return { kind, mode: "single", role: route.role, model: route.model, tier: route.tier, text: r.text, meter: meter.summary() };
}

// 세션의 현재 비용 미터 요약만 조회 (발표 패널용)
export function sessionMeter(sessionId) {
  return meterFor(sessionId).summary();
}

// [B / P4 스텁] 임의 요청을 서브작업으로 분해 — 지금은 '고정 목업 배열'만 (엔진 미구현).
export function planStub(request = "") {
  return {
    stub: true,
    note: "실시간 난이도 분류기는 P4(경로 B). 아래는 고정 예시 분해입니다.",
    subtasks: [
      { kind: "keyword", label: "자료조사·팀원 능력 파악", tier: "small" },
      { kind: "idea", label: "아이디어 발산(각도별)", tier: "small" },
      { kind: "analyze", label: "테마 분석", tier: "flagship" },
      { kind: "report", label: "로드맵·보고서", tier: "flagship" },
    ],
  };
}
