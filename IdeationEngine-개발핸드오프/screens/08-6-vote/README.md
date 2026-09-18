# 8-6 · 발산 · 투표 (+ AI가 모은 아이디어 · 숨은 공통점)

> **보는 사람**: 모두 (각자)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

1인 2표로 해보고 싶은 아이디어에 투표한다. 누르면 처음 적은 내용·AI 검증·익명 댓글을 다시 본다. 목록 아래에 AI가 좋은 점을 모은 아이디어(투표 가능)와 숨은 공통점(참고용, 투표 아님)이 있다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 이 아이디어에 투표 | `voteCurrent` | — |
| 투표 마치기 | `finishVote` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 왼쪽 목록 항목 종류에 따라 오른쪽 본문 전환: 투표 후보 / AI가 모은 아이디어 / 숨은 공통점
- ✅ 체크박스 또는 "이 아이디어에 투표"로 표 넣기·빼기, <b>2표 넘으면 막기</b>, 남은 표 점(●○) 갱신, 서버 저장 실패 시 되돌리기
- ✅ 숨은 공통점의 "몰랐어요 / 이미 알았어요" 저장
- ✅ « 목록 접기
- ✅ 투표 마치기 → 대기 화면(8-6w)으로
- ✅ 이미 마쳤으면(vote.state finished) 열 때 바로 8-6w
- ✅ 투표 인원 실시간 갱신
- ✅ vote.closed면 모두 8-7로

**남은 일**

- ⬜ 숨은 공통점 본문 안의 후보 체크박스로도 표를 넣고 뺄 수 있게 (지금은 보기 전용)

## 백엔드가 해야 할 일 (쉽게)

- <b>1인 2표</b>. 서버는 "지금 체크된 전체 목록"을 받아 저장한다(추가·취소를 한 번에). 2표 넘으면 409 VOTE_LIMIT. 숨은 공통점 id는 후보가 아니므로 400.
- <b>누가 어디에 투표했는지는 끝까지 비공개</b>. 결과(8-7)에는 합계만 쓴다. 자기 아이디어에 투표하는 것은 허용.
- <b>AI가 모은 아이디어</b>: 댓글 단계에서 <b>좋은 점을 받은</b> 아이디어들의 좋은 점만 모아 AI가 새 아이디어를 최대 2개 만든다. 어디서 가져왔는지(sources)와 원래 아쉬운 점을 어떻게 줄였는지(fixes)를 공개하고, 새로 AI 검증을 돌린다. "AI가 모음" 표시를 항상 붙이고, 원래 아이디어보다 낫다고 내세우지 않는다.
- <b>숨은 공통점</b>: 아이스브레이킹 재료 중 <b>서로 다른 묶음에 있었지만 뿌리가 같은</b> 것들을 AI가 찾는다. <b>2명 이상</b> 겹칠 때만 만들고, 답 원문은 인용하지 않고 요약만. 선입견을 막기 위해 <b>아이디어 제출 전에는 API가 403</b>을 준다. 투표 선택지가 아니다.
- "내 답도 들어 있어요"(includesMine)는 요청한 본인에게만 계산해서 준다. 누가 말했는지는 진행자도 모른다.
- 투표 인원만 실시간으로(vote.progress). 모두 마치면 vote.closed.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/vote` | 투표 화면 목록 + 내 표 |
| 투표 후보 선택 | `GET /sessions/{sessionId}/vote/candidates/{ideaId}` | 투표 후보 상세 |
| AI가 모은 아이디어 선택 | `GET /sessions/{sessionId}/ai-ideas/{aiIdeaId}` | AI가 모은 아이디어 상세 |
| 숨은 공통점 선택 | `GET /sessions/{sessionId}/common-threads/{threadId}` | 숨은 공통점 상세 (투표 참고) |
| 체크 / 이 아이디어에 투표 | `PUT /sessions/{sessionId}/vote/me` | 내 표 저장 (최대 2표) |
| 몰랐어요 / 이미 알았어요 | `PUT /sessions/{sessionId}/common-threads/{threadId}/reaction` | "이 연결, 알고 있었나요?" |
| 투표 마치기 | `POST /sessions/{sessionId}/vote/me/finish` | 투표 마치기 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `vote.progress` | "투표한 사람 3 / 4" 갱신 |
| `vote.closed` | 모두 8-7로 (진행자는 확정 버튼, 참가자는 보기 전용) |
| `stage.changed` | 해당 단계 화면으로 이동, 상단바 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/{sessionId}/vote` — 투표 화면 목록 + 내 표

- **API id**: `vote.state` (프론트: `api.call('vote.state', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 왼쪽 레일: 투표 후보(12) · AI가 모은 아이디어(2) · 숨은 공통점(3, 선택지 아님). 1인 2표.

**응답** `200`

```json
{
  "maxVotes": 2,
  "myVotes": [
    "ide_c1"
  ],
  "votedCount": 3,
  "memberCount": 4,
  "finished": false,
  "candidates": [
    {
      "id": "ide_c1",
      "kind": "idea",
      "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
      "grade": "go",
      "isMine": true
    },
    {
      "id": "ide_b1",
      "kind": "idea",
      "title": "관심 있는 학교 행사·특강 소식만 골라 알려주는 웹",
      "grade": "go",
      "isMine": false
    },
    {
      "id": "ide_a2",
      "kind": "idea",
      "title": "팀플 회의가 끝나면 할 일을 정리해 주는 서비스",
      "grade": "go",
      "isMine": false
    }
  ],
  "aiIdeas": [
    {
      "id": "aii_1",
      "kind": "ai",
      "title": "시험기간에만 여는 열람실·카페 빈자리·콘센트 제보판",
      "grade": "go"
    },
    {
      "id": "aii_2",
      "kind": "ai",
      "title": "팀플 자료·수정 요청을 링크 하나에 모으고 바뀐 점만 요약",
      "grade": "fix"
    }
  ],
  "commonThreads": [
    {
      "id": "thr_1",
      "title": "\"누가 무엇을 했는지\"가 한곳에 안 남아요",
      "candidateCount": 4
    },
    {
      "id": "thr_2",
      "title": "알림이 너무 많아 중요한 걸 놓쳐요",
      "candidateCount": 2
    },
    {
      "id": "thr_3",
      "title": "AI는 넣고 싶지만 무거운 서버는 피하고 싶어요",
      "candidateCount": 2
    }
  ]
}
```

**백엔드 메모**

- isMine은 요청한 본인 아이디어에만 true (다른 사람 아이디어의 주인은 아직 비공개).

### `GET /api/v1/sessions/{sessionId}/vote/candidates/{ideaId}` — 투표 후보 상세

- **API id**: `vote.candidate` (프론트: `api.call('vote.candidate', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 누르면 오른쪽에 처음 적은 내용 · AI 검증 요약 · 익명 댓글을 다시 보여준다.

**응답** `200`

```json
{
  "ideaId": "ide_a2",
  "alias": "A",
  "rank": 2,
  "title": "팀플 회의가 끝나면 할 일을 정리해 주는 서비스",
  "grade": "go",
  "originalText": "회의 메모나 녹음을 올리면 누가 언제까지 뭘 해야 하는지 정리해서 단톡방에 보내주는 서비스",
  "review": {
    "exists": {
      "label": "비슷한 게 있음",
      "summary": "회의록 AI는 많지만 대학 팀플·단톡 공유에 맞춘 건 드물어요.",
      "searchUrl": "https://search.example.com/?q=..."
    },
    "feasibility": {
      "level": "상",
      "summary": "텍스트 메모부터 시작하면 돼요."
    },
    "need": {
      "label": "있음",
      "summary": "인터뷰에서 3명이 비슷한 경험을 말했어요."
    },
    "timeline": {
      "label": "가능",
      "summary": "메모 입력과 할 일 정리 화면만 하면 시연할 수 있어요."
    }
  },
  "comments": {
    "concern": 3,
    "praise": 2,
    "items": [
      {
        "type": "concern",
        "text": "회의 메모를 누가 정리해서 올릴지가 또 문제예요"
      },
      {
        "type": "praise",
        "text": "팀플마다 겪는 문제라 발표할 때 공감을 얻기 쉬워요"
      }
    ]
  },
  "votedByMe": false
}
```

### `GET /api/v1/sessions/{sessionId}/ai-ideas/{aiIdeaId}` — AI가 모은 아이디어 상세

- **API id**: `vote.aiIdea` (프론트: `api.call('vote.aiIdea', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 어떤 아이디어에서 좋은 점을 가져왔는지, 아쉬운 점을 어떻게 줄였는지, 새로 한 AI 검증.

**응답** `200`

```json
{
  "id": "aii_1",
  "title": "시험기간에만 여는 열람실·카페 빈자리·콘센트 제보판",
  "grade": "go",
  "sources": [
    {
      "alias": "A",
      "rank": 1,
      "title": "열람실·카페 빈자리를 함께 알려주는 지도",
      "grade": "fix",
      "takenPoint": "시험기간엔 누구나 겪는 문제라 공감이 커요"
    },
    {
      "alias": "D",
      "rank": 3,
      "title": "학교 앞 카페 콘센트 자리 알림",
      "grade": "re",
      "takenPoint": "콘센트 자리는 실제로 다들 찾아다녀요"
    }
  ],
  "fixes": [
    {
      "problem": "실시간 정보가 틀릴 수 있어요",
      "concernCount": 3,
      "fix": "제보 시간과 \"지금도 맞아요\" 확인 수를 같이 보여주기"
    },
    {
      "problem": "평소엔 쓸 일이 별로 없어요",
      "concernCount": 2,
      "fix": "시험기간 2주만 여는 서비스로 범위 줄이기"
    }
  ],
  "review": {
    "exists": "비슷한 게 있음",
    "feasibility": "상",
    "need": "있음",
    "timeline": "가능",
    "searchUrl": "https://search.example.com/?q=..."
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `FORBIDDEN` | 403 | 투표 단계(diverge.vote) 전 |
| `NOT_FOUND` | 404 | 이 세션에 없는 id |

**백엔드 메모**

- AI 아이디어는 "AI가 모음" 표시를 항상 붙이고, 원래 아이디어보다 낫다고 내세우는 문구를 쓰지 않는다.
- 좋은 점을 받은(praise가 있는) 아이디어들에서만 만든다. 최대 2개. 좋은 점을 받은 아이디어가 없으면 만들지 않는다(vote.state의 aiIdeas = []).
- AI 검증 작업과 같이(diverge.review에 들어갈 때) 만들고, 만든 아이디어에도 같은 검증을 돌린다. 모두 끝나야 reviews.ready.
- sources에는 별칭(alias) · 순위 · 제목만. 주인 이름은 투표 결과(vote.results의 sourceOwners)에서만 공개.

### `GET /api/v1/sessions/{sessionId}/common-threads/{threadId}` — 숨은 공통점 상세 (투표 참고)

- **API id**: `vote.thread` (프론트: `api.call('vote.thread', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 서로 다른 묶음에 흩어져 있던 재료가 사실 같은 문제라는 AI의 연결. 투표 선택지가 아니다.

**응답** `200`

```json
{
  "id": "thr_1",
  "title": "팀플에서 \"누가 무엇을 했는지\"가 한곳에 남지 않아요",
  "answerCount": 3,
  "includesMine": true,
  "sources": [
    {
      "question": "질문 1 · 불편",
      "summary": "과제 공지가 메일·LMS·단톡으로 흩어져 마감을 놓침"
    },
    {
      "question": "질문 1 · 불편",
      "summary": "팀플 회비를 누가 냈는지 헷갈림"
    },
    {
      "question": "질문 4 · 쓰는 서비스",
      "summary": "피그마 수정 내역을 추적하기 어렵고, 노션엔 팀원이 잘 안 들어옴"
    }
  ],
  "why": "세 재료는 서로 다른 묶음(흩어진 학교 정보 · 돈·정산 · 팀의 조건)에 있었어요. 겉은 달라도 모두 \"기록이 한곳에 없다\"는 같은 문제예요.",
  "candidates": [
    {
      "id": "ide_c1",
      "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
      "grade": "go",
      "isMine": true,
      "votedByMe": true
    },
    {
      "id": "aii_2",
      "title": "팀플 자료·수정 요청을 링크 하나에 모으고 바뀐 점만 요약",
      "grade": "fix",
      "isAi": true,
      "votedByMe": false
    }
  ],
  "myReaction": "didntKnow"
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `FORBIDDEN` | 403 | 투표 단계(diverge.vote) 전 |
| `NOT_FOUND` | 404 | 이 세션에 없는 id |

**백엔드 메모**

- 2명 이상의 답이 겹칠 때만 만든다.
- sources는 요약만, 답 원문 인용 금지. 누가 말했는지는 진행자도 모른다.
- includesMine은 본인에게만 계산해서 준다.
- 투표 단계(diverge.vote) 전에는 id가 맞든 틀리든 403 FORBIDDEN (선입견 방지 — 아이디어 제출이 끝난 뒤, 투표 때만 공개).
- 만드는 때: diverge.board에 들어갈 때(아이디어 제출 마감 후). 재료 묶음 + 아이디어를 넣고, 서로 다른 묶음에 있던 재료만 잇는다. 최대 3개.
- candidates의 isMine · votedByMe는 요청한 사람 기준.

### `PUT /api/v1/sessions/{sessionId}/vote/me` — 내 표 저장 (최대 2표)

- **API id**: `vote.save` (프론트: `api.call('vote.save', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 체크한 후보 전체를 보낸다(추가·취소를 한 번에). 아이디어와 AI 아이디어 모두 1표씩.

**요청 본문**

```json
{
  "ids": [
    "ide_c1",
    "ide_a2"
  ]
}
```

**응답** `200`

```json
{
  "myVotes": [
    "ide_c1",
    "ide_a2"
  ],
  "remaining": 0
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `VOTE_LIMIT` | 409 | 2표 초과 |
| `NOT_A_CANDIDATE` | 400 | 숨은 공통점 등 후보가 아닌 id |
| `VOTE_FINISHED` | 409 | 투표 마치기 이후 |

**백엔드 메모**

- 누가 어디에 투표했는지는 끝까지 비공개. 결과 집계에서만 합계로 쓴다.
- 자기 아이디어에 투표하는 것은 허용(디자인상 체크됨).

### `PUT /api/v1/sessions/{sessionId}/common-threads/{threadId}/reaction` — "이 연결, 알고 있었나요?"

- **API id**: `vote.threadReact` (프론트: `api.call('vote.threadReact', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 몰랐어요 · 이미 알았어요. 기능 개선용 통계.

**요청 본문**

```json
{
  "reaction": "didntKnow | knew"
}
```

**응답** `200`

```json
{
  "myReaction": "didntKnow"
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `VALIDATION` | 400 | reaction 값이 didntKnow · knew가 아님 |
| `FORBIDDEN` | 403 | 투표 단계(diverge.vote) 전 |
| `NOT_FOUND` | 404 | 이 세션에 없는 id |

**백엔드 메모**

- 다시 보내면 마지막 값으로 바뀐다(PUT).
- 통계는 서비스 개선용. 진행자 · 팀원 화면 어디에도 보여주지 않는다.

### `POST /api/v1/sessions/{sessionId}/vote/me/finish` — 투표 마치기

- **API id**: `vote.finish` (프론트: `api.call('vote.finish', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 내 투표를 확정한다. 모두 마치면 결과가 열린다(vote.closed 이벤트).

**요청 본문**

```json
{}
```

**응답** `200`

```json
{
  "finished": true,
  "votedCount": 4,
  "memberCount": 4
}
```
