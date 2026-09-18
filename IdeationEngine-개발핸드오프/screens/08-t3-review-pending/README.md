# T3 · AI 검증이 아직 안 끝났을 때 (8-5 · ready=false)

> **보는 사람**: 모두  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

댓글 단계가 끝나면 AI 검증(5차)이 뒤에서 돈다. 끝나기 전에 8-5를 열면 이 안내가 뜨고, reviews.ready가 오면 목록이 그려진다. 진행자도 끝나기 전엔 투표로 넘길 수 없다(409 STAGE_LOCKED).

## 프론트엔드

**이미 구현한 것**

- ✅ 8-5가 열릴 때 review.list의 ready · doneCount · total로 진행 표시(8-5 screen.js `pending`)
- ✅ reviews.ready → 다시 불러와서 안내 걷기

**남은 일**

- ⬜ 검증에 실패한 아이디어의 "검증 실패" 표시(목록 그리기와 함께)

## 백엔드가 해야 할 일 (쉽게)

- review.list는 검증이 끝나기 전에도 200으로 답하되 ready=false · doneCount · total을 준다(5차). 끝나면 reviews.ready 이벤트.
- 한 아이디어의 검증이 실패해도 전체를 막지 않는다 — 그 아이디어만 "검증 실패"로 두고 ready=true.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/reviews` | AI 검증 등급별 목록 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `reviews.ready` | AI 검증 목록 불러오기 |

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
