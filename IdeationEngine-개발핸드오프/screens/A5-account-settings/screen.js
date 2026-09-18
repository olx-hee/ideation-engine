/* A5 계정 설정 */
const NOTI = { '세션 초대 알림': 'sessionInvite', '보고서 완성 알림': 'reportReady', '새 기능·이벤트 소식': 'marketing' };

document.addEventListener('ie:toggle', (e) => {
  const key = NOTI[App.text(e.target.closest('.sr').firstElementChild)]; if (!key) return;
  api.call('settings.update', {}, { notifications: { [key]: e.detail } })
    .then(() => App.toast('알림 설정을 저장했어요'))
    .catch(err => { e.target.classList.toggle('on'); App.toast(err.message, 'error'); });
});
/* 실서버 모드: 로그인 정보 · 소셜 연결 · 알림 · 요금제를 서버 값으로 */
function fillSettings(s) {
  App.$$('.sr').forEach(row => {
    const label = App.text(row.querySelector('.sk2') || {});
    const val = row.querySelector('.sv');
    if (label === '이메일' && val) val.textContent = s.email;
    if (label === '비밀번호' && val) val.textContent = s.passwordChangedAt ? `마지막 변경 ${s.passwordChangedAt.slice(0, 10).replaceAll('-', '.')}` : '아직 만들지 않았어요';
    const name = App.text(row.firstElementChild || {});
    if (/Google|카카오/.test(name)) {
      const on = s.connections && s.connections[/Google/.test(name) ? 'google' : 'kakao'];
      const badge = row.querySelector('.badge'), btn = row.querySelector('button');
      if (badge) badge.hidden = !on;
      if (btn) btn.hidden = !!on;
    }
  });
  const keys = ['sessionInvite', 'reportReady', 'marketing'];
  App.$$('.sc .sr .toggle').forEach((t, i) => { if (keys[i]) t.classList.toggle('on', !!(s.notifications || {})[keys[i]]); });
}
async function load() {
  App.loadAccountSide();
  const s = await App.run(null, () => api.call('settings.get'));
  if (s) fillSettings(s);
  const p = await App.run(null, () => api.call('billing.plan'));
  if (p) {
    App.$$('.plan-free').forEach(el => { el.textContent = p.plan; });
    const mini = App.$('.planmini');
    if (mini && p.limits) mini.childNodes.forEach?.call(mini.childNodes, n => { if (n.nodeType === 3 && n.nodeValue.includes('세션 최대')) n.nodeValue = p.limits.unlimitedDuration ? '세션 시간 제한 없음' : `세션 최대 ${p.limits.maxSessionMinutes}분`; });
  }
}
if (!IE_CONFIG.useMock) load();

App.action('changeEmail', async () => {
  const newEmail = prompt('새 이메일 주소'); if (!newEmail) return false;
  const password = prompt('확인을 위해 현재 비밀번호를 입력해 주세요'); if (!password) return false;
  await api.call('account.changeEmail', {}, { newEmail, password });
  App.toast('새 이메일로 확인 메일을 보냈어요'); return false;
});
App.action('changePassword', async () => {
  const currentPassword = prompt('현재 비밀번호'); if (!currentPassword) return false;
  const newPassword = prompt('새 비밀번호 (8자 이상)'); if (!newPassword) return false;
  await api.call('account.changePassword', {}, { currentPassword, newPassword });
  App.toast('비밀번호를 바꿨어요'); return false;
});
App.action('connect', async () => { App.toast('카카오 연결은 OAuth 앱 등록 후 연결돼요 (account.connect)'); return false; });
App.action('upgrade', async () => {
  const r = await api.call('billing.checkout', {}, { plan: 'PRO', period: 'monthly' });
  if (IE_CONFIG.useMock) { App.toast('결제창 주소를 받았어요 (목업)'); return false; }
  location.href = r.checkoutUrl; return false;
});
App.action('logout', async () => { await api.call('auth.logout'); App.save({ accessToken: null, user: null }); });
App.action('withdraw', async () => {
  if (!(await App.confirm('정말 탈퇴할까요?', '세션 기록이 모두 삭제되고 복구할 수 없어요.', '탈퇴'))) return false;
  const password = prompt('확인을 위해 비밀번호를 입력해 주세요'); if (!password) return false;
  await api.call('account.withdraw', {}, { password });
  App.save({ accessToken: null, user: null });
});
