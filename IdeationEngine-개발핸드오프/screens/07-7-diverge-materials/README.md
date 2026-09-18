# 7-7 · 발산 시작 — 재료 보기

> **보는 사람**: 모두  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

아이스브레이킹에서 모인 재료 11개(먼저 보기 묶음은 펼치고 나머지는 한 줄)를 보여주며 발산을 시작한다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 제출 | `submitIdea` | [8-1 발산 · 내 아이디어 정하기](../08-1-idea-write/README.md) |

## 프론트엔드

**이미 구현한 것**

- ✅ 아이디어 한 줄 적고 제출 → 8-1(내 아이디어 정하기) 칸에 이어서 채워짐

**남은 일**

- ⬜ ⚠️ 8-1이 생기면서 이 화면의 입력칸과 역할이 겹침 — "재료 보기 전용"으로 둘지, 8-1 위쪽에 재료 패널로 합칠지 결정 필요

## 백엔드가 해야 할 일 (쉽게)

- 발산 화면 위쪽 재료 패널용 API 하나면 된다. <b>먼저 보기로 표시된 묶음</b>과 <b>나머지 묶음</b>을 나눠서 준다. 이름·출처는 없다.
- 같은 데이터를 8-1의 "아이스브레이킹 재료 11개 보기" 링크에서도 쓴다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /sessions/{sessionId}/materials` | 발산 재료 (모두) |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `stage.changed` | 해당 단계 화면으로 이동, 상단바 갱신 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/{sessionId}/materials` — 발산 재료 (모두)

- **API id**: `ice.materials` (프론트: `api.call('ice.materials', …)`)
- **누가 부를 수 있나**: 세션 참가자 (회원)
- **하는 일**: 발산 화면 위쪽에 보여줄 재료. 먼저 보기 묶음은 펼치고 나머지는 한 줄. 이름·출처 없음.

**응답** `200`

```json
{
  "total": 11,
  "focusGroups": [
    {
      "groupId": "grp_1",
      "title": "흩어진 학교 정보",
      "desc": "묶으면 \"캠퍼스 정보를 한곳에서\" 방향이 돼요",
      "aiPick": true,
      "focus": true,
      "items": [
        {
          "text": "과제 공지가 메일·LMS·단톡으로 흩어짐",
          "count": 2,
          "avoid": false
        },
        {
          "text": "시험기간 열람실 빈자리 찾기",
          "count": 1,
          "avoid": false
        },
        {
          "text": "학교 앞 카페 콘센트 자리 경쟁",
          "count": 1,
          "avoid": false
        }
      ]
    },
    {
      "groupId": "grp_2",
      "title": "AI를 직접 써보고 싶음",
      "desc": "동기가 가장 많이 겹치고, 최근 소식과도 이어져요",
      "aiPick": false,
      "focus": true,
      "items": [
        {
          "text": "AI 기능을 직접 넣어보고 싶음",
          "count": 3,
          "avoid": false
        },
        {
          "text": "온디바이스 AI로 서버 없이 시연",
          "count": 1,
          "avoid": false
        }
      ]
    }
  ],
  "otherGroups": [
    {
      "groupId": "grp_3",
      "title": "돈·정산의 신뢰",
      "desc": "최근 시장 변화와 실제 경험이 맞닿아 있어요",
      "aiPick": false,
      "focus": false,
      "items": [
        {
          "text": "단톡방 공동구매 정산을 한 사람이 떠안음",
          "count": 1,
          "avoid": false
        }
      ]
    },
    {
      "groupId": "grp_4",
      "title": "우리 팀의 조건",
      "desc": "주제가 아니라 범위를 정하는 재료예요",
      "aiPick": false,
      "focus": null,
      "items": [
        {
          "text": "웹 화면과 발표 자료는 자신 있음",
          "count": 2,
          "avoid": false
        },
        {
          "text": "앱 개발 · 서버가 무거운 방향",
          "count": 2,
          "avoid": true
        }
      ]
    }
  ]
}
```
