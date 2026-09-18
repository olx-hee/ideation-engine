# 8-6w · 발산 · 투표 마침 — 결과 기다리기

> **보는 사람**: 모두 (각자)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

투표를 마친 사람이 결과가 열릴 때까지 기다리는 화면. 대기실(6)과 같은 틀. 모두 마치면(또는 진행자가 넘기면) 자동으로 결과(8-7)로 간다.

## 프론트엔드

**이미 구현한 것**

- ✅ 열 때 vote.state로 확인 — 아직 안 마쳤으면 8-6으로 돌려보냄, 마쳤으면 "n / m명 투표 완료" 표시
- ✅ vote.progress로 인원 갱신
- ✅ vote.closed 또는 stage.changed(diverge.result)면 8-7로 자동 이동

## 백엔드가 해야 할 일 (쉽게)

- 이 화면은 <b>기다리는 화면</b>이라 새 API가 없다. vote.state의 finished · votedCount · memberCount와 vote.progress · vote.closed 이벤트만 쓴다.
- 모두 vote.finish를 하면 서버가 단계를 diverge.result로 <b>먼저 저장</b>하고 stage.changed → vote.closed를 보낸다(4차 문서). 이 화면은 둘 중 먼저 오는 것으로 이동한다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/vote` | 투표 화면 목록 + 내 표 |

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
