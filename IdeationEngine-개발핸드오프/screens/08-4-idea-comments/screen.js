/* 8-4 익명 댓글 */
const [concern, praise] = App.$$('textarea.ta');
App.$$('.rail .ri').forEach((r, i) => { r.dataset.ideaId = r.dataset.ideaId || 'ide_' + i; });
let current = App.$('.rail .ri.on');
// 실서버 모드: 디자인 예시로 미리 써 있던 댓글을 지우고 시작 (안 지우면 목업 문장이 실제 댓글로 저장될 수 있음).
// 선택도 비운다 — 목록이 오기 전에 "댓글 저장"을 누르면 예시 줄의 가짜 ideaId로 저장이 나갔다.
if (!IE_CONFIG.useMock) { concern.value = ''; praise.value = ''; current = null; }

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
    const r = await App.run(null, () => api.call('comment.list', { ideaId: current.dataset.ideaId }));
    if (!r) return;
    renderComments(r);
    // 누구 아이디어인지 적는 줄이 디자인 예시("팀원 B의 1순위")로 굳어 있어서, 다른 사람 아이디어를 골라도
    // 계속 팀원 B라고 보였다 — 고른 아이디어의 별칭·순위로 바꿔 준다 (주인 정보는 별칭뿐이라 익명 유지).
    App.$('.detail .dk').textContent = `팀원 ${r.idea.alias}의 ${r.idea.rank}순위`;
    if (r.mine) { concern.value = r.mine.concern || ''; praise.value = r.mine.praise || ''; }   // 이미 쓴 댓글은 고칠 수 있게
  }
});

App.action('saveComment', async () => {
  if (!current) { App.toast('댓글을 달 아이디어를 먼저 골라주세요'); return false; }
  const body = { concern: concern.value.trim(), praise: praise.value.trim() || null };
  if (!body.concern) { App.toast('아쉬운 점은 꼭 적어주세요'); concern.focus(); return false; }
  const r = await api.call('comment.create', { ideaId: current.dataset.ideaId }, body);
  const st = current.querySelector('.s'); st.textContent = body.praise ? '완료 · 좋은 점' : '완료'; st.classList.remove('k');
  renderQuota(r.quota);
  if (IE_CONFIG.useMock) {
    addComment({ type: 'concern', text: body.concern }); if (body.praise) addComment({ type: 'praise', text: body.praise });
    concern.value = ''; praise.value = '';
  } else {
    // 저장한 댓글은 서버 목록으로 다시 그린다 — 화면에 직접 붙이면 같은 아이디어에 두 번 저장할 때(수정은
    // 서버에서 1개 유지) 화면에만 같은 댓글이 여러 줄 쌓였다. 칸은 비우지 않는다: 이게 지금 내 댓글이고
    // 바로 고칠 수 있어야 한다(비우면 저장이 안 된 것처럼 보였다).
    const list = await App.run(null, () => api.call('comment.list', { ideaId: current.dataset.ideaId }));
    if (list) renderComments(list);
  }
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
  if (note) {
    // 예시 문구는 "내 아이디어(팀원 C)는 목록에 없어요"인데 내 별칭은 사람마다 달라서, 그대로 두면
    // 모두에게 "팀원 C가 나"라고 보인다(익명 별칭을 잘못 알려주는 문구) — 별칭 없이 적는다.
    note.textContent = '내 아이디어는 목록에 없어요';
    rail.appendChild(note);
  }
  renderQuota(r.quota);
  App.$('.rail .ri')?.click();   // 첫 줄 선택 → 오른쪽 댓글도 서버 값으로
}
async function load() {
  const r = await App.run(null, () => api.call('comment.targets'));
  // 조회가 실패하면 디자인 예시 목록(가짜 ideaId)이 남아, 누르면 실패하고 저장도 엉뚱한 id로 나간다 — 비운다
  if (!r) { App.$$('.rail .ri, .rail .rgl').forEach(n => n.remove()); current = null; return; }
  renderTargets(r);
}
if (!IE_CONFIG.useMock) load();
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'comments.progress') App.progress(ev.data.doneCount, ev.data.memberCount);   // 진행자 막대(T2)
  /* 단계가 바뀌면 그 단계의 화면으로 — diverge.review만 보고 이동하면, 이벤트를 놓친 사람이나
     진행자가 review→vote까지 빠르게 넘긴 사람이 댓글 화면에 갇힌다(저장하면 STAGE_CLOSED만 나옴). */
  if (ev.type === 'stage.changed' && ev.data.stage && !document.body.dataset.stage.split(' ').includes(ev.data.stage.id)) {
    const want = App.stageScreen(ev.data.stage, App.state.role);
    if (want) App.go(App.screen(want));
  }
});
