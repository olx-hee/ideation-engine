/* 8-3 익명 순위표 */
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
realtime.connect(App.sessionId(), (ev) => { if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.comment') App.go(App.screen('08-4-idea-comments')); });
