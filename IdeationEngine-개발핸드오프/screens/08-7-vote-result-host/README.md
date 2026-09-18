# 8-7 · 발산 · 투표 결과 · 주제 확정 (진행자 · 참가자는 보기 전용)

> **보는 사람**: 모두 (진행자만 확정 · 재투표 버튼)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

투표 결과(8표)와 함께 이때 처음으로 아이디어 주인을 공개한다. 진행자가 확정할 주제를 고르면 파트 나누기(9-1)로 넘어간다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| ○위로 확정하고 파트 나누기 → | `confirmTopic` | — |
| 동점만 다시 투표 | `revote` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 결과 줄 누르면 라디오 선택 + 버튼 문구 "N위로 확정하고…" 변경
- ✅ 주제 확정 → 파트 나누기(9-1)로 이동
- ✅ 동점 재투표(확인 창)
- ✅ 실서버 모드에서 결과 목록 그리기(renderResults)
- ✅ 참가자는 같은 화면에서 라디오·확정·재투표 버튼을 숨김(보기 전용) · topic.confirmed를 받으면 9-1로

**남은 일**

- ⬜ 팀장 고르기 UI (지금은 진행자가 그대로 팀장 · topic.confirm의 leaderParticipantId 는 준비됨) — 디자인 필요

## 백엔드가 해야 할 일 (쉽게)

- <b>투표 결과</b>: 표 수 순위와 함께 <b>이때 처음으로 아이디어 주인(닉네임과 몇 순위였는지)을 공개</b>한다. 댓글 쓴 사람과 누가 어디에 투표했는지는 <b>끝까지</b> 비공개.
- AI가 모은 아이디어는 주인 대신 "어느 아이디어의 좋은 점을 모았는지"(sourceOwners)를 보여준다.
- 동점(ties)을 계산해서 준다. "동점만 다시 투표"를 누르면 동점 후보만으로 짧은 재투표를 열고, 모두의 화면을 투표(8-6)로 되돌린다.
- 결과 화면의 인사이트 카드("1위와 ○○는 같은 숨은 공통점…")는 숨은 공통점 데이터에서 상위 후보끼리 연결된 것을 골라 만든다(참고용).
- <b>주제 확정</b>: 고른 아이디어를 세션 주제로 저장하고 파트 나누기 단계(team.split)로 넘긴다(topic.confirmed + stage.changed). 파트 나누기 AI 작업을 이때 시작한다.
- 표를 받지 못한 아이디어도 주인과 함께 기록(보고서·지난 세션)에 남긴다.
- <b>팀장</b>: topic.confirm의 leaderParticipantId로 배치를 확정할 사람을 정한다. 안 보내면 진행자가 팀장이 된다(9-4).

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/vote/results` | 투표 결과 + 아이디어 주인 공개 |
| 주제 확정 | `POST /sessions/{sessionId}/topic` | 주제 확정 (+ 팀장 정하기) |
| 동점만 다시 투표 | `POST /sessions/{sessionId}/vote/revote` | 동점만 다시 투표 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `vote.closed` | 모두 8-7로 (진행자는 확정 버튼, 참가자는 보기 전용) |
| `topic.confirmed` | 파트 나누기(9-1)로 |
| `stage.changed` | 해당 단계 화면으로 이동, 상단바 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/{sessionId}/vote/results` — 투표 결과 + 아이디어 주인 공개

- **API id**: `vote.results` (프론트: `api.call('vote.results', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 표 수 순위와 함께 이때 처음으로 아이디어 주인 이름을 공개한다. 댓글 작성자·투표자는 계속 비공개.

**응답** `200`

```json
{
  "totalVotes": 8,
  "memberCount": 4,
  "unvotedCount": 9,
  "ranks": [
    {
      "rank": 1,
      "id": "ide_c1",
      "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
      "grade": "go",
      "votes": 3,
      "owner": {
        "nickname": "노형원",
        "rank": 1
      }
    },
    {
      "rank": 2,
      "id": "ide_b1",
      "title": "관심 있는 학교 행사·특강 소식만 골라 알려주는 웹",
      "grade": "go",
      "votes": 2,
      "owner": {
        "nickname": "김승희",
        "rank": 1
      }
    },
    {
      "rank": 3,
      "id": "ide_a2",
      "title": "팀플 회의가 끝나면 할 일을 정리해 주는 서비스",
      "grade": "go",
      "votes": 1,
      "owner": {
        "nickname": "이세민",
        "rank": 2
      }
    },
    {
      "rank": 3,
      "id": "aii_1",
      "title": "시험기간에만 여는 열람실·카페 빈자리·콘센트 제보판",
      "grade": "go",
      "votes": 1,
      "aiMerged": true,
      "sourceOwners": [
        {
          "nickname": "이세민",
          "rank": 1
        },
        {
          "nickname": "박상진",
          "rank": 3
        }
      ]
    },
    {
      "rank": 3,
      "id": "ide_b2",
      "title": "중고 전공책을 같은 학과 안에서만 사고파는 게시판",
      "grade": "go",
      "votes": 1,
      "owner": {
        "nickname": "김승희",
        "rank": 2
      }
    }
  ],
  "ties": [
    {
      "rank": 3,
      "ids": [
        "ide_a2",
        "aii_1",
        "ide_b2"
      ]
    }
  ],
  "insight": {
    "title": "1위와 \"회의 후 할 일 정리\"는 같은 숨은 공통점에서 나왔어요",
    "body": "둘 다 팀플에서 \"누가 무엇을 했는지\"가 한곳에 남지 않는 문제를 풀어요. …",
    "threadId": "thr_1"
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `VOTE_NOT_CLOSED` | 409 | 아직 투표 중 |

**백엔드 메모**

- 표를 받지 못한 아이디어도 주인과 함께 기록에 남긴다(unvotedCount).

### `POST /api/v1/sessions/{sessionId}/topic` — 주제 확정 (+ 팀장 정하기)

- **API id**: `topic.confirm` (프론트: `api.call('topic.confirm', …)`)
- **누가 부를 수 있나**: 세션 진행자만
- **하는 일**: 선택한 아이디어를 세션 주제로 확정하고 파트 나누기 단계(9-1)로 넘긴다. 기본값은 1위.

**요청 본문**

```json
{
  "ideaId": "ide_c1",
  "leaderParticipantId": "par_03"
}
```

**응답** `200`

```json
{
  "topic": {
    "ideaId": "ide_c1",
    "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹"
  },
  "leader": {
    "participantId": "par_03",
    "nickname": "김승희"
  },
  "stage": {
    "id": "team.split",
    "label": "파트 나누기 · 보고서",
    "subStep": 2,
    "progress": 70
  }
}
```

**백엔드 메모**

- 확정되면 topic.confirmed + stage.changed 이벤트. <b>파트 나누기 AI 작업(11)</b>을 이때 시작한다 → 끝나면 team.parts.ready.
- leaderParticipantId(팀장)는 <b>선택</b>이다. 안 보내면 진행자가 팀장이 된다. 8-7에 팀장 고르기 UI는 아직 디자인이 없다(디자인 확인 필요).
- 팀장은 배치 초안을 고치고 확정하는 사람이다(9-4). 진행자와 달라도 된다.

### `POST /api/v1/sessions/{sessionId}/vote/revote` — 동점만 다시 투표

- **API id**: `vote.revote` (프론트: `api.call('vote.revote', …)`)
- **누가 부를 수 있나**: 세션 진행자만
- **하는 일**: 동점 후보만 가지고 짧은 재투표를 연다. 모두의 화면이 투표(8-6)로 돌아가고 후보가 줄어든다.

**요청 본문**

```json
{
  "ids": [
    "ide_a2",
    "aii_1",
    "ide_b2"
  ],
  "maxVotes": 1
}
```

**응답** `200`

```json
{
  "revoteId": "rv_1",
  "candidates": [
    "ide_a2",
    "aii_1",
    "ide_b2"
  ]
}
```
