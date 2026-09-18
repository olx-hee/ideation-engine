# 4 · 세션 만들기

> **보는 사람**: 진행자 (로그인 회원)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

이번 회의에서 정할 주제, 세션 시간, 참여 인원, 공모전 심사기준(선택)을 정하고 방을 만든다. 무료는 최대 30분.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 세션 만들고 방 코드 받기 → | `createSession` | [5 대기실 (진행자)](../05-lobby-host/README.md) |
| 업그레이드 → | — | [A5 계정 설정](../A5-account-settings/README.md) |
| Pro 알아보기 → | — | [A5 계정 설정](../A5-account-settings/README.md) |
| 프로필 버튼 | — | [1-1 랜딩 (로그인 상태) · 프로필 팝오버](../01-1-landing-logged-in/README.md) |

## 프론트엔드

**이미 구현한 것**

- ✅ 시간 칩(10·20·30분) ↔ 직접 입력 칸 연동, 30 넘게 입력하면 30으로 되돌리고 안내
- ✅ 🔒PRO 칩 누르면 안내 토스트
- ✅ 인원 − / + (2~8) ↔ 인원 칩 연동
- ✅ 주제 비었으면 막기
- ✅ 방 만들기 성공 → 방 코드 저장 후 대기실(5)

**남은 일**

- ⬜ 주제 입력칸을 여러 줄(textarea)로 할지 결정

## 백엔드가 해야 할 일 (쉽게)

- <b>세션(방) 만들기</b>: 주제·시간·인원을 저장하고, 방 코드와 초대 링크를 만들어 준다. 만든 사람이 진행자가 된다.
- <b>요금제 검사는 서버가 최종 판단</b>한다. 화면에서 막아도, 무료 회원이 60분·90분·제한 없음(null)으로 요청하면 403 PLAN_LIMIT.
- 방 코드는 헷갈리는 글자(0과 O, 1과 I)를 빼고, 현재 열려 있는 방끼리 겹치지 않게 만든다.
- "공모전 주제·심사기준"은 선택 입력이며, 뒤에서 AI 검증(8-5)과 추천(8-2)의 참고 자료로 쓴다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /billing/plan` | 현재 요금제와 한도 |
| 세션 만들고 방 코드 받기 | `POST /sessions` | 세션 만들기 |

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/billing/plan` — 현재 요금제와 한도

- **API id**: `billing.plan` (프론트: `api.call('billing.plan', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 프론트가 잠금(🔒PRO)을 그릴 때 쓰는 한도 값. 한도는 서버가 최종 판단한다.

**응답** `200`

```json
{
  "plan": "FREE",
  "limits": {
    "maxSessionMinutes": 30,
    "unlimitedDuration": false
  },
  "pro": {
    "priceLabel": "가격 미정",
    "features": [
      "30분 넘는 세션 (60분 · 90분 · 제한 없음)"
    ]
  }
}
```

**백엔드 메모**

- FREE: maxSessionMinutes 30 · unlimitedDuration false / PRO: maxSessionMinutes null · unlimitedDuration true.
- session.create의 403 PLAN_LIMIT 검사와 같은 값을 써야 한다 (한 곳에 두기).

### `POST /api/v1/sessions` — 세션 만들기

- **API id**: `session.create` (프론트: `api.call('session.create', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 주제·시간·인원으로 세션(방)을 만들고 방 코드와 초대 링크를 준다. 만든 사람이 진행자가 된다.

**요청 본문**

```json
{
  "topic": "교내 해커톤에서 만들 서비스 아이디어 정하기",
  "durationMin": 30,
  "maxMembers": 4,
  "criteria": "지역문제 · 심사=창의성/실현성"
}
```

**응답** `201`

```json
{
  "sessionId": "ses_7K2X9",
  "code": "7K2X9M",
  "inviteUrl": "https://ideationengine.app/s/7K2X9M",
  "topic": "교내 해커톤에서 만들 서비스 아이디어 정하기",
  "criteria": null,
  "durationMin": 30,
  "maxMembers": 4,
  "status": "lobby",
  "stage": {
    "id": "lobby",
    "label": "대기실",
    "subStep": null,
    "progress": 0
  },
  "timer": {
    "endsAt": null,
    "remainingSec": null
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
| `PLAN_LIMIT` | 403 | 무료 회원이 30분 초과 또는 제한 없음(null) 선택 |
| `PROFILE_REQUIRED` | 409 | 프로필을 아직 안 만듦 |
| `VALIDATION` | 400 | 주제 비어 있음 · 인원 2~8 밖 |

**백엔드 메모**

- durationMin: 1~30(무료), 60·90 또는 null(=제한 없음)은 PRO만. 프론트에서 막아도 서버에서 꼭 다시 검사.
- 방 코드: 대문자+숫자 6자리, 헷갈리는 글자(0 O 1 I L)는 빼고 만든다. 끝나지 않은 방끼리 겹치지 않게.
- 초대 링크는 방 코드를 그대로 쓴다: https://ideationengine.app/s/{방 코드}. 별도 초대 토큰은 없다.
- maxMembers는 진행자 포함 인원.
