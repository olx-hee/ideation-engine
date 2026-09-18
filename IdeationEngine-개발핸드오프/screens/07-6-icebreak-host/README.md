# 7-6 · 아이스브레이킹 · 진행자

> **보는 사람**: 진행자 (7-1~7-5 인터뷰를 마친 뒤)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

팀원별 인터뷰 진도, 최근 소식 반응(인원 수), AI가 비슷한 것끼리 묶은 재료 11개를 보고 "먼저 이야기할 묶음"만 표시한 뒤 발산을 시작한다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 다시 묶기 | `regroup` | — |
| 이전 단계 | `prevStage` | — |
| 발산 시작 → | `nextStage` | [7-7 발산 시작 — 재료 보기](../07-7-diverge-materials/README.md) |

## 프론트엔드

**이미 구현한 것**

- ✅ "먼저 보기" 토글 → 서버 저장
- ✅ 다시 묶기 · 이전 단계 · 발산 시작
- ✅ 실시간 진도 갱신, 늦게 들어온 답 안내

## 백엔드가 해야 할 일 (쉽게)

- <b>진행자 요약</b>: 사람별 진도(몇 번째 질문/완료), 소식 카드 반응 합계(처음·들어봄·잘 앎 <b>인원 수</b>), AI 재료 묶음을 한 번에 준다.
- <b>재료 묶기</b>: 모든 사람의 재료를 AI가 비슷한 것끼리 3~5개 그룹으로 묶고, 그룹 제목·한 줄 설명을 만든다. 재료마다 "몇 명이 말했는지"(count)만 붙이고 누가 말했는지는 넣지 않는다.
- 진행자는 재료를 <b>고르거나 지우지 않는다</b>. "먼저 보기" 표시만 한다. 재료는 전부 발산으로 넘어간다.
- 인터뷰를 늦게 끝낸 사람의 재료가 들어오면 icebreak.groups.updated로 알리고, 진행자가 "다시 묶기"를 눌러야 반영한다(화면이 갑자기 바뀌지 않게).
- <b>단계 넘기기</b>는 진행자만 가능. 넘기면 모두에게 stage.changed를 보내서 모든 화면이 같이 이동한다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/icebreak/overview` | 진행자 요약 (진도 · 소식 반응 · 재료 묶음) |
| 먼저 보기 | `PUT /sessions/{sessionId}/icebreak/groups/{groupId}/focus` | "먼저 보기" 표시 |
| 다시 묶기 | `POST /sessions/{sessionId}/icebreak/groups/regroup` | 재료 다시 묶기 |
| 이전 단계 | `POST /sessions/{sessionId}/stage/prev` | 이전 단계로 돌아가기 |
| 발산 시작 | `POST /sessions/{sessionId}/stage/next` | 다음 단계로 넘기기 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `icebreak.progress` | "팀 진행" 카드 한 줄 갱신 |
| `icebreak.groups.updated` | "새 재료 2개 · 다시 묶기" 안내 |
| `stage.changed` | 해당 단계 화면으로 이동, 상단바 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/{sessionId}/icebreak/overview` — 진행자 요약 (진도 · 소식 반응 · 재료 묶음)

- **API id**: `ice.overview` (프론트: `api.call('ice.overview', …)`)
- **누가 부를 수 있나**: 세션 진행자만
- **하는 일**: 진행자 화면(7-6). 사람별 진도, 소식 카드 반응 인원 수, AI가 묶은 재료 그룹.

**응답** `200`

```json
{
  "progress": [
    {
      "nickname": "노형원",
      "step": 5,
      "done": true
    },
    {
      "nickname": "이세민",
      "step": 5,
      "done": true
    },
    {
      "nickname": "김승희",
      "step": 5,
      "done": true
    },
    {
      "nickname": "박상진",
      "step": 4,
      "done": false
    }
  ],
  "newsReactions": [
    {
      "cardId": "news_1",
      "category": "시장",
      "title": "단톡방 중고거래",
      "counts": {
        "new": 1,
        "heard": 2,
        "know": 1
      }
    },
    {
      "cardId": "news_2",
      "category": "기술",
      "title": "온디바이스 AI",
      "counts": {
        "new": 3,
        "heard": 0,
        "know": 1
      }
    },
    {
      "cardId": "news_3",
      "category": "규제",
      "title": "학생 정보 동의 강화",
      "counts": {
        "new": 4,
        "heard": 0,
        "know": 0
      }
    }
  ],
  "hint": "온디바이스 AI를 잘 아는 사람이 1명 있어요. 발산 때 설명을 부탁해 보세요.",
  "materialCount": 11,
  "groups": [
    {
      "groupId": "grp_1",
      "title": "흩어진 학교 정보",
      "desc": "묶으면 \"캠퍼스 정보를 한곳에서\" 방향이 돼요",
      "aiPick": true,
      "focus": true,
      "items": [
        {
          "text": "과제 공지가 메일·LMS·단톡으로 흩어짐",
          "count": 2,
          "avoid": false
        },
        {
          "text": "시험기간 열람실 빈자리 찾기",
          "count": 1,
          "avoid": false
        },
        {
          "text": "학교 앞 카페 콘센트 자리 경쟁",
          "count": 1,
          "avoid": false
        }
      ]
    },
    {
      "groupId": "grp_2",
      "title": "AI를 직접 써보고 싶음",
      "desc": "동기가 가장 많이 겹치고, 최근 소식과도 이어져요",
      "aiPick": false,
      "focus": true,
      "items": [
        {
          "text": "AI 기능을 직접 넣어보고 싶음",
          "count": 3,
          "avoid": false
        },
        {
          "text": "온디바이스 AI로 서버 없이 시연",
          "count": 1,
          "avoid": false
        }
      ]
    },
    {
      "groupId": "grp_3",
      "title": "돈·정산의 신뢰",
      "desc": "최근 시장 변화와 실제 경험이 맞닿아 있어요",
      "aiPick": false,
      "focus": false,
      "items": [
        {
          "text": "단톡방 공동구매 정산을 한 사람이 떠안음",
          "count": 1,
          "avoid": false
        }
      ]
    },
    {
      "groupId": "grp_4",
      "title": "우리 팀의 조건",
      "desc": "주제가 아니라 범위를 정하는 재료예요",
      "aiPick": false,
      "focus": null,
      "items": [
        {
          "text": "웹 화면과 발표 자료는 자신 있음",
          "count": 2,
          "avoid": false
        },
        {
          "text": "앱 개발 · 서버가 무거운 방향",
          "count": 2,
          "avoid": true
        }
      ]
    }
  ]
}
```

**백엔드 메모**

- focus: true(먼저 보기로 표시) · false(표시 안 함) · null(표시 대상 아님 — "우리 팀의 조건"처럼 범위용 그룹).
- "잘 아는 사람이 1명" 같은 힌트도 이름 없이 인원 수로만.
- 늦게 끝난 사람 답이 들어오면 icebreak.groups.updated 이벤트로 알리고, 진행자가 "다시 묶기"를 눌러야 반영.

### `PUT /api/v1/sessions/{sessionId}/icebreak/groups/{groupId}/focus` — "먼저 보기" 표시

- **API id**: `ice.focus` (프론트: `api.call('ice.focus', …)`)
- **누가 부를 수 있나**: 세션 진행자만
- **하는 일**: 진행자는 재료를 고르지 않고, 먼저 이야기할 묶음만 표시한다.

**요청 본문**

```json
{
  "focus": true
}
```

**응답** `200`

```json
{
  "groupId": "grp_3",
  "focus": true
}
```

### `POST /api/v1/sessions/{sessionId}/icebreak/groups/regroup` — 재료 다시 묶기

- **API id**: `ice.regroup` (프론트: `api.call('ice.regroup', …)`)
- **누가 부를 수 있나**: 세션 진행자만
- **하는 일**: 지금까지 모인 재료로 AI 묶음을 다시 만든다. 먼저 보기 표시는 비슷한 그룹에 최대한 이어 붙인다.

**요청 본문**

```json
{}
```

**응답** `200`

```json
{
  "groups": [
    {
      "groupId": "grp_1",
      "title": "흩어진 학교 정보",
      "desc": "묶으면 \"캠퍼스 정보를 한곳에서\" 방향이 돼요",
      "aiPick": true,
      "focus": true,
      "items": [
        {
          "text": "과제 공지가 메일·LMS·단톡으로 흩어짐",
          "count": 2,
          "avoid": false
        },
        {
          "text": "시험기간 열람실 빈자리 찾기",
          "count": 1,
          "avoid": false
        },
        {
          "text": "학교 앞 카페 콘센트 자리 경쟁",
          "count": 1,
          "avoid": false
        }
      ]
    },
    {
      "groupId": "grp_2",
      "title": "AI를 직접 써보고 싶음",
      "desc": "동기가 가장 많이 겹치고, 최근 소식과도 이어져요",
      "aiPick": false,
      "focus": true,
      "items": [
        {
          "text": "AI 기능을 직접 넣어보고 싶음",
          "count": 3,
          "avoid": false
        },
        {
          "text": "온디바이스 AI로 서버 없이 시연",
          "count": 1,
          "avoid": false
        }
      ]
    },
    {
      "groupId": "grp_3",
      "title": "돈·정산의 신뢰",
      "desc": "최근 시장 변화와 실제 경험이 맞닿아 있어요",
      "aiPick": false,
      "focus": false,
      "items": [
        {
          "text": "단톡방 공동구매 정산을 한 사람이 떠안음",
          "count": 1,
          "avoid": false
        }
      ]
    },
    {
      "groupId": "grp_4",
      "title": "우리 팀의 조건",
      "desc": "주제가 아니라 범위를 정하는 재료예요",
      "aiPick": false,
      "focus": null,
      "items": [
        {
          "text": "웹 화면과 발표 자료는 자신 있음",
          "count": 2,
          "avoid": false
        },
        {
          "text": "앱 개발 · 서버가 무거운 방향",
          "count": 2,
          "avoid": true
        }
      ]
    }
  ]
}
```

### `POST /api/v1/sessions/{sessionId}/stage/prev` — 이전 단계로 돌아가기

- **API id**: `session.back` (프론트: `api.call('session.back', …)`)
- **누가 부를 수 있나**: 세션 진행자만
- **하는 일**: 진행자가 직전 단계로 되돌린다(아이스브레이킹 진행자 화면의 "이전 단계").

**요청 본문**

```json
{
  "from": "icebreak"
}
```

**응답** `200`

```json
{
  "stage": {
    "id": "icebreak",
    "label": "아이스브레이킹",
    "subStep": 5,
    "progress": 18
  }
}
```

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
