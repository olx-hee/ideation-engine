/* 8-5 AI 검증 */
const GRADE = { go: '바로 해볼 만해요', fix: '보완하면 좋아요', re: '다시 생각해 봐요' };
App.$$('.rail .ri').forEach((r, i) => { r.dataset.ideaId = r.dataset.ideaId || 'ide_' + i; });

function renderReview(r) {
  const d = App.$('.detail');
  d.querySelector('.dk').textContent = `팀원 ${r.alias}의 ${r.rank}순위`;
  d.querySelector('.dt').textContent = r.title;
  const g = d.querySelector('.dhead .grade');
  const rows = d.querySelectorAll('.qa > div');
  const set = (i, label, text, link) => {
    rows[i].innerHTML = `<span class="ans">${App.escape(label)}</span>${App.escape(text)}` +
      (link ? ` <a class="linkish" href="${App.escape(link)}" target="_blank" rel="noopener">검색 결과 보기</a>` : '');
  };
  // 검증이 실패(AI_UNAVAILABLE)했거나 아직 안 끝난 아이디어는 칸이 전부 null로 온다 —
  // 그대로 r.exists.label을 읽으면 여기서 터져서 오른쪽에 HTML 예시 문장이 남아 있었다.
  if (r.status !== 'done') {
    g.className = 'grade gbox'; g.lastChild.textContent = r.status === 'failed' ? '검증하지 못했어요' : '검증하는 중이에요';
    const msg = r.status === 'failed' ? 'AI 검증을 받지 못했어요 · 투표에는 그대로 올라가요' : '검증이 끝나면 채워져요';
    for (let i = 0; i < 5; i++) if (rows[i]) rows[i].textContent = msg;
  } else {
    g.className = 'grade gbox ' + r.grade; g.lastChild.textContent = GRADE[r.grade] || '';
    set(0, r.exists.label, r.exists.summary, r.exists.searchUrl);
    set(1, r.feasibility.level, r.feasibility.summary);
    set(2, r.missingSkills.count + '개', r.missingSkills.summary);
    set(3, r.need.label, r.need.summary);
    set(4, r.timeline.label, r.timeline.summary);
  }
  const c = r.commentSummary || { concern: 0, praise: 0, concernPoints: [], praisePoints: [] };
  rows[5].innerHTML = `아쉬운 점 ${c.concern} · ${(c.concernPoints || []).map(App.escape).join(' · ')}<br>좋은 점 ${c.praise} · ${(c.praisePoints || []).map(App.escape).join(' · ')}`;
}
document.addEventListener('ie:select', async (e) => {
  App.$('.detail .dt').textContent = App.text(e.detail.querySelector('.t'));
  if (!IE_CONFIG.useMock) {
    const r = await App.run(null, () => api.call('review.get', { ideaId: e.detail.dataset.ideaId }));
    if (r) renderReview(r);
  }
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
  const total = (r.groups || []).reduce((n, g) => n + (g.items || []).length, 0);
  App.$('.dvh h3').textContent = `AI가 아이디어 ${total}개의 실효성과 현실성을 살펴봤어요`;
  App.$('.dvh p').textContent = `참고용 판단이에요. 등급이 낮아도 빼지 않고 ${total}개 모두 투표에 올라가요.`;
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
let loadSeq = 0;   // 느린 네트워크에서 응답이 뒤섞여 와도(경쟁 조건) 가장 최근 요청만 반영
let pollTimer = null, listDone = false;
/** quiet: 스스로 다시 물어보는 경우(실패해도 토스트를 띄우지 않는다) */
async function load(quiet) {
  const seq = ++loadSeq;
  const r = quiet ? await api.call('review.list').catch(() => null) : await App.run(null, () => api.call('review.list'));
  if (seq !== loadSeq) return;
  clearTimeout(pollTimer);
  // 검증이 끝날 때까지 스스로 다시 물어본다 — reviews.ready는 한 번만 오는 이벤트라, 웹소켓이
  // 재연결되는 틈이나 늦게 들어온 사람이 그걸 놓치면 "검증하는 중"에서 영원히 안 풀렸다.
  if (!r || !r.ready) pollTimer = setTimeout(() => load(true), 4000);
  if (!r) return;
  pending(r);
  if (r.ready && !listDone) { listDone = true; renderList(r); }   // 목록은 한 번만(다시 그리면 고른 줄이 풀린다)
}
if (!IE_CONFIG.useMock) load();
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'reviews.ready' && !IE_CONFIG.useMock) load(true);
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.vote') App.go(App.screen('08-6-vote'));
});
