/* 8-2 AI 추천에서 고르기 */
let recs = App.$$('.rec');
recs.forEach((rec, i) => {
  rec.dataset.recId = rec.dataset.recId || 'rec_' + (i + 1);
  const on = rec.querySelector('.seg span.on'); if (on) rec.dataset.rank = parseInt(on.textContent, 10);
});
function paint() {
  const picks = [1, 2, 3].map(r => recs.find(x => +x.dataset.rank === r));
  App.$$('.mine li').forEach((li, i) => { li.lastChild.textContent = picks[i] ? App.text(picks[i].querySelector('b')) : '비어 있어요'; });
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
  const r = await api.call('idea.recommend');
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
  const ideas = [1, 2, 3].map(r => recs.find(x => +x.dataset.rank === r)).filter(Boolean)
    .map((rec, i) => ({ rank: i + 1, text: App.text(rec.querySelector('b')), source: 'ai', recommendationId: rec.dataset.recId }));
  if (!ideas.length) { App.toast('마음에 드는 추천을 1개 이상 골라주세요'); return false; }
  await api.call('idea.submit', {}, { ideas });
});
paint();
