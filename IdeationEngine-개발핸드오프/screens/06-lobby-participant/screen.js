/* 6 대기실 (참가자) */
const countEl = App.$('.panel .muted.t-sm b');
/* 인원 수를 다시 불러오는 요청이 여러 번 겹칠 수 있다(처음 열 때 fetch + 짧은 새 사이에
   입장·나감 이벤트가 잇달아 오면 그때마다 또 fetch) — 네트워크 지연 때문에 나중에 보낸
   요청의 응답이 먼저 도착하고 먼저 보낸(낡은) 요청의 응답이 뒤늦게 와서 화면 숫자를 다시
   낡은 값으로 되돌릴 수 있어서, 가장 마지막에 보낸 요청의 응답만 반영한다. */
let countSeq = 0;
async function refreshCount() {
  const my = ++countSeq;
  const r = await App.run(null, () => api.call('session.participants'));
  if (r && my === countSeq) countEl.textContent = `${r.items.length} / ${r.maxMembers}`;
}
/* 실서버 모드: 처음 열 때 인원 수를 서버 값으로 (그 뒤에는 입장·나감 이벤트로 갱신) */
if (!IE_CONFIG.useMock) {
  refreshCount();
  (async () => {
    /* 내 프로필 카드(예시 "이세민 · 맡고 싶은 역할: 개발")를 로그인한 사람으로 — 이름이
       <b> 태그가 아니라 "이름 · 맡고 싶은 역할: X" 한 줄 텍스트라서 통째로 다시 만든다
       (예전엔 <b> 태그를 찾다가 못 찾아서 이름이 영영 안 바뀌는 버그였음). */
    const me = await App.run(null, () => api.call('auth.me'));
    if (!me) return;
    const nameEl = App.$('.panel .card .t-sm');
    if (nameEl) nameEl.textContent = `${me.user.nickname} · 맡고 싶은 역할: ${(me.profileSummary && me.profileSummary.desiredRole) || '미정'}`;
    App.$$('.panel .avatar').forEach(av => { av.textContent = (me.user.nickname || '?')[0]; });
    const chips = App.$('.panel .chips');
    if (chips && me.profileSummary) {
      chips.innerHTML = (me.profileSummary.skills || []).slice(0, 4).map(v => `<span class="sk on">✓ ${App.escape(v)}</span>`).join('');
    }
  })();
}
realtime.connect(App.sessionId(), async (ev) => {
  if (ev.type === 'session.started') App.go(App.screen('07-1-icebreak-q1-discomfort'));
  /* 서버는 웹소켓이 붙을 때마다 지금 단계를 stage.changed로 한 번 보내준다. 진행자가 "시작"을
     누른 순간 이 사람의 연결이 끊겨 있었으면(재연결 대기 중) session.started를 영영 놓치고,
     새로고침 전까지 대기실에 갇힌다(syncStage는 페이지가 열릴 때 한 번만 확인한다) —
     대기실이 아닌 단계가 오면 그 단계 화면으로 따라간다. */
  if (ev.type === 'stage.changed' && ev.data.stage && ev.data.stage.id !== 'lobby') {
    App.go(App.screen(App.stageScreen(ev.data.stage, App.state.role) || '07-1-icebreak-q1-discomfort'));
  }
  // 아직 대기실이면, 끊겼던 사이에 놓친 입장·나감을 그때 따라잡는다(인원수가 틀어진 채로 남지 않게).
  if (ev.type === 'stage.changed' && ev.data.stage && ev.data.stage.id === 'lobby' && !IE_CONFIG.useMock) refreshCount();
  if (ev.type === 'participant.kicked' && ev.data.participantId === App.state.participantId) {
    App.toast('진행자가 방에서 내보냈어요');
    /* 이 브라우저에 남은 세션 정보를 지운다 — 안 지우면 다른 화면이 죽은 sessionId로 계속
       조회해서 KICKED 에러만 만난다(session.ended 공통 처리와 같은 정리). */
    App.save({ sessionId: null, role: null, participantId: null, code: null, inviteUrl: null, isLeader: false });
    App.go(App.screen('01-1-landing-logged-in'));
    return;
  }
  // 내보내진 사람도 인원수에서 빠진다 — joined/left만 보면 남은 사람들의 "3 / 4"가 그대로 남는다.
  if (ev.type === 'participant.joined' || ev.type === 'participant.left' || ev.type === 'participant.kicked') refreshCount();
});
