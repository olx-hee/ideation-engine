# 9-3 · 배치 초안 (모두가 보는 화면)

> **보는 사람**: 모두 (팀장은 9-4)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

파트마다 가장 잘할 사람으로 만든 AI 배치 초안. 사람별 분량 막대와 "이렇게 맞췄어요" 설명을 보고, 회의에서 바꾸고 싶은 파트를 표시해 두면 팀장 화면에 모인다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 이야기해 볼 파트 표시하기 | `markMode` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 실서버 모드: 분량 카드·배치표·작은 일·오른쪽 설명을 team.assignment로 그리기
- ✅ "이야기해 볼 파트 표시하기" → 표시 모드에서 파트 줄을 눌러 표시/해제 (team.mark)
- ✅ 팀장이 바꾸면(team.assignment.updated) 자동으로 다시 그리기
- ✅ 팀장이 확정하면 보고서(9-5)로 이동
- ✅ 팀장이 이 화면을 열면 팀장 화면(9-4)으로 보냄

**남은 일**

- ⬜ 표시 모드 디자인 확인 (지금은 표시한 줄에 회색 "표시함" 배지만)

## 백엔드가 해야 할 일 (쉽게)

- <b>배치 초안</b>: 겹친 파트는 추가 질문 결과로, 후보 1명인 파트는 그대로, 후보 없는 파트는 담당 없이 대안으로 둔다.
- <b>작은 일</b>은 핵심·보통 파트가 적은 사람일수록 더 맡게 나눠서 네 사람의 <b>분량이 비슷</b>해지게 한다. 분량은 파트마다 추정한 작업량(effort)의 합.
- <b>표시(mark)</b>는 "회의에서 이야기해 보자"는 뜻이다. 누가 표시했는지는 <b>팀장에게만</b> 보여준다.
- 팀원(팀장이 아닌 사람)이 부르는 응답에는 marks·changes·suggestion을 넣지 않는다.
- 배치가 바뀔 때마다 version을 올리고 team.assignment.updated 이벤트를 보낸다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/team/assignment` | 배치 초안 · 분량 (9-3 모두 · 9-4 팀장) |
| 파트 줄 누르기(표시 모드) | `PUT /sessions/{sessionId}/team/parts/{partId}/mark` | 이야기해 볼 파트 표시 · 해제 (9-3) |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `team.assignment.updated` | 배치 초안 다시 불러오기 (팀장이 바꿈 · 팀원이 표시함) |
| `team.confirmed` | 보고서(9-5)로 이동 |
| `stage.changed` | 해당 단계 화면으로 이동, 상단바 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/{sessionId}/team/assignment` — 배치 초안 · 분량 (9-3 모두 · 9-4 팀장)

- **API id**: `team.assignment` (프론트: `api.call('team.assignment', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 파트마다 맡은 사람과 정한 방법, 사람별 분량. 팀장이 부르면 팀원이 표시한 파트(marks) · 바꾼 내용(changes) · 옮기기 제안(suggestion)도 준다.

**응답** `200`

```json
{
  "status": "draft",
  "version": 3,
  "leader": {
    "participantId": "par_03",
    "nickname": "김승희"
  },
  "viewer": {
    "participantId": "par_03",
    "isLeader": true
  },
  "members": [
    {
      "participantId": "par_01",
      "nickname": "노형원",
      "counts": {
        "core": 1,
        "normal": 1,
        "small": 0
      },
      "loadPct": 70,
      "over": false,
      "changeFromDraft": "less"
    },
    {
      "participantId": "par_04",
      "nickname": "박상진",
      "counts": {
        "core": 1,
        "normal": 0,
        "small": 1
      },
      "loadPct": 86,
      "over": false,
      "changeFromDraft": null
    },
    {
      "participantId": "par_03",
      "nickname": "김승희",
      "isMe": true,
      "counts": {
        "core": 0,
        "normal": 1,
        "small": 2
      },
      "loadPct": 84,
      "over": false,
      "changeFromDraft": null
    },
    {
      "participantId": "par_02",
      "nickname": "이세민",
      "counts": {
        "core": 1,
        "normal": 1,
        "small": 3
      },
      "loadPct": 100,
      "over": true,
      "changeFromDraft": "more"
    }
  ],
  "parts": [
    {
      "partId": "prt_1",
      "name": "화면 만들기",
      "tier": "core",
      "assignee": {
        "participantId": "par_01",
        "nickname": "노형원"
      },
      "method": "question",
      "methodLabel": "추가 질문으로 정했어요",
      "changed": false
    },
    {
      "partId": "prt_2",
      "name": "서버 · 공지 모으기",
      "tier": "core",
      "assignee": {
        "participantId": "par_04",
        "nickname": "박상진"
      },
      "method": "single",
      "methodLabel": "후보 1명 · 백엔드",
      "changed": false
    },
    {
      "partId": "prt_3",
      "name": "발표 · 시연",
      "tier": "core",
      "assignee": {
        "participantId": "par_02",
        "nickname": "이세민"
      },
      "method": "question",
      "methodLabel": "추가 질문으로 정했어요",
      "changed": true,
      "aiAssignee": {
        "participantId": "par_01",
        "nickname": "노형원"
      },
      "marks": [
        {
          "participantId": "par_02",
          "nickname": "이세민"
        }
      ]
    },
    {
      "partId": "prt_4",
      "name": "화면 디자인",
      "tier": "normal",
      "assignee": {
        "participantId": "par_02",
        "nickname": "이세민"
      },
      "method": "question",
      "methodLabel": "추가 질문으로 정했어요",
      "changed": false
    },
    {
      "partId": "prt_5",
      "name": "발표 자료",
      "tier": "normal",
      "assignee": {
        "participantId": "par_03",
        "nickname": "김승희"
      },
      "method": "single",
      "methodLabel": "후보 1명 · PPT 디자인",
      "changed": false
    },
    {
      "partId": "prt_6",
      "name": "기획 · 범위 관리",
      "tier": "normal",
      "assignee": {
        "participantId": "par_01",
        "nickname": "노형원"
      },
      "method": "single",
      "methodLabel": "후보 1명 · 서비스 기획",
      "changed": false
    },
    {
      "partId": "prt_7",
      "name": "메일·LMS 자동 연동",
      "tier": "normal",
      "assignee": null,
      "method": "excluded",
      "methodLabel": "링크 붙여넣기로 대신 · 팀 선택",
      "changed": false,
      "alternative": "링크 붙여넣기로 대신"
    },
    {
      "partId": "prt_s1",
      "name": "경쟁 서비스 조사",
      "tier": "small",
      "assignee": {
        "participantId": "par_02",
        "nickname": "이세민"
      },
      "method": "balance",
      "methodLabel": "분량 맞추기",
      "changed": false
    },
    {
      "partId": "prt_s2",
      "name": "사용자 인터뷰 3명",
      "tier": "small",
      "assignee": {
        "participantId": "par_03",
        "nickname": "김승희"
      },
      "method": "balance",
      "methodLabel": "분량 맞추기",
      "changed": false
    },
    {
      "partId": "prt_s3",
      "name": "시연용 예시 공지 만들기",
      "tier": "small",
      "assignee": {
        "participantId": "par_02",
        "nickname": "이세민"
      },
      "method": "balance",
      "methodLabel": "분량 맞추기",
      "changed": false
    },
    {
      "partId": "prt_s4",
      "name": "제출 문서 · 보고서 정리",
      "tier": "small",
      "assignee": {
        "participantId": "par_03",
        "nickname": "김승희"
      },
      "method": "balance",
      "methodLabel": "분량 맞추기",
      "changed": false
    },
    {
      "partId": "prt_s5",
      "name": "기능 테스트 · 버그 기록",
      "tier": "small",
      "assignee": {
        "participantId": "par_02",
        "nickname": "이세민"
      },
      "method": "balance",
      "methodLabel": "분량 맞추기",
      "changed": false
    },
    {
      "partId": "prt_s6",
      "name": "회의록 · 일정 챙기기",
      "tier": "small",
      "assignee": {
        "participantId": "par_04",
        "nickname": "박상진"
      },
      "method": "balance",
      "methodLabel": "분량 맞추기",
      "changed": false
    }
  ],
  "balance": {
    "note": "노형원 님에게 핵심 파트가 몰려서 작은 일은 드리지 않았어요. 작은 일 6개는 핵심 파트가 적은 사람일수록 더 맡아, 네 분의 분량이 비슷해지게 했어요.",
    "smallTaskCounts": [
      {
        "nickname": "이세민",
        "count": 3,
        "why": "보통 파트 1개"
      },
      {
        "nickname": "김승희",
        "count": 2,
        "why": "보통 파트 1개"
      },
      {
        "nickname": "박상진",
        "count": 1,
        "why": "핵심 파트 1개"
      }
    ]
  },
  "myParts": [],
  "markedByMe": [],
  "changes": [
    {
      "type": "mark",
      "partId": "prt_3",
      "partName": "발표 · 시연",
      "by": {
        "participantId": "par_02",
        "nickname": "이세민"
      }
    },
    {
      "type": "change",
      "partId": "prt_3",
      "partName": "발표 · 시연",
      "from": {
        "participantId": "par_01",
        "nickname": "노형원"
      },
      "to": {
        "participantId": "par_02",
        "nickname": "이세민"
      }
    }
  ],
  "suggestion": {
    "suggestionId": "sug_1",
    "partId": "prt_s3",
    "partName": "시연용 예시 공지 만들기",
    "from": {
      "participantId": "par_02",
      "nickname": "이세민"
    },
    "to": {
      "participantId": "par_01",
      "nickname": "노형원"
    },
    "reason": "발표·시연을 이세민 님이 맡으면서 이세민 님 분량이 많아졌어요. 작은 일 하나를 옮기면 다시 비슷해져요."
  }
}
```

**백엔드 메모**

- method: question(추가 질문으로 정함) · single(후보 1명) · balance(작은 일 분량 맞추기) · excluded(후보 없음 → 대안으로 대신, assignee=null).
- <b>팀원(팀장 아님)이 부를 때</b>: marks · changes · suggestion은 null, 대신 markedByMe(내가 표시한 partId 목록)와 myParts(내 파트 이름)를 채운다. 누가 표시했는지는 팀장에게만 보인다.
- members[].loadPct: 가장 많은 사람 = 100 기준의 분량 막대. over=true면 "많아요"(평균보다 15% 넘게 많음), changeFromDraft="less"면 "줄었어요"(AI 초안보다 줄어듦).
- 분량은 파트마다 AI가 추정한 작업량(effort 1~5)의 합. 핵심 파트가 몰린 사람에게는 작은 일을 주지 않는 방식으로 맞춘다(AI 작업 14).
- changed=true면 팀장이 AI 초안과 다르게 바꾼 파트, aiAssignee는 원래 초안 담당.
- suggestion: 분량이 한쪽으로 쏠렸을 때(over) 그 사람의 <b>작은 일</b> 하나를 가장 여유 있는 사람에게 옮기자는 제안 1개. 쏠린 사람이 작은 일을 하나도 안 맡았거나 팀장이 "그대로 둘게요"를 누른 제안이면 null.
- 바뀔 때마다 version을 올리고 team.assignment.updated 이벤트를 보낸다.

### `PUT /api/v1/sessions/{sessionId}/team/parts/{partId}/mark` — 이야기해 볼 파트 표시 · 해제 (9-3)

- **API id**: `team.mark` (프론트: `api.call('team.mark', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 회의에서 바꾸고 싶은 파트를 표시한다. 팀장 화면(9-4)의 "회의에서 바꾼 것"에 모인다.

**요청 본문**

```json
{
  "marked": true
}
```

**응답** `200`

```json
{
  "partId": "prt_3",
  "marked": true
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `STAGE_CLOSED` | 409 | 배치 확정 이후 |

**백엔드 메모**

- 누가 표시했는지는 팀장에게만 보인다(다른 팀원에게는 비공개).
- 표시하면 team.assignment.updated 이벤트(팀장 화면 갱신).
