# 8-5 · 발산 · AI 검증 · 현실성

> **보는 사람**: 모두 (같은 화면)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

AI가 아이디어 12개를 이미 있나·우리 팀 구현 가능성(상/중/하)·팀에 없는 스킬·필요한가·기간·댓글 요약으로 살피고 3등급으로 나눈다. 참고용이며 모두 투표에 올라간다.

## 프론트엔드

**이미 구현한 것**

- ✅ 왼쪽 목록에서 아이디어 고르기
- ✅ « 목록 접기
- ✅ 실서버 모드에서 선택한 아이디어의 검증 내용을 불러와 본문 다시 그리기(renderReview)

## 백엔드가 해야 할 일 (쉽게)

- <b>AI 검증</b>은 댓글 단계가 끝나면 서버가 아이디어마다 돌리는 <b>뒤쪽 작업</b>이다(시간이 걸리므로 작업 큐로). 끝나면 reviews.ready 이벤트.
- ① <b>이미 있나</b>: 실제 검색 결과가 근거여야 하고, 검색 결과 링크(searchUrl)를 꼭 준다.
- ② <b>우리 팀 구현 가능성 상/중/하</b>: 팀원 프로필 스킬을 "웹 화면 2명 · 백엔드 1명"처럼 <b>인원 수로만</b> AI에 보낸다. 이름은 AI에 보내지 않는다.
- ③ <b>팀에 없는 스킬</b>: 이 아이디어에 필요한데 팀에 없는 스킬 개수와 설명. 뒤에 파트 나누기(9-1)의 "후보 없음"로 이어진다.
- ④ 필요한가(인터뷰 재료 근거) ⑤ 기간 안에 되나 ⑥ 익명 댓글 요약(개수 + 요점).
- <b>등급</b>: 대부분 긍정이면 go(바로 해볼 만해요), 한두 관점에 걸리면 fix(보완하면 좋아요), 이미 비슷한 게 많거나 기간 안에 어려우면 re(다시 생각해 봐요). <b>등급이 낮아도 빼지 않는다.</b>

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/reviews` | AI 검증 등급별 목록 |
| 화면 열 때 | `GET /sessions/{sessionId}/ideas/{ideaId}/review` | AI 검증 상세 |
| 목록에서 아이디어 선택 | `GET /sessions/{sessionId}/ideas/{ideaId}/review` | AI 검증 상세 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `reviews.ready` | AI 검증 목록 불러오기 |
| `stage.changed` | 해당 단계 화면으로 이동, 상단바 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/{sessionId}/reviews` — AI 검증 등급별 목록

- **API id**: `review.list` (프론트: `api.call('review.list', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 12개 아이디어를 3등급으로 묶은 왼쪽 목록. 등급과 상관없이 모두 투표에 올라간다.

**응답** `200`

```json
{
  "ready": true,
  "total": 12,
  "doneCount": 12,
  "groups": [
    {
      "grade": "go",
      "label": "바로 해볼 만해요",
      "items": [
        {
          "ideaId": "ide_c1",
          "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹"
        }
      ]
    },
    {
      "grade": "fix",
      "label": "보완하면 좋아요",
      "items": [
        {
          "ideaId": "ide_a1",
          "title": "열람실·카페 빈자리 지도"
        }
      ]
    },
    {
      "grade": "re",
      "label": "다시 생각해 봐요",
      "items": [
        {
          "ideaId": "ide_c2",
          "title": "강의자료 PDF 요약 도구"
        }
      ]
    }
  ]
}
```

**백엔드 메모**

- 검증이 다 끝나기 전엔 ready=false. 끝나면 reviews.ready 이벤트.
- 검증은 diverge.review 단계에 들어갈 때 시작한다. ready=false인 동안(단계 전 포함)은 {"ready": false, "total": 아이디어 수, "groups": []} — 일부 결과만 먼저 주지 않는다.
- "다 끝남" = 모든 아이디어가 done 또는 failed. 실패한 아이디어는 {"grade": "failed", "label": "검증하지 못했어요", "items": [...]} 그룹에 넣는다(그룹은 있는 것만).
- 그룹 안 순서는 작성자 · 작성 시각과 상관없이 세션마다 한 번 섞어서 고정. AI가 모은 아이디어는 이 목록에 넣지 않는다(투표 목록에서 따로).

### `GET /api/v1/sessions/{sessionId}/ideas/{ideaId}/review` — AI 검증 상세

- **API id**: `review.get` (프론트: `api.call('review.get', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 오른쪽 본문(이미 있나·구현 가능성·없는 스킬·필요·기간·댓글 요약).

**응답** `200`

```json
{
  "ideaId": "ide_c1",
  "alias": "C",
  "rank": 1,
  "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
  "status": "done",
  "grade": "go",
  "exists": {
    "label": "비슷한 게 있음",
    "summary": "일정 관리 앱은 많지만, 여러 곳의 학교 공지를 모아주는 건 드물어요.",
    "searchUrl": "https://search.example.com/?q=..."
  },
  "feasibility": {
    "level": "상",
    "summary": "웹 화면 2명 · 백엔드 1명이 있어요. 학교 사이트 자동 연결 대신 링크를 붙여넣는 방식이면 지금 수준으로 충분해요."
  },
  "missingSkills": {
    "count": 1,
    "summary": "메일·LMS 자동 연동(API) 경험 — 없어도 시연은 돼요."
  },
  "need": {
    "label": "있음",
    "summary": "인터뷰에서 2명이 공지를 놓쳐 마감을 넘긴 경험을 말했어요."
  },
  "timeline": {
    "label": "가능",
    "summary": "모으기·마감 알림만 하면 해커톤 기간 안에 시연할 수 있어요."
  },
  "commentSummary": {
    "concern": 3,
    "praise": 2,
    "concernPoints": [
      "학교마다 공지 사이트가 달라요",
      "알림이 많으면 귀찮아요"
    ],
    "praisePoints": [
      "다들 겪는 문제라 공감이 커요",
      "발표하기 쉬워요"
    ]
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `NOT_FOUND` | 404 | 이 세션에 없는 아이디어 |

**백엔드 메모**

- grade: go(바로 해볼 만해요) · fix(보완하면 좋아요) · re(다시 생각해 봐요).
- exists는 실제 검색 결과가 근거여야 하고 searchUrl을 꼭 준다. 나머지는 AI 판단(참고용).
- 구현 가능성은 팀원 스킬을 "인원 수"로만 AI에 보낸다(예: 웹 화면 2명). 이름은 AI에 보내지 않는다.
- status: pending(아직) · done · failed. pending · failed면 grade와 6개 관점이 모두 null.
- commentSummary의 concern · praise 개수는 실제 댓글 개수와 같아야 한다. 요점(points)은 작성자 없이 AI 요약.
- exists의 검색 결과에 링크가 없으면 exists는 {"label": "확인 못 함", "summary": "검색 결과가 없어요", "searchUrl": null} — 지어내지 않기.
