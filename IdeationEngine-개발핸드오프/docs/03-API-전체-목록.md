# API 전체 목록

기준 주소 `/api/v1` · 총 74개 · 자세한 요청/응답 예시는 각 화면 README의 "API 상세"에 있어요.

> 이 목록과 `assets/js/endpoints.js`, `assets/js/mock.js`는 같은 원본에서 만들어졌어요. 경로를 바꾸면 세 곳을 함께 바꿔 주세요.

## 계정 · 인증

| 메서드 | 경로 | 권한 | 하는 일 | 쓰는 화면 |
|---|---|---|---|---|
| `POST` | `/auth/signup` | 필요 없음 | 이메일 회원가입 | [A2](../screens/A2-signup/README.md) |
| `POST` | `/auth/login` | 필요 없음 | 이메일 로그인 | [A1](../screens/A1-login/README.md) |
| `POST` | `/auth/refresh` | 필요 없음 | 로그인 유지 (액세스 토큰 새로 받기) | [1](../screens/01-landing/README.md), [1-1](../screens/01-1-landing-logged-in/README.md) |
| `POST` | `/auth/oauth/{provider}` | 필요 없음 | 소셜 로그인 (google · kakao) | [A1](../screens/A1-login/README.md), [A2](../screens/A2-signup/README.md), [A6](../screens/A6-oauth-callback/README.md) |
| `POST` | `/auth/logout` | 필요 없음 | 로그아웃 | [1-1](../screens/01-1-landing-logged-in/README.md), [A5](../screens/A5-account-settings/README.md) |
| `POST` | `/auth/password/reset` | 필요 없음 | 비밀번호 찾기 메일 보내기 | [A1](../screens/A1-login/README.md) |
| `GET` | `/me` | 회원 토큰 | 내 계정 요약 | [1-1](../screens/01-1-landing-logged-in/README.md) |
| `GET` | `/legal/{type}` | 필요 없음 | 약관 원문 (terms · privacy) | [A2](../screens/A2-signup/README.md) |

## 프로필

| 메서드 | 경로 | 권한 | 하는 일 | 쓰는 화면 |
|---|---|---|---|---|
| `GET` | `/meta/skills` | 필요 없음 | 역할·스킬 목록 | [3](../screens/03-profile-create/README.md), [A3](../screens/A3-profile-edit/README.md) |
| `GET` | `/me/profile` | 회원 토큰 | 내 프로필 불러오기 | [A3](../screens/A3-profile-edit/README.md) |
| `PUT` | `/me/profile` | 회원 토큰 | 내 프로필 저장 | [3](../screens/03-profile-create/README.md), [A3](../screens/A3-profile-edit/README.md) |
| `POST` | `/me/avatar` | 회원 토큰 | 프로필 사진 올리기 | [A3](../screens/A3-profile-edit/README.md) |
| `DELETE` | `/me/avatar` | 회원 토큰 | 프로필 사진 삭제 | [A3](../screens/A3-profile-edit/README.md) |

## 지난 세션 · 설정 · 요금제

| 메서드 | 경로 | 권한 | 하는 일 | 쓰는 화면 |
|---|---|---|---|---|
| `GET` | `/me/sessions` | 회원 토큰 | 지난 세션 기록 | [A4](../screens/A4-session-history/README.md) |
| `GET` | `/me/settings` | 회원 토큰 | 계정 설정 불러오기 | [A5](../screens/A5-account-settings/README.md) |
| `PATCH` | `/me/settings` | 회원 토큰 | 알림 설정 바꾸기 | [A5](../screens/A5-account-settings/README.md) |
| `PATCH` | `/me/email` | 회원 토큰 | 이메일 바꾸기 | [A5](../screens/A5-account-settings/README.md) |
| `PATCH` | `/me/password` | 회원 토큰 | 비밀번호 바꾸기 | [A5](../screens/A5-account-settings/README.md) |
| `POST` | `/me/connections/{provider}` | 회원 토큰 | 소셜 계정 연결 | [A5](../screens/A5-account-settings/README.md) |
| `DELETE` | `/me/connections/{provider}` | 회원 토큰 | 소셜 계정 연결 해제 | — |
| `DELETE` | `/me` | 회원 토큰 | 회원 탈퇴 | [A5](../screens/A5-account-settings/README.md) |
| `GET` | `/billing/plan` | 회원 토큰 | 현재 요금제와 한도 | [4](../screens/04-session-create/README.md), [A5](../screens/A5-account-settings/README.md) |
| `POST` | `/billing/checkout` | 회원 토큰 | Pro 결제 시작 | [A5](../screens/A5-account-settings/README.md) |

## 세션 · 대기실

| 메서드 | 경로 | 권한 | 하는 일 | 쓰는 화면 |
|---|---|---|---|---|
| `POST` | `/sessions` | 회원 토큰 | 세션 만들기 | [4](../screens/04-session-create/README.md) |
| `GET` | `/sessions/lookup` | 회원 토큰 | 방 코드로 방 찾기 | [2](../screens/02-join-code/README.md) |
| `POST` | `/sessions/{sessionId}/join` | 회원 토큰 | 방에 들어가기 (처음 입장 · 재접속 모두) | [2](../screens/02-join-code/README.md) |
| `GET` | `/sessions/{sessionId}` | 세션 참가자 (회원) | 세션 상태 | [5](../screens/05-lobby-host/README.md), [6](../screens/06-lobby-participant/README.md), [7-1](../screens/07-1-icebreak-q1-discomfort/README.md), [9-1](../screens/09-1-part-split/README.md) |
| `GET` | `/sessions/{sessionId}/participants` | 세션 참가자 (회원) | 참여자 목록 | [5](../screens/05-lobby-host/README.md) |
| `DELETE` | `/sessions/{sessionId}/participants/{participantId}` | 세션 진행자만 | 참여자 내보내기 | [5](../screens/05-lobby-host/README.md) |
| `POST` | `/sessions/{sessionId}/start` | 세션 진행자만 | 세션 시작 | [5](../screens/05-lobby-host/README.md) |
| `POST` | `/sessions/{sessionId}/stage/next` | 세션 진행자만 | 다음 단계로 넘기기 | [7-6](../screens/07-6-icebreak-host/README.md), [9-1](../screens/09-1-part-split/README.md), [T2](../screens/08-t2-host-advance/README.md) |
| `POST` | `/sessions/{sessionId}/stage/prev` | 세션 진행자만 | 이전 단계로 돌아가기 | [7-6](../screens/07-6-icebreak-host/README.md) |
| `PUT` | `/sessions/{sessionId}/timer` | 세션 진행자만 | 세션 시간 연장 | [T1](../screens/08-t1-time-up/README.md) |

## 7 아이스브레이킹

| 메서드 | 경로 | 권한 | 하는 일 | 쓰는 화면 |
|---|---|---|---|---|
| `GET` | `/sessions/{sessionId}/icebreak/me` | 세션 참가자 (회원) | 내 인터뷰 상태 | [7-1](../screens/07-1-icebreak-q1-discomfort/README.md), [7-3](../screens/07-3-icebreak-q3-change/README.md), [7-4](../screens/07-4-icebreak-q4-services/README.md), [7-5](../screens/07-5-icebreak-q5-wrapup/README.md) |
| `POST` | `/sessions/{sessionId}/icebreak/messages` | 세션 참가자 (회원) | 인터뷰 답 보내기 | [7-1](../screens/07-1-icebreak-q1-discomfort/README.md), [7-3](../screens/07-3-icebreak-q3-change/README.md), [7-4](../screens/07-4-icebreak-q4-services/README.md) |
| `POST` | `/sessions/{sessionId}/icebreak/skip` | 세션 참가자 (회원) | 이 질문 넘어가기 | [7-1](../screens/07-1-icebreak-q1-discomfort/README.md), [7-3](../screens/07-3-icebreak-q3-change/README.md), [7-4](../screens/07-4-icebreak-q4-services/README.md) |
| `GET` | `/sessions/{sessionId}/icebreak/news` | 세션 참가자 (회원) | 최근 소식 카드 3장 | [7-2](../screens/07-2-icebreak-q2-news/README.md) |
| `PUT` | `/sessions/{sessionId}/icebreak/news/{cardId}/reaction` | 세션 참가자 (회원) | 소식 카드 반응 | [7-2](../screens/07-2-icebreak-q2-news/README.md) |
| `POST` | `/sessions/{sessionId}/icebreak/explain` | 세션 참가자 (회원) | "이게 뭐예요?" 뜻풀이 | [7-2](../screens/07-2-icebreak-q2-news/README.md) |
| `GET` | `/sessions/{sessionId}/icebreak/progress` | 세션 참가자 (회원) | 팀 인터뷰 진행 | [7-1](../screens/07-1-icebreak-q1-discomfort/README.md) |
| `GET` | `/sessions/{sessionId}/icebreak/materials/me` | 세션 참가자 (회원) | 내 답에서 뽑힌 재료 (나만 보임) | [7-5](../screens/07-5-icebreak-q5-wrapup/README.md) |
| `GET` | `/sessions/{sessionId}/icebreak/overview` | 세션 진행자만 | 진행자 요약 (진도 · 소식 반응 · 재료 묶음) | [7-6](../screens/07-6-icebreak-host/README.md) |
| `POST` | `/sessions/{sessionId}/icebreak/groups/regroup` | 세션 진행자만 | 재료 다시 묶기 | [7-6](../screens/07-6-icebreak-host/README.md) |
| `PUT` | `/sessions/{sessionId}/icebreak/groups/{groupId}/focus` | 세션 진행자만 | "먼저 보기" 표시 | [7-6](../screens/07-6-icebreak-host/README.md) |
| `GET` | `/sessions/{sessionId}/materials` | 세션 참가자 (회원) | 발산 재료 (모두) | [7-7](../screens/07-7-diverge-materials/README.md) |

## 8 발산

| 메서드 | 경로 | 권한 | 하는 일 | 쓰는 화면 |
|---|---|---|---|---|
| `GET` | `/sessions/{sessionId}/ideas/me` | 세션 참가자 (회원) | 내 아이디어 1·2·3순위 불러오기 | [8-1](../screens/08-1-idea-write/README.md) |
| `PUT` | `/sessions/{sessionId}/ideas/me` | 세션 참가자 (회원) | 내 아이디어 제출 | [8-1](../screens/08-1-idea-write/README.md), [8-2](../screens/08-2-idea-recommend/README.md) |
| `GET` | `/sessions/{sessionId}/ideas/recommendations` | 세션 참가자 (회원) | AI 추천 아이디어 | [8-2](../screens/08-2-idea-recommend/README.md) |
| `GET` | `/sessions/{sessionId}/ideas/board` | 세션 참가자 (회원) | 익명 순위표 | [8-3](../screens/08-3-idea-board/README.md) |
| `GET` | `/sessions/{sessionId}/comments/targets` | 세션 참가자 (회원) | 댓글 달 목록 + 내 할당량 | [8-4](../screens/08-4-idea-comments/README.md) |
| `GET` | `/sessions/{sessionId}/ideas/{ideaId}/comments` | 세션 참가자 (회원) | 먼저 남겨진 익명 댓글 | [8-4](../screens/08-4-idea-comments/README.md) |
| `POST` | `/sessions/{sessionId}/ideas/{ideaId}/comments` | 세션 참가자 (회원) | 익명 댓글 저장 | [8-4](../screens/08-4-idea-comments/README.md) |
| `GET` | `/sessions/{sessionId}/reviews` | 세션 참가자 (회원) | AI 검증 등급별 목록 | [8-5](../screens/08-5-ai-review/README.md), [T3](../screens/08-t3-review-pending/README.md) |
| `GET` | `/sessions/{sessionId}/ideas/{ideaId}/review` | 세션 참가자 (회원) | AI 검증 상세 | [8-5](../screens/08-5-ai-review/README.md) |
| `GET` | `/sessions/{sessionId}/vote` | 세션 참가자 (회원) | 투표 화면 목록 + 내 표 | [8-6](../screens/08-6-vote/README.md), [8-6w](../screens/08-6w-vote-wait/README.md) |
| `GET` | `/sessions/{sessionId}/vote/candidates/{ideaId}` | 세션 참가자 (회원) | 투표 후보 상세 | [8-6](../screens/08-6-vote/README.md) |
| `GET` | `/sessions/{sessionId}/ai-ideas/{aiIdeaId}` | 세션 참가자 (회원) | AI가 모은 아이디어 상세 | [8-6](../screens/08-6-vote/README.md) |
| `GET` | `/sessions/{sessionId}/common-threads/{threadId}` | 세션 참가자 (회원) | 숨은 공통점 상세 (투표 참고) | [8-6](../screens/08-6-vote/README.md) |
| `PUT` | `/sessions/{sessionId}/common-threads/{threadId}/reaction` | 세션 참가자 (회원) | "이 연결, 알고 있었나요?" | [8-6](../screens/08-6-vote/README.md) |
| `PUT` | `/sessions/{sessionId}/vote/me` | 세션 참가자 (회원) | 내 표 저장 (최대 2표) | [8-6](../screens/08-6-vote/README.md) |
| `POST` | `/sessions/{sessionId}/vote/me/finish` | 세션 참가자 (회원) | 투표 마치기 | [8-6](../screens/08-6-vote/README.md) |
| `GET` | `/sessions/{sessionId}/vote/results` | 세션 참가자 (회원) | 투표 결과 + 아이디어 주인 공개 | [8-7](../screens/08-7-vote-result-host/README.md) |
| `POST` | `/sessions/{sessionId}/vote/revote` | 세션 진행자만 | 동점만 다시 투표 | [8-7](../screens/08-7-vote-result-host/README.md) |
| `POST` | `/sessions/{sessionId}/topic` | 세션 진행자만 | 주제 확정 (+ 팀장 정하기) | [8-7](../screens/08-7-vote-result-host/README.md) |

## 9 파트 나누기 · 보고서

| 메서드 | 경로 | 권한 | 하는 일 | 쓰는 화면 |
|---|---|---|---|---|
| `GET` | `/sessions/{sessionId}/team/parts` | 세션 참가자 (회원) | 파트와 후보 (9-1) | [9-1](../screens/09-1-part-split/README.md) |
| `GET` | `/sessions/{sessionId}/team/questions/me` | 세션 참가자 (회원) | 내 추가 질문 (후보가 겹친 사람만 · 9-2) | [9-2](../screens/09-2-overlap-questions/README.md) |
| `PUT` | `/sessions/{sessionId}/team/questions/{partId}/answer` | 세션 참가자 (회원) | 추가 질문 답 제출 | [9-2](../screens/09-2-overlap-questions/README.md) |
| `GET` | `/sessions/{sessionId}/team/assignment` | 세션 참가자 (회원) | 배치 초안 · 분량 (9-3 모두 · 9-4 팀장) | [9-3](../screens/09-3-assign-draft/README.md), [9-4](../screens/09-4-leader-confirm/README.md) |
| `PUT` | `/sessions/{sessionId}/team/parts/{partId}/mark` | 세션 참가자 (회원) | 이야기해 볼 파트 표시 · 해제 (9-3) | [9-3](../screens/09-3-assign-draft/README.md) |
| `PUT` | `/sessions/{sessionId}/team/parts/{partId}/assignee` | 팀장만 (참가자 중 1명) | 맡은 사람 바꾸기 (팀장 · 9-4) | [9-4](../screens/09-4-leader-confirm/README.md) |
| `POST` | `/sessions/{sessionId}/team/suggestions/{suggestionId}` | 팀장만 (참가자 중 1명) | 옮기기 제안 받기 · 그대로 두기 (팀장) | [9-4](../screens/09-4-leader-confirm/README.md) |
| `POST` | `/sessions/{sessionId}/team/assignment/revert` | 팀장만 (참가자 중 1명) | AI 초안으로 되돌리기 (팀장) | [9-4](../screens/09-4-leader-confirm/README.md) |
| `POST` | `/sessions/{sessionId}/team/assignment/confirm` | 팀장만 (참가자 중 1명) | 배치 확정 → 보고서 만들기 (팀장) | [9-4](../screens/09-4-leader-confirm/README.md) |
| `GET` | `/sessions/{sessionId}/report` | 세션 참가자 (회원) | 최종 보고서 (9-5 · A4 보고서 보기) | [9-5](../screens/09-5-report/README.md) |

## 실시간

| `WS` | `/api/v1/sessions/{sessionId}/stream?token=…` | 세션 참가자 | 세션 이벤트 받기 | 5 · 6 · 7 · 8 전체 |
