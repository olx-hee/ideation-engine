# A6 · 소셜 로그인 처리 중 (콜백)

> **보는 사람**: 로그인하려는 사람  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

Google · 카카오 로그인 창에서 /oauth/callback?code=…&state=… 로 돌아온 직후. code를 auth.oauth로 보내고, 처음 가입이면 약관 동의(A2)로, 아니면 원래 가려던 화면(returnTo)으로 간다.

## 프론트엔드

**이미 구현한 것**

- ✅ 주소의 code · state · provider를 읽어 auth.oauth 호출 → 토큰 저장 → returnTo로 이동
- ✅ AGREEMENT_REQUIRED(처음 가입)면 A2로 · OAUTH_FAILED면 안내 + A1로
- ✅ 5초 넘게 안 넘어가면 "다시 시도" 링크

**남은 일**

- ⬜ OAuth 앱 등록 후 redirectUri 확정
- ⬜ A5 "연결하기"(account.connect)도 같은 콜백 화면을 쓸지 결정

## 백엔드가 해야 할 일 (쉽게)

- auth.oauth의 redirectUri는 이 화면 주소(https://ideationengine.app/oauth/callback). state는 프론트가 만들어 sessionStorage에 두고 돌아왔을 때 비교한다.
- 처음 가입이면 409 AGREEMENT_REQUIRED → 프론트가 A2(약관 동의)로 보낸 뒤 다시 auth.oauth를 부른다(6차 문서).

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 열릴 때 | `POST /auth/oauth/{provider}` | 소셜 로그인 (google · kakao) |

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

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
