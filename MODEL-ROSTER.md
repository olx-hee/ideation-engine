# 모델·도구 후보 카탈로그 (MODEL-ROSTER)

> **상태: 조사만 완료 · 코드 미적용.** 오케스트레이터([ORCHESTRATOR-DESIGN.md](ORCHESTRATOR-DESIGN.md))의
> **역할/티어 레지스트리**가 참고할 후보 목록입니다. 실제 채택은 P2 이후 실측으로 확정합니다.
>
> 출처: 자체 웹 조사 + Grok 조사 보고서(`grok-검수/최신보고서/2026-08-03_0412_…`). 가격·슬러그는
> **2026년 중반 공개 자료 기준, 수시 변동** — 배포 직전 재확인 필요.

---

## 1. 왜 이 문서

- "유명 모델 하나"가 아니라 **역할별로 다양한 모델·도구**를 쓰는 게 이 프로젝트의 창의성·사업성 축.
- 이 문서는 **"어떤 후보가 있고, 어디서 부르고, 어느 역할·티어에 맞는가"**의 카탈로그.
- 레지스트리(`kind/역할 → {tier, model}`)를 채울 때 여기서 고른다.

---

## 2. 덜 알려졌지만 준수한 LLM — OpenRouter 수록 (한 키로 라우팅)

Artificial Analysis Intelligence Index(2026-06 인용) 등 기준. **대략 가격 = in/out $/1M(OpenRouter 가중, 변동).**

| 모델 | 강점 | 대략 가격 | 티어 | IdeationEngine 역할 | OR |
|------|------|-----------|------|---------------------|----|
| **DeepSeek V4 Flash** | 에이전트·코딩 가성비 Pareto, 긴 컨텍스트 | ~$0.05 / $0.24 | 저 | ice·idea 대량 콜 | ✅ |
| **DeepSeek V4 Pro** | Flash보다 품질 상한 | (중) | 중~고 | analyze/report 승격 | ✅ |
| **GLM 5.2** (Z.ai) | 오픈웨이트 **1위권**(51), 계획·장시간 코딩 | ~$0.45 / $3.31 | 고 | analyze/report·교차검증 | ✅ |
| **Nemotron 3 Ultra** (NVIDIA) | 오픈웨이트 #2(48), 미국 벤더 스토리, `:free` 경로 | ~$0.42 / $2.61 | 중~고 | 데모·무료 쇼케이스 | ✅ |
| **MiniMax M3** | 네이티브 멀티모달(이미지·영상)·장문 1M | ~$0.10 / $1.21 | 중 | (사진·PDF 첨부 시) 후순위 | ✅ |
| **Qwen3.x** (Alibaba) | 범용·코딩·툴콜, 다국어 | (저~중) | 저~중 | 저가 티어·구조화 JSON | ✅ |
| **Kimi K2.x / K3** (Moonshot) | 장문·에이전트, GPQA 최상위 | (중) | 중 | 긴 세션 로그 요약·보고서 | ✅ |
| **gpt-oss-120b** | Apache-2.0·고처리량, 무료 티어 잦음 | 매우 저/무료 | 저 | 추출·분류·스키마 채우기 | ✅ |
| **Gemma 4** (Google) | 소형·멀티모달·저지연 | (저) | 저 | ice 카드·온프레(장기) | ✅ |
| **Mistral Small/Medium** | 유럽권, 균형·툴콜 | (저~중) | 저~중 | EU 데이터 선호 시 옵션 | ✅ |
| **Llama 3.3 / 4** (Meta) | 범용, 초저지연 호스트(Groq 등) | (저~중) | 중 | 범용 중가 | ✅ |

> 요지: **Nemotron만이 아니라** 위 대부분을 OpenRouter **한 키**로 부를 수 있다(OpenAI 호환 + 슬러그).
> 무료(`:free`)는 **일일 한도·로테이션**이 있어 프로덕션 SLA엔 부적합.

---

## 3. 한국 LLM — OpenRouter 밖, 직접 연동 (창의성·한국어·발표 카드) 🇰🇷

OpenRouter엔 대개 없어 **직접 붙이는 "외부 모델"**. 우리 사업 모델("흩어진 좋은 모델을 모음")에 정확히 맞고,
**한국어 톤 + 국산 AI 활용**이라 심사(창의성)·발표에 강하다.

| 모델 | 강점 | 연동 |
|------|------|------|
| **Upstage Solar Pro 2** (31B) | Artificial Analysis에서 GPT-4.1·DeepSeek V3·Kimi K2 앞섬. 한국어 강함 | **OpenAI 호환 API** → 우리 어댑터에 바로 붙음 |
| **Naver HyperCLOVA X** (HCX-L/HCX-S) | 한국어·문화 특화, 검색·대화 | Naver Cloud API (별도 어댑터) |

→ 역할: **한국어 카피 톤**(UI 문구), 발산 다양성 축. 데이터 약관·리전은 국내라 학교·해커톤 맥락에 유리.

---

## 4. kind별 후보 스케치 (참고용 — 미확정)

| kind | 저가 후보 | 고가/승격 후보 |
|------|-----------|----------------|
| ice (키워드 카드) | Nemotron `:free`, gpt-oss, Qwen Flash, DeepSeek Flash | (캐스케이드 금지 — 설계 §4) |
| idea (발산, 각도별) | DeepSeek Flash, Qwen, (한국어) Solar | GLM 5.2, DeepSeek Pro |
| analyze (테마·그룹화) | Qwen, DeepSeek Flash | GLM 5.2, Nemotron Ultra (+교차검증 2nd) |
| report (최종 보고서) | — | GLM / DeepSeek Pro / (톤 중요 시 Claude·Solar) |

---

## 5. 작업별 특화 AI 도구 — API 되는 것 vs 안 되는 것

특화 도구는 **API가 있어야** 붙일 수 있다. 정직하게 갈린다.

| 용도 | 도구 | API? | 우리 프로젝트 활용 |
|------|------|------|--------------------|
| 자료조사 + **출처** | **Perplexity Sonar** | ✅ (api.perplexity.ai, 4티어 $0.2~$15/1M) | 보고서 전 "시장·경쟁 근거" 카드 (확장) |
| 학술 논문 근거 | **Elicit** | ✅ (Pro+ API, MCP) | 논문 해커톤 "근거" 모드 (선택) |
| 검색 + 요약 | **Gemini** | ✅ (Google AI) | **LLM 공급사 하나**로 오케스트레이터에 편입 |
| PPT/덱 생성 | **Gamma** | ✅ (developers.gamma.app, Generate v1.0) | report 이후 **덱 내보내기** (확장) |
| 회의록 요약 | **Fireflies/Otter** | 일부 API | 오프라인 모드 **사후** 정리 (선택) |
| PDF·논문 학습 | **NotebookLM** (→Gemini Notebook) | ❌ 공식 API 없음 | ⚠️ Gemini 긴 컨텍스트/RAG로 **대체**, 또는 외부 링크 |
| 노트 자동정리 | **Notion AI** | ❌ AI 전용 API 없음 | ⚠️ 결과 "Notion 보내기" 연동 정도 |
| PPT/자율 에이전트 | **Manus** | ❌ 공식 개발자 API 못 찾음 | ⚠️ **Gamma로 대체**. 자율 에이전트라 우리 세션 엔진과 성격 충돌 |

### 파이프라인 지도 (특화 도구는 앞·뒤, 세션은 우리 것)
```
[발견·출처]  Perplexity · Gemini/Deep Research
[문헌·코퍼스] Elicit · Consensus · NotebookLM(업로드 grounded)
[회의·노트]  Fireflies · Notion AI
[아이디어 세션] ★ IdeationEngine (각도·발산·투표·보고서)  ← 우리 코어(고유 영역)
[산출물]     Gamma / Beautiful.ai / Manus(전체 대행 에이전트)
```

---

## 6. 적용 원칙 & 하지 말 것 (정직성 가드레일)

**원칙**
- LLM(§2·§3)은 **오케스트레이터 본류**. 특화 도구(§5)는 **주변 플러그인(P3+)**.
- 특화 도구도 **API 있는 것만**(Perplexity·Gemini·Gamma·Elicit). 없는 것은 대체·외부 링크로.
- 키는 **전부 서버 env**. 다공급사로 아이디어 원문이 분기 → 데이터 학습·보관 **고지·옵트인**(설계 §8).

**하지 말 것**
1. **Perplexity·Gamma를 "우리 멀티 LLM"이라 발표** — 완제품 기능이지 LLM 라우팅 아님(창의성① 정직성 위반).
2. **P1에서 특화 API를 반쯤 붙이기** — 설계 §9 과설계 금지.
3. **NotebookLM·Notion·Manus를 "연동 완료"로 표기** — API 없이 링크만이면 "예정/대체"로.
4. **무료 티어를 사업계획 $/세션에 $0으로 영구 고정** — 설계 §5 체크리스트 위반.
5. **중국 랩 모델의 data-on-train 약관** 무시 — 학교·해커톤 Q&A 대비(리전·no-train 호스트 선택).

---

## 7. 상태 & 다음

- 이 문서 = **조사 결과 카탈로그**. 코드·심사 주장에 아직 반영 안 함.
- **P1**(레지스트리+미터, 목업)은 이 카탈로그의 **모델 라벨·목업 단가**만 참고.
- **P2**에서 OpenRouter 실호출로 후보군을 좁히고 실측 단가로 확정.
- **P3+** 확장: Perplexity(근거)·Gamma(덱)·Solar/HyperCLOVA(한국어).

---

## 8. 출처

- OpenRouter: [Open Weight Models that Matter (2026-06)](https://openrouter.ai/blog/insights/the-open-weight-models-that-matter-june-2026/), 모델 허브([DeepSeek](https://openrouter.ai/deepseek)·[NVIDIA](https://openrouter.ai/nvidia)·[Qwen](https://openrouter.ai/qwen))
- 오픈소스 LLM 리뷰: [Fireworks](https://fireworks.ai/blog/best-open-source-llms), [Vellum Leaderboard](https://www.vellum.ai/open-llm-leaderboard)
- 한국 LLM: [MarkTechPost — Korea's LLM Powerhouses](https://www.marktechpost.com/2025/08/21/meet-south-koreas-llm-powerhouses-hyperclova-ax-solar-pro-and-more/), [BenchLM Korean Leaderboard](https://benchlm.ai/leaderboards/korean-llm)
- Perplexity: [API Guide](https://techjacksolutions.com/ai-tools/perplexity/perplexity-api-guide/), [Sonar Pricing](https://pricepertoken.com/pricing-page/model/perplexity-sonar) · Elicit: [Docs](https://docs.elicit.com/)
- NotebookLM API 부재: [AutoContent](https://autocontentapi.com/blog/does-notebooklm-have-an-api) · Gamma API: [Developer Docs](https://developers.gamma.app/)
- Grok 조사 보고서: `grok-검수/최신보고서/2026-08-03_0412_덜알려진LLM-특화AI-조사보고서.md`
