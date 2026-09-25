/* 8-1 내 아이디어 정하기 */
const rows = App.$$('.rrow .rin');
if (!IE_CONFIG.useMock) rows.forEach(r => { r.value = ''; });   // 실서버 모드: 디자인 예시 아이디어를 지우고 시작
(App.state.draftIdeas || []).forEach((t, i) => { if (rows[i] && !rows[i].value) rows[i].value = t; });

// 쓰다 만 아이디어는 서버에 없다(idea.submit 뿐) — 새로고침·8-2로 다녀오는 동안 날아가지 않게 이 브라우저에 적어 둔다
document.addEventListener('input', (e) => {
  if (e.target.closest('.rrow .rin')) App.save({ draftIdeas: rows.map(r => r.value) });
});

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

/* 단계가 바뀌면 그 단계의 화면으로 — diverge.board만 보고 이동하면, 웹소켓 재연결 틈에 이벤트를 놓쳤거나
   진행자가 board→comment로 빠르게 두 번 넘긴 사람은 이 화면에 갇힌다(8-1에서 아무것도 못 하는 상태).
   8-2도 같은 diverge.write라, 서버가 연결 직후 보내는 현재 단계 동기화로 서로 끌고 가지 않게 같은 단계는 무시한다. */
function onStage(stage) {
  if (!stage || document.body.dataset.stage.split(' ').includes(stage.id)) return;
  const want = App.stageScreen(stage, App.state.role);
  if (want) App.go(App.screen(want));
}
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'ideas.submitted') App.progress(ev.data.submittedCount, ev.data.memberCount);   // 진행자 막대(T2)
  if (ev.type === 'stage.changed') onStage(ev.data.stage);
});
