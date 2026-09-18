# A4 · 지난 세션 기록

> **보는 사람**: 로그인 회원  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

내가 진행했거나 참여한 세션 목록. 결정된 방향과 보고서 보기.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 보고서 보기 | `openReport` | — |
| 왼쪽 메뉴: 프로필 수정 | — | [A3 프로필 수정](../A3-profile-edit/README.md) |
| 왼쪽 메뉴: 지난 세션 기록 | — | [A4 지난 세션 기록](../A4-session-history/README.md) |
| 왼쪽 메뉴: 계정 설정 | — | [A5 계정 설정](../A5-account-settings/README.md) |
| 왼쪽 아래: Pro로 업그레이드 | — | [A5 계정 설정](../A5-account-settings/README.md) |
| 프로필 버튼 | — | [1-1 랜딩 (로그인 상태) · 프로필 팝오버](../01-1-landing-logged-in/README.md) |

## 프론트엔드

**이미 구현한 것**

- ✅ 전체/진행자/참가자 필터
- ✅ 주제 검색(입력 멈추면 0.3초 뒤 요청)
- ✅ 실서버 모드에서 목록 다시 그리기(render)
- ✅ 보고서 없음은 비활성 버튼
- ✅ "보고서 보기" → 보고서 화면(9-5)으로 이동(sessionId 전달)

**남은 일**

- ⬜ 목록 끝에서 더 불러오기(nextCursor)
- ⬜ 기록이 하나도 없을 때 빈 화면 디자인

## 백엔드가 해야 할 일 (쉽게)

- 내가 <b>진행자였거나 참가자였던</b> 세션을 최신순으로 준다. 필터별 개수(counts)도 같이 준다.
- "정해진 방향"은 주제 확정(8-7)에서 고른 아이디어 제목. 중간에 끝난 세션은 decidedTopic=null, endedEarly=true, reportAvailable=false.
- 세션은 회원만 참여할 수 있으므로, 참여했던 모든 세션이 계정 기록에 남는다.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 화면 열 때 | `GET /me/sessions` | 지난 세션 기록 |
| 필터 / 검색 | `GET /me/sessions` | 지난 세션 기록 |

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/me/sessions` — 지난 세션 기록

- **API id**: `history.list` (프론트: `api.call('history.list', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 내가 진행했거나 참여한 세션 목록. 역할 필터·주제 검색·커서 페이지네이션.

**쿼리 파라미터**

| 이름 | 값 |
|---|---|
| `role` | all · host · participant |
| `q` | 검색어(주제) |
| `cursor` | 다음 페이지 커서 |
| `limit` | 20 |

**응답** `200`

```json
{
  "counts": {
    "all": 6,
    "host": 3,
    "participant": 3
  },
  "items": [
    {
      "sessionId": "ses_7K2X9",
      "date": "2026-09-15",
      "topic": "교내 해커톤에서 만들 서비스 아이디어",
      "myRole": "host",
      "memberCount": 4,
      "durationMin": 30,
      "decidedTopic": "첫 회의 돕기",
      "reportAvailable": true
    },
    {
      "sessionId": "ses_Q8M21",
      "date": "2026-08-27",
      "topic": "동아리 홍보 영상 기획",
      "myRole": "participant",
      "memberCount": 6,
      "durationMin": 17,
      "decidedTopic": null,
      "endedEarly": true,
      "reportAvailable": false
    }
  ],
  "nextCursor": null
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `VALIDATION` | 400 | role이 all · host · participant가 아님 · limit이 1~50 밖 · 알 수 없는 cursor |

**백엔드 메모**

- 넣는 세션: 내가 진행자였거나 참가자였던 세션 중 **시작한 세션**(진행 중 포함). 시작하지 않은 대기실 세션 · 내보내진 세션은 넣지 않는다.
- 순서: 시작 시각 최신순. date = 시작한 날짜. durationMin = 실제로 진행한 분(진행 중이면 지금까지).
- decidedTopic = 주제 확정(topic.confirm)한 아이디어 제목, 없으면 null. endedEarly = 끝났는데 확정이 없음. reportAvailable = 보고서(9-2)가 있음 (9-2 전까지는 false).
- q = 세션 주제 부분 일치(대소문자 무시). counts는 q를 적용하고 role 필터는 적용하지 않은 개수.
- limit 기본 20, 최대 50.
