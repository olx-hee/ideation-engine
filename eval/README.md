# 객관 품질 재현 평가 (promptfoo)

비용은 Langfuse로 실측했고(→ 루트 README 사업성①), **"결과가 좋은지(품질)"는 오픈소스 promptfoo로 재현 가능하게** 확인한다.
우리 role-map 모델을 **최고급 Claude-Opus-4.1과 같은 작업**에 놓고, **독립 심판(Gemini-2.5-Flash, 테스트 대상 아님)**이 루브릭으로 채점한다.

## 실행
```bash
npx promptfoo eval -c eval/promptfooconfig.yaml -o eval/quality-results.json
npx promptfoo view      # 웹 UI로 표 보기(선택)
```
OpenRouter 키는 `.env`에서 자동 로드. 실제 API 소액 과금.

## 무엇을 재나 (객관 작업만)
| 작업 | 우리 픽 | 루브릭 요지 |
|------|---------|-------------|
| analyze | Solar-Pro4 | 겹치지 않는 3~4테마로 묶고 공통구조 요약 정확성 |
| report | DeepSeek-V3.2 | 핵심 종합·구조·실행관점·간결성 |
| verify | Llama-3.3 | 심어둔 과장·비현실 주장 4개 포착 |

## 결과 (2026-08-23, 엄격 채점 0~1)
| 작업 | 우리 픽 | Claude-Opus |
|------|---------|-------------|
| analyze | **0.95** | 0.90 |
| report | **0.95** (DeepSeek) | 0.95 |
| verify | **1.0** | 1.0 |

→ **객관 작업 품질에서 우리 저가 모델이 최고급 Opus와 대등하거나 살짝 앞섬.** 비용은 수백 배 저렴(Langfuse 실측).

## 정직한 한계
- 점수가 천장(0.9~1.0)에 몰려 0.05차는 **노이즈 범위** → "명확히 더 낫다"가 아니라 **"동급"**으로 읽어야 함.
- 심판 1개(Gemini-Flash)·셀당 1회·작업 3종 → 표본 작음. 심판은 결국 LLM(LLM-judge 한계 잔존, 단 객관작업엔 방어적).
- **창의·주관 품질은 여기서 안 잼** — 그건 사람 블라인드 채점(창의 사람축, 별도 과제).
