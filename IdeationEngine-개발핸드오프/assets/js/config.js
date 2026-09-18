/* config.js — 환경 설정. 백엔드가 준비되면 useMock을 false로 바꾸세요. */
window.IE_CONFIG = {
  // ⚠️ 2026-09-19 임시: 정식 배포(api.ideationengine.kr) 전 실사용 테스트용 cloudflared 터널.
  //    이 컴퓨터가 꺼지거나 터널이 끊기면 이 주소는 죽는다 — 정식 배포되면 이 값을 그 주소로 바꿀 것.
  baseUrl: 'https://peak-james-chair-hands.trycloudflare.com/api/v1',
  wsUrl: 'wss://peak-james-chair-hands.trycloudflare.com/api/v1',
  googleClientId: '9070339676-f140ddsgrbu5s8j5cjrfucvslnto1kem.apps.googleusercontent.com', // Google Cloud Console에서 발급한 OAuth 클라이언트 ID (공개돼도 되는 값)
  useMock: false,               // true: assets/js/mock.js의 가짜 응답 사용 (백엔드 없이 화면 확인)
  mockDelay: 300,              // 가짜 응답 지연(ms) — 로딩 상태 확인용
  devNav: true                 // 화면 아래 개발용 이동 바 — 시연 영상 촬영 때는 false (목업 모드에서는 Alt+→ / Alt+← 로 다음·이전 화면)
};
