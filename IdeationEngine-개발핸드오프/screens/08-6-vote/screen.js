/* 8-6 투표 */
let MAX_VOTES = 2;
const rail = App.$('.rail');
const views = { idea: App.$('[data-view="idea"]'), ai: App.$('[data-view="ai"]'), thread: App.$('[data-view="thread"]') };

// 목록 항목에 종류 붙이기: 그룹 제목 순서 = 투표 후보 → AI가 모은 아이디어 → 숨은 공통점
let kind = 'idea', groupIndex = 0;
[...rail.children].forEach((el, i) => {
  if (el.classList.contains('rgl')) kind = ['idea', 'ai', 'thread'][groupIndex++] || kind;
  else if (el.classList.contains('ri')) { el.dataset.kind = kind; el.dataset.id = el.dataset.id || ({ idea: 'ide_', ai: 'aii_', thread: 'thr_' }[kind] + i); }
});

const current = () => App.$('.rail .ri.on');
const checked = () => App.$$('.rail .ri .cb.on');
function paintDots() { const used = checked().length; App.$$('.dots3 i').forEach((d, i) => d.classList.toggle('e', i >= used)); }
function syncVoteButton() {
  const cb = current()?.querySelector('.cb');
  App.$$('[data-action="voteCurrent"]').forEach(b => { b.textContent = cb && cb.classList.contains('on') ? '✓ 투표했어요 · 취소' : '이 아이디어에 투표'; });
}
function show(k) { Object.entries(views).forEach(([key, v]) => { v.hidden = key !== k; }); }

document.addEventListener('ie:select', (e) => {
  const item = e.detail; show(item.dataset.kind);
  if (item.dataset.kind !== 'thread') views[item.dataset.kind].querySelector('.dt').textContent = App.text(item.querySelector('.t'));
  syncVoteButton();
  if (!IE_CONFIG.useMock) loadDetail(item);
});

const GRADE_LABEL = { go: '바로 해볼 만해요', fix: '보완하면 좋아요', re: '다시 생각해 봐요' };
function setGrade(el, grade) {
  if (!el) return;
  el.hidden = !grade;
  if (!grade) return;
  el.className = el.className.replace(/\b(go|fix|re)\b/g, '').trim() + ' ' + grade;
  el.lastChild.textContent = GRADE_LABEL[grade] || grade;
}
/** `<div><span class="ans">값</span>설명 [<a>링크</a>]</div>` 한 줄 채우기 */
function setAns(row, label, text, link, linkText) {
  if (!row) return;
  row.innerHTML = `<span class="ans">${App.escape(label ?? '')}</span>${App.escape(text ?? '')}` +
    (link ? ` <a class="linkish" href="${App.escape(link)}" target="_blank" rel="noopener">${linkText || '검색 결과 보기'}</a>` : '');
}
function renderCandidate(r) {
  const v = views.idea;
  v.querySelector('.dk').textContent = `팀원 ${r.alias}의 ${r.rank}순위`;
  v.querySelector('.dt').textContent = r.title;
  setGrade(v.querySelector('.grade'), r.grade);
  v.querySelector('.orig').textContent = r.originalText || '';
  const rows = v.querySelectorAll('.qa.tight > div');
  const rv = r.review || {};
  if (rv.exists) setAns(rows[0], rv.exists.label, rv.exists.summary, rv.exists.searchUrl);
  if (rv.feasibility) setAns(rows[1], rv.feasibility.level, rv.feasibility.summary);
  if (rv.need) setAns(rows[2], rv.need.label, rv.need.summary);
  if (rv.timeline) setAns(rows[3], rv.timeline.label, rv.timeline.summary);
  const cm = v.querySelectorAll('.cm');
  const items = (r.comments && r.comments.items) || [];
  if (cm.length) {
    const tpl = cm[0], box = tpl.parentElement;
    cm.forEach(x => x.remove());
    items.forEach(c => {
      const el = tpl.cloneNode(true);
      el.className = 'cm' + (c.type === 'praise' ? ' plus' : '');
      el.innerHTML = `<span>${c.type === 'praise' ? '좋은 점' : '아쉬운 점'}</span>${App.escape(c.text)}`;
      box.appendChild(el);
    });
  }
  v.querySelectorAll('h6 small, .sech small').forEach(s => {
    if (s.textContent.includes('아쉬운 점') && r.comments) s.textContent = `아쉬운 점 ${r.comments.concern} · 좋은 점 ${r.comments.praise}`;
  });
}
function renderAiIdea(r) {
  const v = views.ai;
  v.querySelector('.dt').textContent = r.title;
  setGrade(v.querySelector('.grade.gbox'), r.grade);
  const srcs = v.querySelectorAll('.src');
  if (srcs.length) {
    const tpl = srcs[0], box = tpl.parentElement;
    srcs.forEach(x => x.remove());
    (r.sources || []).forEach(sc => {
      const el = tpl.cloneNode(true);
      el.querySelector('.m').innerHTML = `팀원 ${App.escape(sc.alias)}의 ${sc.rank}순위 · <span class="grade ${App.escape(sc.grade || '')}"><i></i>${App.escape(GRADE_LABEL[sc.grade] || '')}</span>`;
      el.querySelector('.tt').textContent = sc.title;
      el.querySelector('.g').innerHTML = `<span>가져온 점</span>${App.escape(sc.takenPoint || '')}`;
      box.appendChild(el);
    });
  }
  const fixes = v.querySelectorAll('.fixrow');
  if (fixes.length) {
    const tpl = fixes[0], box = tpl.parentElement;
    fixes.forEach(x => x.remove());
    (r.fixes || []).forEach(f => {
      const el = tpl.cloneNode(true);
      el.innerHTML = `<span class="p">${App.escape(f.problem)}<small>아쉬운 점 ${f.concernCount}</small></span><span class="a">→</span><span>${App.escape(f.fix)}</span>`;
      box.appendChild(el);
    });
  }
  const cells = v.querySelectorAll('.vgrid > div');
  const rv = r.review || {};
  const put = (cell, val, link) => {
    if (!cell) return;
    const b = cell.querySelector('b');
    cell.innerHTML = '';
    if (b) cell.appendChild(b);
    cell.insertAdjacentHTML('beforeend', `<span class="ans">${App.escape(val ?? '')}</span>` + (link ? `<a class="linkish" href="${App.escape(link)}" target="_blank" rel="noopener">검색 결과</a>` : ''));
  };
  put(cells[0], rv.exists, rv.searchUrl); put(cells[1], rv.feasibility); put(cells[2], rv.need); put(cells[3], rv.timeline);
}
function renderThread(r, index) {
  const v = views.thread;
  v.querySelector('.dk').textContent = `투표 참고 · 숨은 공통점 ${index}`;
  v.querySelector('.dt').textContent = r.title;
  const mineChip = v.querySelector('.dhead .quiet'); if (mineChip) mineChip.hidden = !r.includesMine;
  const froms = v.querySelectorAll('.from');
  if (froms.length) {
    const tpl = froms[0], box = tpl.parentElement;
    froms.forEach(x => x.remove());
    (r.sources || []).forEach(sc => {
      const el = tpl.cloneNode(true);
      el.innerHTML = `<span>${App.escape(sc.question)}</span>${App.escape(sc.summary)}`;
      box.appendChild(el);
    });
  }
  const why = v.querySelector('.sec p'); if (why) why.textContent = r.why || '';
  const heads = v.querySelectorAll('h6');
  heads.forEach(h => {
    if (h.textContent.startsWith('어디서 나왔나요')) { const s = h.querySelector('small'); if (s) s.textContent = `${r.answerCount}명의 답 · 인터뷰 재료 요약 · 원문 인용 없음`; }
    if (h.textContent.startsWith('이 공통점과 이어지는 후보')) h.childNodes[0].nodeValue = `이 공통점과 이어지는 후보 ${(r.candidates || []).length}개`;
  });
  const crows = v.querySelectorAll('.crow');
  if (crows.length) {
    const tpl = crows[0], box = tpl.parentElement;
    crows.forEach(x => x.remove());
    (r.candidates || []).forEach(c => {
      const el = tpl.cloneNode(true);
      const cb = el.querySelector('.cb');
      cb.classList.toggle('on', !!c.votedByMe); cb.textContent = c.votedByMe ? '✓' : '';
      el.querySelector('.t').innerHTML = App.escape(c.title) + (c.isMine ? ' <small>내 아이디어</small>' : '') + (c.isAi ? ' <span class="aitag">AI가 모음</span>' : '');
      setGrade(el.querySelector('.grade'), c.grade);
      box.appendChild(el);
    });
  }
  const pick = { didntKnow: 0, knew: 1 }[r.myReaction];
  v.querySelectorAll('.rbtn').forEach((b, i) => b.classList.toggle('on', pick === i));
}
async function loadDetail(item) {
  const id = item.dataset.id;
  if (item.dataset.kind === 'idea') renderCandidate(await api.call('vote.candidate', { ideaId: id }));
  else if (item.dataset.kind === 'ai') renderAiIdea(await api.call('vote.aiIdea', { aiIdeaId: id }));
  else {
    const list = App.$$('.rail .ri').filter(x => x.dataset.kind === 'thread');
    renderThread(await api.call('vote.thread', { threadId: id }), list.indexOf(item) + 1);
  }
}

async function toggleVote(cb) {
  const on = !cb.classList.contains('on');
  if (on && checked().length >= MAX_VOTES) { App.toast(`한 사람당 ${MAX_VOTES}표까지예요. 다른 표를 먼저 빼주세요`); return; }
  const set = (v) => { cb.classList.toggle('on', v); cb.textContent = v ? '✓' : ''; paintDots(); syncVoteButton(); };
  set(on);
  try { await api.call('vote.save', {}, { ids: checked().map(c => c.closest('.ri').dataset.id) }); }
  catch (err) { set(!on); App.toast(err.message, 'error'); }
}
rail.addEventListener('click', (e) => { const cb = e.target.closest('.cb'); if (cb) toggleVote(cb); });
App.action('voteCurrent', async () => { const cb = current()?.querySelector('.cb'); if (cb) await toggleVote(cb); return false; });
App.action('finishVote', async () => {
  if (!checked().length && !(await App.confirm('아직 투표하지 않았어요', '그래도 투표를 마칠까요? 마친 뒤에는 표를 바꿀 수 없어요.', '마치기'))) return false;
  const r = await api.call('vote.finish', {}, {});
  App.toast(`투표를 마쳤어요 · ${r.votedCount} / ${r.memberCount}명`);
  App.go(App.screen('08-6w-vote-wait'));   // 결과 기다리는 화면으로
  return false;
});
document.addEventListener('ie:reaction', (e) => {
  if (!e.target.closest('[data-view="thread"]')) return;
  api.call('vote.threadReact', { threadId: current()?.dataset.id || 'thr_1' }, { reaction: e.detail === '몰랐어요' ? 'didntKnow' : 'knew' })
    .catch(err => App.toast(err.message, 'error'));
});
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'vote.progress') { App.progress(ev.data.votedCount, ev.data.memberCount); App.$$('.dfoot2 .quiet').forEach(q => { if (q.textContent.startsWith('투표한 사람')) q.textContent = `투표한 사람 ${ev.data.votedCount} / ${ev.data.memberCount} · 모두 투표하면 결과가 열려요`; }); }
  if (ev.type === 'vote.closed') App.go(App.screen('08-7-vote-result-host'));   // 모두 결과로 (참가자는 보기 전용)
  if (ev.type === 'stage.changed') { const want = App.stageScreen(ev.data.stage, App.state.role, App.state.isLeader); if (want) App.go(App.screen(want)); }
});
paintDots(); syncVoteButton();

/* 실서버 모드: 왼쪽 목록을 vote.state로 다시 그린다 (목업 모드는 HTML 예시 그대로) */
function renderVote(r) {
  MAX_VOTES = r.maxVotes || MAX_VOTES;
  const labels = App.$$('.rail .rgl');
  const tplVote = App.$('.rail .ri .cb')?.closest('.ri');
  const tplThread = App.$('.rail .ri .n')?.closest('.ri');
  if (!tplVote || !labels.length) return;
  const groups = [['idea', labels[0], r.candidates || []], ['ai', labels[1], r.aiIdeas || []], ['thread', labels[2], r.commonThreads || []]];
  rail.innerHTML = '';
  groups.forEach(([kind, label, items]) => {
    if (!label || (!items.length && kind !== 'idea')) return;
    const lab = label.cloneNode(true);
    const small = lab.querySelector('small');
    if (small && kind !== 'thread') small.textContent = items.length;
    rail.appendChild(lab);
    items.forEach((it, i) => {
      const tpl = kind === 'thread' ? (tplThread || tplVote) : tplVote;
      const el = tpl.cloneNode(true);
      el.classList.remove('on');
      el.dataset.kind = kind; el.dataset.id = it.id;
      el.querySelector('.t').textContent = it.title;
      const cb = el.querySelector('.cb');
      if (cb) { const on = (r.myVotes || []).includes(it.id); cb.classList.toggle('on', on); cb.textContent = on ? '✓' : ''; }
      const gd = el.querySelector('.gd'); if (gd) { gd.className = 'gd ' + (it.grade || ''); gd.hidden = !it.grade; }
      const n = el.querySelector('.n'); if (n) n.textContent = i + 1;
      const st = el.querySelector('.s'); if (st) st.textContent = `후보 ${it.candidateCount}`;
      const mine = el.querySelector('small'); if (mine) mine.hidden = !it.isMine;
      rail.appendChild(el);
    });
  });
  App.$$('.dfoot2 .quiet').forEach(q => { if (q.textContent.startsWith('투표한 사람')) q.textContent = `투표한 사람 ${r.votedCount} / ${r.memberCount} · 모두 투표하면 결과가 열려요`; });
  paintDots(); syncVoteButton();
  App.$('.rail .ri')?.click();   // 첫 줄 선택 → 오른쪽 본문도 서버 값으로
}
async function load() {
  const r = await api.call('vote.state');
  if (r.finished) { App.go(App.screen('08-6w-vote-wait')); return; }   // 이미 마쳤으면 대기 화면
  renderVote(r);
}
if (!IE_CONFIG.useMock) load();
