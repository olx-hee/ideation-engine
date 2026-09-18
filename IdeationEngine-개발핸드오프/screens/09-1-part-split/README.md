# 9-1 · 파트 나누기 — 후보 찾기

> **보는 사람**: 모두 (각자)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

확정된 주제를 파트로 나누고, 파트마다 프로필 스킬로 맡을 수 있는 후보를 보여준다. 후보가 겹친 파트는 그 사람들에게만 추가 질문(9-2)으로 정하고, 팀에 없는 스킬은 "후보 없음 + 대안"으로 표시한다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 진행자만 보이는 다음 단계 버튼 | `advanceTeam` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 실서버 모드: 파트·후보·내가 후보인 파트를 team.parts로 그리기
- ✅ 단계가 추가 질문(team.questions)으로 바뀌고 내게 질문이 있으면 9-2로 자동 이동, 없으면 이 화면에서 기다림
- ✅ 진행자에게만 "추가 질문 시작 →"(겹친 후보가 없으면 "배치 초안 보기 →") 버튼 표시
- ✅ 파트 나누기 AI가 끝나면(team.parts.ready) 자동으로 다시 그리기

**남은 일**

- ⬜ AI가 파트를 나누는 중(ready=false)일 때 기다리는 화면 디자인 — 지금은 안내 문구만
- ⬜ 진행자용 다음 단계 버튼은 디자인에 없어서 임시로 넣음 (디자인 확인 필요)

## 백엔드가 해야 할 일 (쉽게)

- <b>주제 확정 직후</b> 파트 나누기 AI 작업이 돈다. 확정된 주제를 <b>핵심 파트 / 보통 파트 / 작은 일</b>로 나누고, 파트마다 필요한 스킬을 정한다.
- <b>후보</b>는 참가자 프로필 스냅샷의 "할 수 있는 것"과 파트의 필요한 스킬을 맞춰서 고른다. 2명 이상이면 <b>겹침</b>(추가 질문), 1명이면 바로 배정, 없으면 <b>후보 없음</b> + 대안 한 줄.
- AI에는 <b>이름을 보내지 않는다</b>. P1·P2 같은 임시 번호와 스킬 목록만 보낸다.
- 인터뷰의 "피하고 싶은 것"은 후보를 고를 때 조용히 빼는 데만 쓰고, 화면에 이유로 쓰지 않는다.
- 작은 일(스킬 없이 누구나)은 이 화면에서는 개수와 이름만 보여주고, 사람에게 나누는 것은 배치 초안(9-3)에서 한다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}` | 세션 상태 |
| 화면 열 때 | `GET /sessions/{sessionId}/team/parts` | 파트와 후보 (9-1) |
| 진행자: 다음 단계 | `POST /sessions/{sessionId}/stage/next` | 다음 단계로 넘기기 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `team.parts.ready` | 파트·후보 목록 불러오기 (AI 파트 나누기 끝) |
| `stage.changed` | 해당 단계 화면으로 이동, 상단바 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/{sessionId}` — 세션 상태

- **API id**: `session.get` (프론트: `api.call('session.get', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 모든 세션 화면의 상단바(단계 이름·전체 진행률·타이머·내 역할)를 채운다. 새로고침·재접속하면 이걸로 지금 있어야 할 화면을 정한다.

**응답** `200`

```json
{
  "sessionId": "ses_7K2X9",
  "code": "7K2X9M",
  "inviteUrl": "https://ideationengine.app/s/7K2X9M",
  "topic": "교내 해커톤에서 만들 서비스 아이디어 정하기",
  "criteria": null,
  "durationMin": 30,
  "maxMembers": 4,
  "status": "running",
  "stage": {
    "id": "diverge.vote",
    "label": "아이디어 발산",
    "subStep": 5,
    "progress": 55
  },
  "timer": {
    "endsAt": "2026-09-18T15:32:10+09:00",
    "remainingSec": 130
  },
  "host": {
    "participantId": "par_01",
    "nickname": "노형원"
  },
  "me": {
    "participantId": "par_01",
    "role": "host",
    "isLeader": false
  },
  "memberCount": 3
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `NOT_PARTICIPANT` | 403 | 이 세션 참가자가 아님 → 프론트가 방 코드 입장(2)으로 |
| `KICKED` | 403 | 내보내진 사람 |

**백엔드 메모**

- me.isLeader: 파트 배치를 확정하는 <b>팀장</b>인지. 주제 확정(topic.confirm) 때 정해지고, 그 전에는 모두 false.
- 프론트는 stage.id로 지금 있어야 할 화면을 정한다(team.assign 단계는 팀장이면 9-4, 나머지는 9-3).

### `GET /api/v1/sessions/{sessionId}/team/parts` — 파트와 후보 (9-1)

- **API id**: `team.parts` (프론트: `api.call('team.parts', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 확정된 주제를 파트로 나누고, 파트마다 프로필 스킬로 찾은 후보를 준다. 후보가 2명 이상이면 overlap(추가 질문), 1명이면 single(바로 배정), 없으면 none(대안 제안).

**응답** `200`

```json
{
  "ready": true,
  "topic": {
    "ideaId": "ide_c1",
    "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
    "owner": {
      "nickname": "노형원",
      "rank": 1
    },
    "votes": 3,
    "feasibility": "상"
  },
  "parts": [
    {
      "partId": "prt_1",
      "tier": "core",
      "name": "화면 만들기",
      "desc": "공지 목록 · 마감 알림 화면",
      "skill": "프론트엔드",
      "status": "overlap",
      "candidates": [
        {
          "participantId": "par_01",
          "nickname": "노형원",
          "isMe": true
        },
        {
          "participantId": "par_02",
          "nickname": "이세민"
        }
      ]
    },
    {
      "partId": "prt_2",
      "tier": "core",
      "name": "서버 · 공지 모으기",
      "desc": "게시판 글 가져오기 · 알림 보내기",
      "skill": "백엔드",
      "status": "single",
      "candidates": [
        {
          "participantId": "par_04",
          "nickname": "박상진"
        }
      ]
    },
    {
      "partId": "prt_3",
      "tier": "core",
      "name": "발표 · 시연",
      "desc": "문제 정의 · 시연 흐름 · 질의응답",
      "skill": "발표·피칭",
      "status": "overlap",
      "candidates": [
        {
          "participantId": "par_01",
          "nickname": "노형원",
          "isMe": true
        },
        {
          "participantId": "par_02",
          "nickname": "이세민"
        }
      ]
    },
    {
      "partId": "prt_4",
      "tier": "normal",
      "name": "화면 디자인",
      "desc": "화면 분위기 · 컴포넌트 스타일",
      "skill": "웹 디자인",
      "status": "overlap",
      "candidates": [
        {
          "participantId": "par_02",
          "nickname": "이세민"
        },
        {
          "participantId": "par_03",
          "nickname": "김승희"
        }
      ]
    },
    {
      "partId": "prt_5",
      "tier": "normal",
      "name": "발표 자료",
      "desc": "장표 구성 · 시각화",
      "skill": "PPT 디자인",
      "status": "single",
      "candidates": [
        {
          "participantId": "par_03",
          "nickname": "김승희"
        }
      ]
    },
    {
      "partId": "prt_6",
      "tier": "normal",
      "name": "기획 · 범위 관리",
      "desc": "기능 범위 · 진행 조율",
      "skill": "서비스 기획",
      "status": "single",
      "candidates": [
        {
          "participantId": "par_01",
          "nickname": "노형원",
          "isMe": true
        }
      ]
    },
    {
      "partId": "prt_7",
      "tier": "normal",
      "name": "메일·LMS 자동 연동",
      "desc": "AI 검증에서 나온 팀에 없는 스킬",
      "skill": "외부 API 연동",
      "status": "none",
      "candidates": [],
      "alternative": "링크 붙여넣기로 대신하기"
    }
  ],
  "smallTasks": {
    "count": 6,
    "names": [
      "경쟁 서비스 조사",
      "사용자 인터뷰 3명",
      "시연용 예시 공지 만들기",
      "제출 문서 · 보고서 정리",
      "기능 테스트 · 버그 기록",
      "회의록 · 일정 챙기기"
    ],
    "note": "분량이 비슷해지게 나눠요"
  },
  "mine": [
    {
      "partId": "prt_1",
      "name": "화면 만들기",
      "status": "overlap"
    },
    {
      "partId": "prt_3",
      "name": "발표 · 시연",
      "status": "overlap"
    },
    {
      "partId": "prt_6",
      "name": "기획 · 범위 관리",
      "status": "single"
    }
  ],
  "myPendingQuestions": 0
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `NOT_PARTICIPANT` | 403 | 이 세션 참가자가 아님 |

**백엔드 메모**

- 주제 확정(topic.confirm) 직후 AI 작업 11(파트 나누기)이 돈다. 끝나기 전에는 {"ready": false} → 끝나면 team.parts.ready 이벤트.
- tier: core(결과를 좌우하는 파트) · normal(보통 파트) · small(작은 일, 스킬 없이 누구나). small은 parts에 넣지 않고 smallTasks로 이름만 준다(9-3에서 사람에게 나눔).
- 후보는 참가자 프로필 스냅샷의 "할 수 있는 것"(skills)과 파트의 필요한 스킬로 정한다. AI에는 이름 대신 P1·P2 같은 임시 번호와 스킬만 보낸다.
- 인터뷰의 "피하고 싶은 것"은 후보에서 빼는 데만 조용히 쓰고, 화면·응답 어디에도 이유로 쓰지 않는다.
- status=none(후보 없음)이면 alternative(대안)를 AI가 한 줄로 제안한다. 이 파트는 배치 초안에서 담당 없이 "대안으로 대신"으로 둔다.
- myPendingQuestions: 내가 아직 답하지 않은 추가 질문 파트 수. 단계가 team.questions일 때 1 이상이면 프론트가 9-2로 보낸다.

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
