/* 8-3 익명 순위표 */
// 실서버 모드: 디자인 예시 4줄("팀원 A~D"의 가짜 아이디어)을 먼저 지운다 — 조회가 늦거나 실패하면
// 예시가 실제 순위표처럼 보이고, 진행자가 그걸 보고 "모두 냈다"고 판단해 넘겨 버린다.
if (!IE_CONFIG.useMock) {
  App.$$('.rtab tr:not(:first-child)').forEach(n => n.remove());
  App.$('.dvh .aside').textContent = '불러오는 중이에요';
}
function renderBoard(r) {
  const tb = App.$('.rtab');
  tb.querySelectorAll('tr:not(:first-child)').forEach(n => n.remove());
  r.rows.forEach(row => {
    const tr = document.createElement('tr'); if (row.isMe) tr.className = 'me';
    const cells = [1, 2, 3].map(k => row.ideas.find(i => i.rank === k));
    tr.innerHTML = `<td class="who">팀원 ${App.escape(row.alias)}${row.isMe ? '<span class=metag>나</span>' : ''}</td>` +
      cells.map((c, i) => `<td class="${i === 0 ? 'r1' : ''}">${c ? App.escape(c.text) : ''}</td>`).join('');
    tb.appendChild(tr);
  });
  App.$('.dvh .aside').textContent = r.submittedCount === r.memberCount ? `${r.memberCount}명 모두 제출했어요` : `${r.submittedCount} / ${r.memberCount}명 제출`;
}
async function load() {
  const r = await App.run(null, () => api.call('idea.board'));
  if (r) renderBoard(r);
}
if (!IE_CONFIG.useMock) load();
/* 단계가 바뀌면 그 단계의 화면으로 — diverge.comment만 보고 이동하면, 이벤트를 놓친 사람(재연결 틈)이나
   진행자가 comment→review까지 빠르게 넘긴 뒤 들어온 사람이 순위표에 갇힌다. */
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type !== 'stage.changed' || !ev.data.stage) return;
  if (document.body.dataset.stage.split(' ').includes(ev.data.stage.id)) return;
  const want = App.stageScreen(ev.data.stage, App.state.role);
  if (want) App.go(App.screen(want));
});
