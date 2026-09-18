# API 공통 규칙

## 주소

- REST: `https://<도메인>/api/v1` + 경로 (예: `POST /api/v1/sessions`)
- 실시간: `wss://<도메인>/api/v1/sessions/{sessionId}/stream?token=<액세스 토큰>`
- 프론트 설정: `assets/js/config.js`의 `baseUrl`, `wsUrl`

## 인증

| 토큰 | 언제 받나 | 어떻게 보내나 |
|---|---|---|
| 액세스 토큰 (회원) | 로그인·가입·소셜 로그인 응답의 `accessToken` | `Authorization: Bearer <토큰>` |
| 리프레시 토큰 (회원) | 로그인·가입·소셜 로그인 시 **httpOnly 쿠키**로 | 브라우저가 자동 전송 → `POST /auth/refresh`로 새 액세스 토큰 |

- 게스트 토큰은 없어요. 모든 세션 API는 **회원 액세스 토큰**이 필요해요.
- 토큰이 없거나 만료되면 `401 UNAUTHORIZED` → 프론트가 `POST /auth/refresh`를 한 번 시도하고, 성공하면 원래 요청을 다시 보내요. 실패(`401 REFRESH_INVALID`)하면 로그인(A1)으로.
- 프론트 저장: 액세스 토큰을 브라우저 저장소 `ie.state`에 둬요 — "로그인 상태 유지"면 `localStorage`, 아니면 `sessionStorage`. 그래서 액세스 토큰 수명은 짧게(약 1시간) 해 주세요.
- 프론트와 API 주소(도메인)가 다르면 **CORS에서 credentials 허용**(`Access-Control-Allow-Credentials: true`, Origin 정확히 지정)이 필요해요 — 리프레시 쿠키 때문.

## 요청 · 응답 형식

- 요청/응답 모두 `application/json; charset=utf-8` (사진 업로드만 `multipart/form-data`)
- 성공 응답은 **데이터를 그대로** 돌려줘요 (따로 `{data: …}`로 감싸지 않음). 본문이 없으면 `204`.
- 이름 규칙: JSON 필드는 `camelCase`, ID는 접두사+문자열 (`usr_…`, `ses_…`, `par_…`, `ide_…`, `aii_…`, `thr_…`, `news_…`)
- 시간: ISO 8601 + 시간대 (`2026-09-18T15:30:00+09:00`), 날짜만은 `2026-09-18`
- 목록: `?cursor=…&limit=20` → 응답 `{ "items": [...], "nextCursor": "…" | null }`

## 에러 형식

```json
{
  "error": {
    "code": "PRAISE_LIMIT",
    "message": "좋은 점은 2개까지만 쓸 수 있어요",
    "details": { "praiseUsed": 2, "praiseMax": 2 }
  }
}
```

- `message`는 **사용자에게 그대로 보여줄 수 있는 한국어 문장**으로 써 주세요. 프론트는 이 문장을 토스트로 띄워요.
- `details`는 선택. 입력 오류(`VALIDATION`)면 `{ "fields": { "email": "이메일 형식이 아니에요" } }` 권장.

| code | HTTP | 뜻 |
|---|---|---|
| `VALIDATION` | 400 | 입력값이 규칙에 맞지 않음. details에 필드별 이유 |
| `UNAUTHORIZED` | 401 | 액세스 토큰 없음/만료 → 프론트가 /auth/refresh 한 번 시도 후 실패하면 로그인(A1)으로 |
| `REFRESH_INVALID` | 401 | 리프레시 토큰 없음·만료·재사용 → 로그인(A1)으로 |
| `INVALID_CREDENTIALS` | 401 | 이메일·비밀번호 틀림 |
| `PASSWORD_MISMATCH` | 403 | 로그인한 사람의 비밀번호 확인 실패 (이메일 · 비밀번호 변경, 탈퇴) — 401이 아니라서 프론트가 로그인 유지 재시도를 하지 않음 |
| `FORBIDDEN` | 403 | 권한 없음(예: 진행자 전용 API를 참가자가 호출) |
| `PLAN_LIMIT` | 403 | 무료 요금제 한도 초과 → 프론트는 Pro 안내 |
| `OWN_IDEA` | 403 | 내 아이디어에 댓글 |
| `KICKED` | 403 | 이 세션에서 내보내진 사람 |
| `NOT_PARTICIPANT` | 403 | 이 세션 참가자가 아님 |
| `SESSION_NOT_FOUND` | 404 | 없는 방 코드/세션 |
| `NOT_FOUND` | 404 | 이 세션에 없는 id (아이디어 · AI 아이디어 · 숨은 공통점 등) |
| `EMAIL_TAKEN` | 409 | 이미 가입된 이메일 |
| `SESSION_FULL` | 409 | 방 인원이 가득 참 |
| `SESSION_STARTED` | 409 | 이미 시작한 방에 새로 입장 (재접속은 허용) |
| `PROFILE_REQUIRED` | 409 | 프로필을 만들지 않은 회원이 세션 만들기/입장 → 프로필 만들기(3)로 |
| `STAGE_MISMATCH` | 409 | 화면이 보고 있던 단계와 서버 단계가 다름(중복 클릭 등) → 프론트는 session.get으로 다시 맞춤 |
| `STAGE_LOCKED` | 409 | 이 단계에서는 넘기기·되돌리기를 할 수 없음 (대기실 → 세션 시작, 투표 결과 → 주제 확정으로만) |
| `NOT_ALL_SUBMITTED` | 409 | 아직 제출(아이디어 · 댓글)을 안 한 사람이 있어서 넘길 수 없음 → 진행자는 기다리거나 force=true |
| `STAGE_CLOSED` | 409 | 이미 지난 단계의 제출 |
| `PRAISE_LIMIT` | 409 | 좋은 점 2개 초과 |
| `VOTE_LIMIT` | 409 | 2표 초과 |
| `TOO_MANY_ATTEMPTS` | 429 | 요청 횟수 제한 |
| `NOT_CANDIDATE` | 403 | 추가 질문 대상(겹친 후보)이 아님 |
| `NOT_LEADER` | 403 | 팀장만 할 수 있는 동작(담당 바꾸기 · 확정) |
| `PARTS_NOT_READY` | 409 | 파트 나누기 AI 작업이 아직 안 끝남 |
| `ASSIGNMENT_CONFIRMED` | 409 | 이미 확정된 배치 |
| `VERSION_MISMATCH` | 409 | 보고 있던 배치가 최신이 아님 → 다시 불러온 뒤 확정 |
| `SUGGESTION_STALE` | 409 | 옮기기 제안이 더 이상 맞지 않음 |
| `AI_UNAVAILABLE` | 503 | AI/검색 서비스 일시 장애 → 프론트는 "잠시 후 다시" 안내 |

## 중복 방지

- 채팅 보내기는 `clientMessageId`를 함께 보내요. 같은 값이 다시 오면 새로 만들지 말고 이전 응답을 돌려주세요 (네트워크 재시도 대비).
- 단계 넘기기는 `from`(보고 있던 단계)을 보내요. 서버 단계와 다르면 `409 STAGE_MISMATCH`.
- 투표·아이디어 제출은 "전체 목록을 덮어쓰기"(PUT)라서 여러 번 보내도 결과가 같아요.

## 요청 횟수 제한

- 로그인·방 코드 조회·비밀번호 찾기: IP 기준 제한 (`429 TOO_MANY_ATTEMPTS`)
- AI를 부르는 API(인터뷰 답, 뜻풀이, 추천 더 보기): 사람당 제한 — 비용 보호

## 실시간 이벤트

WebSocket 연결 후 서버가 보내는 메시지 형식:

```json
{ "type": "stage.changed", "data": { "stage": { "id": "diverge.comment", "label": "아이디어 발산", "subStep": 3, "progress": 35 } }, "at": "2026-09-18T15:12:03+09:00" }
```

- 이벤트는 **"무엇이 바뀌었다"는 알림**이에요. 화면에 필요한 자세한 데이터는 프론트가 해당 GET API로 다시 가져가도 돼요.
- 연결이 끊기면 프론트가 자동으로 다시 붙어요(최대 10초 간격). (재)연결 직후 서버는 **그 사람에게만** 지금 단계를 `stage.changed`로 한 번 보내 주세요.
- 연결할 때 토큰이 없거나 만료면 닫힘 코드 `4401`, 이 세션 참가자가 아니거나 내보내진 사람이면 `4403`. 자세한 연결 규칙은 2차 전달 문서의 "실시간 연결 규칙".
- 이벤트에도 **익명 규칙**이 똑같이 적용돼요 (진행자 이벤트에 이름·작성자 넣지 않기).

| type | 받는 화면 | data 예시 | 프론트 동작 |
|---|---|---|---|
| `participant.joined` | 대기실 | `{"participantId":"par_04","nickname":"박상진","role":"participant"}` | 참여자 줄 추가, "3 / 4" 숫자 갱신 |
| `participant.left` | 대기실 | `{"participantId":"par_04"}` | 접속 점 끄기(나간 게 아니라 끊긴 것일 수도 있음) |
| `participant.online` | 대기실 | `{"participantId":"par_04","online":true}` | 재접속한 사람 접속 점 다시 켜기 |
| `participant.kicked` | 대기실(내보내진 사람) | `{"participantId":"par_04"}` | 내보내진 사람은 랜딩으로 |
| `session.started` | 대기실 | `{"stage":{"id":"icebreak","progress":3},"timer":{"endsAt":"…"}}` | 모두 7-1 (진행자도 인터뷰 · 끝나면 7-6) |
| `stage.changed` | 모든 세션 화면 | `{"stage":{"id":"diverge.comment","label":"아이디어 발산","subStep":3,"progress":35}}` | 해당 단계 화면으로 이동, 상단바 갱신 |
| `timer.sync` | 모든 세션 화면 | `{"endsAt":"2026-09-18T15:30:00+09:00","serverNow":"…"}` | 1분마다 서버 시각 기준으로 타이머 보정 |
| `icebreak.progress` | 7-1~7-6 | `{"nickname":"김승희","step":3,"done":false}` | "팀 진행" 카드 한 줄 갱신 |
| `icebreak.news.ready` | 7-1 | `{"ready":true}` | 질문 2 카드 불러오기 |
| `icebreak.groups.updated` | 7-6 (진행자) | `{"newMaterials":2}` | "새 재료 2개 · 다시 묶기" 안내 |
| `ideas.submitted` | 8-1, 8-2 | `{"submittedCount":3,"memberCount":4}` | 제출 인원 갱신 |
| `comments.progress` | 8-4 | `{"doneCount":2,"memberCount":4}` | 진행 인원 갱신 |
| `reviews.ready` | 8-4 → 8-5 | `{"ready":true}` | AI 검증 목록 불러오기 |
| `vote.progress` | 8-6 | `{"votedCount":3,"memberCount":4}` | "투표한 사람 3 / 4" 갱신 |
| `vote.closed` | 8-6, 8-6w, 8-7 | `{}` | 모두 8-7로 (진행자는 확정 버튼, 참가자는 보기 전용) |
| `topic.confirmed` | 8-7 이후 | `{"ideaId":"ide_c1","title":"…","leader":{"participantId":"par_03","nickname":"김승희"}}` | 파트 나누기(9-1)로 |
| `team.parts.ready` | 9-1 | `{"ready":true}` | 파트·후보 목록 불러오기 (AI 파트 나누기 끝) |
| `team.assignment.updated` | 9-3 · 9-4 | `{"version":4}` | 배치 초안 다시 불러오기 (팀장이 바꿈 · 팀원이 표시함) |
| `team.confirmed` | 9-3 · 9-4 | `{"reportReady":false}` | 보고서(9-5)로 이동 |
| `report.ready` | 9-5 | `{"ready":true}` | 보고서 불러와서 A4 2쪽 그리기 |
