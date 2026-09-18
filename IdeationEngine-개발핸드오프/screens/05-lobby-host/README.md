# 5 · 대기실 (진행자)

> **보는 사람**: 진행자  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

방 코드와 초대 링크를 팀원에게 알려주고, 들어온 사람을 확인한 뒤 세션을 시작한다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| ▶ 세션 시작하기 | `startSession` | [7-1 아이스브레이킹 · 질문 1 불편했던 순간](../07-1-icebreak-q1-discomfort/README.md) |
| 📋 코드 복사 | `copyCode` | — |
| 🔗 링크 복사 | `copyLink` | — |
| 프로필 버튼 | — | [1-1 랜딩 (로그인 상태) · 프로필 팝오버](../01-1-landing-logged-in/README.md) |

## 프론트엔드

**이미 구현한 것**

- ✅ 방 코드·초대 링크 복사
- ✅ 참여자 줄 누르면 확인 후 내보내기
- ✅ 실시간으로 참여자 추가 · 인원 숫자 갱신
- ✅ 세션 시작 → 진행자 아이스브레이킹 화면(7-6)

**남은 일**

- ⬜ 대기실의 세션 시간 문구(30분)를 session.get 값으로

## 백엔드가 해야 할 일 (쉽게)

- <b>세션 상태</b>와 <b>참여자 목록</b>을 준다. 참여자 목록에는 이름·접속 여부만 넣고 스킬·답변은 넣지 않는다.
- 누가 들어오거나 나가면 <b>실시간 이벤트</b>로 이 화면에 알려준다(웹소켓). 새로고침 없이 줄이 생긴다.
- <b>세션 시작</b>을 누르면: 입장을 닫고 → 타이머를 시작하고 → 참가자 프로필 스냅샷을 확정하고 → 모두에게 session.started 이벤트를 보낸다. 이때 "최근 소식 검색" 같은 AI 작업을 미리 시작해 두면 뒤에서 기다리는 시간이 줄어든다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}` | 세션 상태 |
| 화면 열 때 | `GET /sessions/{sessionId}/participants` | 참여자 목록 |
| 참여자 줄 → 내보내기 | `DELETE /sessions/{sessionId}/participants/{participantId}` | 참여자 내보내기 |
| ▶ 세션 시작하기 | `POST /sessions/{sessionId}/start` | 세션 시작 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `participant.joined` | 참여자 줄 추가, "3 / 4" 숫자 갱신 |
| `participant.online` | 재접속한 사람 접속 점 다시 켜기 |
| `participant.left` | 접속 점 끄기(나간 게 아니라 끊긴 것일 수도 있음) |
| `session.started` | 모두 7-1 (진행자도 인터뷰 · 끝나면 7-6) |

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

### `GET /api/v1/sessions/{sessionId}/participants` — 참여자 목록

- **API id**: `session.participants` (프론트: `api.call('session.participants', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 대기실의 참여자 줄. 이름·아바타·접속 여부만(스킬·답변 등은 포함하지 않음).

**응답** `200`

```json
{
  "maxMembers": 4,
  "items": [
    {
      "participantId": "par_01",
      "nickname": "노형원",
      "role": "host",
      "online": true,
      "isMe": true
    },
    {
      "participantId": "par_02",
      "nickname": "이세민",
      "role": "participant",
      "online": true
    },
    {
      "participantId": "par_03",
      "nickname": "김승희",
      "role": "participant",
      "online": true
    }
  ]
}
```

### `DELETE /api/v1/sessions/{sessionId}/participants/{participantId}` — 참여자 내보내기

- **API id**: `session.kick` (프론트: `api.call('session.kick', …)`)
- **누가 부를 수 있나**: 세션 진행자만
- **하는 일**: 진행자가 대기실에서 잘못 들어온 사람을 내보낸다. 내보내진 사람에게 participant.kicked 이벤트.

**응답** `204`

(본문 없음)

### `POST /api/v1/sessions/{sessionId}/start` — 세션 시작

- **API id**: `session.start` (프론트: `api.call('session.start', …)`)
- **누가 부를 수 있나**: 세션 진행자만
- **하는 일**: 입장을 닫고 타이머를 시작하고, 첫 단계(아이스브레이킹)를 연다. 모두에게 session.started 이벤트.

**응답** `200`

```json
{
  "status": "running",
  "stage": {
    "id": "icebreak",
    "label": "아이스브레이킹",
    "subStep": 1,
    "progress": 3
  },
  "timer": {
    "endsAt": "2026-09-18T15:30:00+09:00",
    "remainingSec": 1800
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `NOT_ENOUGH_MEMBERS` | 409 | 2명 미만 |
| `FORBIDDEN` | 403 | 진행자가 아님 |

**백엔드 메모**

- 시작 시점에 참여자 프로필 스냅샷을 확정하고, 뒤에서 AI 작업(최근 소식 검색 등)을 미리 돌리기 시작한다.
