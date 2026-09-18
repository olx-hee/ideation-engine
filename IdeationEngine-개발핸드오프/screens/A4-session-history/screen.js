/* A4 지난 세션 기록 */
const search = App.$('.srch input');
let role = 'all', timer;

function render(r) {
  const list = App.$('.slist'); list.querySelectorAll('.srow:not(.h), .empty').forEach(n => n.remove());
  if (!r.items.length) list.insertAdjacentHTML('beforeend', '<div class="empty" style="margin-top:8px">아직 참여한 세션이 없어요</div>');
  r.items.forEach(it => {
    const row = document.createElement('div'); row.className = 'srow';
    const meta = `${it.myRole === 'host' ? '진행자' : '참가자'} · ${it.memberCount}명 · ${it.durationMin}분`;
    const decided = it.decidedTopic ? App.escape(it.decidedTopic) : (it.endedEarly ? '— (중간 종료)' : '—');
    row.innerHTML = `<span class="dt">${it.date.replaceAll('-', '.')}</span><span class="tp">${App.escape(it.topic)}</span><span class="mt">${meta}</span>` +
      `<span class="rs"${it.decidedTopic ? '' : ' style="color:var(--faint)"'}>${decided}</span>` +
      `<span>${it.reportAvailable ? `<button class="btn ghost sm" data-action="openReport" data-session-id="${it.sessionId}">보고서 보기</button>` : '<button class="btn ghost sm disabled" disabled>보고서 없음</button>'}</span>`;
    list.appendChild(row);
  });
  const chips = App.$$('.chips .chip'); chips[0].textContent = `전체 ${r.counts.all}`; chips[1].textContent = `진행자 ${r.counts.host}`; chips[2].textContent = `참가자 ${r.counts.participant}`;
}
async function load() {
  if (IE_CONFIG.useMock) return;
  const r = await App.run(null, () => api.call('history.list', { query: { role, q: search.value.trim() } }));
  if (r) render(r);
}
if (!IE_CONFIG.useMock) App.loadAccountSide();

document.addEventListener('ie:chip', (e) => {
  role = e.detail.startsWith('진행자') ? 'host' : e.detail.startsWith('참가자') ? 'participant' : 'all';
  if (IE_CONFIG.useMock) App.toast(`필터: ${e.detail} (백엔드 연결 후 목록이 바뀌어요)`);
  load();
});
search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 300); });
App.action('openReport', async (el) => {
  const id = el.dataset.sessionId || App.state.sessionId;
  App.go(App.screen('09-5-report') + (id ? '?sessionId=' + encodeURIComponent(id) : ''));
  return false;
});
load();
