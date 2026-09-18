# 8-4 · 발산 · 익명 댓글

> **보는 사람**: 모두 (각자)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

다른 사람 아이디어에 비판적으로 댓글을 단다. 아쉬운 점은 모든 아이디어에 필수, 좋은 점은 1인 2개까지. 내 아이디어엔 못 단다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 댓글 저장 | `saveComment` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 왼쪽 목록에서 아이디어 고르기(제목 바뀜)
- ✅ « 로 목록 접기 → 본문 가운데로, » 목록으로 다시 열기
- ✅ 아쉬운 점 비었으면 막기
- ✅ 저장하면 댓글 목록에 추가, 목록 상태 "완료", 오른쪽 위 할당량(4/9 · 1/2)과 "1개 남음" 갱신

**남은 일**

- ⬜ 댓글을 저장하면 다음 안 쓴 아이디어로 자동 이동

## 백엔드가 해야 할 일 (쉽게)

- <b>댓글 대상 목록</b>: 내 아이디어를 뺀 모든 아이디어를 별칭(팀원 A…) 순서로, 내가 댓글을 썼는지 상태와 함께 준다. 할당량(아쉬운 점 몇 개 남았는지, 좋은 점 몇 개 썼는지)도 같이.
- <b>댓글 목록</b>은 <b>작성자 정보를 절대 포함하지 않는다</b>. 순서도 작성 시각순으로 주지 않는다(시간으로 사람 추측 방지).
- <b>규칙은 서버가 지킨다</b>: 아쉬운 점 비면 400, 내 아이디어면 403 OWN_IDEA, 좋은 점이 세션 전체에서 2개를 넘으면 409 PRAISE_LIMIT. 한 아이디어에 내 댓글은 1개(다시 저장하면 수정).
- 진행자에게는 "몇 명이 다 썼는지"만 실시간으로(comments.progress).

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/comments/targets` | 댓글 달 목록 + 내 할당량 |
| 화면 열 때 | `GET /sessions/{sessionId}/ideas/{ideaId}/comments` | 먼저 남겨진 익명 댓글 |
| 목록에서 아이디어 선택 | `GET /sessions/{sessionId}/ideas/{ideaId}/comments` | 먼저 남겨진 익명 댓글 |
| 댓글 저장 | `POST /sessions/{sessionId}/ideas/{ideaId}/comments` | 익명 댓글 저장 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `comments.progress` | 진행 인원 갱신 |
| `stage.changed` | 해당 단계 화면으로 이동, 상단바 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/{sessionId}/comments/targets` — 댓글 달 목록 + 내 할당량

- **API id**: `comment.targets` (프론트: `api.call('comment.targets', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 왼쪽 목록(내 아이디어 제외)과 오른쪽 위 "아쉬운 점 4/9 · 좋은 점 1/2".

**응답** `200`

```json
{
  "quota": {
    "concernDone": 4,
    "concernTotal": 9,
    "praiseUsed": 1,
    "praiseMax": 2
  },
  "groups": [
    {
      "alias": "A",
      "items": [
        {
          "ideaId": "ide_a1",
          "rank": 1,
          "title": "열람실·카페 빈자리 지도",
          "status": "done",
          "praised": true
        }
      ]
    },
    {
      "alias": "B",
      "items": [
        {
          "ideaId": "ide_b1",
          "rank": 1,
          "title": "관심 있는 학교 소식만 골라 알려주는 웹",
          "status": "todo"
        }
      ]
    }
  ]
}
```

### `GET /api/v1/sessions/{sessionId}/ideas/{ideaId}/comments` — 먼저 남겨진 익명 댓글

- **API id**: `comment.list` (프론트: `api.call('comment.list', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 선택한 아이디어의 댓글. 작성자 정보는 절대 포함하지 않는다.

**응답** `200`

```json
{
  "idea": {
    "ideaId": "ide_b1",
    "alias": "B",
    "rank": 1,
    "text": "학교 행사·특강 소식 중 관심 있는 것만 골라 알려주는 웹"
  },
  "counts": {
    "concern": 2,
    "praise": 1
  },
  "items": [
    {
      "type": "concern",
      "text": "관심사를 처음에 고르는 게 귀찮을 수 있어요. 고르지 않아도 일단 보이게 하면 좋겠어요"
    },
    {
      "type": "concern",
      "text": "에브리타임 공지 게시판과 겹칠 수 있어요"
    },
    {
      "type": "praise",
      "text": "공지를 따로 찾아다닐 필요가 없어져요"
    }
  ],
  "mine": null
}
```

**백엔드 메모**

- mine: 내가 이미 쓴 댓글이 있으면 수정할 수 있게 내 것만 따로 준다.
- 댓글 순서는 작성 순서가 아니라 무작위/유형순으로(작성 시각으로 사람을 추측하지 못하게).

### `POST /api/v1/sessions/{sessionId}/ideas/{ideaId}/comments` — 익명 댓글 저장

- **API id**: `comment.create` (프론트: `api.call('comment.create', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 아쉬운 점(필수) + 좋은 점(선택). 한 아이디어에 내 댓글은 1개만(다시 저장하면 수정).

**요청 본문**

```json
{
  "concern": "학교마다 공지 사이트가 달라서 자동으로 모으기 어려울 것 같아요. 처음엔 우리 학교 한 곳만 해야 할 듯해요",
  "praise": null
}
```

**응답** `201`

```json
{
  "saved": true,
  "quota": {
    "concernDone": 5,
    "concernTotal": 9,
    "praiseUsed": 1,
    "praiseMax": 2
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `VALIDATION` | 400 | 아쉬운 점 비어 있음 |
| `OWN_IDEA` | 403 | 내 아이디어에는 댓글 불가 |
| `PRAISE_LIMIT` | 409 | 좋은 점 2개 초과 |

**백엔드 메모**

- 좋은 점 2개 제한은 세션 전체 기준(1인당).
- comments.progress 이벤트로 진행자에게 "몇 명이 다 썼는지"만 알린다.
