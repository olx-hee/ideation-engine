# A2 · 회원가입 (+ 약관 팝업 A2-1 · A2-2)

> **보는 사람**: 누구나  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

이메일·비밀번호·닉네임과 약관 동의로 가입한다. 약관 "보기"를 누르면 이용약관(A2-1)·개인정보 수집·이용 동의(A2-2) 팝업이 뜬다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 보기 (이용약관 / 개인정보) | `openTerms` / `openPrivacy` | — |
| ← 처음으로 | — | [1 랜딩](../01-landing/README.md) |
| Google로 계속 | `oauth` | — |
| 카카오로 계속 | `oauth` | — |
| 팝업: 닫기 | `closeModal` | — |
| 팝업: × | `closeModal` | — |
| 팝업: 동의하고 닫기 | `agreeModal` | — |
| 가입하고 프로필 만들기 → | `signup` | — |
| 로그인 | `goLogin` | — |

## 프론트엔드

**이미 구현한 것**

- ✅ 비밀번호 확인 일치 표시(✓ 일치해요 / 달라요)
- ✅ 전체 동의 ↔ 개별 동의 연동
- ✅ "보기" → 약관 팝업 열기(안에서 스크롤), 닫기·×·동의하고 닫기(해당 체크 켜기)
- ✅ 필수 약관·8자 비밀번호 검사(목업 서버), 가입 성공 시 토큰 저장 → 프로필 만들기(3)
- ✅ 가입 후 프로필 만들기(3)로 — 로그인 전에 가려던 곳(returnTo)을 이어서 넘김(예: 방 코드 입장)

**남은 일**

- ⬜ 약관 본문을 legal.get으로 채우기(지금 예시 문구 — 법률 검토 필요)
- ⬜ 이메일 형식·중복 확인을 입력 중에 보여줄지 결정

## 백엔드가 해야 할 일 (쉽게)

- <b>회원가입</b>: 이메일 중복 확인(409 EMAIL_TAKEN), 비밀번호 규칙 확인, 비밀번호는 해시로만 저장.
- <b>약관 동의 기록</b>: 어떤 버전의 약관에 언제 동의했는지 저장한다. 필수 2개(이용약관·개인정보)는 반드시 true, 마케팅은 선택.
- <b>약관 원문</b>은 버전 관리해서 legal.get으로 내려준다(팝업이 가져다 씀).

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /legal/{type}` | 약관 원문 (terms · privacy) |
| 보기 | `GET /legal/{type}` | 약관 원문 (terms · privacy) |
| 가입하고 프로필 만들기 | `POST /auth/signup` | 이메일 회원가입 |
| Google/카카오 | `POST /auth/oauth/{provider}` | 소셜 로그인 (google · kakao) |

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/legal/{type}` — 약관 원문 (terms · privacy)

- **API id**: `legal.get` (프론트: `api.call('legal.get', …)`)
- **누가 부를 수 있나**: 필요 없음
- **하는 일**: 회원가입 화면의 "보기" 팝업 내용. 법률 검토된 문서를 버전별로 관리한다.

**응답** `200`

```json
{
  "type": "terms",
  "version": "2026-09-01",
  "title": "이용약관",
  "html": "<h5>제1조 (목적)</h5><p>…</p>"
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `NOT_FOUND` | 404 | terms · privacy가 아닌 type |

**백엔드 메모**

- 지금 시행 중인 최신 버전을 준다. 회원가입(auth.signup · auth.oauth) 때 이 version을 동의 기록에 남긴다.
- 프론트가 html을 그대로 팝업에 넣으므로 관리자만 올리고, script 태그 · on… 속성처럼 실행되는 내용은 저장할 때 걸러낸다.

### `POST /api/v1/auth/signup` — 이메일 회원가입

- **API id**: `auth.signup` (프론트: `api.call('auth.signup', …)`)
- **누가 부를 수 있나**: 필요 없음
- **하는 일**: 이메일·비밀번호·닉네임과 약관 동의로 계정을 만들고 바로 로그인 상태로 만든다.

**요청 본문**

```json
{
  "email": "hyeongwon@example.com",
  "password": "********",
  "nickname": "노형원",
  "agreements": {
    "terms": true,
    "privacy": true,
    "marketing": false
  }
}
```

**응답** `201`

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
| `EMAIL_TAKEN` | 409 | 이미 가입된 이메일 |
| `VALIDATION` | 400 | 비밀번호 8자 미만 · 필수 약관 미동의 등 |

**백엔드 메모**

- 비밀번호는 bcrypt/argon2로 해시해서 저장한다(원문 저장 금지).
- 약관 동의는 버전과 동의 시각을 함께 기록한다(나중에 약관이 바뀌면 다시 동의받기 위해).
- 리프레시 토큰은 httpOnly 쿠키로 내려주는 것을 권장한다.

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
