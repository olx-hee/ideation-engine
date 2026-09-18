/* 6 대기실 (참가자) */
const countEl = App.$('.panel .muted.t-sm b');
/* 실서버 모드: 처음 열 때 인원 수를 서버 값으로 (그 뒤에는 입장·나감 이벤트로 갱신) */
if (!IE_CONFIG.useMock) {
  api.call('session.participants').then(r => { countEl.textContent = `${r.items.length} / ${r.maxMembers}`; }).catch(() => {});
  /* 내 프로필 카드(예시 "이세민")를 로그인한 사람으로 */
  api.call('auth.me').then(me => {
    const card = App.$('.panel .me2') || App.$('.panel');
    const nameEl = App.$$('.panel b').find(b => b.textContent.trim().length && !b.textContent.includes('/'));
    if (nameEl) nameEl.textContent = me.user.nickname;
    App.$$('.panel .avatar').forEach(av => { av.textContent = (me.user.nickname || '?')[0]; });
    const chips = App.$('.panel .chips');
    if (chips && me.profileSummary) {
      chips.innerHTML = (me.profileSummary.skills || []).slice(0, 4).map(v => `<span class="sk on">✓ ${App.escape(v)}</span>`).join('');
    }
  }).catch(() => {});
}
realtime.connect(App.sessionId(), async (ev) => {
  if (ev.type === 'session.started') App.go(App.screen('07-1-icebreak-q1-discomfort'));
  if (ev.type === 'participant.kicked' && ev.data.participantId === App.state.participantId) { App.toast('진행자가 방에서 내보냈어요'); App.go(App.screen('01-landing')); }
  if (ev.type === 'participant.joined' || ev.type === 'participant.left') {
    const r = await api.call('session.participants');
    countEl.textContent = `${r.items.length} / ${r.maxMembers}`;
  }
});
