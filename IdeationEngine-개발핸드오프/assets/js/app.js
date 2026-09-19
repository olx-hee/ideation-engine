/* ─────────────────────────────────────────────
   app.js — 모든 화면이 같이 쓰는 동작
   · 화면 맞춤(zoom) · 버튼 이동(data-go) · 액션(data-action) · 토스트
   · 칩/스킬/토글/체크박스/스테퍼/레일 접기/라디오 등 공통 컴포넌트
   · 개발용 화면 이동 바
   화면별 동작은 각 screens/<화면>/screen.js 에서 App.action('이름', fn) 으로 등록
   ───────────────────────────────────────────── */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const cfg = window.IE_CONFIG || {};

  const App = window.App = {
    $, $$,
    actions: {},
    state: loadState(),
    /** 액션 등록: 버튼에 data-action="name" 이 있으면 클릭 시 실행. false를 돌려주면 data-go 이동을 취소 */
    action(name, fn) { this.actions[name] = fn; },
    /** 지금 보고 있는 화면으로의 이동은 무시한다 — 서버가 WebSocket 연결 직후 보내는 stage.changed(현재 단계 동기화)를
        받고 "그 단계의 화면"으로 가면 자기 자신이라 무한 새로고침이 됐다(8-6 · 9-1). 단, 그 사이에 다른 세션을
        만들거나 들어갔으면(sessionId가 바뀌었으면) 화면 경로가 같아도 실제로는 다른 세션이라 이동해야 한다
        — 안 그러면 새 세션을 만들어도 예전 세션 화면에 갇힌 것처럼 보인다. */
    go(href) {
      try {
        const samePage = new URL(href, location.href).href === location.href;
        const sameSession = this.state.sessionId === bootSessionId;
        if (samePage && sameSession) return;
      } catch (e) { /* 이상한 href면 그냥 이동 */ }
      location.href = href;
    },
    screen(key) { return '../' + key + '/index.html'; },
    /** 상태 저장. 로그인 유지(remember)면 localStorage(브라우저를 닫아도 남음), 아니면 sessionStorage(탭을 닫으면 사라짐) */
    save(patch) {
      Object.assign(this.state, patch);
      try {
        const v = JSON.stringify(this.state);
        if (this.state.remember) { localStorage.setItem('ie.state', v); sessionStorage.removeItem('ie.state'); }
        else { sessionStorage.setItem('ie.state', v); localStorage.removeItem('ie.state'); }
      } catch (e) {}
    },
    /** 이 브라우저의 로그인·세션 정보 지우기 (서버 로그아웃은 api.call('auth.logout')) */
    logoutLocal() { this.save({ accessToken: null, user: null, sessionId: null, role: null, participantId: null, code: null, inviteUrl: null, isLeader: false }); },
    /** 로그인·가입·소셜 로그인 성공 공통 — 이전 사람의 세션 정보(sessionId·역할·방 코드·로그인 유지)가
        같은 브라우저에 남아 새 계정에 섞이지 않게, 세션 관련 값은 전부 비우고 시작한다. */
    setLogin(r, remember) {
      this.save({ remember: !!remember, accessToken: r.accessToken, user: r.user,
        sessionId: null, role: null, participantId: null, code: null, inviteUrl: null, isLeader: false });
    },
    /** 소셜 로그인 시작 — Google 동의 화면으로 이동. state를 세션에 저장해두고 A6(콜백)에서 대조한다.
        redirect_uri는 항상 이 사이트의 /oauth/callback — Google Cloud Console에 등록한 값과 정확히 같아야 한다. */
    startOAuth(provider) {
      if (provider !== 'google') { this.toast('카카오 로그인은 아직 준비 중이에요'); return; }
      if (!cfg.googleClientId) { this.toast('Google 로그인이 아직 설정되지 않았어요'); return; }
      const state = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
      sessionStorage.setItem('ie.oauth.state', state);
      sessionStorage.setItem('ie.oauth.provider', provider);
      const params = new URLSearchParams({
        client_id: cfg.googleClientId,
        redirect_uri: location.origin + '/oauth/callback',
        response_type: 'code',
        scope: 'openid email profile',
        state,
        prompt: 'select_account',
      });
      location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
    },
    /** 로그인 안 했으면 로그인 화면으로 보내고 false. returnTo = 로그인 후 돌아올 곳 (예: '../04-session-create/index.html') */
    requireLogin(returnTo) {
      if (this.state.accessToken) return true;
      const back = returnTo || ('../' + document.body.dataset.screen + '/index.html' + location.search);
      this.go(this.screen('A1-login') + '?returnTo=' + encodeURIComponent(back));
      return false;
    },
    /** 주소의 ?returnTo= 값 (다른 사이트로 튀지 않게 우리 화면 경로만 허용) */
    returnTo(fallback) {
      const v = new URLSearchParams(location.search).get('returnTo');
      return v && /^\.\.\/[\w-]+\/index\.html(\?[\w=&%.-]*)?$/.test(v) ? v : fallback;
    },
    withReturnTo(href) { const v = new URLSearchParams(location.search).get('returnTo'); return v ? href + '?returnTo=' + encodeURIComponent(v) : href; },
    /** 서버의 세션 단계(stage.id) → 있어야 할 화면 key (재접속·새로고침 때 사용) */
    stageScreen(stage, role, isLeader) {
      const host = role === 'host';
      const leader = isLeader != null ? isLeader : this.state.isLeader;
      return ({
        lobby: host ? '05-lobby-host' : '06-lobby-participant',
        icebreak: '07-1-icebreak-q1-discomfort',   // 진행자도 참가자와 똑같이 인터뷰 → 끝나면 7-6으로 (2026-09-18 결정)
        'diverge.write': '08-1-idea-write', 'diverge.board': '08-3-idea-board', 'diverge.comment': '08-4-idea-comments',
        'diverge.review': '08-5-ai-review', 'diverge.vote': '08-6-vote', 'diverge.result': '08-7-vote-result-host',
        'team.split': '09-1-part-split', 'team.questions': '09-1-part-split',
        'team.assign': leader ? '09-4-leader-confirm' : '09-3-assign-draft', report: '09-5-report',
      })[stage && stage.id] || null;
    },
    sessionId() { return this.state.sessionId || 'ses_7K2X9'; },
    escape(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    /** **굵게** 표시만 허용하는 안전한 텍스트 → HTML */
    rich(s) { return this.escape(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); },
    text(el) { return (el?.textContent || '').replace(/^✓\s*/, '').trim(); },
    toast(msg, type) {
      let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
      const t = document.createElement('div'); t.className = 'toast' + (type ? ' ' + type : ''); t.textContent = msg; box.appendChild(t);
      setTimeout(() => t.remove(), 2600);
    },
    async copy(text) {
      try { await navigator.clipboard.writeText(text); this.toast('복사했어요'); }
      catch (e) { this.toast('복사하지 못했어요. 직접 선택해서 복사해 주세요', 'error'); }
    },
    /** 버튼 로딩 상태 + 에러 토스트를 한 번에 */
    async run(el, fn) {
      el && el.classList.add('is-loading');
      try { return await fn(); }
      catch (err) {
        console.error(err);
        if (err && (err.code === 'UNAUTHORIZED' || err.code === 'REFRESH_INVALID')) { this.logoutLocal(); this.requireLogin(); return false; }
        if (err && (err.code === 'NOT_PARTICIPANT' || err.code === 'KICKED')) { this.toast(err.message); this.go(this.screen('02-join-code')); return false; }
        // STAGE_CLOSED · STAGE_LOCKED — 이 화면이 알던 단계는 이미 지났다(다른 사람이 다 끝냈거나
        // 진행자가 넘김). 화면이 stage.changed 이벤트를 놓쳤을 때(웹소켓 재연결 틈 등) 여기로 온다.
        // 에러만 띄우면 이 화면에 계속 갇혀서 뭘 눌러도 계속 같은 에러만 나므로, 진짜 단계를 물어서
        // 맞는 화면으로 옮겨준다 (08-6 "투표 마치기"가 이미 다음 단계로 넘어간 뒤 실패하던 문제).
        if (err && (err.code === 'STAGE_CLOSED' || err.code === 'STAGE_LOCKED')) {
          try {
            const s = await api.call('session.get');
            const want = this.stageScreen(s.stage, s.me.role, s.me.isLeader);
            if (want) { this.toast('이미 다음 단계로 넘어갔어요. 화면을 옮길게요'); this.go(this.screen(want)); return false; }
          } catch (e) { /* 조회도 실패하면 아래 일반 에러 처리로 넘어간다 */ }
        }
        // VALIDATION은 message가 "입력값을 다시 확인해 주세요"처럼 뭉뚱그려 와서, 실제 이유는
        // details.fields(예: {password: "비밀번호는 8자 이상이어야 해요"})에 있다 — 그걸 보여준다.
        const fieldMsg = err && err.details && err.details.fields && Object.values(err.details.fields)[0];
        this.toast(fieldMsg || (err && err.message) || '문제가 생겼어요. 잠시 후 다시 시도해 주세요', 'error');
        return false;
      } finally { el && el.classList.remove('is-loading'); }
    },
  };
  const bootSessionId = App.state.sessionId;   // 이 페이지가 로드될 때의 세션 — go()가 세션이 바뀌었는지 비교하는 기준

  function loadState() {
    try { return JSON.parse(localStorage.getItem('ie.state') || sessionStorage.getItem('ie.state')) || {}; } catch (e) { return {}; }
  }

  /* ── 화면 맞춤: 1280×800 보드를 창에 맞게 ── */
  function fit() {
    const b = $('.board'); if (!b) return;
    const z = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
    b.style.zoom = z.toFixed(4);
  }
  window.addEventListener('resize', fit);

  /* ── 이동 · 액션 ── */
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action],[data-go]');
    if (!el || el.classList.contains('disabled') || el.disabled) return;
    e.preventDefault();
    const name = el.dataset.action;
    if (name) {
      const fn = App.actions[name];
      if (fn) { const r = await App.run(el, () => fn(el, e)); if (r === false) return; }
      else if (!el.dataset.go) { App.toast('아직 연결 안 된 동작이에요: ' + name); return; }
    }
    if (el.dataset.go) App.go(el.dataset.go);
  });

  /* ── 공통 컴포넌트 동작 ── */
  function single(x, sel) { $$(':scope > ' + sel, x.parentElement).forEach(c => c.classList.toggle('on', c === x)); }
  function emit(el, name, detail) { el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail })); }

  document.addEventListener('click', (e) => {
    const t = e.target; let x;
    if (t.closest('[data-action],[data-go]')) return;

    if ((x = t.closest('.chip.lock'))) { App.toast('Pro 전용이에요. 계정 설정에서 업그레이드할 수 있어요'); return; }
    if ((x = t.closest('.chips .chip')) && !x.closest('[data-multi]')) { single(x, '.chip'); emit(x, 'ie:chip', App.text(x)); return; }
    if ((x = t.closest('.grp .sk'))) {           // 스킬: 여러 개 선택
      const on = !x.classList.contains('on'); x.classList.toggle('on', on);
      x.textContent = (on ? '✓ ' : '') + App.text(x); emit(x, 'ie:skill', { on }); return;
    }
    if ((x = t.closest('.toggle'))) { x.classList.toggle('on'); emit(x, 'ie:toggle', x.classList.contains('on')); return; }
    if ((x = t.closest('.terms .check'))) {      // 약관: 전체 동의 연동
      const terms = x.closest('.terms'); const boxes = $$('.check:not(.all) .box', terms); const all = $('.check.all .box', terms);
      if (x.classList.contains('all')) { const on = !all.classList.contains('on'); [all, ...boxes].forEach(b => { b.classList.toggle('on', on); b.textContent = on ? '✓' : ''; }); }
      else { const b = $('.box', x); const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.textContent = on ? '✓' : ''; const every = boxes.every(b => b.classList.contains('on')); all.classList.toggle('on', every); all.textContent = every ? '✓' : ''; }
      return;
    }
    if ((x = t.closest('.check'))) { const b = $('.box', x); const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.textContent = on ? '✓' : ''; return; }
    if ((x = t.closest('.rbs .rb'))) { single(x, '.rb'); emit(x, 'ie:reaction', App.text(x)); return; }
    if ((x = t.closest('.rbtn'))) { single(x, '.rbtn'); emit(x, 'ie:reaction', App.text(x)); return; }
    if ((x = t.closest('.gp-h .tg'))) { const on = !x.classList.contains('on'); x.classList.toggle('on', on); x.textContent = on ? '먼저 보기 ✓' : '먼저 보기'; x.closest('.gp').classList.toggle('on', on); emit(x, 'ie:focus', on); return; }
    if ((x = t.closest('.railbtn'))) {           // 왼쪽 목록 접기/펼치기
      const g = x.closest('.focusgrid'); const closed = g.classList.toggle('closed');
      const rail = $('.rail', g); if (rail) rail.hidden = closed;
      x.textContent = closed ? '» 목록' : '«'; x.title = closed ? '목록 열기' : '목록 접기'; return;
    }
    if ((x = t.closest('.stepper span'))) {      // 인원 − / +
      const st = x.closest('.stepper'); const b = $('b', st); const min = +st.dataset.min || 2, max = +st.dataset.max || 8;
      const n = Math.max(min, Math.min(max, (+b.textContent) + (x === st.firstElementChild ? -1 : 1)));
      b.textContent = n; emit(st, 'ie:stepper', n); return;
    }
    if ((x = t.closest('.arw span'))) {          // 8-1 순위 위/아래
      if (x.classList.contains('off')) return;
      const rows = $$('.rrow'); const row = x.closest('.rrow'); const i = rows.indexOf(row); const j = x === x.parentElement.firstElementChild ? i - 1 : i + 1;
      if (j < 0 || j >= rows.length) return;
      const a = $('.rin', rows[i]), c = $('.rin', rows[j]); [a.value, c.value] = [c.value, a.value]; return;
    }
    if ((x = t.closest('.hint2'))) { const inp = $('.comp input'); if (inp) { inp.value = App.text(x) + ' — '; inp.focus(); } return; }
    if ((x = t.closest('.res7'))) {              // 8-7 확정할 주제 고르기
      $$('.res7').forEach(r => $('.radio', r).classList.toggle('on', r === x)); emit(x, 'ie:pick', x); return;
    }
    if ((x = t.closest('.rail .ri')) && !t.closest('.cb')) { $$('.ri', x.closest('.rail')).forEach(r => r.classList.toggle('on', r === x)); emit(x, 'ie:select', x); return; }
    if ((x = t.closest('.pbtn'))) {              // 프로필 팝오버 열기/닫기
      const pop = $('.pop'); if (!pop) return;
      const open = pop.hidden; pop.hidden = !open; x.classList.toggle('open', open); $('.center')?.classList.toggle('dim', open); return;
    }
    const pop = $('.pop'); if (pop && !pop.hidden && !t.closest('.pop')) { pop.hidden = true; $('.pbtn')?.classList.remove('open'); $('.center')?.classList.remove('dim'); }
  });

  /* ── 방 코드 칸: 한 글자씩 자동 이동 ── */
  document.addEventListener('input', (e) => {
    const inp = e.target.closest('.codebox input'); if (!inp) return;
    inp.value = inp.value.replace(/[^0-9a-z]/gi, '').slice(-1).toUpperCase();
    inp.classList.toggle('f', !!inp.value);
    if (inp.value && inp.nextElementSibling) inp.nextElementSibling.focus();
  });
  document.addEventListener('keydown', (e) => {
    const inp = e.target.closest('.codebox input');
    if (inp && e.key === 'Backspace' && !inp.value && inp.previousElementSibling) inp.previousElementSibling.focus();
  });
  document.addEventListener('paste', (e) => {
    const inp = e.target.closest('.codebox input'); if (!inp) return;
    const txt = (e.clipboardData.getData('text') || '').replace(/[^0-9a-z]/gi, '').toUpperCase(); if (!txt) return;
    e.preventDefault(); const all = $$('.codebox input'); txt.split('').slice(0, all.length).forEach((c, i) => { all[i].value = c; all[i].classList.add('f'); });
  });

  /* ── 비밀번호 보기 ── */
  document.addEventListener('click', (e) => {
    const eye = e.target.closest('.pw .eye'); if (!eye) return;
    const inp = $('input', eye.parentElement); inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  /* ── 타이머 (서버 timer.endsAt 이 오면 App.setTimer로 보정) ── */
  let timerEnd = null;
  /** 계정 화면(A3 · A4 · A5) 왼쪽 메뉴를 /me 값으로 (실서버 모드에서만) */
  App.loadAccountSide = async () => {
    if (cfg.useMock) return null;
    const me = await App.run(null, () => api.call('auth.me'));
    if (!me) return null;
    const u = me.user;
    const side = $('.side .me');
    if (side) {
      const b = side.querySelector('b'); if (b) b.textContent = u.nickname;
      const em = side.querySelector('span:not(.avatar)'); if (em) em.textContent = u.email;
    }
    $$('.avatar').forEach(av => {
      if (u.avatarUrl) { av.textContent = ''; av.style.background = `center/cover no-repeat url(${u.avatarUrl})`; }
      else if (!av.classList.contains('guest')) av.textContent = (u.nickname || '?')[0];
    });
    const nm = $('.pbtn .nm'); if (nm) nm.textContent = u.nickname;
    $$('.plan-free').forEach(el => { el.textContent = u.plan; });
    const badge = $('.nav .badge.key'); if (badge) badge.textContent = me.sessionCount;
    if (u.plan === 'PRO') { const up = $('.planmini'); if (up) up.hidden = true; }
    return me;
  };

  /** 3 · A3 공통: 역할 · 스킬 칩을 meta.skills로 그리고, 내 선택을 표시 */
  App.renderSkillChips = async (sel) => {
    if (cfg.useMock) return;
    const meta = await App.run(null, () => api.call('meta.skills'));
    if (!meta) return;
    sel = sel || {};
    const roleBox = $$('.chips').find(c => c.querySelector('.chip'));
    if (roleBox && (meta.roles || []).length) {
      const tpl = roleBox.querySelector('.chip');
      roleBox.innerHTML = '';
      meta.roles.forEach(name => {
        const el = tpl.cloneNode(true);
        el.className = 'chip' + (name === sel.desiredRole ? ' on' : '');
        el.textContent = name;
        roleBox.appendChild(el);
      });
    }
    const grps = $$('.grp');
    if (grps.length && (meta.skillGroups || []).length) {
      const box = grps[0].parentElement, tplGrp = grps[0], tplSk = grps[0].querySelector('.sk');
      grps.forEach(g => g.remove());
      meta.skillGroups.forEach(g => {
        const el = tplGrp.cloneNode(true);
        const gl = el.querySelector('.gl');
        if (gl) gl.innerHTML = App.escape(g.title) + (g.hint ? ` <span style="font-weight:400;color:var(--faint)">· ${App.escape(g.hint)}</span>` : '');
        const chips = el.querySelector('.chips');
        chips.innerHTML = '';
        (g.skills || []).forEach(name => {
          const sk = tplSk.cloneNode(true);
          const on = (sel.skills || []).includes(name);
          sk.className = 'sk' + (on ? ' on' : '');
          sk.textContent = (on ? '✓ ' : '') + name;
          chips.appendChild(sk);
        });
        box.appendChild(el);
      });
    }
  };

  App.setTimer = (remainingSec) => { timerEnd = Date.now() + remainingSec * 1000; tick(); };
  /** 상단바 가운데: 단계 이름과 전체 진행률(%)을 서버 stage 값으로 */
  App.setStage = (stage) => {
    if (!stage) return;
    const name = $('.ib-stage'); if (name && stage.label) name.textContent = stage.label;
    if (stage.progress != null) {
      const bar = $('.ib-track i'); if (bar) bar.style.width = stage.progress + '%';
      const pct = $('.ib-pct'); if (pct) pct.textContent = stage.progress + '%';
    }
  };
  let timeUpShown = false;
  function tick() {
    const b = $('.timer b'); if (!b || timerEnd == null) return;
    const left = Math.max(0, Math.round((timerEnd - Date.now()) / 1000));
    b.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
    if (left === 0 && !timeUpShown && !cfg.useMock) { timeUpShown = true; App.timeUp(); }
  }
  setInterval(tick, 1000);

  /* ── 세션 시간 종료 안내 창 (T1) — 자동 종료 없음. 진행자: 5분 더(session.extend) / 이대로 계속 · 참가자: 안내만 ── */
  App.dialog = function (title, body, buttons) {   // buttons: [{label, cls, onClick}] — 닫히면 true
    $('.tdim')?.remove();
    const dim = document.createElement('div'); dim.className = 'tdim';
    const btns = buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-dlg="${i}">${App.escape(b.label)}</button>`).join('');
    dim.innerHTML = `<div class="tdlg"><h3>${App.escape(title)}</h3>${body}<div class="tdf">${btns}</div></div>`;
    ($('.board') || document.body).appendChild(dim);
    dim.addEventListener('click', async (e) => { const b = e.target.closest('[data-dlg]'); if (!b) return; const r = await buttons[+b.dataset.dlg].onClick?.(); if (r !== false) dim.remove(); });
    return dim;
  };
  /* 네이티브 confirm() 대신 쓰는 확인 창 — 디자인과 같은 모양 · Promise<boolean> */
  App.confirm = (title, body, okLabel) => new Promise((resolve) => {
    App.dialog(title, body ? `<p>${App.escape(body)}</p>` : '', [
      { label: '취소', cls: 'gray', onClick: () => { resolve(false); } },
      { label: okLabel || '확인', onClick: () => { resolve(true); } },
    ]);
  });
  App.timeUp = function () {
    const stage = $('.ib-stage')?.textContent || '';
    const body = `<p>정해둔 시간이 지났어요. 세션은 자동으로 끝나지 않아요 — 진행자가 정해요.</p><div class="tdk"><span>지금 단계</span><b>${App.escape(stage)}</b></div>`;
    if (App.state.role === 'host') {
      App.dialog('세션 시간이 끝났어요', body + '<p class="quiet">"5분 더"는 무료 세션 한도(30분)를 넘으면 안 돼요</p>', [
        { label: '이대로 계속 진행하기', cls: 'gray' },
        { label: '5분 더 진행하기', onClick: async () => { const r = await App.run(null, () => api.call('session.extend', {}, { addMin: 5 })); if (!r) return false; App.setTimer(r.timer.remainingSec); timeUpShown = false; App.toast('5분 더 진행해요'); } },
      ]);
    } else {
      App.dialog('세션 시간이 끝났어요', body + '<p class="quiet">진행자가 정하는 중이에요 — 연장하면 타이머가 다시 움직여요</p>', [{ label: '확인', cls: 'gray' }]);
    }
  };

  /* ── 진행자 하단 막대 (T2) — 8-x 발산 단계에서 진행자에게만. 제출 강제: 409 NOT_ALL_SUBMITTED → 확인 창 → force ── */
  const HOSTBAR_STAGES = { 'diverge.write': '제출', 'diverge.board': '순위표', 'diverge.comment': '댓글 완료', 'diverge.review': 'AI 검증', 'diverge.vote': '투표 마침' };
  let hostBarEl = null, stageNow = null;
  App.progress = (n, m) => { const b = hostBarEl?.querySelector('[data-n]'); if (b) b.textContent = `${n} / ${m}`; };
  function hostBar(stageId) {
    if (cfg.useMock || App.state.role !== 'host' || !(stageId in HOSTBAR_STAGES) || hostBarEl) return;
    stageNow = stageId;
    hostBarEl = document.createElement('div'); hostBarEl.className = 'hostbar';
    hostBarEl.innerHTML = `<span>${HOSTBAR_STAGES[stageId]} <b data-n>– / –</b>명</span><button class="btn" data-next>다음 단계 →</button>`;
    ($('.board') || document.body).appendChild(hostBarEl);
    hostBarEl.querySelector('[data-next]').addEventListener('click', () => advance(false));
    seedProgress(stageId);
  }
  /* 막대의 첫 숫자 — 이벤트(ideas.submitted 등)가 오기 전에도 지금 값을 보여준다. 조회가 없는 단계(댓글·검증)는 이벤트를 기다린다. */
  async function seedProgress(stageId) {
    try {
      if (stageId === 'diverge.write') { const b = await api.call('idea.board'); App.progress(b.submittedCount, b.memberCount); }
      else if (stageId === 'diverge.vote') { const v = await api.call('vote.state'); App.progress(v.votedCount, v.memberCount); }
    } catch (e) { /* 막대 숫자는 부가 정보 — 실패해도 진행을 막지 않는다 */ }
  }
  async function advance(force) {
    try { await api.call('session.advance', {}, { from: stageNow, force }); }
    catch (err) {
      if (err.code === 'NOT_ALL_SUBMITTED') {
        const d = err.details || {}; const pend = d.pendingCount ?? '몇';
        App.dialog(`아직 ${pend}명이 제출하지 않았어요`, `<p>모두 내야 다음 단계로 넘어가요. 연결이 끊긴 사람이 있으면 그냥 넘길 수 있어요 — 그 사람 줄은 빈 칸으로 남아요.</p><div class="tdk"><span>기다리는 사람</span><b>${pend}명</b><span class="quiet" style="margin-left:auto">누구인지는 표시하지 않아요</span></div>`, [
          { label: '기다리기', cls: 'gray' }, { label: '그냥 넘기기', onClick: () => advance(true) }]);
        return;
      }
      App.toast(err.message || '넘기지 못했어요', 'error');
    }
  }
  App.hostBar = hostBar;

  /* ── 개발용 이동 바 ── */
  function devnav() {
    if (cfg.devNav === false || new URLSearchParams(location.search).get('dev') === '0') return;
    const list = window.IE_SCREENS || []; const key = document.body.dataset.screen; const i = list.findIndex(s => s.key === key);
    if (i < 0) return;
    const nav = document.createElement('nav'); nav.className = 'devnav';
    const prev = list[i - 1], next = list[i + 1];
    nav.innerHTML = (prev ? `<a href="${App.screen(prev.key)}" title="${prev.title}">◀ ${prev.num}</a>` : '') +
      `<a href="../../index.html">화면 목록</a><span class="cur">${list[i].num}</span>` +
      (next ? `<a href="${App.screen(next.key)}" title="${next.title}">${next.num} ▶</a>` : '') +
      (cfg.useMock ? '<span class="mock" title="config.js의 useMock">MOCK</span>' : '');
    document.body.appendChild(nav);
  }

  /* ── 세션 화면: 새로고침·재접속 때 서버 단계와 맞추기 (실서버 모드) ── */
  async function syncStage() {
    const pageStage = document.body.dataset.stage;
    if (cfg.useMock || !pageStage) return;
    if (!App.requireLogin()) return;
    const s = await App.run(null, () => api.call('session.get'));
    if (!s) return;
    App.save({ role: s.me.role, participantId: s.me.participantId, isLeader: !!s.me.isLeader });
    if (s.timer && s.timer.remainingSec != null) App.setTimer(s.timer.remainingSec);
    App.setStage(s.stage);
    hostBar(s.stage.id);
    const want = App.stageScreen(s.stage, s.me.role, s.me.isLeader);
    const sameStage = pageStage.split(' ').includes(s.stage.id);
    if (want && (!sameStage || (s.stage.id === 'team.assign' && want !== document.body.dataset.screen))) App.go(App.screen(want));
  }

  /* ── 시연용 (목업 모드): Alt+→ / Alt+← 로 세션 흐름 순서대로 이동 ──
     목업 서버는 실시간 이벤트를 보내지 않아서 화면 사이 자동 이동이 없다. 촬영할 때는 config.js에서 devNav:false로 이동 바를 숨기고 이 단축키로 넘긴다. */
  const DEMO_FLOW = ['01-landing', 'A1-login', '04-session-create', '05-lobby-host', '07-1-icebreak-q1-discomfort', '07-2-icebreak-q2-news', '07-3-icebreak-q3-change',
    '07-4-icebreak-q4-services', '07-5-icebreak-q5-wrapup', '07-6-icebreak-host', '07-7-diverge-materials', '08-1-idea-write', '08-2-idea-recommend', '08-3-idea-board',
    '08-4-idea-comments', '08-5-ai-review', '08-6-vote', '08-6w-vote-wait', '08-7-vote-result-host', '09-1-part-split', '09-2-overlap-questions', '09-3-assign-draft', '09-4-leader-confirm', '09-5-report'];
  document.addEventListener('keydown', (e) => {
    if (!cfg.useMock || !e.altKey || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    const i = DEMO_FLOW.indexOf(document.body.dataset.screen); if (i < 0) return;
    const j = i + (e.key === 'ArrowRight' ? 1 : -1); if (DEMO_FLOW[j]) { e.preventDefault(); App.go(App.screen(DEMO_FLOW[j])); }
  });

  document.addEventListener('DOMContentLoaded', () => {
    fit(); devnav(); syncStage();
    if (!cfg.useMock && App.state.user) {          // 오른쪽 위 프로필 버튼을 로그인한 사람으로
      const nm = $('.pbtn .nm'); if (nm) nm.textContent = App.state.user.nickname;
      const av = $('.pbtn .avatar'); if (av && !App.state.user.avatarUrl) av.textContent = (App.state.user.nickname || '?')[0];
    }
    const b = $('.timer b');
    if (b) { const [m, s] = b.textContent.split(':').map(Number); if (!isNaN(m)) App.setTimer(m * 60 + (s || 0)); }
    $('[data-autofocus]')?.focus();
  });
})();
