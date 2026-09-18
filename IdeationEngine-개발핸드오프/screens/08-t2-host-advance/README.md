# T2 · 진행자 단계 넘기기 + 제출 확인 (하단 막대 · 확인 창)

> **보는 사람**: 진행자  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

8-1 ~ 8-6에서 진행자에게만 보이는 하단 막대("제출 n / m명 · 다음 단계 →")와, 안 낸 사람이 있을 때 뜨는 확인 창. "그냥 넘기기"만 force=true로 보낸다. 이 화면은 그 막대·창의 목업이다(실제로는 app.js가 진행자 화면에 붙임).

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 다음 단계 → | `hostAdvance` | — |
| 기다리기 | `forceCancel` | — |
| 그냥 넘기기 | `forceAdvance` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 진행자 하단 막대(app.js `App.hostBar`) — ideas.submitted · comments.progress · vote.progress로 숫자 갱신
- ✅ "다음 단계 →" → session.advance(from) · 409 NOT_ALL_SUBMITTED면 확인 창
- ✅ "그냥 넘기기" → session.advance(from, force: true)

**남은 일**

- ⬜ 막대의 첫 숫자(화면 열 때) — 지금은 이벤트가 와야 채워짐 → idea.board · comment.targets · vote.state 응답으로 채우기

## 백엔드가 해야 할 일 (쉽게)

- <b>제출 강제</b>(2026-09-18 결정): diverge.write · diverge.comment에서 아직 안 낸 사람이 있으면 session.advance는 409 NOT_ALL_SUBMITTED + details {pendingCount, memberCount}. force=true면 넘어간다.
- 누가 안 냈는지는 진행자에게도 알려주지 않는다(익명). 인원 수만.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 다음 단계 → | `POST /sessions/{sessionId}/stage/next` | 다음 단계로 넘기기 |
| 그냥 넘기기 | `POST /sessions/{sessionId}/stage/next` | 다음 단계로 넘기기 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `ideas.submitted` | 제출 인원 갱신 |
| `comments.progress` | 진행 인원 갱신 |
| `vote.progress` | "투표한 사람 3 / 4" 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `POST /api/v1/sessions/{sessionId}/stage/next` — 다음 단계로 넘기기

- **API id**: `session.advance` (프론트: `api.call('session.advance', …)`)
- **누가 부를 수 있나**: 세션 진행자만
- **하는 일**: 진행자가 단계를 넘긴다. 서버가 다음 단계를 정해 stage.changed 이벤트를 모두에게 보낸다.

**요청 본문**

```json
{
  "from": "icebreak",
  "force": false
}
```

**응답** `200`

```json
{
  "stage": {
    "id": "diverge.write",
    "label": "아이디어 발산",
    "subStep": 1,
    "progress": 25
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `STAGE_MISMATCH` | 409 | 이미 다른 단계로 넘어감(두 번 누름) |
| `STAGE_LOCKED` | 409 | 대기실(→ 세션 시작으로) · 투표 결과(→ 주제 확정으로)에서 넘기려 함 · AI 검증이 끝나기 전(ready=false) review → vote |
| `NOT_ALL_SUBMITTED` | 409 | diverge.write(아이디어) · diverge.comment(댓글)에서 아직 안 낸 사람이 있음. details {pendingCount, memberCount}. force=true면 넘어감 |
| `PARTS_NOT_READY` | 409 | 파트 나누기 AI 작업이 아직 안 끝남(team.split에서 넘기려 할 때) |

**백엔드 메모**

- req.from 으로 "내가 보고 있던 단계"를 보내서 중복 클릭·동시 클릭을 막는다.
- 제출 단계는 전원이 내야 넘어간다(2026-09-18 결정): diverge.write는 memberCount 전원이 idea.submit, diverge.comment는 전원이 아쉬운 점 할당량을 채워야 한다. 아니면 409 NOT_ALL_SUBMITTED(details에 pendingCount·memberCount). 연결이 끊긴 사람 때문에 막히면 진행자가 force=true로 넘길 수 있다(프론트는 확인 창 뒤에만 보냄) — 그때만 제출 안 한 사람이 생긴다.
- 순서: icebreak → diverge.write → diverge.board → diverge.comment → diverge.review → diverge.vote → diverge.result. lobby는 session.start로, diverge.result는 topic.confirm으로만 넘어간다.
- 단계를 DB에 먼저 저장하고 나서 이벤트를 보낸다(이벤트를 받은 화면이 session.get으로 확인해도 새 단계가 보이게).
- 단계에 들어가거나 나갈 때 할 일(제출 마감, AI 작업 시작, 투표 마감 등)은 그 단계를 다루는 차수 전달 문서에 적혀 있다.
- 9단계에서는 진행자가 team.split → team.questions(겹친 후보가 없으면 바로 team.assign) 로 넘긴다.
- team.questions → team.assign 은 겹친 후보가 모두 답하거나 시간이 끝나면 <b>서버가 자동으로</b> 넘긴다(진행자가 먼저 넘길 수도 있음).
- team.assign → report 는 이 API가 아니라 <b>팀장의 team.confirm</b> 으로만 넘어간다.
