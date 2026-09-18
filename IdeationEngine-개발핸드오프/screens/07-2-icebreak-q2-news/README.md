# 7-2 · 아이스브레이킹 · 질문 2 최근 소식 카드

> **보는 사람**: 팀원  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작) · [../../assets/js/icebreak-chat.js](../../assets/js/icebreak-chat.js) (채팅 공통)

## 이 화면은

세션 주제 주변의 최근 소식(시장·기술·규제) 3장을 보여주고, 들어봤는지 반응을 받는다. 모르는 말은 "이게 뭐예요?"로 풀이.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 보내기 / Enter | `sendMessage` | — |
| 넘어가기 | `skip` | — |
| 이게 뭐예요? | `explain` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 카드별 반응(처음 들어요·들어봤어요·잘 알아요) 선택 → 서버 저장
- ✅ "이게 뭐예요?" → 내 질문 말풍선 + 뜻풀이 말풍선, "내가 물어본 말" 갱신
- ✅ 채팅 공통 동작

## 백엔드가 해야 할 일 (쉽게)

- <b>최근 소식 카드</b>: 세션 주제로 실제 검색(예: Brave 검색 API)을 해서 최근 기사·공식 자료를 찾고, <b>검색 결과에 있는 내용만</b> AI가 "쉽게 말하면 / 우리 팀에게" 문장으로 요약한다. 없는 사실을 지어내면 안 된다. 출처 이름·링크·날짜를 꼭 함께 준다.
- 모든 참가자가 <b>같은 카드 3장</b>을 본다. 세션 시작 때 한 번 만들어 저장해 둔다.
- <b>반응</b>은 사람별로 저장하지만, 진행자 화면(7-6)에는 이름 없이 인원 수만 집계해서 보여준다.
- <b>뜻풀이</b>는 AI가 짧게 설명하고, 사람이 물어본 단어 목록을 저장한다(나중에 "잘 아는 사람이 1명" 같은 힌트에 쓸 수 있음 — 이름 없이).

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/icebreak/news` | 최근 소식 카드 3장 |
| 반응 버튼 | `PUT /sessions/{sessionId}/icebreak/news/{cardId}/reaction` | 소식 카드 반응 |
| 이게 뭐예요? | `POST /sessions/{sessionId}/icebreak/explain` | "이게 뭐예요?" 뜻풀이 |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `icebreak.progress` | "팀 진행" 카드 한 줄 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/{sessionId}/icebreak/news` — 최근 소식 카드 3장

- **API id**: `ice.news` (프론트: `api.call('ice.news', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 세션 주제로 실제 검색한 결과에서 시장·기술·규제 카드 3장을 만든다. 모든 참가자가 같은 카드를 본다.

**응답** `200`

```json
{
  "ready": true,
  "cards": [
    {
      "cardId": "news_1",
      "category": "시장",
      "title": "대학가 중고거래가 앱 밖 단톡방으로 이동",
      "plain": "거래는 늘었는데 믿을 장치가 없어요",
      "forTeam": "신뢰·정산을 돕는 도구가 틈새일 수 있어요",
      "source": {
        "name": "[기사·매체]",
        "url": "https://example.com/news/1",
        "publishedAt": "2026-09-10"
      },
      "myReaction": "heard"
    },
    {
      "cardId": "news_2",
      "category": "기술",
      "title": "폰 안에서 도는 온디바이스 AI 모델 무료 공개",
      "plain": "서버 없이도 요약 같은 AI 기능을 넣을 수 있어요",
      "forTeam": "백엔드가 약해도 AI 시연이 가능해요",
      "source": {
        "name": "[공식 블로그]",
        "url": "https://example.com/news/2",
        "publishedAt": "2026-09-08"
      },
      "myReaction": "new"
    },
    {
      "cardId": "news_3",
      "category": "규제",
      "title": "학생 개인정보 동의 절차 강화",
      "plain": "학번·시간표를 쓰면 동의 화면이 더 분명해야 해요",
      "forTeam": "학생 정보를 쓰면 동의 흐름도 기능이에요",
      "source": {
        "name": "[기관 보도자료]",
        "url": "https://example.com/news/3",
        "publishedAt": "2026-09-05"
      },
      "myReaction": null
    }
  ]
}
```

**백엔드 메모**

- 검색 API(예: Brave)로 최근 기사·공식 자료를 찾고, 검색 결과에 있는 내용만 AI가 쉬운 말로 요약한다(지어내기 금지).
- 검색 실패 시 {"ready": true, "cards": [], "fallback": true} → 프론트는 질문 2·3을 건너뛴다.
- 세션 시작 때 미리 만들어 캐시해 두면 질문 2에서 기다리는 시간이 없다.

### `PUT /api/v1/sessions/{sessionId}/icebreak/news/{cardId}/reaction` — 소식 카드 반응

- **API id**: `ice.react` (프론트: `api.call('ice.react', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 처음 들어요 · 들어봤어요 · 잘 알아요 중 하나. 다시 누르면 바뀐다.

**요청 본문**

```json
{
  "reaction": "new | heard | know"
}
```

**응답** `200`

```json
{
  "cardId": "news_2",
  "myReaction": "new"
}
```

**백엔드 메모**

- 진행자 화면에는 사람 이름 없이 인원 수만 집계해서 보여준다.

### `POST /api/v1/sessions/{sessionId}/icebreak/explain` — "이게 뭐예요?" 뜻풀이

- **API id**: `ice.explain` (프론트: `api.call('ice.explain', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 카드 속 어려운 말을 쉬운 말로 풀어 대화창에 넣어준다. 물어본 말은 "내가 물어본 말"에 쌓인다.

**요청 본문**

```json
{
  "cardId": "news_2",
  "term": "온디바이스 AI"
}
```

**응답** `200`

```json
{
  "message": {
    "id": "m7",
    "role": "ai",
    "style": "explain",
    "text": "**온디바이스 AI**는 인터넷 서버를 거치지 않고 폰이나 노트북 안에서 바로 도는 AI예요. …"
  },
  "askedTerms": [
    "온디바이스 AI"
  ]
}
```
