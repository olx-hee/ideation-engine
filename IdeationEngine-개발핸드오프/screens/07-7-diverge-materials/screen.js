/* 7-7 발산 시작 — 재료 */
/* 이 화면은 진행자 것이다. 참가자가 URL로 들어오면 자기 화면(8-1)으로 보낸다 —
   data-stage가 diverge.write라서 app.js의 syncStage는 "맞는 단계"로 보고 옮겨주지 않는다.
   역할을 아직 모르면(캐시 없음) 건드리지 않는다 — 재료 패널 자체는 8-1과 같은 내용이라 해롭지 않다. */
if (!IE_CONFIG.useMock && App.state.role && App.state.role !== 'host') App.go(App.screen('08-1-idea-write'));

/* 실서버 모드: 재료를 ice.materials로 그린다 (먼저 보기 묶음은 펼치고, 나머지는 한 줄) */
function renderMaterials(r) {
  const fg = App.$('.fg'), rest = App.$('.rest');
  const tplCard = App.$('.fgc'), tplRow = App.$('.fgc .mrow'), tplPill = App.$('.rest .pill2');
  // 재료가 0개일 수 있다(아무도 인터뷰를 못 끝냈거나 AI가 재료를 못 뽑은 경우) — 예시를 지운 빈 패널이
  // "불러오는 중"처럼 보이지 않게 지금 상태를 적는다. 발산 자체는 재료 없이도 진행된다.
  const empty = !(r.focusGroups || []).length && !(r.otherGroups || []).length;
  if (fg && tplCard && tplRow) {
    fg.innerHTML = '';
    if (empty) fg.innerHTML = '<p class="hint">아이스브레이킹에서 모인 재료가 없어요. 재료 없이 바로 아이디어를 적어도 괜찮아요.</p>';
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
if (!IE_CONFIG.useMock) api.call('ice.materials').then(renderMaterials).catch(err => {
  App.toast(err.message, 'error');
  // 못 불러왔을 때 HTML 예시 재료를 그대로 두면 팀 재료처럼 읽힌다
  const fg = App.$('.fg'); if (fg) fg.innerHTML = '<p class="hint">재료를 불러오지 못했어요. 새로고침하면 다시 불러와요.</p>';
  const rest = App.$('.rest'); if (rest) rest.innerHTML = '';
});

App.action('submitIdea', async () => {
  const inp = App.$('.comp-row input');
  const text = inp.value.trim();
  if (!text) { App.toast('아이디어를 입력해 주세요'); inp.focus(); return false; }
  App.save({ draftIdeas: [...(App.state.draftIdeas || []), text].slice(0, 3) });
});
