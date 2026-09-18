# 9-4 · 팀장 확정 — 회의 내용 반영

> **보는 사람**: 팀장  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

팀장이 회의에서 말로 정한 대로 담당을 바꾸고 확정한다. 바꾼 줄은 표시되고, 분량이 한쪽으로 쏠리면 작은 일을 옮기자는 제안이 뜬다. 확정하면 모두에게 보고서가 열린다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 그대로 둘게요 (제안 닫기) | `keepSuggestion` | — |
| 옮기기 (제안대로 바꾸기) | `moveSuggestion` | — |
| AI 초안으로 되돌리기 | `revertAssign` | — |
| 이대로 확정하고 보고서 만들기 | `confirmAssign` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 맡은 사람 칸을 누르면 팀원 목록이 열리고, 고르면 담당 변경(team.reassign)
- ✅ 바꾼 줄 강조 · 분량 막대·"많아요/줄었어요" 다시 계산(서버 응답으로)
- ✅ 옮기기 제안 받기 / 그대로 두기
- ✅ AI 초안으로 되돌리기(확인 창)
- ✅ 확정 → 보고서(9-5)로 이동
- ✅ 팀장이 아닌 사람이 열면 9-3으로 보냄

**남은 일**

- ⬜ 담당 고르는 목록(드롭다운) 디자인 확인 — 지금은 흰 카드에 팀원 목록
- ⬜ 후보 없는 파트에 담당을 넣고 싶을 때의 화면 (지금은 선택칸 없음)

## 백엔드가 해야 할 일 (쉽게)

- <b>팀장만</b> 담당을 바꾸고 확정할 수 있다(그 외에는 403 NOT_LEADER). 팀장은 주제 확정 때 정해진다.
- 담당을 바꾸면 <b>분량과 옮기기 제안을 다시 계산</b>해서 배치 전체를 돌려준다. AI 초안과 같아지면 "바꿈" 표시를 뗀다.
- <b>확정</b>: 요청의 version이 서버와 다르면 409 (그 사이 누가 바꿨다는 뜻). 확정하면 보고서 AI 작업을 시작하고 모두에게 stage.changed(report)를 보낸다.
- 확정 뒤에도 팀장은 담당을 고칠 수 있고, 그러면 보고서를 다시 만든다(report.ready).

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/team/assignment` | 배치 초안 · 분량 (9-3 모두 · 9-4 팀장) |
| 맡은 사람 바꾸기 | `PUT /sessions/{sessionId}/team/parts/{partId}/assignee` | 맡은 사람 바꾸기 (팀장 · 9-4) |
| 옮기기 / 그대로 둘게요 | `POST /sessions/{sessionId}/team/suggestions/{suggestionId}` | 옮기기 제안 받기 · 그대로 두기 (팀장) |
| AI 초안으로 되돌리기 | `POST /sessions/{sessionId}/team/assignment/revert` | AI 초안으로 되돌리기 (팀장) |
| 이대로 확정하고 보고서 만들기 | `POST /sessions/{sessionId}/team/assignment/confirm` | 배치 확정 → 보고서 만들기 (팀장) |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `team.assignment.updated` | 배치 초안 다시 불러오기 (팀장이 바꿈 · 팀원이 표시함) |
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

### `PUT /api/v1/sessions/{sessionId}/team/parts/{partId}/assignee` — 맡은 사람 바꾸기 (팀장 · 9-4)

- **API id**: `team.reassign` (프론트: `api.call('team.reassign', …)`)
- **누가 부를 수 있나**: 팀장만 (참가자 중 1명)
- **하는 일**: 회의에서 말로 정한 대로 파트의 담당을 바꾼다. 분량·쏠림 제안을 다시 계산해서 배치 전체를 돌려준다.

**요청 본문**

```json
{
  "participantId": "par_02"
}
```

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

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `NOT_LEADER` | 403 | 팀장이 아님 |
| `VALIDATION` | 400 | 이 세션 참가자가 아닌 participantId · 후보 없음(excluded) 파트 |

**백엔드 메모**

- AI 초안 담당과 같아지면 changed=false로 되돌린다.
- 배치 확정(team.confirm) 뒤에도 팀장은 이 API로 담당을 고칠 수 있다 → 보고서의 파트·워크플로우를 다시 만들고 report.ready 이벤트(보고서 수정 화면 디자인은 아직 없음).

### `POST /api/v1/sessions/{sessionId}/team/suggestions/{suggestionId}` — 옮기기 제안 받기 · 그대로 두기 (팀장)

- **API id**: `team.suggestion` (프론트: `api.call('team.suggestion', …)`)
- **누가 부를 수 있나**: 팀장만 (참가자 중 1명)
- **하는 일**: "옮기기"면 제안대로 작은 일의 담당을 바꾸고, "그대로 둘게요"면 제안만 닫는다.

**요청 본문**

```json
{
  "accept": true
}
```

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

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `NOT_LEADER` | 403 | 팀장이 아님 |
| `SUGGESTION_STALE` | 409 | 그 사이 배치가 바뀌어 제안이 더 이상 맞지 않음 → 프론트는 다시 불러오기 |

### `POST /api/v1/sessions/{sessionId}/team/assignment/revert` — AI 초안으로 되돌리기 (팀장)

- **API id**: `team.revert` (프론트: `api.call('team.revert', …)`)
- **누가 부를 수 있나**: 팀장만 (참가자 중 1명)
- **하는 일**: 팀장이 바꾼 담당을 모두 AI 초안으로 되돌린다. 팀원 표시(marks)는 남긴다.

**요청 본문**

```json
{}
```

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

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `NOT_LEADER` | 403 | 팀장이 아님 |
| `ASSIGNMENT_CONFIRMED` | 409 | 이미 확정됨 |

### `POST /api/v1/sessions/{sessionId}/team/assignment/confirm` — 배치 확정 → 보고서 만들기 (팀장)

- **API id**: `team.confirm` (프론트: `api.call('team.confirm', …)`)
- **누가 부를 수 있나**: 팀장만 (참가자 중 1명)
- **하는 일**: 지금 배치를 확정하고 보고서 단계로 넘긴다. 모두의 화면이 보고서(9-5)로 이동한다.

**요청 본문**

```json
{
  "version": 3
}
```

**응답** `200`

```json
{
  "status": "confirmed",
  "reportReady": false,
  "stage": {
    "id": "report",
    "label": "파트 나누기 · 보고서",
    "subStep": 6,
    "progress": 100
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `NOT_LEADER` | 403 | 팀장이 아님 |
| `VERSION_MISMATCH` | 409 | 보고 있던 배치가 최신이 아님(그 사이 바뀜) → 다시 불러온 뒤 확정 |
| `ASSIGNMENT_CONFIRMED` | 409 | 이미 확정됨 |

**백엔드 메모**

- 요청의 version이 서버 배치 version과 다르면 409 (다른 창에서 바꾼 걸 모르고 확정하는 것 방지).
- 확정하면 team.confirmed + stage.changed(report) 이벤트, AI 작업 15(보고서 요약·워크플로우)를 시작. 끝나면 report.ready.
- 세션을 끝난 상태(status=ended)로 바꾸고 지난 세션 기록(A4)의 reportAvailable=true.
