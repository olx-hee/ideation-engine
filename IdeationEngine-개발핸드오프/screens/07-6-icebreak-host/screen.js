/* 7-6 아이스브레이킹 진행자 */
App.$$('.gp').forEach((g, i) => { g.dataset.groupId = g.dataset.groupId || 'grp_' + (i + 1); });

document.addEventListener('ie:focus', (e) => {
  const gp = e.target.closest('.gp');
  api.call('ice.focus', { groupId: gp.dataset.groupId }, { focus: e.detail }).catch(err => App.toast(err.message, 'error'));
});
/* 실서버 모드: 진도 · 소식 반응 · 재료 묶음을 ice.overview로 그린다 */
function renderOverview(r) {
  // 1) 인터뷰 진행
  const prs = App.$$('.pr');
  if (prs.length) {
    const box = prs[0].parentElement;
    const tplDone = prs.find(x => !x.querySelector('.bar')) || prs[0];
    const tplBar = prs.find(x => x.querySelector('.bar')) || prs[0];
    prs.forEach(x => x.remove());
    (r.progress || []).forEach(m => {
      const el = (m.done ? tplDone : tplBar).cloneNode(true);
      el.querySelector('.nm2').textContent = m.nickname + (m.isMe ? ' (나)' : '');
      const st = el.querySelector('.st');
      st.textContent = m.done ? '완료' : `${m.step} / 5`;
      st.classList.toggle('done', !!m.done);
      const bar = el.querySelector('.bar i'); if (bar) bar.style.width = (m.step || 0) * 20 + '%';
      box.appendChild(el);
    });
  }
  // 2) 소식 카드 반응 (인원 수만)
  const rxs = App.$$('.rx');
  if (rxs.length) {
    const box = rxs[0].parentElement, tpl = rxs[0];
    rxs.forEach(x => x.remove());
    (r.newsReactions || []).forEach(c => {
      const el = tpl.cloneNode(true);
      const t = el.querySelector('.rx-t');
      t.innerHTML = `<span class="c">${App.escape(c.category)}</span>${App.escape(c.title)}`;
      const total = Object.values(c.counts || {}).reduce((a, b) => a + b, 0) || 1;
      const bars = el.querySelectorAll('.stack3 i');
      [['s-new', 'new'], ['s-heard', 'heard'], ['s-know', 'know']].forEach(([cls, key], i) => {
        const bar = bars[i]; if (bar) { bar.className = cls; bar.style.width = ((c.counts || {})[key] || 0) * 100 / total + '%'; }
      });
      box.appendChild(el);
    });
  }
  // 3) 재료 묶음
  const gps = App.$$('.gp');
  if (gps.length) {
    const box = gps[0].parentElement, tpl = gps[0];
    const tplRow = tpl.querySelector('.mrow');
    gps.forEach(x => x.remove());
    (r.groups || []).forEach(g => {
      const el = tpl.cloneNode(true);
      el.dataset.groupId = g.groupId;
      el.classList.toggle('on', !!g.focus);
      el.querySelector('.gp-h b').textContent = g.title;
      const ai = el.querySelector('.ai2'); if (ai) ai.hidden = !g.aiPick;
      const tg = el.querySelector('.tg');
      if (tg) { tg.hidden = g.focus === null; tg.classList.toggle('on', !!g.focus); tg.textContent = g.focus ? '먼저 보기 ✓' : '먼저 보기'; }
      const d = el.querySelector('.gp-d'); if (d) d.textContent = g.desc || '';
      el.querySelectorAll('.mrow').forEach(x => x.remove());
      (g.items || []).forEach(it => {
        const row = tplRow.cloneNode(true);
        row.innerHTML = `${App.escape(it.text)}<span class="cnt">${it.count}명</span>`;
        if (it.avoid) row.insertBefore(Object.assign(document.createElement('span'), { className: 'avoid', textContent: '피할 것' }), row.firstChild);
        el.appendChild(row);
      });
      box.appendChild(el);
    });
  }
  // 4) 재료 개수 · 힌트
  App.$$('.hmain p').forEach(p => { if (p.textContent.startsWith('발산 재료')) p.textContent = `발산 재료 ${r.materialCount}개 · 비슷한 것끼리 묶었어요`; });
  const hint = App.$$('.sc2 p').find(p => p.textContent.includes('발산 때') || p.textContent.includes('있어요'));
  if (hint && r.hint) hint.textContent = r.hint;
}
/* 재료 묶기(LLM)는 몇 초 걸린다 — 그동안 HTML의 디자인 예시(노형원·온디바이스 AI…)가 실데이터처럼 보이지 않게
   8-5·9-1과 같은 안내를 띄우고, 응답이 오면 걷는다. */
function pending(on) {
  App.$('.tdim')?.remove();
  if (!on) return;
  const dim = document.createElement('div'); dim.className = 'tdim';
  dim.innerHTML = '<div class="tdlg" style="text-align:center"><div class="avatar" style="width:72px;height:72px;font-size:var(--fs-h1);margin:0 auto 14px">AI</div><h3>재료를 묶는 중이에요</h3><p>팀원들의 인터뷰 답을 발산 재료로 정리하고 있어요</p><p class="quiet">몇 초면 끝나요</p></div>';
  (App.$('.board') || document.body).appendChild(dim);
}
if (!IE_CONFIG.useMock) pending(true);
let lastOverview = null;   // 다시 묶기 응답엔 progress·newsReactions가 없어서, 지워버리지 않고 마지막 값을 이어 쓴다
async function load() {
  let r;
  try { r = await api.call('ice.overview'); }
  catch (e) {
    pending(false);
    if (e.code === 'FORBIDDEN') { App.go(App.screen('07-1-icebreak-q1-discomfort')); return; }   // 참가자가 잘못 들어온 경우
    throw e;
  }
  if (r) { lastOverview = r; renderOverview(r); }
  pending(false);
}
if (!IE_CONFIG.useMock) App.run(null, load);

App.action('regroup', async () => {
  const r = await api.call('ice.regroup', {}, {});
  if (!IE_CONFIG.useMock) { lastOverview = Object.assign({}, lastOverview, r); renderOverview(lastOverview); }
  App.toast('재료를 다시 묶었어요');
  return false;
});
App.action('prevStage', async () => { await api.call('session.back', {}, { from: 'icebreak' }); App.toast('이전 단계로 돌아갔어요'); return false; });
App.action('nextStage', async () => { await api.call('session.advance', {}, { from: 'icebreak' }); });

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'icebreak.progress') {
    const row = App.$$('.pr').find(r => r.querySelector('.nm2').textContent.startsWith(ev.data.nickname));
    if (row && ev.data.done) { row.querySelector('.bar')?.remove(); const st = row.querySelector('.st'); st.textContent = '완료'; st.classList.add('done'); }
    else if (row) { const bar = row.querySelector('.bar i'); if (bar) bar.style.width = ev.data.step * 20 + '%'; row.querySelector('.st').textContent = ev.data.step + ' / 5'; }
  }
  if (ev.type === 'icebreak.groups.updated') App.toast(`새 재료 ${ev.data.newMaterials}개가 들어왔어요 · "다시 묶기"로 반영해요`);
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.write') App.go(App.screen('07-7-diverge-materials'));
});
