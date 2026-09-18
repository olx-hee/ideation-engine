/* 5 대기실 (진행자) */
const codeEl = App.$('.roomcode');
const linkInput = App.$('.card input.inp');
if (App.state.code) codeEl.textContent = App.state.code;
if (App.state.inviteUrl) linkInput.value = App.state.inviteUrl.replace(/^https?:\/\//, '');

/* 실서버 모드: 방 코드·초대 링크·참여자 줄을 서버 값으로 (목업 모드는 HTML 예시 그대로) */
async function load() {
  if (!App.state.code) {                       // 재접속이라 브라우저에 저장된 값이 없을 때
    const s = await api.call('session.get');
    codeEl.textContent = s.code;
    linkInput.value = (s.inviteUrl || '').replace(/^https?:\/\//, '');
    App.save({ code: s.code, inviteUrl: s.inviteUrl });
  }
  renderRoster(await api.call('session.participants'));
}
function renderRoster(r) {
  const rows = App.$$('.prow:not(.empty)');
  const tplHost = rows[0], tplMember = rows[1] || rows[0], empty = App.$('.prow.empty');
  rows.forEach(x => x.remove());
  (r.items || []).forEach(it => {
    const host = it.role === 'host';
    const el = (host ? tplHost : tplMember).cloneNode(true);
    el.dataset.participantId = it.participantId;
    el.querySelector('.avatar').textContent = (it.nickname || '?')[0];
    const nameEl = el.children[1];
    if (nameEl.firstChild && nameEl.firstChild.nodeType === 3) nameEl.firstChild.nodeValue = it.nickname + ' ';
    else nameEl.insertBefore(document.createTextNode(it.nickname + ' '), nameEl.firstChild);
    const badge = nameEl.querySelector('.badge.key'); if (badge) badge.hidden = !it.isMe;
    const hint = nameEl.querySelector('.muted'); if (hint) hint.hidden = host || it.isMe;
    el.querySelector('.dot').style.background = it.online ? '' : 'var(--line)';
    list.insertBefore(el, empty);
  });
  if (empty) empty.hidden = (r.items || []).length >= r.maxMembers;
  badge.textContent = `${(r.items || []).length} / ${r.maxMembers}`;
}
if (!IE_CONFIG.useMock) load();

App.action('copyCode', async () => { await App.copy(codeEl.textContent.trim()); return false; });
App.action('copyLink', async () => { await App.copy('https://' + linkInput.value.replace(/^https?:\/\//, '')); return false; });
App.action('startSession', async () => { await api.call('session.start', {}, {}); });

const list = App.$('.prow').parentElement;
const badge = App.$('.badge.ok');
function count() {
  const n = App.$$('.prow:not(.empty)').length;
  const max = badge.textContent.split('/')[1].trim();
  badge.textContent = `${n} / ${max}`;
  const start = App.$('[data-action="startSession"]');
  if (start) { start.classList.toggle('disabled', n < 2); start.title = n < 2 ? '팀원이 1명 이상 들어와야 시작할 수 있어요' : ''; }   // 혼자면 시작 못 함
}
count();

list.addEventListener('click', async (e) => {
  const row = e.target.closest('.prow');
  if (!row || row.classList.contains('empty') || row.querySelector('.badge.key')) return;
  const name = row.children[1].firstChild.textContent.trim();
  if (!(await App.confirm(`${name} 님을 내보낼까요?`, '내보낸 사람은 이 세션에 다시 들어올 수 없어요.', '내보내기'))) return;
  const ok = await App.run(null, () => api.call('session.kick', { participantId: row.dataset.participantId || 'par_02' }));
  if (ok !== false) { row.remove(); count(); }
});

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'participant.joined') {
    const row = document.createElement('div'); row.className = 'prow'; row.dataset.participantId = ev.data.participantId;
    row.innerHTML = `<span class="avatar">${App.escape(ev.data.nickname[0])}</span><span style="flex:1">${App.escape(ev.data.nickname)}</span><span class="dot"></span>`;
    list.insertBefore(row, App.$('.prow.empty')); count();
  }
  if (ev.type === 'participant.online') App.$(`.prow[data-participant-id="${ev.data.participantId}"] .dot`)?.style.removeProperty('background');
  if (ev.type === 'participant.left') App.$(`.prow[data-participant-id="${ev.data.participantId}"] .dot`)?.style.setProperty('background', 'var(--line)');
});
