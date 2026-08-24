/* 역할/티어 레지스트리 — kind(작업)마다 어느 티어·모델·역할로 보낼지 정하는 '정적 표'.
   이게 사업성① "고정 티어 표(A)"의 실체. 판단 로직 없이 결정적으로 배분.
   모델명 = 실제 사용 모델 라벨(§5 정직성: 라벨=슬러그 동시 관리). 슬러그 매핑은 adapter.js.
   2026-08-15 벤치(benchmarks/) + Grok 검수 반영:
     - 단순작업(ice/keyword)은 비추론 저가 = Gemini-2.5-Flash-Lite (한국어 3/3 안정·최저가)
     - flagship(analyze/report)은 GLM-4.6 + 추론 OFF(≈9~22배 저렴, adapter에서 reasoning off)
     - Qwen2.5-7B는 ice 한국어 불안정(1/3)으로 제외, Nemotron/Llama-3B 제외
     - 각도별 다른 모델(다양성 스토리)은 '검증된 안정 모델'로만: 잠정안, Grok 재검수 대상 */

// tier: "small"(저가·비추론) | "mid" | "flagship"(초고난도용 빈 슬롯 — 현재 활성 경로 없음)
// 실측 결과 '2단 라우팅'이 최적(Grok 1733): Light=Gemini-2.5-Flash-Lite(사소함) / Strong=Solar-Pro4(실질작업).
//   - idea 기본 = 단일 Solar 1콜 (rematch n=10·심판3: 단일 강모델이 이종 앙상블 품질·비용 우위).
//     품질이 필요하면 IDEA_QUALITY(Self-Refine)로 같은 모델을 여러 번 — '다른 모델 섞기'는 하지 않는다.
//   - analyze = Solar-Pro4 (heavy-analyze.json n=5·심판3: 평균 1위 + 현행 GLM-4.6 대비 비용 62배↓).
//   - report  = Solar-Pro4 (report-retest.json n=5·심판3: 현행 GLM 대비 품질 +0.73·비용 57배↓, 공동 최상위).
//     추론모델은 더 무거운 report에서 analyze보다 나았고(DeepSeek 근소 1위) "무거울수록 살짝 도움" 신호는 있으나,
//     그 이득(+0.03)이 4배 비용을 정당화 못 함 → 실무는 Solar. (초고난도 전용으로 DeepSeek/추론은 미래 옵션)
// [role map 확정 — 작업 성격별 측정된 최적 + 정직한 다중]
//   객관·정리 작업 = 작업별 최적 단일: keyword/ice=Flash-Lite / analyze=Solar / report=DeepSeek(report-retest 1위).
//   창의(주관) 작업 = 다중 후보(concepts) → 사람 선택 (아래 CONCEPT_LENSES).
//   검증 = 생성자와 독립 모델(verify-bench2: 독립이 자기검증 놓친 결함 더 잡음) → VERIFY.
//   → 한 세션에 Flash-Lite·Solar·Gemini·Kimi·Mistral·DeepSeek·Llama가 각자 측정된 역할. "단일과 다를게 없다" 방어.
export const ROUTING = {
  keyword: { tier: "small", model: "Gemini-2.5-Flash-Lite", role: "키워드 추출" },
  ice:     { tier: "small", model: "Gemini-2.5-Flash-Lite", role: "발산 워커" },
  idea:    { tier: "small", model: "Solar-Pro4",            role: "발산" },        // 단일 4관점 1콜(기본, 품질옵션=Self-Refine)
  analyze: { tier: "small", model: "Solar-Pro4",            role: "분석·그룹화" },  // heavy-analyze 1위
  report:  { tier: "small", model: "DeepSeek-V3.2",         role: "정리·보고" },    // report-retest 1위(진짜 다른 모델, de-Solar)
};

// [품질모드] idea에 한해 Self-Refine(초안→비평→수정)로 같은 강모델을 3패스.
// rematch 재대결 품질 1위(4.53 vs 단일 3.97), Grok 검수 채택. 기본 off, 옵션으로만 켠다.
export const IDEA_QUALITY = { tier: "small", model: "Solar-Pro4", role: "발산·정제(Self-Refine)", passes: 3 };

/* [컨셉 엔진 — 창의 후보 생성, 자동 합치기 없음] 발산 아이디어 풀 → 렌즈별로 서로 다른 모델이 하나의 통합 컨셉.
   concept-engine-test: 4모델×4렌즈 다중이 단일보다 다양(+0.12), 세션당 1회라 절대비용 무의미($0.0085).
   각 렌즈 = 다른 모델(정직한 다중) + 강제 분산(수렴 방지). 배열 반환 → 팀이 투표로 선택, 안 뽑힌 건 이견 보존. */
export const CONCEPT_LENSES = [
  { key: "practical", label: "실용·저비용", model: "Solar-Pro4",       hint: "실용성·저비용·빠른 실행을 최우선으로 한다." },
  { key: "novel",     label: "참신·차별화", model: "Gemini-2.5-Flash", hint: "참신함·시장 차별화를 최우선으로 한다." },
  { key: "technical", label: "기술 실현",   model: "Kimi-K2.5",        hint: "기술적 실현가능성·확장성을 최우선으로 한다." },
  { key: "cross",     label: "이질적 결합", model: "Mistral-Medium-3", hint: "전혀 다른 분야의 메커니즘을 결합한 의외성을 최우선으로 한다." },
];

/* [검증 — 생성자와 독립] Solar 등 생성물의 사실오류·환각·논리모순·누락을 '다른 모델'이 점검.
   verify-bench2: 독립(Llama)이 자기검증(Solar)이 놓친 유효 결함을 더 잡음(방법론적 정당). optics 아님. */
export const VERIFY = { tier: "small", model: "Llama-3.3", role: "독립 검증" };

/* [현실성 패스] 발산 아이디어를 받아 각 아이디어에 실현가능성·"왜 아직 없나"·수요를 붙이는 별도 단계.
   창의 사람축 결과 애매(공상 유도) → 발산은 자유롭게 두고, 현실성 검토는 여기서 분리(Grok 0430 검수).
   DeepSeek(추론·구조화 강함) 채택. ③왜없나·⑤수요는 'LLM 추정' → 다음 단계 시중검색(Brave)으로 실측 보강. */
export const REALITY = { tier: "small", model: "DeepSeek-V3.2", role: "현실성 검토" };

export const FALLBACK = { tier: "mid", model: "Llama-3.3", role: "일반" };

/* [창의(다성) 모드 전용 — 기본 경로 아님]
   각도별 '다른 모델' fanout + 종합(SYNTH) 구조. 품질 목적으로는 confound/rematch에서 단일 대비 열세로 반증됨
   (이종 섞기 = 품질 희석 + 고비용). 오직 '의도적 다성/창의 연출' 옵션 모드용으로만 남겨둠. */
export const ANGLE_MODELS = {
  biz:   { tier: "small", model: "Gemini-2.5-Flash-Lite" },
  ux:    { tier: "small", model: "Solar-Pro4" },
  tech:  { tier: "small", model: "GPT-4o-mini" },
  novel: { tier: "small", model: "Gemini-2.5-Flash" },
};
export const SYNTH = { tier: "small", model: "Solar-Pro4", role: "종합" };

// 라우팅 kind + 특수 kind(concepts=창의 후보 다중, verify=독립 검증). 서버 유효성 검사용.
export const ORCHESTRATOR_KINDS = [...Object.keys(ROUTING), "concepts", "verify", "reality"];
