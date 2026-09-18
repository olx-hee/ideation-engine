/* 9-3 배치 초안 */
const esc = App.escape;
let cur = null, marking = false;

function memberCard(m) {
  const counts = [`핵심 ${m.counts.core}`, `보통 ${m.counts.normal}`, `작은 일 ${m.counts.small}`].join(' · ');
  const tag = m.over ? '<span class="pill9 w">많아요</span>' : (m.changeFromDraft === 'less' ? '<span class="pill9">줄었어요</span>' : '');
  return `<div class="lc${m.isMe ? ' me' : ''}${m.over ? ' over' : ''}"><div class="n">${Team.av(m)}${esc(m.nickname)}` +
         `${m.isMe ? ' <small>(나)</small>' : ''}${tag}</div><div class="bar"><i style="width:${m.loadPct}%"></i></div><div class="c">${counts}</div></div>`;
}
function methodCell(p) {
  if (p.method === 'excluded') return `<span class="q9">${esc(p.alternative || '')} · 팀 선택</span>`;
  if (p.method === 'question') return '<span class="pill9 k">추가 질문으로 정했어요</span>';
  return `<span class="q9">${esc(p.methodLabel || '')}</span>`;
}

function render(a) {
  cur = a;
  App.$('.load9').innerHTML = a.members.map(memberCard).join('');

  const tab = App.$('.ptab');
  tab.querySelectorAll('.pg9,.pr9,.sm9').forEach(n => n.remove());
  const marked = a.markedByMe || [];
  const row = (p) => {
    const who = p.assignee ? Team.who9(p.assignee) : '<span class="q9">담당 없음</span>';
    const mark = marked.includes(p.partId) ? '<span class="pill9 mk">표시함</span>' : '';
    return `<div class="pr9${p.method === 'excluded' ? ' out' : ''}" data-part-id="${esc(p.partId)}">` +
           `<span class="pn">${esc(p.name)}${mark}</span>${who}<span class="cand">${methodCell(p)}</span></div>`;
  };
  [['core', '결과를 좌우하는 파트'], ['normal', '보통 파트']].forEach(([tier, label]) => {
    const parts = a.parts.filter(p => p.tier === tier);
    if (parts.length) tab.insertAdjacentHTML('beforeend', `<div class="pg9">${label}</div>` + parts.map(row).join(''));
  });
  const small = a.parts.filter(p => p.tier === 'small');
  if (small.length) tab.insertAdjacentHTML('beforeend', '<div class="pg9">작은 일 · 분량 맞추기</div><div class="sm9">' +
    small.map(p => `<div data-part-id="${esc(p.partId)}"><span>${esc(p.name)}</span>${p.assignee ? Team.who9(p.assignee) : ''}</div>`).join('') + '</div>');

  const [balance, , mine] = App.$$('.p9side .sc2');
  balance.querySelector('p').textContent = a.balance.note;
  balance.querySelectorAll('.mine9').forEach(n => n.remove());
  a.balance.smallTaskCounts.forEach(x => balance.insertAdjacentHTML('beforeend',
    `<div class="mine9"><span class="pill9">${x.count}개</span>${esc(x.nickname)} · ${esc(x.why)}</div>`));
  const myParts = a.myParts && a.myParts.length ? a.myParts : a.parts.filter(p => p.assignee && p.assignee.isMe).map(p => p.name);
  mine.querySelector('h4').textContent = `내 파트 ${myParts.length}개`;
  mine.querySelector('p').textContent = myParts.join(' · ') || '맡은 파트가 없어요';
}

App.action('markMode', async (el) => {
  marking = !marking;
  el.textContent = marking ? '표시 끝내기' : '이야기해 볼 파트 표시하기';
  App.$('.ptab').classList.toggle('marking', marking);
  App.toast(marking ? '이야기해 볼 파트를 눌러주세요' : '표시를 마쳤어요');
  return false;
});

// 목업 모드에서는 화면의 디자인 예시 줄에 임시 partId를 붙여 표시 동작을 확인할 수 있게 함
App.$$('.ptab .pr9, .ptab .sm9 > div').forEach((r, i) => { if (!r.dataset.partId) r.dataset.partId = 'prt_' + (i + 1); });

App.$('.ptab').addEventListener('click', async (e) => {
  if (!marking) return;
  const row = e.target.closest('[data-part-id]');
  if (!row) return;
  const on = !row.querySelector('.pill9.mk');
  const done = await App.run(null, () => api.call('team.mark', { partId: row.dataset.partId }, { marked: on }));
  if (done === false) return;
  row.querySelector('.pill9.mk')?.remove();
  if (on) row.querySelector('.pn,span').insertAdjacentHTML('beforeend', '<span class="pill9 mk">표시함</span>');
  App.toast(on ? '팀장 화면에 표시됐어요' : '표시를 해제했어요');
});

async function load() {
  const a = await api.call('team.assignment');
  if (a.viewer && a.viewer.isLeader) { App.go(App.screen('09-4-leader-confirm')); return; }
  render(a);
}

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'team.assignment.updated' && !IE_CONFIG.useMock) load();
  if (ev.type === 'team.confirmed' || (ev.type === 'stage.changed' && ev.data.stage.id === 'report')) App.go(App.screen('09-5-report'));
});
if (!IE_CONFIG.useMock) load();
