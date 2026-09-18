# 8-1 · 발산 · 내 아이디어 정하기

> **보는 사람**: 모두 (각자)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

원래 해보고 싶었던 아이디어를 최대 3개, 하고 싶은 순서대로 적는다. 투표가 끝날 때까지 익명.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 이 순서로 제출 | `submitIdeas` | [8-3 발산 · 익명 순위표](../08-3-idea-board/README.md) |
| AI 추천 보기 | — | [8-2 발산 · AI 추천에서 고르기](../08-2-idea-recommend/README.md) |
| 아이스브레이킹 재료 11개 보기 | — | [7-7 발산 시작 — 재료 보기](../07-7-diverge-materials/README.md) |

## 프론트엔드

**이미 구현한 것**

- ✅ ↑ ↓로 순위 바꾸기(맨 위·맨 아래는 비활성)
- ✅ 7-7에서 적은 초안 자동 채우기
- ✅ 빈 칸은 빼고 1~3개 제출

**남은 일**

- ⬜ 세 번째 칸이 비었을 때 "AI 추천으로 채우기" 버튼(참고 목업)을 넣을지 결정
- ⬜ 작성 중 내용 자동 저장 (다시 들어왔을 때 idea.mine으로 채우는 건 구현됨)

## 백엔드가 해야 할 일 (쉽게)

- <b>내 아이디어 저장</b>: 최대 3개를 순위와 함께 저장한다. 다시 제출하면 덮어쓴다.
- <b>아이디어 주인</b>(누가 냈는지)은 DB에는 저장하지만, <b>투표 결과(8-7) 전까지 어떤 API 응답에도 넣지 않는다</b>. 진행자도 볼 수 없다.
- 제출 인원 수만 실시간으로 알린다(ideas.submitted). 모두 내면 진행자가 순위표로 넘긴다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/ideas/me` | 내 아이디어 1·2·3순위 불러오기 |
| 이 순서로 제출 | `PUT /sessions/{sessionId}/ideas/me` | 내 아이디어 제출 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `ideas.submitted` | 제출 인원 갱신 |
| `stage.changed` | 해당 단계 화면으로 이동, 상단바 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/{sessionId}/ideas/me` — 내 아이디어 1·2·3순위 불러오기

- **API id**: `idea.mine` (프론트: `api.call('idea.mine', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 작성 중이던 내용을 복구한다.

**응답** `200`

```json
{
  "submitted": false,
  "ideas": [
    {
      "rank": 1,
      "text": "과제 공지와 마감을 메일·학교 사이트·단톡에서 한곳에 모아 알려주는 웹",
      "source": "own"
    },
    {
      "rank": 2,
      "text": "강의자료 PDF를 요약해 주는 브라우저 도구",
      "source": "own"
    }
  ]
}
```

### `PUT /api/v1/sessions/{sessionId}/ideas/me` — 내 아이디어 제출

- **API id**: `idea.submit` (프론트: `api.call('idea.submit', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 최대 3개를 순위와 함께 제출한다. AI 추천에서 고른 것도 source만 다르고 팀에는 똑같이 "내 아이디어"로 보인다.

**요청 본문**

```json
{
  "ideas": [
    {
      "rank": 1,
      "text": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
      "source": "own"
    },
    {
      "rank": 2,
      "text": "학교 행사·특강 소식 중 관심 있는 것만 골라 알려주는 웹",
      "source": "ai",
      "recommendationId": "rec_1"
    }
  ]
}
```

**응답** `200`

```json
{
  "submitted": true,
  "submittedCount": 3,
  "memberCount": 4
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `VALIDATION` | 400 | 0개 또는 4개 이상 · 빈 문장 · 순위 중복 |
| `STAGE_CLOSED` | 409 | 이미 다음 단계 |

**백엔드 메모**

- source("own"|"ai")는 서버 내부 통계용. 다른 사람에게 보내는 어떤 응답에도 넣지 않는다.
- 아이디어 주인(participantId)은 저장하되, 투표 결과(8-7) 전까지는 어떤 응답에도 넣지 않는다.
- 제출할 때마다 ideas.submitted 이벤트(인원 수만)를 보낸다.
