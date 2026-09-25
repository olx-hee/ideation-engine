/* 7-6 아이스브레이킹 진행자 */
App.$$('.gp').forEach((g, i) => { g.dataset.groupId = g.dataset.groupId || 'grp_' + (i + 1); });

document.addEventListener('ie:focus', (e) => {
  const gp = e.target.closest('.gp');
  api.call('ice.focus', { groupId: gp.dataset.groupId }, { focus: e.detail }).catch(err => {
    if (goNextIfClosed(err)) return;
    App.toast(err.message, 'error');
    // 서버에 반영되지 않았으면 표시를 되돌린다 — 켜진 채로 남으면 7-7(먼저 보기 묶음)과 달라 보였다
    const tg = gp.querySelector('.tg');
    if (tg) { tg.classList.toggle('on', !e.detail); tg.textContent = !e.detail ? '먼저 보기 ✓' : '먼저 보기'; }
    gp.classList.toggle('on', !e.detail);
  });
});
/* 진도 줄 템플릿(완료용 · 막대용)은 첫 렌더에서 원본 줄이 사라지므로 한 번만 붙잡아 둔다 —
   실시간 이벤트로 목록을 여러 번 다시 그리는데, 매번 화면에 남은 줄에서 템플릿을 찾으면
   전원이 "완료"가 된 뒤엔 막대 줄이 없어서 늦게 들어온 사람 줄이 깨졌다. */
let prTpl = null;
function progressTpl() {
  if (prTpl) return prTpl;
  const prs = App.$$('.pr');
  if (!prs.length) return null;
  prTpl = {
    box: prs[0].parentElement,
    done: (prs.find(x => !x.querySelector('.bar')) || prs[0]).cloneNode(true),
    bar: (prs.find(x => x.querySelector('.bar')) || prs[0]).cloneNode(true),
  };
  return prTpl;
}
function renderProgress(items) {
  const t = progressTpl();
  if (!t) return;
  t.box.querySelectorAll('.pr').forEach(x => x.remove());
  (items || []).forEach(m => {
    const el = (m.done ? t.done : t.bar).cloneNode(true);
    el.querySelector('.nm2').textContent = m.nickname + (m.isMe ? ' (나)' : '');
    const st = el.querySelector('.st');
    st.textContent = m.done ? '완료' : `${m.step} / 5`;
    st.classList.toggle('done', !!m.done);
    const bar = el.querySelector('.bar i'); if (bar) bar.style.width = (m.step || 0) * 20 + '%';
    t.box.appendChild(el);
  });
}
/* 재료 묶음 카드 템플릿도 한 번만 붙잡아 둔다 — 묶음이 0개로 한 번 그려지면(아무도 안 끝난 상태)
   화면에 .gp가 남지 않아서, 뒤늦게 재료가 들어와 다시 그릴 때 그릴 틀이 없었다. */
let gpTpl = null;
function groupTpl() {
  if (gpTpl) return gpTpl;
  const gps = App.$$('.gp');
  if (!gps.length) return null;
  const card = gps[0].cloneNode(true);
  gpTpl = { box: gps[0].parentElement, card, row: card.querySelector('.mrow') };
  return gpTpl;
}
/* 실서버 모드: 진도 · 소식 반응 · 재료 묶음을 ice.overview로 그린다 */
function renderOverview(r) {
  // 1) 인터뷰 진행
  renderProgress(r.progress);
  // 2) 소식 카드 반응 (인원 수만)
  const rxs = App.$$('.rx');
  if (rxs.length) {
    const box = rxs[0].parentElement, tpl = rxs[0];
    rxs.forEach(x => x.remove());
    box.querySelectorAll('.js-empty').forEach(x => x.remove());
    // 검색이 안 된 세션은 카드가 없다 — 막대만 사라져서 "집계가 안 되는 건가?"로 보였다
    if (!(r.newsReactions || []).length) {
      box.insertAdjacentHTML('beforeend', '<p class="quiet js-empty">이 세션은 최근 소식을 찾지 못해 소식 카드가 없어요.</p>');
    }
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
  const gt = groupTpl();
  if (gt) {
    const box = gt.box, tpl = gt.card, tplRow = gt.row;
    box.querySelectorAll('.gp').forEach(x => x.remove());
    box.querySelectorAll('.js-empty').forEach(x => x.remove());
    // 아직 인터뷰를 끝낸 사람이 없으면 묶음이 0개다 — 빈 화면처럼 보이지 않게 지금 상태를 적는다
    if (!(r.groups || []).length) {
      box.insertAdjacentHTML('beforeend', r.materialCount
        ? '<p class="hint js-empty">재료는 모였는데 아직 묶지 않았어요. "다시 묶기"를 눌러 주세요.</p>'
        : '<p class="hint js-empty">아직 인터뷰를 끝낸 사람이 없어요. 한 명이라도 끝나면 재료가 여기에 묶여요 — 기다리거나 바로 발산을 시작할 수 있어요.</p>');
    }
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
  const hint = App.$$('.sc2 p').find(p => p.dataset.hint || p.textContent.includes('발산 때'));
  // 힌트가 없는 세션에서 예시 문장("온디바이스 AI를 잘 아는 사람이 1명…")을 그대로 두면 실데이터로 읽힌다
  if (hint) { hint.dataset.hint = '1'; hint.textContent = r.hint || ''; hint.hidden = !r.hint; }
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
let lastOverview = null;   // 마지막 요약 — 실시간 진도 이벤트를 이 목록 위에 얹어서 다시 그린다
let loaded = IE_CONFIG.useMock;
const queuedProgress = [];   // ice.overview 응답을 기다리는 동안 온 진도 이벤트 (스냅샷이 덮어쓰지 않게 뒤에 다시 적용)
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
  loaded = true;
  queuedProgress.splice(0).forEach(applyProgress);
}
if (!IE_CONFIG.useMock) App.run(null, load);

/* 진도는 서버 목록을 통째로 다시 그린다 — 닉네임이 같은 줄만 찾아 고치던 방식에서는 늦게 들어온
   사람(HTML 예시에도, 첫 ice.overview 응답에도 줄이 없는 사람)의 이벤트가 그냥 버려졌다. */
function applyProgress(d) {
  const list = ((lastOverview && lastOverview.progress) || []).slice();
  const i = list.findIndex(p => p.nickname === d.nickname);
  const row = { nickname: d.nickname, step: d.step, done: d.done, isMe: i >= 0 ? list[i].isMe : undefined };
  if (i >= 0) list[i] = row; else list.push(row);
  lastOverview = Object.assign({}, lastOverview, { progress: list });
  renderProgress(list);
}

/* 들어오거나 내보내진 사람은 icebreak.progress가 따로 오지 않고, participant.joined/kicked 이벤트엔
   닉네임이 없어 줄을 만들거나 지울 수 없다 — 목록을 다시 받아 통째로 맞춘다. */
async function refreshProgress() {
  if (!loaded || IE_CONFIG.useMock) return;
  const pr = await App.run(null, () => api.call('ice.progress'));
  if (!pr) return;
  lastOverview = Object.assign({}, lastOverview, { progress: pr.items || [] });
  renderProgress(pr.items || []);
}

/* "다시 묶기" 전/후가 헷갈리지 않게, 아직 반영 안 된 새 재료 수를 버튼에 붙여 둔다 */
let pendingNew = 0;
function showPendingNew() {
  const btn = App.$('[data-action="regroup"]');
  if (btn) btn.textContent = pendingNew ? `다시 묶기 (새 재료 ${pendingNew}개)` : '다시 묶기';
}

/** 발산이 이미 시작된 뒤 누른 경우 — app.js 공통 처리는 8-1로 보내지만 진행자 화면은 7-7이다 */
function goNextIfClosed(e) {
  if (e.code !== 'STAGE_CLOSED') return false;
  App.toast('발산이 시작돼 재료가 확정됐어요');
  App.go(App.screen('07-7-diverge-materials'));
  return true;
}

App.action('regroup', async () => {
  try { await api.call('ice.regroup', {}, {}); }
  catch (e) { if (goNextIfClosed(e)) return false; throw e; }
  pendingNew = 0; showPendingNew();
  App.toast('재료를 다시 묶었어요');
  // 다시 묶기 응답엔 재료 개수·진도가 없어서, 예전엔 마지막 값을 이어 써 개수가 옛 숫자로 남았다 —
  // 묶음은 이미 만들어졌으니(AI 재호출 없음) 요약을 한 번 다시 받아 전체를 최신으로 맞춘다.
  if (!IE_CONFIG.useMock) await load();
  return false;
});
App.action('prevStage', async () => { await api.call('session.back', {}, { from: 'icebreak' }); App.toast('이전 단계로 돌아갔어요'); return false; });
App.action('nextStage', async () => {
  try { await api.call('session.advance', {}, { from: 'icebreak' }); }
  catch (e) { if (goNextIfClosed(e)) return false; throw e; }
});

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'icebreak.progress') {
    if (loaded) applyProgress(ev.data); else queuedProgress.push(ev.data);
  }
  if (ev.type === 'participant.joined' || ev.type === 'participant.kicked') refreshProgress();
  if (ev.type === 'icebreak.groups.updated') {
    App.toast(`새 재료 ${ev.data.newMaterials}개가 들어왔어요 · "다시 묶기"로 반영해요`);
    // 아직 묶음이 하나도 없으면(아무도 안 끝난 상태로 이 화면을 열었을 때) 첫 재료가 들어온 지금 바로
    // 채워준다 — 그러지 않으면 빈 목록이 "다시 묶기"를 누를 때까지 그대로 남는다.
    if (loaded && !App.$$('.gp').length) { pendingNew = 0; App.run(null, load); }
    else pendingNew += ev.data.newMaterials;
    showPendingNew();
  }
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.write') App.go(App.screen('07-7-diverge-materials'));
});
