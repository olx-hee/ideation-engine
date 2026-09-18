/* A6 소셜 로그인 콜백 */
(async () => {
  const q = new URLSearchParams(location.search);
  const provider = q.get('provider') || sessionStorage.getItem('ie.oauth.provider') || 'google';
  const code = q.get('code'), state = q.get('state');
  if (IE_CONFIG.useMock) { App.toast('목업: 소셜 로그인 처리 중 화면이에요 (실서버에서는 1초 안에 넘어가요)'); return; }
  if (!code || state !== sessionStorage.getItem('ie.oauth.state')) { App.toast('로그인 정보가 맞지 않아요. 다시 시도해 주세요', 'error'); App.go(App.screen('A1-login')); return; }
  try {
    const r = await api.call('auth.oauth', { provider }, { code, redirectUri: location.origin + '/oauth/callback' });
    App.save({ accessToken: r.accessToken, user: r.user });
    App.go(App.returnTo(App.screen('01-1-landing-logged-in')));
  } catch (err) {
    if (err.code === 'AGREEMENT_REQUIRED') { sessionStorage.setItem('ie.oauth.pending', JSON.stringify({ provider, code })); App.go(App.screen('A2-signup')); return; }
    App.toast(err.message || '소셜 로그인에 실패했어요', 'error'); App.go(App.screen('A1-login'));
  }
})();
