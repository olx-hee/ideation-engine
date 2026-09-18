/* endpoints.js — API 목록 (자동 생성 · 문서: docs/03-API-전체-목록.md) */
window.IE_ENDPOINTS = {
  "auth.signup": {
    "method": "POST",
    "path": "/auth/signup",
    "auth": "none",
    "title": "이메일 회원가입"
  },
  "auth.login": {
    "method": "POST",
    "path": "/auth/login",
    "auth": "none",
    "title": "이메일 로그인"
  },
  "auth.refresh": {
    "method": "POST",
    "path": "/auth/refresh",
    "auth": "none",
    "title": "로그인 유지 (액세스 토큰 새로 받기)"
  },
  "auth.oauth": {
    "method": "POST",
    "path": "/auth/oauth/{provider}",
    "auth": "none",
    "title": "소셜 로그인 (google · kakao)"
  },
  "auth.logout": {
    "method": "POST",
    "path": "/auth/logout",
    "auth": "none",
    "title": "로그아웃"
  },
  "auth.passwordReset": {
    "method": "POST",
    "path": "/auth/password/reset",
    "auth": "none",
    "title": "비밀번호 찾기 메일 보내기"
  },
  "auth.me": {
    "method": "GET",
    "path": "/me",
    "auth": "member",
    "title": "내 계정 요약"
  },
  "legal.get": {
    "method": "GET",
    "path": "/legal/{type}",
    "auth": "none",
    "title": "약관 원문 (terms · privacy)"
  },
  "meta.skills": {
    "method": "GET",
    "path": "/meta/skills",
    "auth": "none",
    "title": "역할·스킬 목록"
  },
  "profile.get": {
    "method": "GET",
    "path": "/me/profile",
    "auth": "member",
    "title": "내 프로필 불러오기"
  },
  "profile.update": {
    "method": "PUT",
    "path": "/me/profile",
    "auth": "member",
    "title": "내 프로필 저장"
  },
  "profile.avatarUpload": {
    "method": "POST",
    "path": "/me/avatar",
    "auth": "member",
    "title": "프로필 사진 올리기"
  },
  "profile.avatarDelete": {
    "method": "DELETE",
    "path": "/me/avatar",
    "auth": "member",
    "title": "프로필 사진 삭제"
  },
  "history.list": {
    "method": "GET",
    "path": "/me/sessions",
    "auth": "member",
    "title": "지난 세션 기록"
  },
  "settings.get": {
    "method": "GET",
    "path": "/me/settings",
    "auth": "member",
    "title": "계정 설정 불러오기"
  },
  "settings.update": {
    "method": "PATCH",
    "path": "/me/settings",
    "auth": "member",
    "title": "알림 설정 바꾸기"
  },
  "account.changeEmail": {
    "method": "PATCH",
    "path": "/me/email",
    "auth": "member",
    "title": "이메일 바꾸기"
  },
  "account.changePassword": {
    "method": "PATCH",
    "path": "/me/password",
    "auth": "member",
    "title": "비밀번호 바꾸기"
  },
  "account.connect": {
    "method": "POST",
    "path": "/me/connections/{provider}",
    "auth": "member",
    "title": "소셜 계정 연결"
  },
  "account.disconnect": {
    "method": "DELETE",
    "path": "/me/connections/{provider}",
    "auth": "member",
    "title": "소셜 계정 연결 해제"
  },
  "account.withdraw": {
    "method": "DELETE",
    "path": "/me",
    "auth": "member",
    "title": "회원 탈퇴"
  },
  "billing.plan": {
    "method": "GET",
    "path": "/billing/plan",
    "auth": "member",
    "title": "현재 요금제와 한도"
  },
  "billing.checkout": {
    "method": "POST",
    "path": "/billing/checkout",
    "auth": "member",
    "title": "Pro 결제 시작"
  },
  "session.create": {
    "method": "POST",
    "path": "/sessions",
    "auth": "member",
    "title": "세션 만들기"
  },
  "session.lookup": {
    "method": "GET",
    "path": "/sessions/lookup",
    "auth": "member",
    "title": "방 코드로 방 찾기"
  },
  "session.join": {
    "method": "POST",
    "path": "/sessions/{sessionId}/join",
    "auth": "member",
    "title": "방에 들어가기 (처음 입장 · 재접속 모두)"
  },
  "session.get": {
    "method": "GET",
    "path": "/sessions/{sessionId}",
    "auth": "participant",
    "title": "세션 상태"
  },
  "session.participants": {
    "method": "GET",
    "path": "/sessions/{sessionId}/participants",
    "auth": "participant",
    "title": "참여자 목록"
  },
  "session.kick": {
    "method": "DELETE",
    "path": "/sessions/{sessionId}/participants/{participantId}",
    "auth": "host",
    "title": "참여자 내보내기"
  },
  "session.start": {
    "method": "POST",
    "path": "/sessions/{sessionId}/start",
    "auth": "host",
    "title": "세션 시작"
  },
  "session.advance": {
    "method": "POST",
    "path": "/sessions/{sessionId}/stage/next",
    "auth": "host",
    "title": "다음 단계로 넘기기"
  },
  "session.back": {
    "method": "POST",
    "path": "/sessions/{sessionId}/stage/prev",
    "auth": "host",
    "title": "이전 단계로 돌아가기"
  },
  "session.extend": {
    "method": "PUT",
    "path": "/sessions/{sessionId}/timer",
    "auth": "host",
    "title": "세션 시간 연장"
  },
  "ice.state": {
    "method": "GET",
    "path": "/sessions/{sessionId}/icebreak/me",
    "auth": "participant",
    "title": "내 인터뷰 상태"
  },
  "ice.send": {
    "method": "POST",
    "path": "/sessions/{sessionId}/icebreak/messages",
    "auth": "participant",
    "title": "인터뷰 답 보내기"
  },
  "ice.skip": {
    "method": "POST",
    "path": "/sessions/{sessionId}/icebreak/skip",
    "auth": "participant",
    "title": "이 질문 넘어가기"
  },
  "ice.news": {
    "method": "GET",
    "path": "/sessions/{sessionId}/icebreak/news",
    "auth": "participant",
    "title": "최근 소식 카드 3장"
  },
  "ice.react": {
    "method": "PUT",
    "path": "/sessions/{sessionId}/icebreak/news/{cardId}/reaction",
    "auth": "participant",
    "title": "소식 카드 반응"
  },
  "ice.explain": {
    "method": "POST",
    "path": "/sessions/{sessionId}/icebreak/explain",
    "auth": "participant",
    "title": "\"이게 뭐예요?\" 뜻풀이"
  },
  "ice.progress": {
    "method": "GET",
    "path": "/sessions/{sessionId}/icebreak/progress",
    "auth": "participant",
    "title": "팀 인터뷰 진행"
  },
  "ice.myMaterials": {
    "method": "GET",
    "path": "/sessions/{sessionId}/icebreak/materials/me",
    "auth": "participant",
    "title": "내 답에서 뽑힌 재료 (나만 보임)"
  },
  "ice.overview": {
    "method": "GET",
    "path": "/sessions/{sessionId}/icebreak/overview",
    "auth": "host",
    "title": "진행자 요약 (진도 · 소식 반응 · 재료 묶음)"
  },
  "ice.regroup": {
    "method": "POST",
    "path": "/sessions/{sessionId}/icebreak/groups/regroup",
    "auth": "host",
    "title": "재료 다시 묶기"
  },
  "ice.focus": {
    "method": "PUT",
    "path": "/sessions/{sessionId}/icebreak/groups/{groupId}/focus",
    "auth": "host",
    "title": "\"먼저 보기\" 표시"
  },
  "ice.materials": {
    "method": "GET",
    "path": "/sessions/{sessionId}/materials",
    "auth": "participant",
    "title": "발산 재료 (모두)"
  },
  "idea.mine": {
    "method": "GET",
    "path": "/sessions/{sessionId}/ideas/me",
    "auth": "participant",
    "title": "내 아이디어 1·2·3순위 불러오기"
  },
  "idea.submit": {
    "method": "PUT",
    "path": "/sessions/{sessionId}/ideas/me",
    "auth": "participant",
    "title": "내 아이디어 제출"
  },
  "idea.recommend": {
    "method": "GET",
    "path": "/sessions/{sessionId}/ideas/recommendations",
    "auth": "participant",
    "title": "AI 추천 아이디어"
  },
  "idea.board": {
    "method": "GET",
    "path": "/sessions/{sessionId}/ideas/board",
    "auth": "participant",
    "title": "익명 순위표"
  },
  "comment.targets": {
    "method": "GET",
    "path": "/sessions/{sessionId}/comments/targets",
    "auth": "participant",
    "title": "댓글 달 목록 + 내 할당량"
  },
  "comment.list": {
    "method": "GET",
    "path": "/sessions/{sessionId}/ideas/{ideaId}/comments",
    "auth": "participant",
    "title": "먼저 남겨진 익명 댓글"
  },
  "comment.create": {
    "method": "POST",
    "path": "/sessions/{sessionId}/ideas/{ideaId}/comments",
    "auth": "participant",
    "title": "익명 댓글 저장"
  },
  "review.list": {
    "method": "GET",
    "path": "/sessions/{sessionId}/reviews",
    "auth": "participant",
    "title": "AI 검증 등급별 목록"
  },
  "review.get": {
    "method": "GET",
    "path": "/sessions/{sessionId}/ideas/{ideaId}/review",
    "auth": "participant",
    "title": "AI 검증 상세"
  },
  "vote.state": {
    "method": "GET",
    "path": "/sessions/{sessionId}/vote",
    "auth": "participant",
    "title": "투표 화면 목록 + 내 표"
  },
  "vote.candidate": {
    "method": "GET",
    "path": "/sessions/{sessionId}/vote/candidates/{ideaId}",
    "auth": "participant",
    "title": "투표 후보 상세"
  },
  "vote.aiIdea": {
    "method": "GET",
    "path": "/sessions/{sessionId}/ai-ideas/{aiIdeaId}",
    "auth": "participant",
    "title": "AI가 모은 아이디어 상세"
  },
  "vote.thread": {
    "method": "GET",
    "path": "/sessions/{sessionId}/common-threads/{threadId}",
    "auth": "participant",
    "title": "숨은 공통점 상세 (투표 참고)"
  },
  "vote.threadReact": {
    "method": "PUT",
    "path": "/sessions/{sessionId}/common-threads/{threadId}/reaction",
    "auth": "participant",
    "title": "\"이 연결, 알고 있었나요?\""
  },
  "vote.save": {
    "method": "PUT",
    "path": "/sessions/{sessionId}/vote/me",
    "auth": "participant",
    "title": "내 표 저장 (최대 2표)"
  },
  "vote.finish": {
    "method": "POST",
    "path": "/sessions/{sessionId}/vote/me/finish",
    "auth": "participant",
    "title": "투표 마치기"
  },
  "vote.results": {
    "method": "GET",
    "path": "/sessions/{sessionId}/vote/results",
    "auth": "participant",
    "title": "투표 결과 + 아이디어 주인 공개"
  },
  "vote.revote": {
    "method": "POST",
    "path": "/sessions/{sessionId}/vote/revote",
    "auth": "host",
    "title": "동점만 다시 투표"
  },
  "topic.confirm": {
    "method": "POST",
    "path": "/sessions/{sessionId}/topic",
    "auth": "host",
    "title": "주제 확정 (+ 팀장 정하기)"
  },
  "team.parts": {
    "method": "GET",
    "path": "/sessions/{sessionId}/team/parts",
    "auth": "participant",
    "title": "파트와 후보 (9-1)"
  },
  "team.questions": {
    "method": "GET",
    "path": "/sessions/{sessionId}/team/questions/me",
    "auth": "participant",
    "title": "내 추가 질문 (후보가 겹친 사람만 · 9-2)"
  },
  "team.answer": {
    "method": "PUT",
    "path": "/sessions/{sessionId}/team/questions/{partId}/answer",
    "auth": "participant",
    "title": "추가 질문 답 제출"
  },
  "team.assignment": {
    "method": "GET",
    "path": "/sessions/{sessionId}/team/assignment",
    "auth": "participant",
    "title": "배치 초안 · 분량 (9-3 모두 · 9-4 팀장)"
  },
  "team.mark": {
    "method": "PUT",
    "path": "/sessions/{sessionId}/team/parts/{partId}/mark",
    "auth": "participant",
    "title": "이야기해 볼 파트 표시 · 해제 (9-3)"
  },
  "team.reassign": {
    "method": "PUT",
    "path": "/sessions/{sessionId}/team/parts/{partId}/assignee",
    "auth": "leader",
    "title": "맡은 사람 바꾸기 (팀장 · 9-4)"
  },
  "team.suggestion": {
    "method": "POST",
    "path": "/sessions/{sessionId}/team/suggestions/{suggestionId}",
    "auth": "leader",
    "title": "옮기기 제안 받기 · 그대로 두기 (팀장)"
  },
  "team.revert": {
    "method": "POST",
    "path": "/sessions/{sessionId}/team/assignment/revert",
    "auth": "leader",
    "title": "AI 초안으로 되돌리기 (팀장)"
  },
  "team.confirm": {
    "method": "POST",
    "path": "/sessions/{sessionId}/team/assignment/confirm",
    "auth": "leader",
    "title": "배치 확정 → 보고서 만들기 (팀장)"
  },
  "report.get": {
    "method": "GET",
    "path": "/sessions/{sessionId}/report",
    "auth": "participant",
    "title": "최종 보고서 (9-5 · A4 보고서 보기)"
  }
};
