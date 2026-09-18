# 7-3 · 아이스브레이킹 · 질문 3 변화 × 내 경험

> **보는 사람**: 팀원  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작) · [../../assets/js/icebreak-chat.js](../../assets/js/icebreak-chat.js) (채팅 공통)

## 이 화면은

내가 반응한 소식 카드를 요약해서 보여주고, 그 변화 때문에 불편해지거나 가능해질 사람을 묻는다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 보내기 / Enter | `sendMessage` | — |
| 넘어가기 | `skip` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 채팅 공통 동작(보내기·꼬리질문·넘어가기·진행 갱신)

**남은 일**

- ⬜ 질문 속 "반응한 카드 요약"(qlist)을 서버 메시지 데이터로 그리기 — 메시지에 attachments 필드를 두는 것을 제안

## 백엔드가 해야 할 일 (쉽게)

- 질문 3은 질문 2에서 이 사람이 누른 <b>반응을 함께 보여주는</b> 질문이다. 서버가 질문 메시지를 만들 때 {"attachments":[{"type":"newsReactions","items":[…]}]} 처럼 카드 요약을 붙여 보내면 프론트가 표로 그린다.
- 꼬리질문 규칙은 질문 1과 같다(짧거나 모호하면 1번).

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/icebreak/me` | 내 인터뷰 상태 |
| 보내기 | `POST /sessions/{sessionId}/icebreak/messages` | 인터뷰 답 보내기 |
| 넘어가기 | `POST /sessions/{sessionId}/icebreak/skip` | 이 질문 넘어가기 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `icebreak.progress` | "팀 진행" 카드 한 줄 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

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
