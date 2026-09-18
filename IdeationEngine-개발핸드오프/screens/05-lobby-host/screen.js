/* 5 대기실 (진행자) */
const codeEl = App.$('.roomcode');
const linkInput = App.$('.card input.inp');
if (App.state.code) codeEl.textContent = App.state.code;
if (App.state.inviteUrl) linkInput.value = App.state.inviteUrl.replace(/^https?:\/\//, '');

/* 실서버 모드: 방 코드·초대 링크·참여자 줄을 서버 값으로 (목업 모드는 HTML 예시 그대로).
   위의 App.state.code는 화면이 뜨자마자 깜빡임 없이 보여주는 임시 값일 뿐 — 다른 세션을
   만들거나 복귀한 뒤라 브라우저에 예전 세션 코드가 남아 있을 수 있어서, 항상 서버 값으로
   다시 덮어써야 한다(캐시가 있다고 요청을 건너뛰면 진행자가 낡은 초대 코드를 공유하게 됨). */
async function load() {
  const s = await App.run(null, () => api.call('session.get'));
  if (!s) return;
  codeEl.textContent = s.code;
  linkInput.value = (s.inviteUrl || '').replace(/^https?:\/\//, '');
  App.save({ code: s.code, inviteUrl: s.inviteUrl });
  const r = await App.run(null, () => api.call('session.participants'));
  if (r) renderRoster(r);
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
  count(r.maxMembers);   // 배지뿐 아니라 "세션 시작하기" 버튼의 활성/비활성도 실제 인원수로 다시 맞춘다
}
if (!IE_CONFIG.useMock) load();

App.action('copyCode', async () => { await App.copy(codeEl.textContent.trim()); return false; });
App.action('copyLink', async () => { await App.copy('https://' + linkInput.value.replace(/^https?:\/\//, '')); return false; });
App.action('startSession', async () => { await api.call('session.start', {}, {}); });

const list = App.$('.prow').parentElement;
const badge = App.$('.badge.ok');
function count(max) {
  const n = App.$$('.prow:not(.empty)').length;
  max = max || badge.textContent.split('/')[1].trim();
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
  const ok = await App.run(null, () => api.call('session.kick', { participantId: row.dataset.participantId }));
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
