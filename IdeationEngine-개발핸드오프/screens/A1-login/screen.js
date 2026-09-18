/* A1 로그인 */
const email = App.$('.form input.inp');
const pw = App.$('.form label.pw input');

App.action('login', async () => {
  const remember = App.$('.check .box').classList.contains('on');
  const body = { email: email.value.trim(), password: pw.value, remember };
  if (!body.email || !body.password) { App.toast('이메일과 비밀번호를 입력해 주세요'); return false; }
  const r = await api.call('auth.login', {}, body);
  App.save({ remember, accessToken: r.accessToken, user: r.user });
  App.go(App.returnTo(App.screen('01-1-landing-logged-in')));
  return false;
});
App.action('goSignup', async () => { App.go(App.withReturnTo(App.screen('A2-signup'))); return false; });
App.action('oauth', async (el) => {
  App.startOAuth(el.classList.contains('kakao') ? 'kakao' : 'google');
  return false;
});
App.action('resetPw', async () => {
  if (!email.value.trim()) { App.toast('이메일을 먼저 적어주세요'); email.focus(); return false; }
  await api.call('auth.passwordReset', {}, { email: email.value.trim() });
  App.toast('비밀번호 재설정 메일을 보냈어요');
  return false;
});
[email, pw].forEach(el => el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) App.$('[data-action="login"]').click(); }));
