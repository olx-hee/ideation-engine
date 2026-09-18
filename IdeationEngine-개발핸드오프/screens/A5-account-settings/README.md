# A5 · 계정 설정

> **보는 사람**: 로그인 회원  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

로그인 정보(이메일·비밀번호·소셜 연결), 알림, 요금제(FREE → Pro), 로그아웃·탈퇴.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 변경 (이메일 / 비밀번호) | `changeEmail` / `changePassword` | — |
| 카카오 연결하기 | `connect` | — |
| Pro로 업그레이드 → | `upgrade` | — |
| 로그아웃 | `logout` | [1 랜딩](../01-landing/README.md) |
| 탈퇴 | `withdraw` | [1 랜딩](../01-landing/README.md) |
| 왼쪽 메뉴: 프로필 수정 | — | [A3 프로필 수정](../A3-profile-edit/README.md) |
| 왼쪽 메뉴: 지난 세션 기록 | — | [A4 지난 세션 기록](../A4-session-history/README.md) |
| 왼쪽 메뉴: 계정 설정 | — | [A5 계정 설정](../A5-account-settings/README.md) |
| 왼쪽 아래: Pro로 업그레이드 | `upgrade` | — |
| 프로필 버튼 | — | [1-1 랜딩 (로그인 상태) · 프로필 팝오버](../01-1-landing-logged-in/README.md) |

## 프론트엔드

**이미 구현한 것**

- ✅ 알림 토글 → 바로 저장(실패 시 되돌림)
- ✅ 이메일 변경·비밀번호 변경(간단한 입력 창)
- ✅ Pro 결제 시작(결제창 주소 받기)
- ✅ 로그아웃
- ✅ 탈퇴(확인 + 비밀번호)

**남은 일**

- ⬜ 이메일·비밀번호 변경을 prompt 대신 팝업으로(디자인 필요)
- ⬜ 가격 확정 후 요금제 카드 문구

## 백엔드가 해야 할 일 (쉽게)

- <b>설정 불러오기/저장</b>: 알림 3개(세션 초대·보고서 완성·마케팅)는 바뀐 것만 PATCH.
- <b>이메일 변경</b>은 새 주소로 확인 메일을 보내고 링크를 눌러야 바뀐다. <b>비밀번호 변경</b>은 현재 비밀번호를 확인하고, 다른 기기 로그인을 끊는다.
- <b>소셜 연결 해제</b> 시 마지막 로그인 수단이면 막는다(409).
- <b>결제</b>: 결제 대행사(PG) 결제창 주소를 만들어 주고, <b>결제 완료는 PG가 서버로 보내는 웹훅으로만</b> 확정한다(프론트 응답을 믿지 않음). 요금제가 바뀌면 billing.plan의 한도도 바뀐다.
- <b>탈퇴</b>: 비밀번호 확인 후 계정 삭제. 다른 사람과 함께한 세션의 익명 댓글·아이디어를 어떻게 남길지 정책 결정이 필요하다(예: "탈퇴한 사용자").

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /me/settings` | 계정 설정 불러오기 |
| 화면 열 때 | `GET /billing/plan` | 현재 요금제와 한도 |
| 알림 토글 | `PATCH /me/settings` | 알림 설정 바꾸기 |
| 이메일 변경 | `PATCH /me/email` | 이메일 바꾸기 |
| 비밀번호 변경 | `PATCH /me/password` | 비밀번호 바꾸기 |
| 카카오 연결하기 | `POST /me/connections/{provider}` | 소셜 계정 연결 |
| Pro로 업그레이드 | `POST /billing/checkout` | Pro 결제 시작 |
| 로그아웃 | `POST /auth/logout` | 로그아웃 |
| 탈퇴 | `DELETE /me` | 회원 탈퇴 |

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/me/settings` — 계정 설정 불러오기

- **API id**: `settings.get` (프론트: `api.call('settings.get', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 로그인 정보·연결된 소셜 계정·알림 설정.

**응답** `200`

```json
{
  "email": "hyeongwon@example.com",
  "passwordChangedAt": "2026-06-10T09:00:00+09:00",
  "connections": {
    "google": true,
    "kakao": false
  },
  "notifications": {
    "sessionInvite": true,
    "reportReady": true,
    "marketing": false
  }
}
```

**백엔드 메모**

- 비밀번호가 없는 소셜 전용 계정은 passwordChangedAt = null.

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

### `PATCH /api/v1/me/settings` — 알림 설정 바꾸기

- **API id**: `settings.update` (프론트: `api.call('settings.update', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 바뀐 항목만 보낸다.

**요청 본문**

```json
{
  "notifications": {
    "marketing": true
  }
}
```

**응답** `200`

```json
{
  "email": "hyeongwon@example.com",
  "passwordChangedAt": "2026-06-10T09:00:00+09:00",
  "connections": {
    "google": true,
    "kakao": false
  },
  "notifications": {
    "sessionInvite": true,
    "reportReady": true,
    "marketing": false
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `VALIDATION` | 400 | notifications 밖의 항목 · sessionInvite · reportReady · marketing이 아닌 키 · true/false가 아님 |

**백엔드 메모**

- 보낸 키만 바꾸고, 바꾼 뒤 전체 설정을 돌려준다.

### `PATCH /api/v1/me/email` — 이메일 바꾸기

- **API id**: `account.changeEmail` (프론트: `api.call('account.changeEmail', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 새 이메일로 확인 메일을 보내고, 링크를 눌러야 바뀐다.

**요청 본문**

```json
{
  "newEmail": "new@example.com",
  "password": "********"
}
```

**응답** `200`

```json
{
  "verificationSent": true
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `PASSWORD_MISMATCH` | 403 | 비밀번호가 틀림 |
| `EMAIL_TAKEN` | 409 | 이미 다른 계정이 쓰는 이메일 |
| `VALIDATION` | 400 | 이메일 형식이 아님 · 지금 이메일과 같음 · 비밀번호가 없는 소셜 전용 계정 |

**백엔드 메모**

- 새 주소로 확인 메일: https://ideationengine.app/verify-email?token=… (24시간 · 한 번만). 링크를 누르기 전까지 이메일은 그대로.
- 링크를 연 뒤 확정하는 화면 · API는 디자인 후 추가. 예전 주소에는 "이메일 변경 요청이 있었어요" 안내 메일.
- 비밀번호 확인 실패를 401로 주면 프론트가 로그인 유지(refresh) 후 같은 요청을 한 번 더 보내므로 403 PASSWORD_MISMATCH를 쓴다.

### `PATCH /api/v1/me/password` — 비밀번호 바꾸기

- **API id**: `account.changePassword` (프론트: `api.call('account.changePassword', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 현재 비밀번호 확인 후 변경, 다른 기기 로그인은 끊는다.

**요청 본문**

```json
{
  "currentPassword": "********",
  "newPassword": "********"
}
```

**응답** `204`

(본문 없음)

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `PASSWORD_MISMATCH` | 403 | 현재 비밀번호가 틀림 |
| `VALIDATION` | 400 | 새 비밀번호 8자 미만 |

**백엔드 메모**

- 지금 요청한 로그인(이 액세스 토큰을 발급한 리프레시 토큰 계열)은 유지하고, 그 사용자의 다른 리프레시 토큰은 모두 무효화한다 → 다른 기기는 액세스 토큰이 만료되면 로그인 화면으로.
- 액세스 토큰에 로그인 계열 id를 넣어 두면 "지금 로그인"을 알 수 있다 (리프레시 쿠키는 Path=/api/v1/auth라 이 요청에는 오지 않음).
- 비밀번호가 없는 소셜 전용 계정은 currentPassword 없이 새 비밀번호를 만들 수 있다. passwordChangedAt 갱신.

### `POST /api/v1/me/connections/{provider}` — 소셜 계정 연결

- **API id**: `account.connect` (프론트: `api.call('account.connect', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 로그인된 계정에 google/kakao를 연결한다.

**요청 본문**

```json
{
  "code": "소셜_인가_코드"
}
```

**응답** `200`

```json
{
  "connections": {
    "google": true,
    "kakao": true
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `OAUTH_FAILED` | 400 | 소셜 서버 확인 실패 |
| `OAUTH_TAKEN` | 409 | 그 소셜 계정이 이미 다른 계정에 연결됨 |

**백엔드 메모**

- 소셜 계정의 이메일이 내 이메일과 달라도 연결할 수 있다 (로그인한 사람이 직접 연결하므로).
- 이미 내 계정에 연결된 같은 소셜 계정이면 그대로 200.

### `POST /api/v1/billing/checkout` — Pro 결제 시작

- **API id**: `billing.checkout` (프론트: `api.call('billing.checkout', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 결제 대행사(PG) 결제창 주소를 만들어 돌려준다. 결제 완료는 PG → 서버 웹훅으로 확정한다(프론트 응답만 믿지 않기).

**요청 본문**

```json
{
  "plan": "PRO",
  "period": "monthly"
}
```

**응답** `200`

```json
{
  "checkoutUrl": "https://pg.example.com/checkout/abc"
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `ALREADY_PRO` | 409 | 이미 PRO |
| `VALIDATION` | 400 | plan이 PRO가 아님 · period가 monthly가 아님 |

**백엔드 메모**

- 가격·PG사는 아직 미정. 웹훅 엔드포인트(POST /billing/webhook)도 함께 필요.
- PG를 정하기 전에는 PG 테스트 결제창(또는 서버의 임시 안내 페이지) 주소를 돌려준다. 요금제를 PRO로 바꾸는 건 웹훅을 받았을 때만.

### `POST /api/v1/auth/logout` — 로그아웃

- **API id**: `auth.logout` (프론트: `api.call('auth.logout', …)`)
- **누가 부를 수 있나**: 필요 없음
- **하는 일**: 쿠키의 리프레시 토큰을 무효화하고 쿠키를 지운다(Set-Cookie Max-Age=0).

**응답** `204`

(본문 없음)

**백엔드 메모**

- 액세스 토큰이 이미 만료된 상태에서도 로그아웃은 성공해야 한다(쿠키 기준으로 처리). 토큰이 없어도 204.

### `DELETE /api/v1/me` — 회원 탈퇴

- **API id**: `account.withdraw` (프론트: `api.call('account.withdraw', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 계정과 세션 기록을 지운다. 복구 불가. 다른 사람이 함께한 세션의 익명 댓글·아이디어는 "탈퇴한 사용자"로 남길지 정책 결정 필요.

**요청 본문**

```json
{
  "password": "********",
  "reason": "선택 입력"
}
```

**응답** `204`

(본문 없음)

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `PASSWORD_MISMATCH` | 403 | 비밀번호가 틀림 |

**백엔드 메모**

- 비밀번호가 없는 소셜 전용 계정은 password 없이 탈퇴(로그인한 토큰으로 확인).
- 지우는 것: 이메일 · 비밀번호 · 닉네임 · 프로필 · 사진 · 소셜 연결 · 설정 · 모든 리프레시 토큰, 응답에서 리프레시 쿠키도 지움(Max-Age=0).
- (임시 규칙 — 기획 결정 전) 다른 사람과 함께한 세션의 익명 아이디어 · 댓글 · 표는 남기고 계정 연결만 끊는다. 결과 · 기록에 주인 이름이 필요하면 "탈퇴한 사용자".
- 같은 이메일로 다시 가입할 수 있다 (새 계정).
