SHELL_CSS = r"""/* ─────────────────────────────────────────────
   shell.css — 실제 페이지로 쓰기 위한 추가 스타일
   (디자인 목업에는 없던 부분: 화면 맞춤, 입력칸, 토스트, 개발용 내비)
   ───────────────────────────────────────────── */
[hidden]{display:none!important}
html,body{height:100%}
body{background:var(--app-bg);scroll-snap-type:none;overflow:hidden}

/* 1280×800 기준으로 만든 화면을 창 크기에 맞춰 통째로 확대/축소 (app.js가 zoom 계산) */
.stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--page)}
.stage .board{border-radius:0;box-shadow:none;border:none;flex:none}
body.fill .stage{background:var(--app-bg)}

/* 목업의 <div class="inp">를 실제 입력칸으로 바꾼 것 — 모양은 그대로 */
input.inp,textarea.inp,textarea.ta,input.rin,input.bare,input.mini{font:inherit;color:var(--ink);outline:none}
input.inp,textarea.inp,textarea.ta,input.rin{display:block;min-width:0;width:100%}
textarea{resize:none}
.inp::placeholder,.ta::placeholder,.rin::placeholder{color:var(--faint);opacity:1}
input.inp:focus,textarea.inp:focus,input.rin:focus,textarea.ta:focus{border-color:var(--key);box-shadow:0 0 0 3px var(--key-100)}
label.inp.pw{display:flex;align-items:center;gap:8px;cursor:text}
label.inp.pw .bare{flex:1;min-width:0;border:none;background:transparent;padding:0;letter-spacing:.15em}
label.inp.pw .eye{cursor:pointer;letter-spacing:0}
input.mini{outline:none}
.codebox input{font-family:var(--mono);font-size:var(--fs-h1);font-weight:700;width:52px;height:64px;border:1px solid var(--line);border-radius:12px;text-align:center;background:var(--soft);color:var(--ink);outline:none;text-transform:uppercase;padding:0}
.codebox input.f{border-color:var(--key-400);color:var(--key-700);background:var(--key-50)}
.codebox input:focus{border:2px solid var(--key);background:var(--panel)}

/* 누를 수 있는 것들 */
button,[data-go],[data-action],.chip,.sk,.toggle,.check,.rb,.rbtn,.seg span,.stepper span,.arw span,.ri,.pbtn,.railbtn,.tg,.hint2,.res7,.cb,.mi,.nav a,.nc-top,.mx{cursor:pointer}
.chip.lock{cursor:not-allowed}
.btn.is-loading{opacity:.6;pointer-events:none}
.btn:focus-visible,[data-go]:focus-visible{outline:2px solid var(--key);outline-offset:2px}
.btn.disabled,.btn[disabled]{cursor:not-allowed}

/* 채팅은 실제로 스크롤 (최신 말풍선이 아래) */
.msgs{justify-content:flex-start;overflow-y:auto;scrollbar-width:thin}
.msgs>:first-child{margin-top:auto}

/* 토스트 */
.toasts{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;z-index:1000;pointer-events:none}
.toast{background:#1B1B2F;color:#fff;font-size:13px;padding:10px 16px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:ie-in .18s ease-out;max-width:520px}
.toast.error{background:#BE123C}
@keyframes ie-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* 9 파트 나누기 · 배치 · 보고서 */
.sel9{position:relative}
.menu9{position:absolute;top:calc(100% + 4px);left:0;z-index:20;display:block;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);padding:4px;min-width:150px}
.menu9>div{display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:8px;font-size:13px;font-weight:400;color:var(--ink)}
.menu9>div:hover{background:var(--soft)}
.ptab.marking .pr9,.ptab.marking .sm9>div{cursor:pointer}
.ptab.marking .pr9:hover,.ptab.marking .sm9>div:hover{background:var(--key-50)}
.pill9.mk{margin-left:8px}
textarea.ta9{display:block;width:100%;font:inherit;color:var(--ink);outline:none}
textarea.ta9:focus{border-color:var(--key);box-shadow:0 0 0 3px var(--key-100)}

/* 보고서: PDF로 저장 = A4 2쪽만 인쇄 */
.printonly{display:none}
@media print{
  @page{size:A4 portrait;margin:0}
  body.printing{overflow:visible;background:#fff}
  body.printing>*{display:none!important}
  body.printing>.printonly{display:block}
  .printonly .a4{transform:none;box-shadow:none;page-break-after:always;break-after:page}
  .printonly .a4:last-child{page-break-after:auto;break-after:auto}
}

/* 개발용 화면 이동 바 (주소 뒤에 ?dev=0 을 붙이면 숨김) */
.devnav{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:999;display:flex;align-items:center;gap:2px;background:rgba(27,27,47,.88);color:#fff;border-radius:999px;padding:4px;font:12px/1 "Noto Sans KR",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25)}
.devnav a{color:#fff;text-decoration:none;padding:7px 12px;border-radius:999px;white-space:nowrap}
.devnav a:hover{background:rgba(255,255,255,.14)}
.devnav .cur{padding:7px 12px;color:#C7D2FE;font-family:"JetBrains Mono",monospace}
.devnav .mock{padding:3px 8px;margin-left:4px;border-radius:999px;background:#F59E0B;color:#1B1B2F;font-weight:700}
"""

CONFIG_JS = r"""/* config.js — 환경 설정. 백엔드가 준비되면 useMock을 false로 바꾸세요. */
window.IE_CONFIG = {
  baseUrl: '/api/v1',          // REST API 주소 (예: https://api.ideationengine.app/api/v1)
  wsUrl: null,                 // 실시간 주소. null이면 baseUrl 기준으로 ws(s)://…/sessions/{id}/stream
  useMock: true,               // true: assets/js/mock.js의 가짜 응답 사용 (백엔드 없이 화면 확인)
  mockDelay: 300,              // 가짜 응답 지연(ms) — 로딩 상태 확인용
  devNav: true                 // 화면 아래 개발용 이동 바 — 시연 영상 촬영 때는 false (목업 모드에서는 Alt+→ / Alt+← 로 다음·이전 화면)
};
"""

APP_JS = r"""/* ─────────────────────────────────────────────
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
    go(href) { location.href = href; },
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
    logoutLocal() { this.save({ accessToken: null, user: null, sessionId: null, role: null, participantId: null }); },
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
        this.toast((err && err.message) || '문제가 생겼어요. 잠시 후 다시 시도해 주세요', 'error');
        return false;
      } finally { el && el.classList.remove('is-loading'); }
    },
  };

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
"""

API_JS = r"""/* ─────────────────────────────────────────────
   api.js — 백엔드 호출은 전부 여기로
   사용법:  const data = await api.call('session.create', {}, { topic, durationMin });
            await api.call('comment.create', { ideaId: 'ide_b1' }, { concern: '…' });
            await api.call('history.list', { query: { role: 'host' } });
   · 경로의 {sessionId}는 따로 안 넘기면 App.sessionId() 사용
   · 엔드포인트 목록: endpoints.js (문서: docs/03-API-전체-목록.md)
   · config.js의 useMock=true면 mock.js의 가짜 응답을 돌려줌
   ───────────────────────────────────────────── */
(function () {
  const cfg = window.IE_CONFIG || {};
  const ENDPOINTS = window.IE_ENDPOINTS || {};

  // 401이어도 로그인 유지(refresh) 재시도를 하지 않는 API (로그인·가입 자체이거나 refresh 자신)
  const NO_RETRY = ['auth.login', 'auth.signup', 'auth.oauth', 'auth.refresh', 'auth.logout', 'auth.passwordReset'];

  class ApiError extends Error {
    constructor(code, message, status, details) { super(message); this.code = code; this.status = status; this.details = details; }
  }

  function buildPath(tpl, params) {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => {
      const v = params[k] != null ? params[k] : (k === 'sessionId' ? App.sessionId() : null);
      if (v == null) throw new ApiError('CLIENT', `경로 값이 없어요: ${k}`, 0);
      return encodeURIComponent(v);
    });
  }

  async function call(id, params = {}, body) {
    const ep = ENDPOINTS[id];
    if (!ep) throw new ApiError('CLIENT', `알 수 없는 API: ${id}`, 0);
    const path = buildPath(ep.path, params);
    const query = params.query ? '?' + new URLSearchParams(Object.entries(params.query).filter(([, v]) => v != null && v !== '')) : '';

    if (cfg.useMock) return window.IE_MOCK.handle(id, { params, query: params.query || {}, body, path });

    const headers = {};
    const token = App.state.accessToken;
    if (token) headers.Authorization = 'Bearer ' + token;
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

    const res = await fetch(cfg.baseUrl + path + query, { method: ep.method, headers, body: payload, credentials: 'include' });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (res.status === 401 && !NO_RETRY.includes(id) && !params._retried) {
      if (await refresh()) return call(id, Object.assign({}, params, { _retried: true }), body);
    }
    if (!res.ok) {
      const e = (data && data.error) || {};
      throw new ApiError(e.code || ('HTTP_' + res.status), e.message || '요청에 실패했어요', res.status, e.details);
    }
    return data;
  }

  /* 로그인 유지: 리프레시 쿠키로 새 액세스 토큰 받기. 동시에 여러 요청이 401이어도 한 번만 부름 */
  let refreshing = null;
  function refresh() {
    if (cfg.useMock) return Promise.resolve(!!App.state.accessToken);
    if (!refreshing) {
      refreshing = fetch(cfg.baseUrl + '/auth/refresh', { method: 'POST', credentials: 'include' })
        .then(async (r) => { if (!r.ok) throw new Error('refresh'); const d = await r.json(); App.save({ accessToken: d.accessToken, user: d.user }); return true; })
        .catch(() => { App.logoutLocal(); return false; })
        .finally(() => { setTimeout(() => { refreshing = null; }, 0); });
    }
    return refreshing;
  }

  /* 실시간: 세션 화면에서 realtime.connect(sessionId, ev => …) — ev = { type, data, at } */
  const realtime = {
    connect(sessionId, onEventRaw) {
      /* 공통 처리: 타이머 보정(timer.sync)과 상단바 단계(stage.changed)는 화면마다 쓰지 않고 여기서 */
      const onEvent = (ev) => {
        try {
          if (ev && ev.type === 'timer.sync' && ev.data && ev.data.endsAt) {
            const now = ev.data.serverNow ? Date.parse(ev.data.serverNow) : Date.now();
            App.setTimer(Math.max(0, Math.round((Date.parse(ev.data.endsAt) - now) / 1000)));
          }
          if (ev && ev.type === 'stage.changed' && ev.data) App.setStage(ev.data.stage);
        } catch (e) { /* 보정 실패는 화면 동작을 막지 않음 */ }
        return onEventRaw(ev);
      };
      if (cfg.useMock) return window.IE_MOCK.stream(sessionId, onEvent);
      const base = cfg.wsUrl || (location.origin.replace(/^http/, 'ws') + cfg.baseUrl);
      let ws, retry = 0, closed = false;
      const open = () => {
        const token = App.state.accessToken || '';   // 연결할 때마다 최신 토큰으로 (1시간 뒤 토큰이 바뀌어도 재연결됨)
        ws = new WebSocket(`${base}/sessions/${encodeURIComponent(sessionId)}/stream?token=${encodeURIComponent(token)}`);
        ws.onopen = () => { retry = 0; };
        ws.onmessage = (m) => { try { onEvent(JSON.parse(m.data)); } catch (e) { console.warn('이벤트 파싱 실패', e); } };
        ws.onclose = async (e) => {
          if (closed) return;
          if (e.code === 4401) {                      // 토큰 만료 → 한 번 새로 받고 다시 연결
            if (await api.refresh()) { retry = 0; return open(); }
            return;                                   // 로그인 자체가 풀렸으면 멈춤 (화면 쪽에서 로그인으로 보냄)
          }
          if (e.code === 4403) return;                // 이 세션 참가자가 아님 · 내보내짐 → 계속 재연결하지 않음
          setTimeout(open, Math.min(10000, 500 * 2 ** retry++));
        };
      };
      open();
      return { close() { closed = true; ws && ws.close(); } };
    }
  };

  window.api = { call, refresh, ApiError, endpoints: ENDPOINTS };
  window.realtime = realtime;
})();
"""

MOCK_OVERRIDES_JS = r"""
  /* 입력에 따라 결과가 달라지는 API만 여기서 흉내 (나머지는 위 data의 예시 응답 그대로) */
  let iceStep = 1, iceFollowed = false, iceInit = false;
  function syncIce() { if (iceInit) return; iceInit = true; const n = parseInt((document.querySelector('.ch-n') || {}).textContent, 10); if (n) iceStep = n; }
  const Q = ['최근 일주일, 가장 불편했던 순간은 언제였어요? 사소한 것도 좋아요.',
    "요즘 '캠퍼스 생활 서비스' 주변 소식이에요. 모르는 분야여도 괜찮아요, 들어봤는지 눌러주세요.",
    '방금 본 변화 중 하나 때문에 **새로 가능해지거나 더 불편해질** 사람이 주변에 있나요?',
    '요즘 가장 자주 쓰는 앱이나 서비스는 뭐고, **아쉬운 점**은요?',
    '마지막이에요. 이번에 **해보고 싶은 것**과 **피하고 싶은 것**이 있나요?'];
  const L = ['질문 1 · 불편했던 순간', '질문 2 · 요즘 바뀐 것', '질문 3 · 변화 × 내 경험', '질문 4 · 요즘 쓰는 서비스', '질문 5 · 해보고 싶은 것 · 피하고 싶은 것'];
  function nextQ() {
    iceFollowed = false;
    if (iceStep >= 5) return { step: 5, done: true, messages: [{ role: 'ai', style: 'good', text: '끝! 수고했어요. 진행자가 단계를 넘기면 함께 발산으로 이동해요.' }] };
    iceStep++;
    return { step: iceStep, done: false, messages: [{ role: 'ai', text: '좋아요, 충분해요. 다음으로 갈게요.' }, { role: 'ai', label: L[iceStep - 1], text: Q[iceStep - 1] }] };
  }
  let praiseUsed = 1, concernDone = 4, myVotes = ['ide_c1'];
  const fail = (code, message, status) => { const e = new api.ApiError(code, message, status); throw e; };

  const overrides = {
    'auth.login': ({ body }) => { if (!body.email || !body.password) fail('VALIDATION', '이메일과 비밀번호를 입력해 주세요', 400); return null; },
    'auth.signup': ({ body }) => {
      if (!body.agreements.terms || !body.agreements.privacy) fail('VALIDATION', '필수 약관에 동의해 주세요', 400);
      if ((body.password || '').length < 8) fail('VALIDATION', '비밀번호는 8자 이상이에요', 400); return null;
    },
    'session.create': ({ body }) => {
      if (!body.topic) fail('VALIDATION', '이번 회의에서 정할 주제를 적어주세요', 400);
      if (body.durationMin == null || body.durationMin > 30) fail('PLAN_LIMIT', '무료 플랜은 세션을 30분까지 만들 수 있어요', 403); return null;
    },
    'session.lookup': ({ query }) => { if (!/^[0-9A-Z]{6}$/.test(query.code || '')) fail('SESSION_NOT_FOUND', '없는 방 코드예요. 다시 확인해 주세요', 404); return null; },
    'auth.logout': () => { App.logoutLocal(); return null; },
    'ice.send': ({ body }) => {
      syncIce();
      const text = (body.text || '').trim();
      if (text.length < 15 && !iceFollowed) { iceFollowed = true; return { step: iceStep, done: false, messages: [{ role: 'ai', label: '꼬리질문', style: 'fq', text: '조금만 더 알려줄래요? **언제, 어디서** 그랬는지요.' }] }; }
      return nextQ();
    },
    'ice.skip': () => { syncIce(); return nextQ(); },
    'ice.explain': ({ body }) => ({ message: { role: 'ai', style: 'explain', text: `**${body.term}**는 쉽게 말하면 … (백엔드 연결 후 AI 뜻풀이가 들어가요)` }, askedTerms: [body.term] }),
    'idea.submit': ({ body }) => { const n = body.ideas.filter(i => i.text.trim()).length; if (n < 1 || n > 3) fail('VALIDATION', '아이디어는 1~3개 적어주세요', 400); return null; },
    'comment.create': ({ body }) => {
      if (!body.concern || !body.concern.trim()) fail('VALIDATION', '아쉬운 점은 꼭 적어주세요', 400);
      if (body.praise && praiseUsed >= 2) fail('PRAISE_LIMIT', '좋은 점은 2개까지만 쓸 수 있어요', 409);
      if (body.praise) praiseUsed++; concernDone++;
      return { saved: true, quota: { concernDone, concernTotal: 9, praiseUsed, praiseMax: 2 } };
    },
    'vote.save': ({ body }) => { if (body.ids.length > 2) fail('VOTE_LIMIT', '한 사람당 2표까지예요', 409); myVotes = body.ids.slice(); return { myVotes, remaining: 2 - myVotes.length }; },
    'team.answer': ({ params, body }) => {
      if (!body.answers || !body.answers.q1 || !body.answers.q1.choice) fail('VALIDATION', '보기 중 하나를 골라주세요', 400);
      if (!body.answers.q2 || !(body.answers.q2.text || '').trim()) fail('VALIDATION', '까다로운 부분을 어떻게 만들지 적어주세요', 400);
      const first = params.partId === 'prt_1';
      return { saved: true, nextPartId: first ? 'prt_3' : null, remaining: first ? 1 : 0 };
    },
    'team.mark': ({ params, body }) => ({ partId: params.partId, marked: !!body.marked }),
  };
"""

CHAT_JS = r"""/* ─────────────────────────────────────────────
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
"""

TEAM_JS = r"""/* ─────────────────────────────────────────────
   team.js — 9 파트 나누기 · 배치 · 보고서 공통
   · Team.av(사람) / Team.who9(사람) : 아바타 · 이름 표시
   · 보기 고르기(.opt9) 라디오 동작
   ───────────────────────────────────────────── */
(function () {
  const esc = (s) => App.escape(s);
  window.Team = {
    av(m) { const n = (m && m.nickname) || ''; return `<i class="av9">${esc(n[0] || '?')}</i>`; },
    who9(m) {
      if (!m) return '<span class="q9">담당 없음</span>';
      return `<span class="who9">${this.av(m)}${esc(m.nickname)}${m.isMe ? ' <span class="q9">(나)</span>' : ''}</span>`;
    },
  };
  /* 9-2 보기 고르기 */
  document.addEventListener('click', (e) => {
    const opt = e.target.closest('.opt9');
    if (!opt) return;
    opt.parentElement.querySelectorAll('.opt9').forEach((o) => {
      const on = o === opt;
      o.classList.toggle('on', on);
      o.querySelector('.radio')?.classList.toggle('on', on);
    });
  });
})();
"""
