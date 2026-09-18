# 7-1 · 아이스브레이킹 · 질문 1 불편했던 순간

> **보는 사람**: 팀원 (진행자도 참여 가능)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작) · [../../assets/js/icebreak-chat.js](../../assets/js/icebreak-chat.js) (채팅 공통)

## 이 화면은

AI와 1:1로 짧게 인터뷰한다. 답이 짧으면 꼬리질문을 1번 하고, 다음 질문(최근 소식)을 준비한다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 보내기 / Enter | `sendMessage` | — |
| 넘어가기 | `skip` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 보내기·Enter로 답 보내기, 내 말풍선 즉시 추가
- ✅ AI 응답(꼬리질문=연보라, 뜻풀이=하늘색, 끝 안내=초록) 그리기
- ✅ 질문 번호·진행 막대·"오늘 나눌 이야기" 표시 갱신
- ✅ 팀 진행 실시간 갱신
- ✅ 진행자가 발산으로 넘기면 자동 이동

## 백엔드가 해야 할 일 (쉽게)

- <b>AI 인터뷰 대화</b>: 사람이 답을 보내면 서버가 AI(저가 모델)에게 "이 답이 충분히 구체적인가?"를 물어서, 짧으면 꼬리질문 1번, 충분하면 다음 질문을 돌려준다. 질문 5개는 순서가 정해져 있다.
- <b>답 원문은 본인만</b> 볼 수 있다. 진행자·팀원에게 가는 어떤 API에도 원문을 넣지 않는다. 대신 AI가 답에서 "재료"(짧은 요약)를 뽑아 이름 없이 발산 단계로 넘긴다.
- 질문 2(최근 소식)는 검색이 필요해서 느릴 수 있다. 세션 시작 때 미리 검색해 두고, 준비가 늦으면 "찾는 중" 메시지를 먼저 보낸 뒤 icebreak.news.ready 이벤트로 알린다.
- "팀 진행" 카드는 이름과 "몇 번째 질문인지"만 보낸다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}` | 세션 상태 |
| 화면 열 때 | `GET /sessions/{sessionId}/icebreak/me` | 내 인터뷰 상태 |
| 화면 열 때 | `GET /sessions/{sessionId}/icebreak/progress` | 팀 인터뷰 진행 |
| 보내기 | `POST /sessions/{sessionId}/icebreak/messages` | 인터뷰 답 보내기 |
| 넘어가기 | `POST /sessions/{sessionId}/icebreak/skip` | 이 질문 넘어가기 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `icebreak.progress` | "팀 진행" 카드 한 줄 갱신 |
| `icebreak.news.ready` | 질문 2 카드 불러오기 |
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

### `GET /api/v1/sessions/{sessionId}/icebreak/me` — 내 인터뷰 상태

- **API id**: `ice.state` (프론트: `api.call('ice.state', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 새로고침·재접속 시 내 대화 내용과 몇 번째 질문인지 복구한다. 이 대화는 본인만 볼 수 있다.

**응답** `200`

```json
{
  "step": 1,
  "done": false,
  "topics": [
    "최근 불편했던 순간",
    "요즘 이 주제 주변에서 바뀐 것",
    "그 변화와 내 경험",
    "요즘 쓰는 서비스와 아쉬운 점",
    "해보고 싶은 것 · 피하고 싶은 것"
  ],
  "messages": [
    {
      "id": "m1",
      "role": "ai",
      "label": null,
      "style": null,
      "text": "안녕하세요 노형원님. 저와 1:1로 짧게 이야기해요. …"
    },
    {
      "id": "m2",
      "role": "ai",
      "label": "질문 1 · 불편했던 순간",
      "style": null,
      "text": "최근 일주일, 가장 불편했던 순간은 언제였어요? 사소한 것도 좋아요."
    }
  ]
}
```

**백엔드 메모**

- 메시지 style: null(기본) · "fq"(꼬리질문, 연보라) · "explain"(뜻풀이, 하늘색) · "good"(인터뷰 끝 안내, 초록 — 마지막 1번만).

### `GET /api/v1/sessions/{sessionId}/icebreak/progress` — 팀 인터뷰 진행

- **API id**: `ice.progress` (프론트: `api.call('ice.progress', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 오른쪽 "팀 진행" 카드. 답 내용은 없이 몇 번째 질문인지만.

**응답** `200`

```json
{
  "items": [
    {
      "nickname": "노형원",
      "isMe": true,
      "step": 1,
      "done": false
    },
    {
      "nickname": "이세민",
      "step": 2,
      "done": false
    },
    {
      "nickname": "김승희",
      "step": 2,
      "done": false
    },
    {
      "nickname": "박상진",
      "step": 0,
      "done": false
    }
  ]
}
```

**백엔드 메모**

- 변경될 때마다 icebreak.progress 실시간 이벤트로도 보낸다.

### `POST /api/v1/sessions/{sessionId}/icebreak/messages` — 인터뷰 답 보내기

- **API id**: `ice.send` (프론트: `api.call('ice.send', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 내 답을 받아서 AI가 (1) 답이 짧으면 꼬리질문 1번, (2) 충분하면 다음 질문, (3) 마지막이면 끝 안내와 재료를 돌려준다.

**요청 본문**

```json
{
  "text": "과제 공지 놓친 거",
  "clientMessageId": "c_171234"
}
```

**응답** `200`

```json
{
  "step": 1,
  "done": false,
  "messages": [
    {
      "id": "m4",
      "role": "ai",
      "label": "꼬리질문",
      "style": "fq",
      "text": "어떤 과제였고, 공지가 **어디에** 올라와 있었어요?"
    }
  ]
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `INTERVIEW_DONE` | 409 | 이미 끝난 인터뷰 |

**백엔드 메모**

- 꼬리질문은 질문당 최대 1번. "짧다/모호하다" 판단은 AI(저가 모델)가 한다.
- 질문 2로 넘어갈 때 news 카드가 준비 안 됐으면 {"role":"ai","style":"wait"} 안내를 먼저 보내고, 준비되면 icebreak.news.ready 이벤트.
- 응답이 느리면 SSE/스트리밍으로 바꿔도 된다(프론트는 messages 배열만 그리면 됨).
- 답 원문은 이 사람 본인에게만 보인다. 진행자·팀원 API 어디에도 원문을 넣지 않는다.

### `POST /api/v1/sessions/{sessionId}/icebreak/skip` — 이 질문 넘어가기

- **API id**: `ice.skip` (프론트: `api.call('ice.skip', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 현재 질문(또는 꼬리질문)을 건너뛰고 다음 질문 메시지를 받는다.

**요청 본문**

```json
{}
```

**응답** `200`

```json
{
  "step": 2,
  "done": false,
  "messages": [
    {
      "id": "m9",
      "role": "ai",
      "label": "질문 2 · 요즘 바뀐 것",
      "text": "요즘 '캠퍼스 생활 서비스' 주변 소식이에요. …"
    }
  ]
}
```
