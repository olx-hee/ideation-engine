/* 8-5 AI 검증 */
const GRADE = { go: '바로 해볼 만해요', fix: '보완하면 좋아요', re: '다시 생각해 봐요' };
App.$$('.rail .ri').forEach((r, i) => { r.dataset.ideaId = r.dataset.ideaId || 'ide_' + i; });

function renderReview(r) {
  const d = App.$('.detail');
  d.querySelector('.dk').textContent = `팀원 ${r.alias}의 ${r.rank}순위`;
  d.querySelector('.dt').textContent = r.title;
  const g = d.querySelector('.dhead .grade'); g.className = 'grade gbox ' + r.grade; g.lastChild.textContent = GRADE[r.grade];
  const rows = d.querySelectorAll('.qa > div');
  const set = (i, label, text, link) => {
    rows[i].innerHTML = `<span class="ans">${App.escape(label)}</span>${App.escape(text)}` +
      (link ? ` <a class="linkish" href="${App.escape(link)}" target="_blank" rel="noopener">검색 결과 보기</a>` : '');
  };
  set(0, r.exists.label, r.exists.summary, r.exists.searchUrl);
  set(1, r.feasibility.level, r.feasibility.summary);
  set(2, r.missingSkills.count + '개', r.missingSkills.summary);
  set(3, r.need.label, r.need.summary);
  set(4, r.timeline.label, r.timeline.summary);
  const c = r.commentSummary;
  rows[5].innerHTML = `아쉬운 점 ${c.concern} · ${c.concernPoints.map(App.escape).join(' · ')}<br>좋은 점 ${c.praise} · ${c.praisePoints.map(App.escape).join(' · ')}`;
}
document.addEventListener('ie:select', async (e) => {
  App.$('.detail .dt').textContent = App.text(e.detail.querySelector('.t'));
  if (!IE_CONFIG.useMock) renderReview(await api.call('review.get', { ideaId: e.detail.dataset.ideaId }));
});
/* 검증 중(T3): review.list의 ready가 false면 안내를 띄우고, reviews.ready가 오면 걷는다 */
function pending(r) {
  App.$('.tdim')?.remove(); if (r.ready) return;
  const done = r.doneCount ?? 0, total = r.total ?? 0, pct = total ? Math.round(done * 100 / total) : 0;
  App.$('.tdim')?.remove();
  const dim = document.createElement('div'); dim.className = 'tdim';
  dim.innerHTML = `<div class="tdlg" style="text-align:center"><div class="avatar" style="width:72px;height:72px;font-size:var(--fs-h1);margin:0 auto 14px">AI</div><h3>검증하는 중이에요</h3><p>아이디어 ${total}개 중 <b>${done}개</b> 끝남 · 검색 근거 확인 중</p><div class="tpend"><div class="bar" style="width:360px"><i style="width:${pct}%"></i></div></div><p class="quiet">끝나면 자동으로 보여요 · 검증에 실패한 아이디어는 "검증 실패"로 표시되고 그대로 투표에 올라가요</p></div>`;
  (App.$('.board') || document.body).appendChild(dim);
}
/* 실서버 모드: 등급별 목록을 review.list로 그린다 ("N개 더 보기"로 4개씩) */
function renderList(r) {
  const rail = App.$('.rail');
  const tplLabel = rail.querySelector('.rgl'), tplItem = rail.querySelector('.ri'), tplMore = rail.querySelector('.rmore');
  if (!tplLabel || !tplItem) return;
  rail.innerHTML = '';
  (r.groups || []).forEach(g => {
    const lab = tplLabel.cloneNode(true);
    const badge = lab.querySelector('.grade');
    if (badge) { badge.className = 'grade ' + g.grade; badge.lastChild.textContent = g.label || GRADE[g.grade] || g.grade; }
    const small = lab.querySelector('small'); if (small) small.textContent = (g.items || []).length;
    rail.appendChild(lab);
    const hidden = [];
    (g.items || []).forEach((it, i) => {
      const el = tplItem.cloneNode(true);
      el.classList.remove('on');
      el.dataset.ideaId = it.ideaId;
      el.querySelector('.t').textContent = it.title;
      if (i >= 4) { el.hidden = true; hidden.push(el); }
      rail.appendChild(el);
    });
    if (hidden.length && tplMore) {
      const more = tplMore.cloneNode(true);
      more.textContent = `${hidden.length}개 더 보기`;
      more.addEventListener('click', () => { hidden.forEach(x => { x.hidden = false; }); more.remove(); });
      rail.appendChild(more);
    }
  });
  App.$('.rail .ri')?.click();
}
async function load() {
  const r = await api.call('review.list');
  pending(r);
  if (r.ready) renderList(r);
}
if (!IE_CONFIG.useMock) load();
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'reviews.ready' && !IE_CONFIG.useMock) load();
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.vote') App.go(App.screen('08-6-vote'));
});
