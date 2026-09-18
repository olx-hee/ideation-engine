/* 1 랜딩 */
// 로그인 유지: 토큰이 있거나 리프레시 쿠키로 새로 받을 수 있으면 로그인 상태 랜딩으로
if (!IE_CONFIG.useMock) {
  (async () => { if (App.state.accessToken || await api.refresh()) App.go(App.screen('01-1-landing-logged-in')); })();
}
// 세션 만들기는 로그인 필요 → 안 했으면 로그인 후 4번으로 돌아오게
App.action('needLogin', async () => (App.requireLogin('../04-session-create/index.html') ? undefined : false));
