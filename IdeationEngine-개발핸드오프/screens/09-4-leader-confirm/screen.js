/* 9-4 팀장 확정 */
const esc = App.escape;
let cur = null;

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

function statusCell(p) {
  if (p.method === 'excluded') return `<span class="q9">${esc(p.alternative || '')}</span>`;
  if (p.changed) return `<span class="pill9 solid">회의에서 바꿈</span><span class="q9">AI 초안: ${esc((p.aiAssignee || {}).nickname || '')}</span>`;
  if (p.method === 'question') return '<span class="q9">추가 질문으로 정함</span>';
  return '<span class="q9">AI 초안 그대로</span>';
}
function select(p) {
  // 담당 없는 파트도 누를 수 있어야 한다 — 후보가 다 빠졌거나(중간 이탈) 아무도 답하지 않은 파트가
  // 빈 칸으로만 남아서, 팀장이 누를 데가 없어 끝까지 담당을 못 정하는 막힌 길이 됐다.
  // 대안으로 대신하는 파트(excluded)는 원래 담당을 정하지 않으니 그대로 빈 칸으로 둔다.
  if (!p.assignee) {
    return p.method === 'excluded' ? '<span class="q9"></span>'
      : `<span class="sel9" data-part-id="${esc(p.partId)}"><span class="q9">담당 고르기</span></span>`;
  }
  return `<span class="sel9${p.changed ? ' chg' : ''}" data-part-id="${esc(p.partId)}">${Team.av(p.assignee)}${esc(p.assignee.nickname)}</span>`;
}

function render(a) {
  cur = a;
  App.$('.load9').innerHTML = a.members.map(memberCard).join('');

  const tab = App.$('.ptab');
  tab.querySelectorAll('.pg9,.pr9,.sm9').forEach(n => n.remove());
  // 여러 명이 같은 파트를 표시할 수 있는데 첫 사람만 보여줘서 나머지가 묻혔다 — 인원을 함께 적는다
  const markTag = (p) => {
    const m = p.marks || [];
    if (!m.length) return '';
    const who = m.length > 1 ? `${esc(m[0].nickname)} 님 외 ${m.length - 1}명이` : `${esc(m[0].nickname)} 님이`;
    return `<span class="pill9 k mk">${who} 표시</span>`;
  };
  const row = (p) => `<div class="pr9${p.method === 'excluded' ? ' out' : ''}${p.changed ? ' chg' : ''}" data-part-id="${esc(p.partId)}">` +
    `<span class="pn">${esc(p.name)}${markTag(p)}</span>${select(p)}<span class="cand">${statusCell(p)}</span></div>`;
  [['core', '결과를 좌우하는 파트'], ['normal', '보통 파트']].forEach(([tier, label]) => {
    const parts = a.parts.filter(p => p.tier === tier);
    if (parts.length) tab.insertAdjacentHTML('beforeend', `<div class="pg9">${label}</div>` + parts.map(row).join(''));
  });
  const small = a.parts.filter(p => p.tier === 'small');
  if (small.length) tab.insertAdjacentHTML('beforeend', '<div class="pg9">작은 일</div><div class="sm9">' +
    small.map(p => `<div data-part-id="${esc(p.partId)}"><span>${esc(p.name)}${markTag(p)}</span>${select(p)}</div>`).join('') + '</div>');

  const warn = App.$('.sc2.warn9');
  warn.hidden = !a.suggestion;
  if (a.suggestion) {
    const s = a.suggestion;
    warn.querySelector('p').textContent = s.reason;
    warn.querySelector('.sug9 span:last-child').textContent = `${s.partName} · ${s.from.nickname} → ${s.to.nickname}`;
    warn.dataset.suggestionId = s.suggestionId;
  }
  const changes = App.$$('.p9side .sc2')[1];
  changes.querySelectorAll('.chgl').forEach(n => n.remove());
  const btn = changes.querySelector('button');
  (a.changes || []).forEach(c => {
    const html = c.type === 'mark'
      ? `<span class="pill9 k">표시</span><span>${esc(c.partName)} — ${esc(c.by.nickname)} 님이 이야기해 보자고 표시</span>`
      : `<span class="pill9 w">바꿈</span><span>${esc(c.partName)} · ${esc(c.from.nickname)} → ${esc(c.to.nickname)}</span>`;
    btn.insertAdjacentHTML('beforebegin', `<div class="chgl">${html}</div>`);
  });
  changes.querySelector('h4').textContent = `회의에서 바꾼 것${(a.changes || []).length ? '' : ' 없음'}`;
  btn.hidden = !(a.changes || []).some(c => c.type === 'change');
}

/* 맡은 사람 고르기 */
function closeMenu() { App.$('.menu9')?.remove(); }
document.addEventListener('click', async (e) => {
  const sel = e.target.closest('.sel9');
  const item = e.target.closest('.menu9 [data-participant-id]');
  if (item) {
    const box = item.closest('.sel9');
    const partId = (box && box.dataset.partId) || App.$('.menu9').dataset.partId || '';
    const html = item.innerHTML;
    closeMenu();
    const r = await App.run(null, () => api.call('team.reassign', { partId: partId || 'prt_1' }, { participantId: item.dataset.participantId }));
    if (r === false) return;
    if (IE_CONFIG.useMock) {                                  // 목업 모드: 고른 이름만 바꿔서 보여줌
      if (box) { box.innerHTML = html; box.classList.add('chg'); box.closest('.pr9')?.classList.add('chg'); }
    } else render(r);
    App.toast('맡은 사람을 바꿨어요');
    return;
  }
  const wasOpen = !!(sel && sel.querySelector('.menu9'));
  closeMenu();
  if (!sel || wasOpen) return;
  const members = (cur && cur.members) || [];
  if (!members.length) { App.toast('팀원 목록을 불러오지 못했어요'); return; }
  const menu = document.createElement('div');
  menu.className = 'menu9';
  menu.dataset.partId = sel.dataset.partId || '';
  menu.innerHTML = members.map(m => `<div data-participant-id="${esc(m.participantId)}">${Team.av(m)}${esc(m.nickname)}</div>`).join('');
  sel.appendChild(menu);
});

App.action('moveSuggestion', async () => {
  const warn = App.$('.sc2.warn9');
  const r = await api.call('team.suggestion', { suggestionId: warn.dataset.suggestionId || 'sug_1' }, { accept: true });
  if (IE_CONFIG.useMock) warn.hidden = true; else render(r);
  App.toast('작은 일을 옮겼어요');
  return false;
});
App.action('keepSuggestion', async () => {
  const warn = App.$('.sc2.warn9');
  const r = await api.call('team.suggestion', { suggestionId: warn.dataset.suggestionId || 'sug_1' }, { accept: false });
  if (IE_CONFIG.useMock) warn.hidden = true; else render(r);
  return false;
});
App.action('revertAssign', async () => {
  if (!(await App.confirm('AI 초안으로 되돌릴까요?', '팀장이 바꾼 담당이 모두 AI 초안으로 돌아가요. 팀원이 표시한 파트는 남아요.', '되돌리기'))) return false;
  const r = await api.call('team.revert', {}, {});
  if (!IE_CONFIG.useMock) render(r);
  App.toast('AI 초안으로 되돌렸어요');
  return false;
});
App.action('confirmAssign', async () => {
  if (!(await App.confirm('이대로 확정할까요?', '확정하면 모두에게 보고서가 열리고, 이 배치 초안 화면으로는 되돌아올 수 없어요. 확정한 뒤에도 담당은 보고서에서 다시 고칠 수 있어요.', '확정하기'))) return false;
  try {
    await api.call('team.confirm', {}, { version: (cur && cur.version) || 1 });
  } catch (err) {
    // 그 사이 배치가 바뀐 경우(다른 탭 등) — 최신을 다시 불러와 cur.version을 맞춰준다.
    // 안 그러면 다시 눌러도 같은 옛 version을 보내서 계속 튕겼다.
    if (err && err.code === 'VERSION_MISMATCH') {
      await load();
      App.toast('배치가 그 사이 바뀌었어요. 확인하고 다시 확정해 주세요', 'error');
      return false;
    }
    throw err;
  }
  App.go(App.screen('09-5-report'));
  return false;
});

async function load() {
  const a = await App.run(null, () => api.call('team.assignment'));
  if (a === false) return;                      // 실패는 App.run이 토스트 · 지난 단계면 화면 이동
  if (cur && a.version < cur.version) return;   // 늦게 도착한 응답 — 이미 더 최신 배치를 보고 있음
  if (a.viewer && !a.viewer.isLeader) { App.go(App.screen('09-3-assign-draft')); return; }
  render(a);
}
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'team.assignment.updated' && !IE_CONFIG.useMock) load();
  if (ev.type === 'team.confirmed' || (ev.type === 'stage.changed' && ev.data.stage.id === 'report')) App.go(App.screen('09-5-report'));
});
if (!IE_CONFIG.useMock) load();
if (IE_CONFIG.useMock) api.call('team.assignment').then(a => { cur = a; });   // 목업 모드: 이름 목록만 미리 받아둠
