/* 8-1 내 아이디어 정하기 */
const rows = App.$$('.rrow .rin');
if (!IE_CONFIG.useMock) rows.forEach(r => { r.value = ''; });   // 실서버 모드: 디자인 예시 아이디어를 지우고 시작
(App.state.draftIdeas || []).forEach((t, i) => { if (rows[i] && !rows[i].value) rows[i].value = t; });

async function load() {
  const r = await App.run(null, () => api.call('idea.mine'));
  if (!r) return;
  r.ideas.forEach(it => { if (rows[it.rank - 1]) rows[it.rank - 1].value = it.text; });
}
if (!IE_CONFIG.useMock) load();

App.action('submitIdeas', async () => {
  const ideas = rows.map(r => r.value.trim()).filter(Boolean).map((text, i) => ({ rank: i + 1, text, source: 'own' }));
  if (!ideas.length) { App.toast('아이디어를 1개 이상 적어주세요'); rows[0].focus(); return false; }
  const r = await api.call('idea.submit', {}, { ideas });
  App.save({ draftIdeas: [] });
  App.progress(r.submittedCount, r.memberCount);   // 진행자 막대(T2)는 남의 제출 이벤트만 받으므로 내 제출은 여기서 반영
  App.toast('제출했어요. 모두 내면 순위표가 열려요');
});

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'ideas.submitted') App.progress(ev.data.submittedCount, ev.data.memberCount);   // 진행자 막대(T2)
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.board') App.go(App.screen('08-3-idea-board'));
});
