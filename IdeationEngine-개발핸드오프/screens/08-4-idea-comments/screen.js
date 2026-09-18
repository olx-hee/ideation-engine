/* 8-4 익명 댓글 */
const [concern, praise] = App.$$('textarea.ta');
App.$$('.rail .ri').forEach((r, i) => { r.dataset.ideaId = r.dataset.ideaId || 'ide_' + i; });
let current = App.$('.rail .ri.on');

function addComment(c) {
  const d = document.createElement('div'); d.className = 'cm' + (c.type === 'praise' ? ' plus' : '');
  d.innerHTML = `<span>${c.type === 'praise' ? '좋은 점' : '아쉬운 점'}</span>${App.escape(c.text)}`;
  App.$('.clist').appendChild(d);
}
function renderComments(r) {
  App.$$('.clist .cm').forEach(n => n.remove()); r.items.forEach(addComment);
  App.$('.clist h6 small').textContent = `아쉬운 점 ${r.counts.concern} · 좋은 점 ${r.counts.praise}`;
}
document.addEventListener('ie:select', async (e) => {
  current = e.detail;
  App.$('.detail .dt').textContent = App.text(current.querySelector('.t'));
  concern.value = ''; praise.value = '';
  if (!IE_CONFIG.useMock) {
    const r = await api.call('comment.list', { ideaId: current.dataset.ideaId });
    renderComments(r);
    if (r.mine) { concern.value = r.mine.concern || ''; praise.value = r.mine.praise || ''; }   // 이미 쓴 댓글은 고칠 수 있게
  }
});

App.action('saveComment', async () => {
  const body = { concern: concern.value.trim(), praise: praise.value.trim() || null };
  if (!body.concern) { App.toast('아쉬운 점은 꼭 적어주세요'); concern.focus(); return false; }
  const r = await api.call('comment.create', { ideaId: current.dataset.ideaId }, body);
  addComment({ type: 'concern', text: body.concern }); if (body.praise) addComment({ type: 'praise', text: body.praise });
  const st = current.querySelector('.s'); st.textContent = body.praise ? '완료 · 좋은 점' : '완료'; st.classList.remove('k');
  const [c, p] = App.$$('.counts b');
  c.textContent = `${r.quota.concernDone} / ${r.quota.concernTotal}`; p.textContent = `${r.quota.praiseUsed} / ${r.quota.praiseMax}`;
  App.$$('.cf .cl small')[1].textContent = `선택 · ${Math.max(0, r.quota.praiseMax - r.quota.praiseUsed)}개 남음`;
  concern.value = ''; praise.value = '';
  App.toast('익명으로 저장했어요');
  return false;
});
/* 실서버 모드: 왼쪽 목록과 할당량을 comment.targets로 그린다 */
function renderQuota(q) {
  if (!q) return;
  const [c, p] = App.$$('.counts b');
  if (c) c.textContent = `${q.concernDone} / ${q.concernTotal}`;
  if (p) p.textContent = `${q.praiseUsed} / ${q.praiseMax}`;
  const small = App.$$('.cf .cl small')[1];
  if (small) small.textContent = `선택 · ${Math.max(0, q.praiseMax - q.praiseUsed)}개 남음`;
}
function renderTargets(r) {
  const rail = App.$('.rail');
  const tplLabel = rail.querySelector('.rgl'), tplItem = rail.querySelector('.ri'), note = rail.querySelector('.rmore');
  if (!tplLabel || !tplItem) return;
  rail.innerHTML = '';
  (r.groups || []).forEach(g => {
    const lab = tplLabel.cloneNode(true); lab.textContent = `팀원 ${g.alias}`; rail.appendChild(lab);
    (g.items || []).forEach(it => {
      const el = tplItem.cloneNode(true);
      el.classList.remove('on');
      el.dataset.ideaId = it.ideaId;
      el.querySelector('.n').textContent = it.rank;
      el.querySelector('.t').textContent = it.title;
      const st = el.querySelector('.s');
      const done = it.status === 'done';
      st.textContent = done ? (it.praised ? '완료 · 좋은 점' : '완료') : '아직';
      st.classList.toggle('k', !done);
      rail.appendChild(el);
    });
  });
  if (note) rail.appendChild(note);
  renderQuota(r.quota);
  App.$('.rail .ri')?.click();   // 첫 줄 선택 → 오른쪽 댓글도 서버 값으로
}
async function load() { renderTargets(await api.call('comment.targets')); }
if (!IE_CONFIG.useMock) load();
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'comments.progress') App.progress(ev.data.doneCount, ev.data.memberCount);   // 진행자 막대(T2)
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.review') App.go(App.screen('08-5-ai-review'));
});
