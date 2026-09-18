# A1 · 로그인

> **보는 사람**: 누구나  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

이메일/비밀번호 또는 Google·카카오로 로그인한다. 세션을 만들거나 방에 들어가려면 로그인이 필요하다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 로그인 (Enter) | `login` | — |
| Google로 계속 | `oauth` | — |
| 카카오로 계속 | `oauth` | — |
| 회원가입 | `goSignup` | — |
| ← 처음으로 | — | [1 랜딩](../01-landing/README.md) |
| 비밀번호 찾기 | `resetPw` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 이메일·비밀번호 로그인, Enter로 로그인, 비밀번호 보기(👁)
- ✅ <b>로그인 상태 유지</b> 체크 → 브라우저를 닫아도 로그인 유지(서버 리프레시 쿠키 30일 + 브라우저 저장소)
- ✅ 로그인 후 돌아갈 곳(returnTo)이 있으면 그곳으로(세션 만들기·방 입장), 없으면 1-1
- ✅ 회원가입으로 갈 때도 돌아갈 곳을 이어서 넘김
- ✅ 비밀번호 찾기 메일
- ✅ "로그인 없이 코드로 입장" 링크 삭제(게스트 입장 없음)

**남은 일**

- ⬜ 소셜 로그인: 소셜 로그인 창 열기 → 콜백 페이지에서 code 받아 auth.oauth 호출 (OAuth 앱 등록 후)
- ⬜ 에러 문구를 입력칸 아래에 표시(지금은 토스트)

## 백엔드가 해야 할 일 (쉽게)

- <b>이메일 로그인</b>: 비밀번호 해시를 비교해서 맞으면 <b>액세스 토큰</b>(본문, 약 1시간)과 <b>리프레시 토큰</b>(httpOnly 쿠키)을 준다. 연속 실패는 횟수 제한.
- <b>로그인 유지</b>: remember=true면 리프레시 쿠키 30일, false면 브라우저를 닫으면 사라지는 쿠키. 액세스 토큰이 만료되면 프론트가 <code>POST /auth/refresh</code>로 새로 받는다(회전 방식 — auth.refresh 명세 참고).
- <b>소셜 로그인</b>: 프론트가 받은 인가 code를 서버가 Google/카카오에 확인하고, 처음이면 계정을 만들고 isNewUser=true → 프론트가 프로필 만들기(3)로.
- <b>비밀번호 찾기</b>는 가입 여부를 들키지 않도록 항상 같은 응답.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 로그인 | `POST /auth/login` | 이메일 로그인 |
| Google/카카오 | `POST /auth/oauth/{provider}` | 소셜 로그인 (google · kakao) |
| 비밀번호 찾기 | `POST /auth/password/reset` | 비밀번호 찾기 메일 보내기 |

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `POST /api/v1/auth/login` — 이메일 로그인

- **API id**: `auth.login` (프론트: `api.call('auth.login', …)`)
- **누가 부를 수 있나**: 필요 없음
- **하는 일**: 이메일과 비밀번호를 확인하고 토큰을 준다.

**요청 본문**

```json
{
  "email": "hyeongwon@example.com",
  "password": "********",
  "remember": true
}
```

**응답** `200`

```json
{
  "user": {
    "id": "usr_001",
    "email": "hyeongwon@example.com",
    "nickname": "노형원",
    "avatarUrl": null,
    "plan": "FREE"
  },
  "accessToken": "eyJhbGciOi...",
  "expiresIn": 3600
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호가 틀림 |
| `TOO_MANY_ATTEMPTS` | 429 | 연속 실패 제한 |

**백엔드 메모**

- 응답 본문에는 액세스 토큰(짧게, 예: 1시간)만. 리프레시 토큰은 Set-Cookie로 내려준다 → auth.refresh 참고.
- remember=true면 리프레시 쿠키를 30일 유지(Max-Age), false면 Max-Age 없이(브라우저를 닫으면 사라짐).

### `POST /api/v1/auth/oauth/{provider}` — 소셜 로그인 (google · kakao)

- **API id**: `auth.oauth` (프론트: `api.call('auth.oauth', …)`)
- **누가 부를 수 있나**: 필요 없음
- **하는 일**: 소셜 로그인 창에서 받은 code를 서버가 소셜 서버에 확인하고, 처음이면 계정을 만든다.

**요청 본문**

```json
{
  "code": "소셜_인가_코드",
  "redirectUri": "https://ideationengine.app/oauth/callback",
  "remember": true,
  "agreements": {
    "terms": true,
    "privacy": true,
    "marketing": false
  }
}
```

**응답** `200`

```json
{
  "user": {
    "id": "usr_001",
    "email": "hyeongwon@example.com",
    "nickname": "노형원",
    "avatarUrl": null,
    "plan": "FREE"
  },
  "accessToken": "eyJhbGciOi...",
  "isNewUser": false
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `OAUTH_FAILED` | 400 | 소셜 서버 확인 실패 · 이메일 제공에 동의하지 않음 |
| `AGREEMENT_REQUIRED` | 409 | 처음 가입인데 필수 약관(terms · privacy) 동의가 없음 |
| `EMAIL_TAKEN` | 409 | 같은 이메일로 이미 가입된 계정이 있는데 이 소셜 계정은 연결 안 됨 → 로그인 후 계정 설정에서 연결 |
| `VALIDATION` | 400 | provider가 google · kakao가 아님 |

**백엔드 메모**

- isNewUser=true면 프론트는 3번(프로필 만들기)으로 보낸다.
- 토큰은 이메일 로그인과 같게: 본문에 액세스 토큰, 리프레시 토큰은 쿠키 (remember 규칙도 같음).
- agreements는 처음 가입일 때만 필요하다 (이미 있는 계정이면 무시). 가입 때처럼 약관 버전과 동의 시각을 기록.
- 이메일이 같다는 이유만으로 기존 계정에 자동으로 연결하지 않는다 (남의 계정을 가로채는 것 방지). 연결은 로그인한 뒤 account.connect로만.

### `POST /api/v1/auth/password/reset` — 비밀번호 찾기 메일 보내기

- **API id**: `auth.passwordReset` (프론트: `api.call('auth.passwordReset', …)`)
- **누가 부를 수 있나**: 필요 없음
- **하는 일**: 가입된 이메일이면 재설정 링크를 메일로 보낸다. 가입 여부를 노출하지 않도록 항상 같은 응답.

**요청 본문**

```json
{
  "email": "hyeongwon@example.com"
}
```

**응답** `200`

```json
{
  "sent": true
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `TOO_MANY_ATTEMPTS` | 429 | 같은 IP에서 10분에 5번 넘게 |

**백엔드 메모**

- 가입된 이메일이든 아니든 응답은 똑같이 {"sent": true}. 메일은 가입된 이메일에만 보낸다.
- 메일의 링크: https://ideationengine.app/reset-password?token=… (30분 · 한 번만 쓸 수 있는 토큰). 링크를 연 뒤 새 비밀번호를 정하는 화면 · API는 디자인 후 추가.
- 비밀번호가 없는 소셜 전용 계정이면 "Google/카카오로 가입한 계정이에요" 안내 메일을 보낸다.
