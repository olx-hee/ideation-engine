# 1-1 · 랜딩 (로그인 상태) · 프로필 팝오버

> **보는 사람**: 로그인한 회원  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

로그인한 사람이 보는 랜딩. 오른쪽 위 프로필 버튼을 누르면 이름·이메일·요금제·프로필 요약과 메뉴가 나온다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| ＋ 세션 만들기 | `needLogin` | [4 세션 만들기](../04-session-create/README.md) |
| → 코드로 입장 (진행 중인 세션이 있으면 "↩ 세션으로 돌아가기") | `joinOrRejoin` | [2 방 코드 입장](../02-join-code/README.md) |
| 메뉴: 프로필 수정 | — | [A3 프로필 수정](../A3-profile-edit/README.md) |
| 메뉴: 지난 세션 기록 | — | [A4 지난 세션 기록](../A4-session-history/README.md) |
| 메뉴: 계정 설정 | — | [A5 계정 설정](../A5-account-settings/README.md) |
| 메뉴: Pro로 업그레이드 | — | [A5 계정 설정](../A5-account-settings/README.md) |
| 메뉴: 로그아웃 | `logout` | [1 랜딩](../01-landing/README.md) |

## 프론트엔드

**이미 구현한 것**

- ✅ 프로필 버튼으로 팝오버 열기/닫기, 바깥 누르면 닫힘 (실서버 모드는 닫힌 상태로 시작)
- ✅ 실서버 모드: 화면을 열면 예시 데이터(노형원 등)를 먼저 지우고 /me 값으로 채움 — 이름·이메일·요금제·아바타 글자/사진·역할·스킬(최대 3개 + "+N")·지난 세션 수
- ✅ 프로필이 없으면 "아직 프로필이 없어요 · 만들기"로 바꿔 보여줌
- ✅ PRO 회원이면 "Pro로 업그레이드" 메뉴 숨김
- ✅ <b>재접속</b>: 참가 중인 세션(activeSession)이 있으면 "→ 코드로 입장" 버튼이 "↩ 세션으로 돌아가기"로 바뀌고, 누르면 지금 단계 화면으로 바로 이동
- ✅ 로그인이 안 됐거나 만료됐으면(리프레시 실패) 토큰 지우고 랜딩(1)으로
- ✅ 로그아웃: 서버 요청이 실패해도 이 브라우저의 로그인 정보는 지우고 랜딩으로

## 백엔드가 해야 할 일 (쉽게)

- <b>내 계정 요약(/me)</b> 하나로 팝오버와 랜딩을 채운다: 이름·이메일·요금제·사진, 프로필 요약(없으면 null + profileComplete=false), 지난 세션 수, <b>참가 중인 세션(activeSession)</b>.
- <b>activeSession</b>은 재접속용이에요. 내가 참가자로 등록돼 있고 아직 끝나지 않은 세션이 있으면 그 세션의 id·방 코드·내 역할·현재 단계를 준다. 없으면 null.
- 액세스 토큰이 만료돼서 401을 주면, 프론트가 <code>/auth/refresh</code>를 한 번 부르고 다시 요청해요.
- 로그아웃은 리프레시 토큰을 무효화하고 쿠키를 지운다. 액세스 토큰이 만료된 상태여도 성공해야 해요.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `POST /auth/refresh` | 로그인 유지 (액세스 토큰 새로 받기) |
| 화면 열 때 | `GET /me` | 내 계정 요약 |
| 메뉴: 로그아웃 | `POST /auth/logout` | 로그아웃 |

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `POST /api/v1/auth/refresh` — 로그인 유지 (액세스 토큰 새로 받기)

- **API id**: `auth.refresh` (프론트: `api.call('auth.refresh', …)`)
- **누가 부를 수 있나**: 필요 없음
- **하는 일**: 액세스 토큰이 만료됐거나 앱을 다시 열었을 때, 쿠키에 있는 리프레시 토큰으로 새 액세스 토큰을 받는다. 본문은 보내지 않는다(쿠키로 인증).

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
| `REFRESH_INVALID` | 401 | 리프레시 토큰이 없음 · 만료 · 로그아웃됨 · 이미 사용됨 → 다시 로그인 |

**백엔드 메모**

- 리프레시 쿠키 설정: HttpOnly · Secure · SameSite=Lax · Path=/api/v1/auth. 자바스크립트에서 읽을 수 없게.
- 회전(rotation): 쓸 때마다 새 리프레시 토큰으로 바꿔서 Set-Cookie 하고, 이전 토큰은 무효로 만든다.
- 이미 쓴(무효가 된) 리프레시 토큰이 다시 들어오면 탈취로 보고 그 사용자의 리프레시 토큰을 전부 무효화한다.
- 로그인할 때 받은 remember 값을 리프레시 토큰에 저장해 두고, 회전할 때도 같은 유지 기간을 적용한다.
- 프론트 동작: API가 401을 받으면 이 API를 한 번 부르고 성공하면 원래 요청을 다시 보낸다. 실패하면 로그인 화면으로.

### `GET /api/v1/me` — 내 계정 요약

- **API id**: `auth.me` (프론트: `api.call('auth.me', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 오른쪽 위 프로필 버튼·팝오버에 필요한 정보(이름·이메일·요금제·프로필 요약·지난 세션 수).

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
  "profileComplete": true,
  "profileSummary": {
    "desiredRole": "개발·구현",
    "skills": [
      "프론트엔드",
      "백엔드",
      "발표·피칭"
    ]
  },
  "sessionCount": 6,
  "activeSession": {
    "sessionId": "ses_7K2X9",
    "code": "7K2X9M",
    "topic": "교내 해커톤에서 만들 서비스 아이디어 정하기",
    "role": "host",
    "status": "running",
    "stage": {
      "id": "diverge.vote",
      "label": "아이디어 발산",
      "subStep": 5,
      "progress": 55
    }
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `UNAUTHORIZED` | 401 | 액세스 토큰 없음·만료 → 프론트가 auth.refresh 후 다시 시도 |

**백엔드 메모**

- profileComplete: 닉네임·맡고 싶은 역할·스킬 1개 이상이 있으면 true. false면 profileSummary는 null.
- activeSession: 내가 참가 중인데 아직 끝나지 않은(lobby 또는 running) 세션. 없으면 null. 여러 개면 가장 최근 1개. 랜딩에서 "세션으로 돌아가기"(재접속)에 쓴다.
- 내보내진(kicked) 세션은 activeSession에 넣지 않는다.

### `POST /api/v1/auth/logout` — 로그아웃

- **API id**: `auth.logout` (프론트: `api.call('auth.logout', …)`)
- **누가 부를 수 있나**: 필요 없음
- **하는 일**: 쿠키의 리프레시 토큰을 무효화하고 쿠키를 지운다(Set-Cookie Max-Age=0).

**응답** `204`

(본문 없음)

**백엔드 메모**

- 액세스 토큰이 이미 만료된 상태에서도 로그아웃은 성공해야 한다(쿠키 기준으로 처리). 토큰이 없어도 204.
