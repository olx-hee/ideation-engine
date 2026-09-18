# IdeationEngine 개발 핸드오프 · 화면 1 ~ 9-5

디자인 목업 **v14** 기준으로 만든 **실제로 동작하는 HTML·CSS·JS 화면 36개**와 **화면별 API 명세·백엔드 설명**이에요.
(투표는 **1인 2표** · 9 파트 나누기 ~ 보고서 포함)

## 정해진 규칙 (2026-09-18)

- **게스트 입장 없음** — 회원가입 → 로그인 → 프로필 작성까지 끝나야 세션을 만들거나 방에 들어갈 수 있어요.
- **방 코드 = 대문자·숫자 6자리**, **초대 링크 = `https://ideationengine.app/s/{방 코드}`** (별도 초대 토큰 없음)
- **로그인 유지** — 액세스 토큰(약 1시간) + 리프레시 쿠키(로그인 상태 유지 체크 시 30일), `POST /auth/refresh`
- **재접속 허용** — 이미 들어갔던 방은 코드로 다시 들어오거나 랜딩의 "세션으로 돌아가기"로 지금 단계 화면에 바로 복귀

## 5분 안에 보기

1. **`index.html`을 브라우저로 열기** → 화면 목록에서 아무 화면이나 누르기
2. 화면 아래 검은 바의 **◀ ▶** 로 흐름 순서대로 이동 (주소 뒤에 `?dev=0`을 붙이면 숨김)
3. 버튼·입력은 실제로 동작해요. 지금은 **MOCK(가짜 서버)** 로 응답하고, 백엔드가 준비되면 `assets/js/config.js`에서 `useMock: false`로 바꾸면 돼요.

> 파일을 더블클릭해서 열어도 되지만, VS Code **Live Server** 같은 로컬 서버로 열면 클립보드 복사 등 모든 기능이 정상 동작해요.

## 폴더 구조

```
IdeationEngine-개발핸드오프/
├─ 팀공유-진행현황.md         ★ 무엇을 했고 · 어디까지 됐고 · 무엇을 해야 하는지 (팀원·Claude는 여기부터)
├─ index.html                 화면 목록 (여기서 시작)
├─ README.md                  지금 이 문서
├─ assets/
│  ├─ css/
│  │  ├─ tokens.css           색·글자 크기 변수
│  │  ├─ components.css       디자인 목업의 컴포넌트 스타일 (그대로)
│  │  └─ shell.css            실제 페이지용 추가 (입력칸·화면 맞춤·토스트·개발용 바)
│  └─ js/
│     ├─ config.js            ★ 환경 설정 (useMock, API 주소)
│     ├─ app.js               공통 동작 (이동·액션·칩·토글·레일 접기·타이머…)
│     ├─ api.js               ★ 백엔드 호출: api.call('id', params, body) · 실시간 realtime.connect
│     ├─ endpoints.js         API 목록 (자동 생성)
│     ├─ mock.js              가짜 서버 응답 (자동 생성)
│     ├─ icebreak-chat.js     7-1~7-5 채팅 공통
│     └─ screens.js           화면 순서
├─ screens/
│  └─ <번호-이름>/
│     ├─ index.html           화면 (마크업)
│     ├─ screen.js            이 화면만의 동작
│     └─ README.md            ★ 화면 설명 · 누르면 어떻게 되나 · 남은 일 · 백엔드가 할 일 · API 요청/응답 예시
├─ design/                    디자인 목업 원본 (v14)
├─ _generator/                ★ 이 폴더 전체를 만드는 스크립트 — 수정은 여기서 하고 `python _generator/handoff.py`
├─ _tools/test-backend-phase1.py  1차 범위(계정·입장) 테스트용 가짜 백엔드
├─ _tools/test-backend-team.py    7차(9번 파트 나누기 ~ 보고서) 테스트용 가짜 백엔드
└─ docs/
   ├─ 00-백엔드-1차-전달-화면1-1-1-2.md  ★ 백엔드 1차 전달 (만들 API · 완료 기준 18개)
   ├─ 00-백엔드-2차-전달-화면4-5-6.md  ★ 백엔드 2차 전달 (만들 API · 완료 기준 30개)
   ├─ 00-백엔드-3차-전달-화면7-1~7-7.md  ★ 백엔드 3차 전달 (만들 API · 완료 기준 28개)
   ├─ 00-백엔드-4차-전달-화면8-1-8-3-8-4-8-6-8-7.md  ★ 백엔드 4차 전달 (만들 API · 완료 기준 32개)
   ├─ 00-백엔드-5차-전달-화면8-2-8-5-8-6.md  ★ 백엔드 5차 전달 (만들 API · 완료 기준 26개)
   ├─ 00-백엔드-6차-전달-화면A1~A5.md  ★ 백엔드 6차 전달 (만들 API · 완료 기준 34개)
   ├─ 00-백엔드-7차-전달-화면9-1~9-5.md  ★ 백엔드 7차 전달 (만들 API · 완료 기준 24개)
   ├─ 00-핸드오프-README.md    README 사본 (배포한 사이트에서도 열 수 있게)
   ├─ 01-백엔드-한눈에-보기.md  ★ 백엔드 처음 보는 사람은 여기부터
   ├─ 02-API-공통-규칙.md      인증 · 에러 형식 · 실시간 이벤트
   ├─ 03-API-전체-목록.md      API 74개 표
   ├─ 04-데이터-모델.md        DB 표 제안
   ├─ 05-AI-작업-목록.md       AI·검색 작업
   ├─ 06-디자인-토큰.md        색·글자·컴포넌트 클래스
   └─ 07-배포-Vercel.md       배포 · 주소 규칙(/s/방코드 · /oauth/callback) · 백엔드 연결
```

## 화면 목록

| 번호 | 화면 (README) | 폴더 | 보는 사람 | API 수 |
|---|---|---|---|---|
| 1 | [랜딩](screens/01-landing/README.md) | `screens/01-landing/` | 누구나 (로그인 전) | 1 |
| 1-1 | [랜딩 (로그인 상태) · 프로필 팝오버](screens/01-1-landing-logged-in/README.md) | `screens/01-1-landing-logged-in/` | 로그인한 회원 | 3 |
| 2 | [방 코드 입장](screens/02-join-code/README.md) | `screens/02-join-code/` | 로그인한 회원 (프로필 작성 완료) | 2 |
| 3 | [프로필 만들기](screens/03-profile-create/README.md) | `screens/03-profile-create/` | 로그인한 회원 (가입 직후 · 프로필 없이 입장하려던 사람) | 2 |
| 4 | [세션 만들기](screens/04-session-create/README.md) | `screens/04-session-create/` | 진행자 (로그인 회원) | 2 |
| 5 | [대기실 (진행자)](screens/05-lobby-host/README.md) | `screens/05-lobby-host/` | 진행자 | 4 |
| 6 | [대기실 (참가자)](screens/06-lobby-participant/README.md) | `screens/06-lobby-participant/` | 팀원 | 1 |
| 7-1 | [아이스브레이킹 · 질문 1 불편했던 순간](screens/07-1-icebreak-q1-discomfort/README.md) | `screens/07-1-icebreak-q1-discomfort/` | 팀원 (진행자도 참여 가능) | 5 |
| 7-2 | [아이스브레이킹 · 질문 2 최근 소식 카드](screens/07-2-icebreak-q2-news/README.md) | `screens/07-2-icebreak-q2-news/` | 팀원 | 3 |
| 7-3 | [아이스브레이킹 · 질문 3 변화 × 내 경험](screens/07-3-icebreak-q3-change/README.md) | `screens/07-3-icebreak-q3-change/` | 팀원 | 3 |
| 7-4 | [아이스브레이킹 · 질문 4 요즘 쓰는 서비스](screens/07-4-icebreak-q4-services/README.md) | `screens/07-4-icebreak-q4-services/` | 팀원 | 3 |
| 7-5 | [아이스브레이킹 · 질문 5 마무리 · 내 재료](screens/07-5-icebreak-q5-wrapup/README.md) | `screens/07-5-icebreak-q5-wrapup/` | 팀원 | 2 |
| 7-6 | [아이스브레이킹 · 진행자](screens/07-6-icebreak-host/README.md) | `screens/07-6-icebreak-host/` | 진행자 (7-1~7-5 인터뷰를 마친 뒤) | 5 |
| 7-7 | [발산 시작 — 재료 보기](screens/07-7-diverge-materials/README.md) | `screens/07-7-diverge-materials/` | 모두 | 1 |
| 8-1 | [발산 · 내 아이디어 정하기](screens/08-1-idea-write/README.md) | `screens/08-1-idea-write/` | 모두 (각자) | 2 |
| 8-2 | [발산 · AI 추천에서 고르기](screens/08-2-idea-recommend/README.md) | `screens/08-2-idea-recommend/` | 모두 (각자) | 2 |
| 8-3 | [발산 · 익명 순위표](screens/08-3-idea-board/README.md) | `screens/08-3-idea-board/` | 모두 | 1 |
| 8-4 | [발산 · 익명 댓글](screens/08-4-idea-comments/README.md) | `screens/08-4-idea-comments/` | 모두 (각자) | 3 |
| 8-5 | [발산 · AI 검증 · 현실성](screens/08-5-ai-review/README.md) | `screens/08-5-ai-review/` | 모두 (같은 화면) | 2 |
| 8-6 | [발산 · 투표 (+ AI가 모은 아이디어 · 숨은 공통점)](screens/08-6-vote/README.md) | `screens/08-6-vote/` | 모두 (각자) | 7 |
| 8-6w | [발산 · 투표 마침 — 결과 기다리기](screens/08-6w-vote-wait/README.md) | `screens/08-6w-vote-wait/` | 모두 (각자) | 1 |
| 8-7 | [발산 · 투표 결과 · 주제 확정 (진행자 · 참가자는 보기 전용)](screens/08-7-vote-result-host/README.md) | `screens/08-7-vote-result-host/` | 모두 (진행자만 확정 · 재투표 버튼) | 3 |
| 9-1 | [파트 나누기 — 후보 찾기](screens/09-1-part-split/README.md) | `screens/09-1-part-split/` | 모두 (각자) | 3 |
| 9-2 | [겹친 후보 질문 (후보가 겹친 사람만)](screens/09-2-overlap-questions/README.md) | `screens/09-2-overlap-questions/` | 후보가 겹친 사람만 | 2 |
| 9-3 | [배치 초안 (모두가 보는 화면)](screens/09-3-assign-draft/README.md) | `screens/09-3-assign-draft/` | 모두 (팀장은 9-4) | 2 |
| 9-4 | [팀장 확정 — 회의 내용 반영](screens/09-4-leader-confirm/README.md) | `screens/09-4-leader-confirm/` | 팀장 | 5 |
| 9-5 | [최종 보고서 (A4 세로 2쪽)](screens/09-5-report/README.md) | `screens/09-5-report/` | 모두 (지난 세션 기록에서도) | 1 |
| T1 | [세션 시간이 끝났을 때 (안내 창)](screens/08-t1-time-up/README.md) | `screens/08-t1-time-up/` | 모두 (진행자에게만 버튼) | 1 |
| T2 | [진행자 단계 넘기기 + 제출 확인 (하단 막대 · 확인 창)](screens/08-t2-host-advance/README.md) | `screens/08-t2-host-advance/` | 진행자 | 1 |
| T3 | [AI 검증이 아직 안 끝났을 때 (8-5 · ready=false)](screens/08-t3-review-pending/README.md) | `screens/08-t3-review-pending/` | 모두 | 1 |
| A1 | [로그인](screens/A1-login/README.md) | `screens/A1-login/` | 누구나 | 3 |
| A2 | [회원가입 (+ 약관 팝업 A2-1 · A2-2)](screens/A2-signup/README.md) | `screens/A2-signup/` | 누구나 | 3 |
| A3 | [프로필 수정](screens/A3-profile-edit/README.md) | `screens/A3-profile-edit/` | 로그인 회원 | 5 |
| A4 | [지난 세션 기록](screens/A4-session-history/README.md) | `screens/A4-session-history/` | 로그인 회원 | 1 |
| A5 | [계정 설정](screens/A5-account-settings/README.md) | `screens/A5-account-settings/` | 로그인 회원 | 9 |
| A6 | [소셜 로그인 처리 중 (콜백)](screens/A6-oauth-callback/README.md) | `screens/A6-oauth-callback/` | 로그인하려는 사람 | 1 |

## 프론트엔드 개발자에게

- **화면 = `screens/<화면>/index.html`의 `.board` 안쪽.** React/Vue 등으로 옮길 때 이 마크업을 컴포넌트로 옮기고, 클래스 이름은 그대로 두고 `tokens.css` → `components.css` → `shell.css` 순서로 전역 import 하면 모양이 똑같이 나와요.
- **크기**: 모든 화면은 1280×800 기준으로 디자인됐고, 지금은 창 크기에 맞춰 통째로 확대/축소(zoom)해요. **반응형·모바일 레이아웃은 남은 일**이에요.
- **이동**: 버튼에 `data-go="../화면/index.html"` · **동작**: `data-action="이름"` + 화면의 `screen.js`에서 `App.action('이름', async (el) => { … })`. 동작이 `false`를 돌려주면 이동하지 않아요. 로딩 표시와 에러 토스트는 공통으로 처리돼요.
- **API**: `await api.call('comment.create', { ideaId }, { concern, praise })` — id 목록은 `docs/03-API-전체-목록.md`. 경로의 `{sessionId}`는 자동으로 채워져요.
- **목업 모드 규칙**: `useMock: true`일 때는 HTML에 들어 있는 예시 내용을 그대로 보여주고, `false`일 때만 각 `screen.js`의 `load()`가 서버 데이터로 다시 그려요. 그래서 목업 모드에서는 디자인과 픽셀이 같아요.
- **실시간**: `realtime.connect(App.sessionId(), ev => …)` — 진행자가 단계를 넘기면 `stage.changed`를 받아 다음 화면으로 이동하는 코드가 들어 있어요.
- **공통으로 남은 일**
  - ⬜ 반응형·모바일, 다크 모드
  - ⬜ 로딩(스켈레톤)·빈 화면·에러 화면 디자인 적용 (지금은 버튼 흐림 + 토스트)
  - ⬜ 토큰 갱신(리프레시) · 로그인 후 원래 화면으로 돌아가기
  - ⬜ 세션 화면 공통: 들어올 때 `session.get`으로 단계 확인 → 다른 단계면 그 화면으로 보내기, 상단 진행률·타이머를 서버 값으로
  - ⬜ 각 README의 "남은 일" 목록

## 백엔드 개발자에게 — 읽는 순서

0. **차수별 작업 범위** (만들 API · 정해진 규칙 · 완료 기준): [1차](docs/00-백엔드-1차-전달-화면1-1-1-2.md) · [2차](docs/00-백엔드-2차-전달-화면4-5-6.md) · [3차](docs/00-백엔드-3차-전달-화면7-1~7-7.md) · [4차](docs/00-백엔드-4차-전달-화면8-1-8-3-8-4-8-6-8-7.md) · [5차](docs/00-백엔드-5차-전달-화면8-2-8-5-8-6.md) · [6차](docs/00-백엔드-6차-전달-화면A1~A5.md) · [7차](docs/00-백엔드-7차-전달-화면9-1~9-5.md) — 차수 순서대로 만들어요
1. [docs/01-백엔드-한눈에-보기.md](docs/01-백엔드-한눈에-보기.md) — 부품 · 권한 · 세션 단계 · **익명 규칙** · 개발 순서
2. [docs/02-API-공통-규칙.md](docs/02-API-공통-규칙.md) — 인증 · 에러 형식 · 실시간 이벤트
3. 만들 화면의 `screens/<화면>/README.md` — "백엔드가 해야 할 일"과 요청/응답 예시
4. [04 데이터 모델](docs/04-데이터-모델.md) · [05 AI 작업](docs/05-AI-작업-목록.md) · [03 전체 목록](docs/03-API-전체-목록.md)

응답 예시는 `assets/js/mock.js`와 **같은 원본**이라, 예시대로 JSON을 돌려주면 프론트가 바로 붙어요.

## 수정하는 법 (중요)

`screens/` `assets/` `docs/` `README.md` `index.html` `design/` `팀공유-진행현황.md` 는 **자동으로 만들어진 파일**이에요. 직접 고치면 다음 생성 때 덮어써져요.
수정은 `_generator/` 안의 원본에서 하고 `python _generator/handoff.py`를 실행하세요 (어떤 파일을 고치면 되는지는 `팀공유-진행현황.md` 6장).

## 개발하면서 디자인·기획에 확인이 필요한 것

- 7-7(발산 시작 · 재료)과 8-1(내 아이디어 정하기)의 입력칸 역할이 겹침 — 7-7을 재료 보기 전용으로 둘지
- 참가자가 보는 8-7(결과 보기 전용) · 투표를 마친 뒤 기다리는 화면 · 검증이 아직 안 끝났을 때 화면
- 세션 시간이 끝났을 때 동작(자동 종료 vs 진행자에게 알림)
- 회원 탈퇴 시 다른 사람과 함께한 세션의 익명 댓글·아이디어 처리 (임시 규칙: 남기고 "탈퇴한 사용자")
- Pro 가격 · 결제 대행사 · 약관 법률 검토
- 7-6 진행자 "이전 단계" 버튼의 뜻 (지금 규칙: 아이스브레이킹 → 대기실은 안 돼서 409)
- 8-1 ~ 8-6에서 진행자가 단계를 넘기는 버튼 (지금은 7-6 "발산 시작"만 있음)
- 소셜 로그인 콜백 화면 · 소셜로 처음 가입할 때 약관 동의 화면
- 비밀번호 재설정 · 이메일 변경 확인 메일의 링크를 연 뒤 화면
- **팀장을 누가 정하나** — 지금은 주제 확정(8-7) 때 진행자가 그대로 팀장 (topic.confirm의 leaderParticipantId는 준비됨)
- 9-1의 진행자용 "추가 질문 시작 →" 버튼 · 9-3의 파트 표시 모드 · 9-4의 담당 고르는 목록 — 디자인 없이 임시로 넣음
- 보고서를 로그인 없이 볼 수 있는 공개 링크를 만들지
