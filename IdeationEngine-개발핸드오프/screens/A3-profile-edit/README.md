# A3 · 프로필 수정

> **보는 사람**: 로그인 회원  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

프로필 사진, 닉네임, 한 줄 강점, 맡고 싶은 역할, 할 수 있는 스킬을 고친다. 다음 세션부터 반영된다.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 변경 사항 저장 | `saveProfile` | — |
| 취소 | — | [1-1 랜딩 (로그인 상태) · 프로필 팝오버](../01-1-landing-logged-in/README.md) |
| 사진 변경 | `changeAvatar` | — |
| 사진 삭제 | `deleteAvatar` | — |
| 왼쪽 메뉴: 프로필 수정 | — | [A3 프로필 수정](../A3-profile-edit/README.md) |
| 왼쪽 메뉴: 지난 세션 기록 | — | [A4 지난 세션 기록](../A4-session-history/README.md) |
| 왼쪽 메뉴: 계정 설정 | — | [A5 계정 설정](../A5-account-settings/README.md) |
| 왼쪽 아래: Pro로 업그레이드 | — | [A5 계정 설정](../A5-account-settings/README.md) |
| 프로필 버튼 | — | [1-1 랜딩 (로그인 상태) · 프로필 팝오버](../01-1-landing-logged-in/README.md) |

## 프론트엔드

**이미 구현한 것**

- ✅ 역할·스킬 선택(3번과 같은 동작)
- ✅ 사진 올리기(파일 선택 → 미리보기) · 삭제(첫 글자로)
- ✅ 저장 → "✓ 저장됨 · 방금"
- ✅ 실서버 모드: 화면을 열면 profile.get으로 닉네임·강점·역할·스킬 채움

**남은 일**

- ⬜ 저장 안 하고 나갈 때 확인

## 백엔드가 해야 할 일 (쉽게)

- 3번(프로필 만들기)과 같은 데이터를 고친다. 저장 시각(updatedAt)을 돌려줘서 "저장됨 · 9/12"를 표시한다.
- <b>사진</b>은 파일 저장소(S3 같은 곳)에 올리고 주소만 DB에 저장한다. 5MB 이하 이미지만, 서버에서 정사각형으로 줄인다.
- 진행 중인 세션에는 반영하지 않는다(세션은 시작할 때 복사한 스냅샷을 씀).

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /me/profile` | 내 프로필 불러오기 |
| 화면 열 때 | `GET /meta/skills` | 역할·스킬 목록 |
| 변경 사항 저장 | `PUT /me/profile` | 내 프로필 저장 |
| 사진 변경 | `POST /me/avatar` | 프로필 사진 올리기 |
| 사진 삭제 | `DELETE /me/avatar` | 프로필 사진 삭제 |

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/me/profile` — 내 프로필 불러오기

- **API id**: `profile.get` (프론트: `api.call('profile.get', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 프로필 수정 화면을 채운다.

**응답** `200`

```json
{
  "nickname": "노형원",
  "strength": "발표 자료를 빠르게 잘 만들어요",
  "desiredRole": "개발·구현",
  "skills": [
    "프론트엔드",
    "백엔드",
    "PPT 디자인",
    "기술 설계 기획",
    "발표·피칭"
  ],
  "avatarUrl": null,
  "updatedAt": "2026-09-12T10:20:00+09:00"
}
```

**백엔드 메모**

- 프로필을 아직 안 만들었으면 nickname은 가입 때 닉네임, strength · desiredRole · updatedAt은 null, skills는 [] (null 아님 — 화면이 배열로 씀).

### `GET /api/v1/meta/skills` — 역할·스킬 목록

- **API id**: `meta.skills` (프론트: `api.call('meta.skills', …)`)
- **누가 부를 수 있나**: 필요 없음
- **하는 일**: 프로필 화면의 칩 목록. 서버에서 내려주면 앱을 다시 배포하지 않고 스킬을 추가할 수 있다.

**응답** `200`

```json
{
  "roles": [
    "자료조사",
    "발표·기획",
    "문서정리",
    "개발·구현",
    "디자인"
  ],
  "skillGroups": [
    {
      "id": "dev",
      "title": "개발",
      "hint": null,
      "skills": [
        "프론트엔드",
        "백엔드",
        "데이터",
        "인프라",
        "AI/ML"
      ]
    },
    {
      "id": "design",
      "title": "디자인",
      "hint": "만드는 결과물 기준",
      "skills": [
        "PPT 디자인",
        "웹 디자인",
        "앱 디자인",
        "영상·모션",
        "브랜딩·그래픽"
      ]
    },
    {
      "id": "plan",
      "title": "기획",
      "hint": "무엇을 설계하는 기획인지 기준",
      "skills": [
        "비즈니스 모델 기획",
        "기술 설계 기획",
        "서비스 기획",
        "프로젝트 관리",
        "사업계획서·제안서"
      ]
    },
    {
      "id": "etc",
      "title": "발표·기타",
      "hint": null,
      "skills": [
        "발표·피칭",
        "마케팅·홍보",
        "리서치·사용자 조사",
        "문서 정리",
        "논문"
      ]
    }
  ]
}
```

### `PUT /api/v1/me/profile` — 내 프로필 저장

- **API id**: `profile.update` (프론트: `api.call('profile.update', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 닉네임·한 줄 강점·맡고 싶은 역할·할 수 있는 스킬을 저장한다. 진행 중인 세션에는 반영하지 않고 다음 세션부터 쓴다.

**요청 본문**

```json
{
  "nickname": "노형원",
  "strength": "발표 자료를 빠르게 잘 만들어요",
  "desiredRole": "개발·구현",
  "skills": [
    "프론트엔드",
    "백엔드",
    "PPT 디자인",
    "기술 설계 기획",
    "발표·피칭"
  ]
}
```

**응답** `200`

```json
{
  "nickname": "노형원",
  "strength": "발표 자료를 빠르게 잘 만들어요",
  "desiredRole": "개발·구현",
  "skills": [
    "프론트엔드",
    "백엔드",
    "PPT 디자인",
    "기술 설계 기획",
    "발표·피칭"
  ],
  "avatarUrl": null,
  "updatedAt": "2026-09-12T10:20:00+09:00"
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `VALIDATION` | 400 | 닉네임 비어 있음 · 목록에 없는 스킬 |

**백엔드 메모**

- 세션에 들어갈 때 이 프로필을 "스냅샷"으로 복사해 둔다. 그래야 세션 중에 프로필을 바꿔도 AI 판단이 흔들리지 않는다.

### `POST /api/v1/me/avatar` — 프로필 사진 올리기

- **API id**: `profile.avatarUpload` (프론트: `api.call('profile.avatarUpload', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: multipart/form-data의 file 필드. 5MB 이하 이미지, 서버에서 정사각형으로 줄여 저장.

**요청 본문**

```
multipart/form-data · file=<이미지>
```

**응답** `200`

```json
{
  "avatarUrl": "https://cdn.ideationengine.app/avatars/usr_001.webp"
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `VALIDATION` | 400 | 파일 없음 · 5MB 초과 · JPG/PNG/WebP 이미지가 아님 |

**백엔드 메모**

- 가운데를 기준으로 정사각형으로 잘라 512×512로 줄여 저장. 파일 이름은 매번 새로 (브라우저 캐시 때문에 같은 주소 재사용 금지).
- 예전 사진 파일은 지운다. 이후 auth.me · profile.get의 avatarUrl이 새 주소.
- 5MB 검사는 프론트도 하지만 서버가 최종 판단.

### `DELETE /api/v1/me/avatar` — 프로필 사진 삭제

- **API id**: `profile.avatarDelete` (프론트: `api.call('profile.avatarDelete', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 사진이 없으면 닉네임 첫 글자로 표시된다.

**응답** `204`

(본문 없음)

**백엔드 메모**

- 사진이 없어도 204 (같은 결과).
