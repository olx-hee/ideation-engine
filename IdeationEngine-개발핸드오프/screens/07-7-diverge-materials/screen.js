/* 7-7 발산 시작 — 재료 */
/* 실서버 모드: 재료를 ice.materials로 그린다 (먼저 보기 묶음은 펼치고, 나머지는 한 줄) */
function renderMaterials(r) {
  const fg = App.$('.fg'), rest = App.$('.rest');
  const tplCard = App.$('.fgc'), tplRow = App.$('.fgc .mrow'), tplPill = App.$('.rest .pill2');
  if (fg && tplCard && tplRow) {
    fg.innerHTML = '';
    (r.focusGroups || []).forEach(g => {
      const el = tplCard.cloneNode(true);
      el.querySelectorAll('.mrow').forEach(x => x.remove());
      el.querySelector('.h').innerHTML = `${App.escape(g.title)}<em>먼저 보기</em>`;
      (g.items || []).forEach(it => {
        const row = tplRow.cloneNode(true);
        row.innerHTML = (it.avoid ? '<span class="avoid">피할 것</span>' : '') + App.escape(it.text);
        el.appendChild(row);
      });
      fg.appendChild(el);
    });
  }
  if (rest && tplPill) {
    rest.innerHTML = '';
    (r.otherGroups || []).forEach(g => {
      const b = document.createElement('b'); b.textContent = g.title; rest.appendChild(b);
      const wrap = document.createElement('div');
      (g.items || []).forEach(it => {
        const pill = tplPill.cloneNode(true);
        pill.innerHTML = (it.avoid ? '<span class="avoid">피할 것</span>' : '') + App.escape(it.text);
        wrap.appendChild(pill);
      });
      rest.appendChild(wrap);
    });
  }
  App.$$('.matpanel b').forEach(b => { if (b.textContent.startsWith('아이스브레이킹에서 모인 재료')) b.textContent = `아이스브레이킹에서 모인 재료 ${r.total}개`; });
}
if (!IE_CONFIG.useMock) api.call('ice.materials').then(renderMaterials).catch(err => App.toast(err.message, 'error'));

App.action('submitIdea', async () => {
  const inp = App.$('.comp-row input');
  const text = inp.value.trim();
  if (!text) { App.toast('아이디어를 입력해 주세요'); inp.focus(); return false; }
  App.save({ draftIdeas: [...(App.state.draftIdeas || []), text].slice(0, 3) });
});
