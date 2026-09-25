/* 8-6w 투표 마침 · 결과 기다리기 */
const cnt = App.$('.wait-count b');
/** quiet: 스스로 다시 물어보는 경우(실패해도 토스트를 띄우지 않는다) */
async function load(quiet) {
  // 이 화면은 이벤트만 기다리는 화면이라, vote.closed·stage.changed를 한 번 놓치면(웹소켓 재연결 틈)
  // 결과가 열렸는데도 영원히 "기다리는 중"으로 남는다. 그래서 진짜 단계를 직접 확인한다 —
  // 진행자가 강제로 넘겼거나 투표 안 한 사람이 나가버린 경우엔 votedCount가 memberCount에
  // 끝까지 못 미쳐서 아래 인원 비교만으로는 알 수 없다.
  // (첫 로드는 app.js의 syncStage가 이미 session.get으로 단계를 맞춰준다 — 다시 물어볼 필요 없음)
  if (quiet) {
    const s = await api.call('session.get').catch(() => null);
    if (s && App.followStage(s.stage)) return;   // diverge.result면 8-7로 (판단은 app.js 한 곳에서)
  }
  const r = quiet ? await api.call('vote.state').catch(() => null) : await App.run(null, () => api.call('vote.state'));
  if (!r) { poll(); return; }
  if (!r.finished) { App.go(App.screen('08-6-vote')); return; }   // 아직 안 마친 사람 · 재투표로 표가 초기화된 사람은 투표 화면으로
  // "votedCount가 memberCount에 닿았으면 8-7로" 는 없앴다 — 투표를 안 한 사람이 나가거나 내보내지면
  // 인원 수만 같아지고 단계는 아직 diverge.vote라, 8-7이 409 VOTE_NOT_CLOSED로 되돌려보내고
  // 여기로 다시 오는 무한 왕복(8-6w → 8-7 → 8-6 → 8-6w)이 됐다. 이동 판단은 위의 단계 확인 한 곳에서만.
  cnt.textContent = `${r.votedCount} / ${r.memberCount}`;
  poll();
}
let pollTimer = null;
function poll() { clearTimeout(pollTimer); pollTimer = setTimeout(() => load(true), 5000); }
if (!IE_CONFIG.useMock) load();
realtime.connect(App.sessionId(), (ev) => {
  // 진행자도 투표를 마치면 이 화면에서 기다린다 — 하단 막대 숫자도 같이 맞춰준다(8-6과 같은 값)
  if (ev.type === 'vote.progress') { cnt.textContent = `${ev.data.votedCount} / ${ev.data.memberCount}`; App.progress(ev.data.votedCount, ev.data.memberCount); }
  if (ev.type === 'vote.closed') App.go(App.screen('08-7-vote-result-host'));
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.result') App.go(App.screen('08-7-vote-result-host'));
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.vote') App.go(App.screen('08-6-vote'));   // 재투표
});
