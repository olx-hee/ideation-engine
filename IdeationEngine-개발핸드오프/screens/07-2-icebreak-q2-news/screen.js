/* 7-2 최근 소식 카드 */
const REACTION = { '처음 들어요': 'new', '들어봤어요': 'heard', '잘 알아요': 'know' };
App.$$('.nc').forEach((c, i) => { c.dataset.cardId = c.dataset.cardId || 'news_' + (i + 1); });

document.addEventListener('ie:reaction', (e) => {
  const card = e.target.closest('.nc'); if (!card) return;
  App.$$('.nc').forEach(c => c.classList.toggle('on', c === card));
  api.call('ice.react', { cardId: card.dataset.cardId }, { reaction: REACTION[e.detail] }).catch(err => App.toast(err.message, 'error'));
});

/* 실서버 모드: 카드 3장을 ice.news로 그린다 (반응·뜻풀이가 서버 카드 id로 가게) */
function renderNews(r) {
  const cards = App.$$('.nc');
  if (!cards.length) return;
  const tpl = cards[0], wrap = tpl.parentElement;
  const fill = (el, text) => { if (!el) return; const b = el.querySelector('b'); el.textContent = ''; if (b) el.appendChild(b); el.appendChild(document.createTextNode(text || '')); };
  cards.forEach(c => c.remove());
  (r.cards || []).forEach((c, i) => {
    const el = tpl.cloneNode(true);
    el.classList.toggle('on', i === 0);
    el.dataset.cardId = c.cardId;
    el.dataset.term = c.title;
    el.querySelector('.ncat').textContent = c.category;
    el.querySelector('.ndate').textContent = (c.source && c.source.publishedAt) || '';
    el.querySelector('.nt').textContent = c.title;
    fill(el.querySelector('.ne'), c.plain);
    fill(el.querySelector('.nteam'), c.forTeam);
    const src = el.querySelector('.nsrc span');
    if (src) {
      const name = (c.source && c.source.name) || '';
      const url = c.source && c.source.url;
      src.innerHTML = '출처 ' + (url ? `<a class="linkish" href="${App.escape(url)}" target="_blank" rel="noopener">${App.escape(name)}</a>` : App.escape(name));
    }
    const pick = { new: 0, heard: 1, know: 2 }[c.myReaction];
    el.querySelectorAll('.rb').forEach((b, n) => b.classList.toggle('on', pick === n));
    wrap.appendChild(el);
  });
  if (r.fallback) {   // 검색 결과가 없어도 서버는 질문 2·3을 그대로 물어본다 — 카드만 없다고 알려주고 채팅은 이어간다
    App.toast('최근 소식을 찾지 못해 카드 없이 질문을 이어가요');
    const inp = App.$('.comp input'); if (inp) inp.placeholder = '답을 입력해 주세요';
    const empty = wrap && !wrap.querySelector('.nc');
    if (empty) wrap.insertAdjacentHTML('beforeend', '<p class="quiet" style="padding:12px">이 주제로 찾은 최근 소식이 없어요. 아는 변화가 있으면 채팅으로 바로 답해 주세요.</p>');
  }
}
if (!IE_CONFIG.useMock) {
  const asked = App.$('.asked'); if (asked) asked.textContent = '아직 없어요';   // HTML의 예시("온디바이스 AI")는 목업용 — 실제로 물어본 게 없으면 비워둔다
  api.call('ice.news').then(renderNews).catch(err => App.toast(err.message, 'error'));
}

App.action('explain', async (el) => {
  const card = el.closest('.nc');
  const term = card.dataset.term || App.text(card.querySelector('.nt')).replace(/^\[예시\]\s*/, '');
  App.chat.bubble('user', null, `"${term}" 이게 뭐예요?`);
  const r = await api.call('ice.explain', {}, { cardId: card.dataset.cardId, term });
  App.chat.bubble('ai', 'explain', r.message.text);
  const asked = App.$('.asked'); if (asked) asked.textContent = r.askedTerms.join(' · ');
  return false;
});
