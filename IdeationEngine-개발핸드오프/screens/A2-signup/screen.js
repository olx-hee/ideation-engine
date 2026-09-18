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

/* 서버 검증 실패(details.fields)를 토스트뿐 아니라 해당 칸에도 빨간 테두리 + 포커스로 눈에 띄게.
   비밀번호 칸은 실제 테두리가 input이 아니라 감싸는 label.pw에 있어서(input엔 border:none) 그쪽을 잡는다. */
const FIELD_INPUT = { email, password: pw, nickname: nick };
function markInvalid(field) {
  const input = FIELD_INPUT[field];
  if (!input) return;
  const box = input.closest('label.pw') || input;
  box.style.borderColor = 'var(--bad)';
  input.focus();
  input.addEventListener('input', () => { box.style.borderColor = ''; }, { once: true });
}

async function openModal(type) {
  const m = App.$(`.overlay[data-modal="${type}"]`); m.hidden = false; m.querySelector('.mb').scrollTop = 0;
  if (!IE_CONFIG.useMock) { const d = await api.call('legal.get', { type }); m.querySelector('.mb .legal').innerHTML = d.html; }
}
App.action('openTerms', async () => { await openModal('terms'); return false; });
App.action('openPrivacy', async () => { await openModal('privacy'); return false; });
App.action('closeModal', async (el) => { el.closest('.overlay').hidden = true; return false; });
App.action('agreeModal', async (el) => {
  const m = el.closest('.overlay'); const box = boxes[m.dataset.modal === 'terms' ? 0 : 1];
  if (!box.classList.contains('on')) box.closest('.check').click();
  m.hidden = true; return false;
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') App.$$('.overlay').forEach(o => { o.hidden = true; }); });

App.action('oauth', async (el) => {
  App.startOAuth(el.classList.contains('kakao') ? 'kakao' : 'google');
  return false;
});
App.action('signup', async () => {
  if (!email.value.trim()) { App.toast('이메일을 적어주세요'); markInvalid('email'); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { App.toast('이메일 형식을 확인해 주세요'); markInvalid('email'); return false; }
  if (pw.value.length < 8) { App.toast('비밀번호는 8자 이상이어야 해요'); markInvalid('password'); return false; }
  if (pw.value !== pw2.value) { App.toast('비밀번호가 서로 달라요'); pw2.focus(); return false; }
  if (!nick.value.trim()) { App.toast('닉네임을 적어주세요'); nick.focus(); return false; }
  if (!boxes[0].classList.contains('on') || !boxes[1].classList.contains('on')) {
    App.toast('필수 약관에 모두 동의해 주세요');
    const t = App.$('.terms'); t.style.outline = '2px solid var(--bad)'; t.style.borderRadius = '10px';
    return false;
  }
  const body = {
    email: email.value.trim(), password: pw.value, nickname: nick.value.trim(),
    agreements: { terms: boxes[0].classList.contains('on'), privacy: boxes[1].classList.contains('on'), marketing: boxes[2].classList.contains('on') },
  };
  let r;
  try {
    r = await api.call('auth.signup', {}, body);
  } catch (err) {
    const fields = err && err.details && err.details.fields;
    if (fields) {
      if (fields.email || fields.password || fields.nickname) markInvalid(fields.email ? 'email' : fields.password ? 'password' : 'nickname');
      else if (fields.agreements) { const t = App.$('.terms'); t.style.outline = '2px solid var(--bad)'; t.style.borderRadius = '10px'; }
    } else if (err && err.code === 'EMAIL_TAKEN') markInvalid('email');
    throw err;   // App.run이 (고친) 구체적인 메시지로 토스트를 띄운다
  }
  App.setLogin(r, false);
  App.go(App.withReturnTo(App.screen('03-profile-create')));
  return false;
});
App.action('goLogin', async () => { App.go(App.withReturnTo(App.screen('A1-login'))); return false; });
