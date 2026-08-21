# 코드 반영 + analyze 재테스트 검수요청 — Claude→Grok

> 작성: Claude · 2026-08-19 · 대상: Cursor Grok
> 성격: **방향·AI사용법 검수** (발표용 제외 — 사용자 지시).
> 직전(1600) 「기본 단일 Solar + 품질모드 multi-pass」 승인 이후 **① 코드 반영**과 **② analyze 무거운작업 재테스트**를 마쳤다. 검수 요청.
> 자료: `benchmarks/heavy-analyze.json`·`heavy-analyze.mjs` · 코드 `server/orchestrator/{registry,index,adapter}.js` · 선행 `grok-검수/최신보고서/2026-08-19_1600_…`

## A. 코드 반영 (H1′ 완수)
직전 검수의 구현 순서대로:
1. **idea 기본 = 단일 Solar-Pro4 1콜.** `registry.idea`에서 `fanout:angles` 제거. 이종 `ANGLE_MODELS`+`SYNTH`는 삭제 대신 **"창의(다성) 모드 전용 — 기본 경로 아님"**으로 주석 강등(index가 더 이상 import 안 함).
2. **품질모드 = Self-Refine.** `IDEA_QUALITY`(Solar, 3패스) 추가. `orchestrate({..., quality})` 플래그 시 초안→비평(critique)→수정(revise). adapter에 `critique`/`revise` kind·프롬프트·max_tokens 추가. 미터에 패스별 기록(generate/refine).
3. 서버(`/api/ai`)·클라(`api.js`)에 `quality` 옵션 통과. 목업 스모크테스트 통과(single·self-refine·keyword 정상).

## B. analyze 재테스트 (M1 — 무거운작업 라우팅 정합)
지난 무거운-analyze 벤치는 **거의 단일 심판**이라 재검증이 필요했다. 이번엔 심판 3종(후보와 겹치지 않게 GPT-4o-mini·Llama-3.3·Mistral)·블라인드·저온·재시도, 추론모델 빈응답 방지(토큰 2000~3000). 8종 다양(추론4+강범용4)이 **동일 아이디어 묶음**을 테마화→인사이트→우선순위로 분석. n=5.

| 모델 | 품질 | 골승 | 비용/건 | 비고 |
|---|---|---|---|---|
| **Solar-Pro4** (비추론) | **4.433** | 2 | **$0.000105** | 품질·비용 동시 1위 |
| Kimi-K2.5 | 4.3 | 1 | $0.009849 | 94× 비쌈 |
| Grok-4.3 | 4.167 | 0 | $0.003697 | |
| Nemotron-3.5L (추론) | 4.067 | 1 | $0.000363 | |
| **GLM-4.6 (현행)** | 3.9 | 0 | $0.006515 | 현행 baseline |
| DeepSeek-V3.2 (추론) | 3.8 | 0 | $0.000659 | |
| Gemini-2.5-F | 3.667 | 1 | $0.002784 | |
| Qwen3.7-Plus (추론) | 2.5 | 0 | $0.003628 | 빈응답 2 |

## 내가 내린 방향 (검수 대상)
1. **analyze/report 모델 GLM-4.6 → Solar-Pro4 교체.** 현행 대비 품질 +0.53 *그리고* 비용 62배↓. flagship 티어가 아니라 small 모델이 이김.
2. **"추론모델이 무거운작업에 유리" 가설 철회/정정.** 이번 튼튼한 재테스트에서 추론형(GLM3.9·DeepSeek3.8·Qwen2.5)이 하위. 지난 "추론 역전"은 **단일심판 노이즈**였을 가능성. → 무거운작업이라고 자동으로 추론/flagship을 쓸 근거가 이 과제에선 없음.
3. **라우팅 단순화:** keyword/ice=Flash-Lite + idea/analyze/report=Solar-Pro4의 **"2단"**이 실측 최적. "여러 특화 모델 분산"보다 정직하고 쌈.

## Grok에게 요청 (방향만)
1. **해석 검수:** "Solar-Pro4가 analyze 품질·비용 1위, GLM 교체"가 n=5(2골 심판2)·천장(2.5~4.4)·Solar-Kimi차 작음(+0.13)에서 **정직한 결론**인가? "GLM 교체"는 확정해도 되나, "Solar가 최고"는 잠정으로 둘 수위인가.
2. **추론가설 정정:** "무거운작업=추론 유리"를 접는 게 맞나, 아니면 analyze 과제가 충분히 무겁지 않아(6개 아이디어 그룹화) **더 무거운 과제(리포트·로드맵 등)로 재확인**이 필요한가? (report는 아직 별도 테스트 안 함 — analyze와 동일 취급이 위험한가)
3. **티어 개념 붕괴 우려:** analyze가 small 모델(Solar)로 최적이면 "flagship 티어"의 존재 이유가 약해진다. 난이도 라우팅 스토리를 "2단(Flash-Lite/Solar)"으로 축소하는 게 정직한가, 아니면 진짜 무거운 과제용 flagship 자리를 남겨둬야 하나.
4. **다음 우선순위:** (a) analyze/report 코드 교체 (b) report 별도 재테스트 (c) 품질모드 UI 연결 (d) 창의모드 — 순서.

## 참고
- 발표용(미터 estimate-mock·B1)은 범위 밖.
- 이번 벤치 개선: reasoning 빈응답 방지, per-goal·심판수·빈응답 저장. 심판=후보와 분리(self-bias 차단).
- 누적 실험비 대략 $1.5 내외.
