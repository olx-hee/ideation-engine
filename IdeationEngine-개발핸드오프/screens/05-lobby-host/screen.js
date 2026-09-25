/* 5 대기실 (진행자) */
const codeEl = App.$('.roomcode');
const linkInput = App.$('.card input.inp');
if (App.state.code) codeEl.textContent = App.state.code;
if (App.state.inviteUrl) linkInput.value = App.state.inviteUrl.replace(/^https?:\/\//, '');

/* 디자인 예시 줄(노형원·이세민·김승희)은 실서버 모드에서 항상 가짜라, 진짜 데이터가 처음
   도착하는 순간(session.participants 응답이든 participant.joined 이벤트든 둘 중 먼저 오는
   쪽) 한 번만 지운다. load()의 fetch가 끝나기 전에 참여자 이벤트가 먼저 도착할 수 있는데,
   그때마다 매번 줄을 전부 지우고 다시 그리면 방금 들어온 사람 줄이 fetch의 낡은 스냅샷에
   덮여 순간적으로(또는 계속) 사라지는 경쟁 조건이 생긴다 — 그래서 지우는 시점을 한 곳으로
   모으고, 그 뒤로는 없는 사람만 더하는 식으로 그린다(있는 줄은 건드리지 않음). */
let tplHost, tplMember, cleared = IE_CONFIG.useMock;
function ensureCleared() {
  if (cleared) return;
  cleared = true;
  const demo = App.$$('.prow:not(.empty)');
  tplHost = demo[0].cloneNode(true);
  tplMember = (demo[1] || demo[0]).cloneNode(true);
  demo.forEach(x => x.remove());
}
/** 참여자 한 명을 줄로 그린다. 이미 그 줄이 있으면 아무것도 하지 않는다(중복 추가·낡은 데이터로 덮어쓰기 방지). */
function addRow(it) {
  ensureCleared();
  if (App.$(`.prow[data-participant-id="${it.participantId}"]`)) return;
  const host = it.role === 'host';
  const el = (host ? tplHost : tplMember).cloneNode(true);
  el.dataset.participantId = it.participantId;
  el.querySelector('.avatar').textContent = (it.nickname || '?')[0];
  const nameEl = el.children[1];
  if (nameEl.firstChild && nameEl.firstChild.nodeType === 3) nameEl.firstChild.nodeValue = it.nickname + ' ';
  else nameEl.insertBefore(document.createTextNode(it.nickname + ' '), nameEl.firstChild);
  const key = nameEl.querySelector('.badge.key'); if (key) key.hidden = !it.isMe;
  const hint = nameEl.querySelector('.muted'); if (hint) hint.hidden = host || it.isMe;
  el.querySelector('.dot').style.background = it.online ? '' : 'var(--line)';
  list.insertBefore(el, App.$('.prow.empty'));
}
function renderRoster(r) {
  (r.items || []).forEach(addRow);
  count(r.maxMembers);   // 배지 · "세션 시작하기" 활성 · "기다리는 중" 줄을 모두 실제 인원수로 다시 맞춘다
}
/* 실서버 모드: 방 코드·초대 링크·참여자 줄을 서버 값으로 (목업 모드는 HTML 예시 그대로).
   위의 App.state.code는 화면이 뜨자마자 깜빡임 없이 보여주는 임시 값일 뿐 — 다른 세션을
   만들거나 복귀한 뒤라 브라우저에 예전 세션 코드가 남아 있을 수 있어서, 항상 서버 값으로
   다시 덮어써야 한다(캐시가 있다고 요청을 건너뛰면 진행자가 낡은 초대 코드를 공유하게 됨). */
async function loadRoster() {
  const r = await App.run(null, () => api.call('session.participants'));
  if (r) renderRoster(r);
}
async function load() {
  const s = await App.run(null, () => api.call('session.get'));
  if (!s) return;
  codeEl.textContent = s.code;
  linkInput.value = (s.inviteUrl || '').replace(/^https?:\/\//, '');
  App.save({ code: s.code, inviteUrl: s.inviteUrl });
  await loadRoster();
}
if (!IE_CONFIG.useMock) load();

App.action('copyCode', async () => { await App.copy(codeEl.textContent.trim()); return false; });
App.action('copyLink', async () => { await App.copy('https://' + linkInput.value.replace(/^https?:\/\//, '')); return false; });
App.action('startSession', async () => { await api.call('session.start', {}, {}); });

const list = App.$('.prow').parentElement;
const badge = App.$('.badge.ok');
function count(max) {
  const n = App.$$('.prow:not(.empty)').length;
  max = +(max || badge.textContent.split('/')[1].trim());
  badge.textContent = `${n} / ${max}`;
  const start = App.$('[data-action="startSession"]');
  if (start) { start.classList.toggle('disabled', n < 2); start.title = n < 2 ? '팀원이 1명 이상 들어와야 시작할 수 있어요' : ''; }   // 혼자면 시작 못 함
  // 방이 꽉 차면 "기다리는 중…" 줄을 감춘다 — 처음 그릴 때만 맞추면 도중에 들어온 사람 때문에
  // 정원이 찬 뒤에도 빈 줄이 남아 있어서, 진행자가 아직 자리가 있는 줄로 착각한다.
  const empty = App.$('.prow.empty');
  if (empty) empty.hidden = n >= max;
}
// 실서버 모드에서는 디자인 예시 줄(3명)을 먼저 지운다 — 서버 응답이 오기 전까지 "3 / 4"로
// 보이고 "세션 시작하기"도 눌리는 상태라, 혼자 있는 진행자가 눌러서 에러만 보게 됐다.
if (!IE_CONFIG.useMock) ensureCleared();
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
  // 문서(2차 전달 · 실시간 이벤트 표): session.started → "진행자 5도 7-1". 시작 버튼을 누른
  // 탭은 data-go로 바로 넘어가지만, 다른 창에서 이 대기실을 보고 있던 진행자(같은 사람의
  // 다른 탭 등)는 이 이벤트가 없으면 새로고침 전까지 대기실에 그대로 남는다.
  if (ev.type === 'session.started') App.go(App.screen('07-1-icebreak-q1-discomfort'));
  // 서버는 웹소켓이 붙을 때마다 지금 단계를 stage.changed로 한 번 보내준다. session.started가
  // 나가는 순간 이 탭의 연결이 끊겨 있었으면(재연결 대기 중) 그 이벤트를 영영 놓치고, 새로고침
  // 전까지 대기실에 갇힌다 — 대기실이 아닌 단계가 오면 그 단계 화면으로 따라간다.
  if (ev.type === 'stage.changed' && ev.data.stage && ev.data.stage.id !== 'lobby') {
    App.go(App.screen(App.stageScreen(ev.data.stage, 'host') || '07-1-icebreak-q1-discomfort'));
  }
  // 아직 대기실이면, 끊겼던 사이에 놓친 입장·나감을 그때 따라잡는다(안 하면 그동안 들어온
  // 사람 줄이 없어서 인원수와 "시작하기" 활성 조건이 계속 틀어져 있다).
  if (ev.type === 'stage.changed' && ev.data.stage && ev.data.stage.id === 'lobby' && !IE_CONFIG.useMock) loadRoster();
  if (ev.type === 'participant.joined') { addRow({ participantId: ev.data.participantId, nickname: ev.data.nickname, role: ev.data.role, online: true, isMe: false }); count(); }
  if (ev.type === 'participant.online') App.$(`.prow[data-participant-id="${ev.data.participantId}"] .dot`)?.style.removeProperty('background');
  if (ev.type === 'participant.left') App.$(`.prow[data-participant-id="${ev.data.participantId}"] .dot`)?.style.setProperty('background', 'var(--line)');
  // 내보내기를 다른 탭에서 눌렀을 때도 이 탭의 줄·인원수가 맞아야 한다(진행자가 두 탭을 열어둔 경우).
  if (ev.type === 'participant.kicked') {
    const row = App.$(`.prow[data-participant-id="${ev.data.participantId}"]`);
    if (row) { row.remove(); count(); }
  }
});
