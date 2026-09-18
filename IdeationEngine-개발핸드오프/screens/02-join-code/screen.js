/* 2 방 코드 입장 — 회원만 · 초대 링크 = 방 코드 · 재접속 */
const CODE_LENGTH = 6;
const cells = App.$$('.codebox input');
const link = App.$('.panel input.inp');
const params = new URLSearchParams(location.search);

function setCode(code) {
  const c = String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, CODE_LENGTH);
  cells.forEach((el, i) => { el.value = c[i] || ''; el.classList.toggle('f', !!c[i]); });
  (cells.find(el => !el.value) || cells[CODE_LENGTH - 1]).focus();
}
/** 초대 링크(https://…/s/7K2X9M) 또는 코드 그대로 → 방 코드 */
function codeFrom(text) {
  const v = String(text || '').trim();
  const m = v.match(/\/s\/([0-9A-Za-z]{6})(?:[/?#]|$)/);
  if (m) return m[1];
  return /^[0-9A-Za-z]{6}$/.test(v) ? v : '';
}

if (params.get('code')) setCode(params.get('code'));
else if (!IE_CONFIG.useMock) setCode('');   // 목업 모드는 디자인 예시(7K2) 그대로

link.addEventListener('input', () => { const c = codeFrom(link.value); if (c) setCode(c); });
App.action('pasteLink', async () => {
  try { link.value = await navigator.clipboard.readText(); const c = codeFrom(link.value); if (c) setCode(c); else App.toast('초대 링크나 방 코드가 아니에요'); }
  catch (e) { App.toast('붙여넣기 권한이 없어요. 칸에 직접 붙여넣어 주세요'); link.focus(); }
  return false;
});

App.action('join', async () => {
  const code = cells.map(c => c.value).join('').toUpperCase();
  if (code.length !== CODE_LENGTH) {
    App.toast('방 코드 6자리를 모두 넣어주세요');
    (cells.find(c => !c.value) || cells[0]).focus();
    return false;
  }
  const back = `../02-join-code/index.html?code=${code}&auto=1`;
  if (!App.requireLogin(back)) return false;                       // 로그인 → 돌아와서 자동 입장

  const room = await api.call('session.lookup', { query: { code } });
  let r;
  try {
    r = await api.call('session.join', { sessionId: room.sessionId }, { code });
  } catch (err) {
    if (err.code === 'PROFILE_REQUIRED') {                          // 프로필 → 돌아와서 자동 입장
      App.toast('입장하기 전에 프로필을 먼저 만들어 주세요');
      App.go(App.screen('03-profile-create') + '?returnTo=' + encodeURIComponent(back));
      return false;
    }
    throw err;
  }
  App.save({ sessionId: room.sessionId, role: r.role, participantId: r.participantId });
  if (r.rejoined) App.toast('다시 들어왔어요');
  App.go(App.screen(App.stageScreen(r.session.stage, r.role) || '06-lobby-participant'));
  return false;
});

[...cells, link].forEach(el => el.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); App.$('[data-action="join"]').click(); }
}));
if (params.get('auto') === '1' && App.state.accessToken) App.$('[data-action="join"]').click();
