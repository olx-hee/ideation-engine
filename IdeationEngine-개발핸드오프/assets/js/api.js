/* ─────────────────────────────────────────────
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

    // 응답이 안 오면(느린 네트워크·서버가 죽었는데 연결만 붙어있는 경우 등) fetch는 영원히 기다린다 —
    // 그 요청을 부른 화면의 "불러오는 중" 오버레이(.tdim 등)도 같이 영원히 떠 있게 되고, 그 아래
    // 버튼은 화면에서 클릭할 수 없게 가려진다("버튼이 안 보인다"로 보고된 문제). 적당한 시간 뒤엔
    // 포기하고 에러로 넘겨서, 화면이 항상 다시 눌러볼 수 있는 상태로 돌아오게 한다.
    let res;
    try {
      res = await fetch(cfg.baseUrl + path + query, { method: ep.method, headers, body: payload, credentials: 'include', signal: AbortSignal.timeout(20000) });
    } catch (e) {
      if (e.name === 'TimeoutError' || e.name === 'AbortError') throw new ApiError('TIMEOUT', '서버 응답이 오래 걸려요. 다시 시도해 주세요', 0);
      throw new ApiError('NETWORK', '서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요', 0);
    }
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

  /* 종료된 세션에서 빠져나오기 — session.ended 이벤트로도 오고, 그 이벤트를 놓친 채
     소켓만 4404로 끊긴 경우(끊겨 있는 동안 진행자가 종료)로도 온다. 두 경로가 겹쳐도
     한 번만 동작하게 막는다. */
  let leaving = false;
  function leaveEndedSession() {
    if (leaving) return;
    leaving = true;
    App.toast('진행자가 세션을 종료했어요');
    App.save({ sessionId: null, role: null, participantId: null, code: null, inviteUrl: null, isLeader: false });
    setTimeout(() => App.go(App.screen('01-1-landing-logged-in')), 800);
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
          if (ev && ev.type === 'stage.changed' && ev.data) {
            App.setStage(ev.data.stage);
            // 단계가 이 화면이 모르는 곳으로 넘어갔으면(끊긴 사이 두 단계가 지나갔거나 진행자가 빨리 넘김)
            // 여기서 바로 맞는 화면으로 보낸다 — 화면별 처리에만 맡기면 그 화면이 기다리던 단계가
            // 아닐 때 아무도 반응하지 않아 그대로 갇힌다. 이동했으면 화면 콜백은 부르지 않는다.
            if (App.followStage(ev.data.stage)) return;
          }
          // 세션 종료는 화면마다 따로 처리하지 않고 여기서 한 번에 — 진행자를 포함해 그 세션의
          // 모든 화면(어느 단계에 있든)이 이 이벤트 하나로 안내받고 랜딩으로 나간다.
          if (ev && ev.type === 'session.ended') { leaveEndedSession(); return; }
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
          // 4404 = 진행자가 세션을 종료함(SessionStageService.end). 이걸 모르고 재연결만 계속하면
          // 죽은 방에 대고 영원히 두드리고, 그 사이 session.ended 이벤트를 놓친 사람은 안내도 못 받는다.
          if (e.code === 4404) { leaveEndedSession(); return; }
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
