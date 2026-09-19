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
    // 채팅 안 링크 하나만 띄우면 놓치기 쉬워서(스크롤 안 하거나, 여러 명이 같이 테스트하다 못 봄)
    // "다 됐는데 페이지가 안 넘어간다"로 보였다 — 진행자는 몇 초 뒤 자동으로 진행자 화면으로 보낸다.
    if (reply.done && App.state.role === 'host') { hostLink(); setTimeout(() => App.go(App.screen('07-6-icebreak-host')), 1500); }
    if (window.IE_CONFIG && IE_CONFIG.useMock && reply.step) {   // 시연(목업): 다음 질문 화면으로 자연스럽게 (실서버는 한 화면에서 이어짐)
      const map = { 2: '07-2-icebreak-q2-news', 3: '07-3-icebreak-q3-change', 4: '07-4-icebreak-q4-services', 5: '07-5-icebreak-q5-wrapup' };
      const want = reply.done ? '07-5-icebreak-q5-wrapup' : map[reply.step];
      if (want && want !== document.body.dataset.screen) setTimeout(() => App.go(App.screen(want)), 1200);
    }
    checkNewsIfPastQ1(reply.step);
    maybeGoToNews();
  }
  /* 진행자: 인터뷰가 끝나면 진행자 화면(7-6)으로 가는 링크 말풍선 (한 번만) */
  function hostLink() {
    if (!msgs || msgs.querySelector('.hostlink')) return;
    const a = document.createElement('a'); a.className = 'b ai good hostlink'; a.href = '#'; a.dataset.go = App.screen('07-6-icebreak-host');
    a.textContent = '진행자 화면으로 가서 팀 재료 보기 →'; msgs.appendChild(a); scrollDown();
  }

  /* 7-1 → 7-2: icebreak.news.ready (실시간, 문서 이벤트 표) — 답을 쓰는 중이면 보내고 나서 넘어가도록 미룬다.
     세션당 한 번만 오는 이벤트라, 그 전에 이미 질문 2까지 넘어간 사람(새로고침 포함)은 이 이벤트를 못 받는다 —
     그 경우엔 ice.news의 ready로 직접 확인한다(문서 "프론트 남은 일"). */
  let newsReady = false, newsChecked = false;
  function isQ1Screen() { return document.body.dataset.screen === '07-1-icebreak-q1-discomfort'; }
  function maybeGoToNews() {
    if (!newsReady || !isQ1Screen()) return;
    if (input && input.value.trim()) return;   // 입력 중인 답은 날리지 않는다
    newsReady = false;
    App.go(App.screen('07-2-icebreak-q2-news'));
  }
  async function checkNewsIfPastQ1(step) {
    if (newsReady || newsChecked || !isQ1Screen() || !step || step < 2) return;
    newsChecked = true;
    try { const r = await api.call('ice.news'); if (r && r.ready && (r.cards || []).length) { newsReady = true; maybeGoToNews(); } }
    catch (e) { newsChecked = false; }
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
  input && input.addEventListener('input', () => { if (!input.value.trim()) maybeGoToNews(); });

  /* 실서버 모드: 화면을 열면 지금까지의 대화와 팀 진행을 서버에서 받아 다시 그린다 (새로고침 · 재접속 대비).
     "팀 진행" 줄은 예시 4명(노형원·이세민·김승희·박상진)이 HTML에 그대로 박혀 있어서, 실제 참가자
     이름·인원이 다르면 하나도 안 맞아 그대로 남아 있었다 — 응답으로 통째로 새로 그린다. */
  function progressContainer() {
    return $('.side2 .tr') && $('.side2 .tr').parentElement;
  }
  function renderProgress(items) {
    const box = progressContainer();
    if (!box) return;
    box.querySelectorAll('.tr').forEach((el) => el.remove());
    items.forEach((m) => {
      const row = document.createElement('div'); row.className = 'tr';
      const name = document.createElement('span'); name.textContent = m.nickname + (m.isMe ? ' (나)' : '');
      const status = document.createElement('span'); status.textContent = m.done ? '완료' : m.step + ' / 5';
      row.append(name, status); box.appendChild(row);
    });
  }
  function patchProgressRow(nickname, step, done) {
    const box = progressContainer();
    if (!box) return;
    const row = $$('.side2 .tr').find((r) => r.firstElementChild.textContent.replace(/\s*\(나\)$/, '') === nickname);
    if (row) { row.lastElementChild.textContent = done ? '완료' : step + ' / 5'; return; }
    const created = document.createElement('div'); created.className = 'tr';
    const name = document.createElement('span'); name.textContent = nickname;
    const status = document.createElement('span'); status.textContent = done ? '완료' : step + ' / 5';
    created.append(name, status); box.appendChild(created);
  }
  /* restore()가 ice.state → ice.progress 두 번 오가는 동안 icebreak.progress 실시간 이벤트가 먼저 도착하면,
     아직 예시 4명 줄인 상태라 패치가 엉뚱한 곳에 붙거나(또는 안 붙거나) 뒤이은 renderProgress()의 스냅샷이
     그 패치보다 먼저 뜬 응답이라서 방금 온 갱신을 덮어써 버릴 수 있다 — restore가 끝날 때까지는 모아뒀다가
     renderProgress 직후에 다시 적용해서, 늦게 온 사람 줄이 비거나 최신 상태가 씹히지 않게 한다. */
  let restored = false;
  const pendingProgress = [];
  async function restore() {
    const st = await App.run(null, () => api.call('ice.state'));
    if (st) {
      msgs.querySelectorAll('.b, .blab').forEach(x => x.remove());   // 말풍선만 지운다 (7-2의 소식 카드는 대화창 안에 있어서 남겨야 함)
      render({ messages: st.messages, step: st.step, done: st.done });
      (st.topics || []).forEach((t, i) => {   // tp.textContent = t 로 통째로 바꾸면 번호 배지(<i>)까지 지워져서, 배지는 남기고 글자만 바꾼다
        const tp = $$('.side2 .tp')[i]; if (!tp || !t) return;
        const badge = tp.querySelector('i');
        tp.textContent = ''; if (badge) tp.appendChild(badge);
        tp.appendChild(document.createTextNode(t));
      });
    }
    const pr = await App.run(null, () => api.call('ice.progress'));
    if (pr) renderProgress(pr.items || []);
    restored = true;
    pendingProgress.splice(0).forEach((d) => patchProgressRow(d.nickname, d.step, d.done));
  }
  if (!IE_CONFIG.useMock) restore(); else restored = true;

  realtime.connect(App.sessionId(), (ev) => {
    if (ev.type === 'icebreak.progress') {
      if (restored) patchProgressRow(ev.data.nickname, ev.data.step, ev.data.done);
      else pendingProgress.push(ev.data);
    }
    if (ev.type === 'icebreak.news.ready') { newsReady = true; maybeGoToNews(); }
    if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.write') App.go(App.screen('08-1-idea-write'));
  });
  scrollDown();
})();
