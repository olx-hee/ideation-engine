/* 8-6w 투표 마침 · 결과 기다리기 */
const cnt = App.$('.wait-count b');
async function load() {
  const r = await api.call('vote.state');
  if (!r.finished) { App.go(App.screen('08-6-vote')); return; }   // 아직 안 마친 사람은 투표 화면으로
  cnt.textContent = `${r.votedCount} / ${r.memberCount}`;
}
if (!IE_CONFIG.useMock) load();
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'vote.progress') cnt.textContent = `${ev.data.votedCount} / ${ev.data.memberCount}`;
  if (ev.type === 'vote.closed') App.go(App.screen('08-7-vote-result-host'));
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.result') App.go(App.screen('08-7-vote-result-host'));
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.vote') App.go(App.screen('08-6-vote'));   // 재투표
});
