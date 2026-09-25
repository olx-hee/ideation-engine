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

  let room, r;
  try {
    room = await api.call('session.lookup', { query: { code } });
    r = await api.call('session.join', { sessionId: room.sessionId }, { code });
  } catch (err) {
    if (err.code === 'PROFILE_REQUIRED') {                          // 프로필 → 돌아와서 자동 입장
      App.toast('입장하기 전에 프로필을 먼저 만들어 주세요');
      App.go(App.screen('03-profile-create') + '?returnTo=' + encodeURIComponent(back));
      return false;
    }
    /* 못 들어가는 이유(이미 시작함 · 정원 초과 · 내보내짐)를 2.6초면 사라지는 토스트로만 알리면
       코드를 잘못 넣은 줄 알고 계속 다시 누른다 — 닫을 때까지 남는 안내 창으로 보여준다.
       lookup도 같은 이유로 실패하므로(늦게 온 사람은 거기서 먼저 걸린다) 두 호출을 한 try로 묶었다. */
    if (err.code === 'SESSION_STARTED' || err.code === 'SESSION_FULL' || err.code === 'KICKED') {
      App.dialog('이 방에는 들어갈 수 없어요',
        `<p>${App.escape(err.message)}</p><div class="tdk"><span>방 코드</span><b>${App.escape(code)}</b></div>` +
        '<p class="quiet">진행자가 세션을 시작한 뒤에는 새로 들어올 수 없어요. 진행자에게 확인해 주세요.</p>',
        [{ label: '확인', cls: 'gray' }]);
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
