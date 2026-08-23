/* 공급사 어댑터 — 실제 LLM 호출 자리(설계 §6).
   P2: OPENROUTER_API_KEY 가 있고 모델 슬러그가 매핑돼 있으면 OpenRouter 실호출,
       없거나 실패하면 '목업'으로 폴백한다(best-effort, 설계 §5). 이 함수만 실호출로 바뀐다.
   ⓐ 슬라이스: 우선 ice(=Nemotron-Nano)만 실 슬러그로 매핑해 실호출을 검증한다. */

import { logGeneration } from "./langfuse.js";

// 모델별 capability 자리(설계 §6) — P2에서 실제 값으로 채운다. 지금은 기본 스텁.
export const MODEL_CAPS = {
  default: { supportsJsonSchema: false, supportsTools: false, authStyle: "bearer" },
};
export const capsOf = (model) => MODEL_CAPS[model] || MODEL_CAPS.default;

/* 라벨(registry.js) → OpenRouter 실제 모델 슬러그. (2026-08-15 벤치 검증 슬러그)
   슬러그는 https://openrouter.ai/models 에서 변동 가능 — 잘못돼도 아래 try/catch가 목업으로 폴백. */
export const OPENROUTER_SLUGS = {
  "Gemini-2.5-Flash-Lite": "google/gemini-2.5-flash-lite", // keyword/ice (Light 티어, 최저가)
  "Gemini-2.5-Flash":      "google/gemini-2.5-flash",      // concept·참신 렌즈
  "GPT-4o-mini":           "openai/gpt-4o-mini",           // (안정 대안)
  "Solar-Pro4":            "upstage/solar-pro4",           // idea·analyze·concept·실용 렌즈 (국산, 가성비 1위)
  "DeepSeek-V3.2":         "deepseek/deepseek-v3.2",       // report (report-retest 1위)
  "Kimi-K2.5":             "moonshotai/kimi-k2.5",         // concept·기술 렌즈
  "Mistral-Medium-3":      "mistralai/mistral-medium-3",   // concept·이질결합 렌즈
  "GLM-4.6":               "z-ai/glm-4.6",                 // (구 analyze/report — 교체됨)
  "Llama-3.3":             "meta-llama/llama-3.3-70b-instruct", // verify(독립 검증) + FALLBACK
};

// kind별 출력 상한 — 단순작업은 낮게(비용·낭비 방지, Grok M6/max_tokens 반영)
// idea는 이제 '단일 모델이 4관점 전부' 생성 → 256→512로 상향(fanout 워커였을 때의 256은 각도 1개 기준).
// analyze/report 512→1024: heavy-analyze 벤치(테마화+인사이트+우선순위)가 512에서 잘릴 수 있어 상향(Grok M1).
const MAX_TOKENS_BY_KIND = { keyword: 64, ice: 128, idea: 512, critique: 256, revise: 512, analyze: 1024, report: 1024, synthesize: 600, concept: 500, verify: 700 };

// kind별 시스템 지시(실호출 시 역할 부여). 사용자 입력은 구분자로 격리 → 프롬프트 주입 완화(설계 §5).
const SYSTEM_BY_KIND = {
  keyword: "너는 팀 아이디어 회의의 키워드 추출기다. 목표에서 핵심 키워드 3~5개만 쉼표로 답한다.",
  ice: "너는 아이스브레이킹 진행자다. 목표와 관련해 참가자가 떠올릴 만한 짧은 발상의 씨앗을 한 문장으로 준다.",
  // idea 기본 = 단일 강모델(Solar)이 4관점 전부 생성 (rematch/confound: 단일이 이종 앙상블보다 품질·비용 우위).
  idea: "너는 아이디어 발산 전문가다. 목표에 대해 [사업성][사용자경험][기술][참신함] 4관점에서 각각 겹치지 않는 새 아이디어 하나씩, 각 2문장 이내 한국어로 제안한다.",
  // Self-Refine(품질모드) 2·3단계: 같은 강모델을 비평→수정으로 다시 돌린다(rematch 재대결 품질 1위, Grok 채택).
  critique: "너는 엄격한 아이디어 비평가다. 아래 아이디어들의 약점(진부함·모호함·관점 누락·실현성)을 관점별로 짧고 구체적으로 지적한다.",
  revise: "너는 아이디어 발산 전문가다. 아래 비평을 반영해 4관점([사업성][사용자경험][기술][참신함]) 아이디어를 더 구체적이고 참신하게 개선한다. 각 2문장 이내 한국어.",
  analyze: "너는 분석가다. 제출된 아이디어들을 3~4개 테마로 묶고 공통 구조를 짧게 요약한다.",
  report: "너는 정리 담당이다. 세션 결과를 종합한 짧은 보고서 초안을 작성한다.",
  // [컨셉 엔진] 렌즈별로 다른 모델이 풀의 아이디어 2~3개를 근거로 하나의 통합 컨셉. 합치지 않고 후보로 반환.
  concept: "너는 아이디어 종합가다. 목표와 아이디어 풀을 참고해, 주어진 렌즈 관점에서 풀의 아이디어 2~3개를 근거로 하나의 통합 제품 컨셉을 만든다. 첫 줄은 '컨셉명:'으로 짧게, 다음 줄에 2문장 이내 요약. 다른 렌즈와 겹치지 않게. 한국어.",
  // [독립 검증] 생성자와 다른 모델이 결과물의 결함을 점검(방법론적 독립).
  verify: "너는 결과물 검증가다. 아래 결과물에서 사실오류·환각(없는 걸 있다고/과장)·논리모순·중요한 누락·비현실적 주장을 찾아 번호로 지적한다. 각 지적은 '어떤 문장이 왜 문제인지'를 한 줄로. 문제 없으면 '중대한 결함 없음'.",
  // [창의(다성) 모드 전용 — 기본 idea 경로 아님] 이종 fanout→종합 구조는 confound/rematch에서 단일 대비 품질·비용 열세로 반증됨.
  synthesize: "너는 아이디어 종합 편집자다. 여러 관점에서 독립 생성된 원안을 종합해 (1)중복 제거 (2)관점을 고루 커버 (3)부족한 부분 보완하여, 서로 겹치지 않는 세련된 최종 아이디어 4개로 정리한다. 각 2문장 이내 한국어.",
};

function buildMessages(kind, prompt) {
  const system = SYSTEM_BY_KIND[kind] || "너는 팀 아이디어 회의를 돕는 조력자다. 간결하게 한국어로 답한다.";
  const user = `아래 목표에 답하라.\n<<<GOAL>>>\n${prompt || "(목표 미지정)"}\n<<<END>>>`;
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

async function callOpenRouter({ slug, kind, tier, prompt }) {
  const body = {
    model: slug,
    messages: buildMessages(kind, prompt),
    max_tokens: MAX_TOKENS_BY_KIND[kind] ?? 256,
    temperature: 0.7,
    usage: { include: true }, // OpenRouter 실비용($)을 usage.cost로 회신받음(Langfuse 실측용)
    // flagship(analyze/report)의 하이브리드 모델(GLM 등) 추론 기본 OFF — 필요 각도만 켠다(§5·벤치 9~22배).
    ...(tier === "flagship" ? { reasoning: { enabled: false } } : {}),
  };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173", // OpenRouter 랭킹용(선택)
      "X-Title": "IdeationEngine",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`); // 본문 미로깅(사용자 goal·공급사 에러 유출 방지, S4)
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  const u = data?.usage || {};
  const inTok = u.prompt_tokens ?? 0;
  const outTok = u.completion_tokens ?? 0;
  const cost = typeof u.cost === "number" ? u.cost : null; // OpenRouter 실비용($) — usage.include로 회신
  return { text, inTok, outTok, total: u.total_tokens ?? inTok + outTok, cost };
}

const MOCK_BY_KIND = {
  keyword: (m) => `[${m}] 핵심 키워드: 반복 판단·인지 부하·자동화`,
  ice: (m) => `[${m}] 최근 겪은 반복적 불편에서 아이디어의 씨앗을 찾아보세요.`,
  idea: (m) => `[${m}] 이 각도에서 떠오르는 새로운 접근을 제안합니다.`,
  analyze: (m) => `[${m}] 제출된 아이디어를 4개 테마로 묶고 공통 구조를 요약했습니다.`,
  report: (m) => `[${m}] 세션 결과를 종합한 보고서 초안입니다.`,
  concept: (m) => `컨셉명: [${m}] 통합 컨셉(목업)\n풀의 아이디어를 이 렌즈로 묶은 예시 컨셉입니다. 실호출 시 실제 컨셉이 생성됩니다.`,
  verify: (m) => `[${m}] 1. (목업) 근거 약한 단정 문장 점검 필요. 2. 누락된 리스크 항목 확인.`,
};

// kind+model 기반 결정적 해시 → 목업 usage를 재현 가능하게(발표 재현성, §8)
function stableOut(kind, model) {
  const s = `${kind}|${model}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 120 + (h % 300); // 120~419
}

export async function callModel({ model, tier, kind, prompt = "" }) {
  // 실호출 조건: 키 있음 + 이 모델의 슬러그 매핑 있음. 실패하면 목업으로 폴백.
  const slug = OPENROUTER_SLUGS[model];
  if (process.env.OPENROUTER_API_KEY && slug) {
    try {
      const r = await callOpenRouter({ slug, kind, tier, prompt });
      logGeneration({ kind, model, tier, inTok: r.inTok, outTok: r.outTok, total: r.total, cost: r.cost, prompt, output: r.text });
      return { text: r.text, model, tier, usageTokensIn: r.inTok, usageTokensOut: r.outTok, usageTokens: r.total, usageCost: r.cost, mock: false, slug };
    } catch (e) {
      console.warn(`[adapter] OpenRouter 실호출 실패(${model}→${slug}) — 목업 폴백: ${e.message}`);
    }
  }

  // ── 목업(키 없음 / 슬러그 미매핑 / 실호출 실패) ──
  const make = MOCK_BY_KIND[kind] || ((m) => `[${m}] 응답(목업)`);
  const text = make(model);
  // 입력은 길이 비례(결정적), 출력은 kind+model 해시(결정적) — 실측은 provider usage로 대체
  const inTok = Math.min(2000, 40 + Math.floor(prompt.length / 3));
  const outTok = stableOut(kind, model);
  return { text, model, tier, usageTokensIn: inTok, usageTokensOut: outTok, usageTokens: inTok + outTok, mock: true };
}
