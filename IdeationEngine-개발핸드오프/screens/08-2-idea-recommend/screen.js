/* 8-2 AI 추천에서 고르기 */
let recs = App.$$('.rec');
recs.forEach((rec, i) => {
  rec.dataset.recId = rec.dataset.recId || 'rec_' + (i + 1);
  const on = rec.querySelector('.seg span.on'); if (on) rec.dataset.rank = parseInt(on.textContent, 10);
});
if (!IE_CONFIG.useMock) recs.forEach(rec => { rec.classList.remove('on'); delete rec.dataset.rank; });   // 실서버 모드: 디자인 예시로 미리 골라둔 순위를 지우고 시작 (안 지우면 목업 추천이 실제 제출로 나갈 수 있음)
/* 8-1에서 이미 적어 둔 아이디어 (순위 → 문장). idea.submit은 전체를 덮어쓰는 PUT이라, 추천만 보내면
   직접 적은 아이디어가 조용히 지워진다 — 고르지 않은 순위는 원래 문장을 그대로 다시 보낸다. */
let mineText = {};
function paint() {
  const picks = [1, 2, 3].map(r => recs.find(x => +x.dataset.rank === r));
  App.$$('.mine li').forEach((li, i) => { li.lastChild.textContent = picks[i] ? App.text(picks[i].querySelector('b')) : (mineText[i + 1] || '비어 있어요'); });
  recs.forEach(rec => {
    rec.classList.toggle('on', !!rec.dataset.rank);
    rec.querySelectorAll('.seg span').forEach((s, i) => { const on = +rec.dataset.rank === i + 1; s.classList.toggle('on', on); s.textContent = on ? `${i + 1}순위` : i + 1; });
  });
}
document.addEventListener('click', (e) => {
  const s = e.target.closest('.seg span'); if (!s) return;
  const rec = s.closest('.rec'); const r = [...s.parentElement.children].indexOf(s) + 1;
  if (+rec.dataset.rank === r) delete rec.dataset.rank;
  else { recs.forEach(o => { if (+o.dataset.rank === r) delete o.dataset.rank; }); rec.dataset.rank = r; }
  paint();
});

/* 실서버 모드: 추천 카드를 idea.recommend로 그린다 ("더 보기"는 받은 nextCursor로) */
let nextCursor = null;
function renderRecs(items, append) {
  const box = App.$('.recs'), tpl = App.$('.rec');
  if (!box || !tpl) return;
  if (!append) box.innerHTML = '';
  if (!append && !items.length) { box.innerHTML = '<div class="empty">추천할 아이디어가 아직 없어요. 아이디어를 직접 적어도 돼요</div>'; recs = []; paint(); return; }
  items.forEach(it => {
    const el = tpl.cloneNode(true);
    el.classList.remove('on');
    delete el.dataset.rank;
    el.dataset.recId = it.recommendationId;
    el.querySelector('b').textContent = it.title;
    el.querySelector('p').textContent = '추천 이유 · ' + it.reason;
    el.querySelectorAll('.seg span').forEach((sp, i) => { sp.className = ''; sp.textContent = String(i + 1); });
    box.appendChild(el);
  });
  recs = App.$$('.rec');
  paint();
}
async function load() {
  const m = await App.run(null, () => api.call('idea.mine'));
  if (m) (m.ideas || []).forEach(it => { mineText[it.rank] = it.text; });
  // 아직 제출 전이면 서버에 아무것도 없다 — 8-1에서 쓰다 만 문장(이 브라우저에 저장)을 쓴다
  if (!Object.keys(mineText).length) (App.state.draftIdeas || []).forEach((t, i) => { if (t && t.trim()) mineText[i + 1] = t.trim(); });
  paint();
  const r = await App.run(null, () => api.call('idea.recommend'));
  // 추천을 못 받았으면(AI 실패·재료 없음) 디자인 예시 카드를 비운다 — 그대로 두면 목업 추천을 골라
  // 진짜 아이디어로 제출하게 된다(가짜 recommendationId까지 같이 나감).
  if (!r) { renderRecs([], false); return; }
  nextCursor = r.nextCursor;
  renderRecs(r.items || [], false);
}
if (!IE_CONFIG.useMock) load();

App.action('moreRecs', async () => {
  if (IE_CONFIG.useMock) { App.toast('새 추천 4개를 받았어요 (목업이라 목록은 그대로예요)'); return false; }
  if (!nextCursor) { App.toast('더 보여드릴 추천이 없어요'); return false; }
  const r = await api.call('idea.recommend', { query: { cursor: nextCursor } });
  nextCursor = r.nextCursor;
  renderRecs(r.items || [], true);
  App.toast(`새 추천 ${(r.items || []).length}개를 받았어요`);
  return false;
});
App.action('submitIdeas', async () => {
  const picked = [1, 2, 3].map(r => recs.find(x => +x.dataset.rank === r));
  if (!picked.some(Boolean)) { App.toast('마음에 드는 추천을 1개 이상 골라주세요'); return false; }
  // 고른 순위는 추천으로, 고르지 않은 순위는 8-1에서 적어 둔 문장으로 — 빈 순위는 빼고 1·2·3으로 다시 붙인다
  const ideas = [1, 2, 3].map(r => {
    const rec = picked[r - 1];
    if (rec) return { text: App.text(rec.querySelector('b')), source: 'ai', recommendationId: rec.dataset.recId };
    return mineText[r] ? { text: mineText[r], source: 'own' } : null;
  }).filter(Boolean).map((it, i) => Object.assign({ rank: i + 1 }, it));
  const r = await api.call('idea.submit', {}, { ideas });
  App.progress(r.submittedCount, r.memberCount);   // 진행자 막대(T2)는 남의 제출 이벤트만 받으므로 내 제출은 여기서
  App.toast('제출했어요. 모두 내면 순위표가 열려요');
});
paint();

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'ideas.submitted') App.progress(ev.data.submittedCount, ev.data.memberCount);   // 진행자 막대(T2)
  /* 단계가 바뀌면 그 단계의 화면으로 — diverge.board만 보고 이동하면 진행자가 두 단계를 빠르게 넘겼을 때
     추천 화면에 갇힌다. 같은 단계(diverge.write)는 무시한다 — 서버가 연결 직후 보내는 현재 단계 동기화나
     진행자의 session.back 때 고르던 추천이 날아가지 않게. */
  if (ev.type === 'stage.changed' && ev.data.stage && !document.body.dataset.stage.split(' ').includes(ev.data.stage.id)) {
    const want = App.stageScreen(ev.data.stage, App.state.role);
    if (want) App.go(App.screen(want));
  }
});
