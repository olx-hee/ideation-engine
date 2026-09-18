/* ─────────────────────────────────────────────
   icebreak-chat.js — 7-1 ~ 7-5 공통 (AI와 1:1 인터뷰 채팅)
   · 보내기 / Enter → ice.send → AI 말풍선 추가
   · 넘어가기 → ice.skip
   · 팀 진행 카드는 실시간 icebreak.progress 로 갱신
   ───────────────────────────────────────────── */
(function () {
  const { $, $$ } = App;
  const msgs = $('.msgs');
  const input = $('.comp input');
  const stepText = $('.ch-n');
  const bar = $('.ch-prog i');

  function scrollDown() { msgs && (msgs.scrollTop = msgs.scrollHeight); }
  function label(text) { const d = document.createElement('div'); d.className = 'blab'; d.textContent = text; msgs.appendChild(d); }
  function bubble(role, style, text) {
    const d = document.createElement('div');
    d.className = 'b ' + (role === 'user' ? 'me' : 'ai') + (style ? ' ' + style : '');
    d.innerHTML = App.rich(text); msgs.appendChild(d); scrollDown(); return d;
  }
  function render(reply) {
    (reply.messages || []).forEach(m => { if (m.label) label(m.label); bubble(m.role, m.style, m.text); });
    if (reply.step) {
      stepText.textContent = reply.done ? '완료' : reply.step + ' / 5';
      bar.style.width = (reply.done ? 100 : reply.step * 20) + '%';
      $$('.side2 .tp').forEach((tp, i) => { tp.classList.toggle('done', i + 1 < reply.step || reply.done); tp.classList.toggle('cur', i + 1 === reply.step && !reply.done); });
    }
    if (reply.done && input) { input.disabled = true; input.placeholder = '인터뷰가 끝났어요'; }
    if (reply.done && App.state.role === 'host') hostLink();
    if (window.IE_CONFIG && IE_CONFIG.useMock && reply.step) {   // 시연(목업): 다음 질문 화면으로 자연스럽게 (실서버는 한 화면에서 이어짐)
      const map = { 2: '07-2-icebreak-q2-news', 3: '07-3-icebreak-q3-change', 4: '07-4-icebreak-q4-services', 5: '07-5-icebreak-q5-wrapup' };
      const want = reply.done ? '07-5-icebreak-q5-wrapup' : map[reply.step];
      if (want && want !== document.body.dataset.screen) setTimeout(() => App.go(App.screen(want)), 1200);
    }
  }
  /* 진행자: 인터뷰가 끝나면 진행자 화면(7-6)으로 가는 링크 말풍선 (한 번만) */
  function hostLink() {
    if (!msgs || msgs.querySelector('.hostlink')) return;
    const a = document.createElement('a'); a.className = 'b ai good hostlink'; a.href = '#'; a.dataset.go = App.screen('07-6-icebreak-host');
    a.textContent = '진행자 화면으로 가서 팀 재료 보기 →'; msgs.appendChild(a); scrollDown();
  }
  App.chat = { bubble, label, render, scrollDown, hostLink };

  /** AI가 답하는 동안 보여줄 "…" 말풍선 */
  function waiting(on) {
    const old = msgs && msgs.querySelector('.b.waiting');
    if (old) old.remove();
    if (!on || !msgs) return;
    const d = document.createElement('div');
    d.className = 'b ai waiting'; d.textContent = '…';
    msgs.appendChild(d); scrollDown();
  }
  App.action('sendMessage', async () => {
    if (!input || input.disabled) return false;
    const text = input.value.trim();
    if (!text) { App.toast('답을 입력해 주세요'); return false; }
    bubble('user', null, text); input.value = '';
    waiting(true);
    try { render(await api.call('ice.send', {}, { text, clientMessageId: 'c_' + Date.now() })); }
    finally { waiting(false); }
    return false;
  });
  App.action('skip', async () => { render(await api.call('ice.skip', {}, {})); return false; });

  input && input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); $('[data-action="sendMessage"]')?.click(); }
  });

  /* 실서버 모드: 화면을 열면 지금까지의 대화와 팀 진행을 서버에서 받아 다시 그린다 (새로고침 · 재접속 대비) */
  function setProgressRow(nickname, step, done) {
    const row = $$('.side2 .tr').find(r => r.firstElementChild.textContent.startsWith(nickname));
    if (row) row.lastElementChild.textContent = done ? '완료' : step + ' / 5';
  }
  async function restore() {
    const st = await App.run(null, () => api.call('ice.state'));
    if (st) {
      msgs.querySelectorAll('.b, .blab').forEach(x => x.remove());   // 말풍선만 지운다 (7-2의 소식 카드는 대화창 안에 있어서 남겨야 함)
      render({ messages: st.messages, step: st.step, done: st.done });
      (st.topics || []).forEach((t, i) => { const tp = $$('.side2 .tp')[i]; if (tp && t) tp.textContent = t; });
    }
    const pr = await App.run(null, () => api.call('ice.progress'));
    if (pr) (pr.items || []).forEach(m => setProgressRow(m.nickname, m.step, m.done));
  }
  if (!IE_CONFIG.useMock) restore();

  realtime.connect(App.sessionId(), (ev) => {
    if (ev.type === 'icebreak.progress') {
      const row = $$('.side2 .tr').find(r => r.firstElementChild.textContent.startsWith(ev.data.nickname));
      if (row) row.lastElementChild.textContent = ev.data.done ? '완료' : ev.data.step + ' / 5';
    }
    if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.write') App.go(App.screen('08-1-idea-write'));
  });
  scrollDown();
})();
