# 6 · 대기실 (참가자)

> **보는 사람**: 팀원  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

입장이 끝났다는 확인과 내 프로필 요약, 현재 입장 인원을 보며 진행자가 시작하길 기다린다.

## 프론트엔드

**이미 구현한 것**

- ✅ 진행자가 시작하면(session.started) 자동으로 아이스브레이킹 질문 1(7-1)로 이동
- ✅ 입장 인원 실시간 갱신(참여자가 들어오거나 나갈 때)
- ✅ 진행자가 나를 내보내면(participant.kicked) 안내 후 랜딩으로

## 백엔드가 해야 할 일 (쉽게)

- 이 화면은 <b>기다리는 화면</b>이라 실시간 이벤트가 핵심이다. 진행자가 시작 버튼을 누르면 서버가 session.started를 보내고, 화면이 스스로 다음 화면으로 넘어간다. 새로고침하거나 다시 들어와도(재접속) 서버 단계를 확인해서 이미 시작됐으면 바로 해당 화면으로 보낸다(공통 처리).
- 연결이 끊겼다가 다시 붙으면 session.get으로 현재 단계를 다시 확인해서 이미 시작됐으면 바로 이동시킨다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}` | 세션 상태 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `participant.joined` | 참여자 줄 추가, "3 / 4" 숫자 갱신 |
| `participant.left` | 접속 점 끄기(나간 게 아니라 끊긴 것일 수도 있음) |
| `participant.kicked` | 내보내진 사람은 랜딩으로 |
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
