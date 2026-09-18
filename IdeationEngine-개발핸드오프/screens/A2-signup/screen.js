/* A2 회원가입 + 약관 팝업 */
const [email, nick] = App.$$('.form input.inp');
const [pw, pw2] = App.$$('.form label.pw input');
const ok = App.$('.okt');
const boxes = App.$$('.terms .check:not(.all) .box');

function checkPw() {
  const same = pw.value && pw.value === pw2.value;
  ok.hidden = !pw2.value; ok.textContent = same ? '✓ 일치해요' : '비밀번호가 달라요'; ok.style.color = same ? '' : 'var(--bad)';
}
pw.addEventListener('input', checkPw); pw2.addEventListener('input', checkPw);

async function openModal(type) {
  const m = App.$(`.overlay[data-modal="${type}"]`); m.hidden = false; m.querySelector('.mb').scrollTop = 0;
  if (!IE_CONFIG.useMock) { const d = await api.call('legal.get', { type }); m.querySelector('.mb .legal').innerHTML = d.html; }
}
App.action('openTerms', async () => { openModal('terms'); return false; });
App.action('openPrivacy', async () => { openModal('privacy'); return false; });
App.action('closeModal', async (el) => { el.closest('.overlay').hidden = true; return false; });
App.action('agreeModal', async (el) => {
  const m = el.closest('.overlay'); const box = boxes[m.dataset.modal === 'terms' ? 0 : 1];
  if (!box.classList.contains('on')) box.closest('.check').click();
  m.hidden = true; return false;
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') App.$$('.overlay').forEach(o => { o.hidden = true; }); });

App.action('oauth', async () => { App.toast('소셜 가입은 OAuth 앱 등록 후 연결돼요 (auth.oauth)'); return false; });
App.action('signup', async () => {
  if (pw.value !== pw2.value) { App.toast('비밀번호가 서로 달라요'); pw2.focus(); return false; }
  if (!nick.value.trim()) { App.toast('닉네임을 적어주세요'); nick.focus(); return false; }
  const body = {
    email: email.value.trim(), password: pw.value, nickname: nick.value.trim(),
    agreements: { terms: boxes[0].classList.contains('on'), privacy: boxes[1].classList.contains('on'), marketing: boxes[2].classList.contains('on') },
  };
  const r = await api.call('auth.signup', {}, body);
  App.save({ accessToken: r.accessToken, user: r.user });
  App.go(App.withReturnTo(App.screen('03-profile-create')));
  return false;
});
App.action('goLogin', async () => { App.go(App.withReturnTo(App.screen('A1-login'))); return false; });
