/* 9-1 파트 나누기 — 후보 찾기 */
const esc = App.escape;

function partRow(p) {
  const cand = p.status === 'none'
    ? `<span class="bad9">후보 없음</span><span class="q9">→ ${esc(p.alternative || '')} 제안</span>`
    : p.candidates.map(Team.av).join('') + (p.status === 'overlap'
        ? '<span class="pill9 k">겹침 · 추가 질문</span>'
        : `<span class="q9">1명 · 바로 배정</span>`);
  return `<div class="pr9${p.status === 'none' ? ' out' : ''}"><span class="pn">${esc(p.name)}<small>${esc(p.desc || '')}</small></span>` +
         `<span class="skl">${esc(p.skill || '누구나')}</span><span class="cand">${cand}</span></div>`;
}

function render(d) {
  App.$('.p9top b').textContent = d.topic.title;
  App.$('.p9top .r').innerHTML = `${esc(d.topic.owner.nickname)} 님의 ${d.topic.owner.rank}순위 · ${d.topic.votes}표` +
    `<span class="pill9">구현 가능성 ${esc(d.topic.feasibility)}</span>`;

  const tab = App.$('.ptab');
  tab.querySelectorAll('.pg9,.pr9').forEach(n => n.remove());
  [['core', '결과를 좌우하는 파트'], ['normal', '보통 파트']].forEach(([tier, label]) => {
    const parts = d.parts.filter(p => p.tier === tier);
    if (!parts.length) return;
    tab.insertAdjacentHTML('beforeend', `<div class="pg9">${label}</div>` + parts.map(partRow).join(''));
  });
  const s = d.smallTasks;
  tab.insertAdjacentHTML('beforeend', '<div class="pg9">작은 일 · 스킬 없이 누구나</div>' +
    `<div class="pr9"><span class="pn">작은 일 ${s.count}개<small>${esc(s.names.join(' · '))}</small></span>` +
    `<span class="skl">누구나</span><span class="cand"><span class="q9">${esc(s.note)}</span></span></div>`);

  const box = App.$('.sc2.me9');
  box.querySelectorAll('.mine9').forEach(n => n.remove());
  const note = box.querySelector('p');
  d.mine.forEach(m => note.insertAdjacentHTML('beforebegin',
    `<div class="mine9"><span class="pill9${m.status === 'overlap' ? ' k' : ''}">${m.status === 'overlap' ? '겹침' : '바로 배정'}</span>${esc(m.name)}</div>`));
  const overlap = d.mine.filter(m => m.status === 'overlap').length;
  note.textContent = overlap
    ? `겹친 ${overlap}개는 다음 화면에서 질문 2개씩 드려요. 다른 사람은 이 화면에서 바로 배치로 넘어가요.`
    : '겹친 파트가 없어서 추가 질문은 없어요. 곧 배치 초안으로 넘어가요.';
}

let stage = 'team.split';
function hostButton(isHost, hasOverlap) {
  const bar = App.$('[data-host]');
  if (!bar) return;
  bar.hidden = !isHost;
  const b = bar.querySelector('button');
  b.dataset.from = stage;
  b.textContent = stage === 'team.questions' ? '질문 마감하고 배치 보기 →' : (hasOverlap ? '추가 질문 시작 →' : '배치 초안 보기 →');
}

async function load() {
  const s = await api.call('session.get');
  stage = s.stage.id;
  const d = await api.call('team.parts');
  if (!d.ready) { App.toast('AI가 파트를 나누는 중이에요. 잠시만 기다려 주세요'); return; }
  render(d);
  hostButton(s.me.role === 'host', d.parts.some(p => p.status === 'overlap'));
  if (stage === 'team.questions' && d.myPendingQuestions > 0) App.go(App.screen('09-2-overlap-questions'));
}

App.action('advanceTeam', async (el) => {
  await api.call('session.advance', {}, { from: el.dataset.from || 'team.split' });
  return false;
});

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'team.parts.ready') load();
  if (ev.type === 'stage.changed') {
    stage = ev.data.stage.id;
    if (stage === 'team.questions') load();
    else { const want = App.stageScreen(ev.data.stage, App.state.role, App.state.isLeader); if (want) App.go(App.screen(want)); }
  }
});
if (!IE_CONFIG.useMock) load();
