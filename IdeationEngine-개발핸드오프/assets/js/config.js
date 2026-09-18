/* config.js — 환경 설정. 백엔드가 준비되면 useMock을 false로 바꾸세요. */
window.IE_CONFIG = {
  baseUrl: '/api/v1',          // REST API 주소 (예: https://api.ideationengine.app/api/v1)
  wsUrl: null,                 // 실시간 주소. null이면 baseUrl 기준으로 ws(s)://…/sessions/{id}/stream
  useMock: true,               // true: assets/js/mock.js의 가짜 응답 사용 (백엔드 없이 화면 확인)
  mockDelay: 300,              // 가짜 응답 지연(ms) — 로딩 상태 확인용
  devNav: true                 // 화면 아래 개발용 이동 바 — 시연 영상 촬영 때는 false (목업 모드에서는 Alt+→ / Alt+← 로 다음·이전 화면)
};
