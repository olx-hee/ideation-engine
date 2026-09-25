/* 9-2 겹친 후보 질문 */
const esc = App.escape;
let data = null, idx = 0;

function render() {
  const it = data.items[idx];
  if (!it) return;
  const tabs = App.$('.qtabs');
  tabs.querySelectorAll('.qtab').forEach(n => n.remove());
  const hint = tabs.querySelector('.q9');
  data.items.forEach((x, i) => hint.insertAdjacentHTML('beforebegin',
    `<span class="qtab${i === idx ? ' on' : ''}">${esc(x.partName)} · ${i === idx ? '답하는 중' : (x.status === 'done' ? '제출함' : '다음')}</span>`));
  hint.textContent = it.otherCandidateCount
    ? `다른 후보 ${it.otherCandidateCount}명도 같은 질문에 답하고 있어요`
    : '이 파트의 후보는 나만 남았어요';
  App.$('.dvh .aside').textContent = `파트 ${idx + 1} / ${data.items.length}`;

  const [q1, q2] = it.questions;
  const heads = App.$$('.qh');
  heads[0].innerHTML = `<i>Q1</i>${esc(q1.text)}`;
  const savedChoice = it.answer && it.answer.q1 && it.answer.q1.choice;
  App.$('.opts9').innerHTML = q1.options.map(o => {
    const on = o.value === savedChoice;
    return `<div class="opt9${on ? ' on' : ''}" data-value="${esc(o.value)}"><span class="radio${on ? ' on' : ''}"></span>${esc(o.label)}</div>`;
  }).join('');
  App.$$('.sub9')[0].textContent = q1.detailLabel;
  const detail = App.$('input.inp');
  detail.value = (it.answer && it.answer.q1 && it.answer.q1.detail) || '';
  detail.placeholder = q1.detailPlaceholder || '';
  heads[1].innerHTML = `<i>Q2</i>${esc(q2.text)}`;
  App.$('.ctx9').innerHTML = App.rich(q2.context);
  const ta = App.$('textarea.ta9');
  ta.value = (it.answer && it.answer.q2 && it.answer.q2.text) || '';
  ta.placeholder = '3줄 정도로 적어주세요';
  App.$$('.sub9')[1].textContent = q2.hint;
  App.$('[data-action="submitAnswer"]').textContent = idx + 1 < data.items.length ? '답 제출하고 다음 파트로' : '답 제출하고 마치기';
}

App.action('submitAnswer', async () => {
  const it = (data && data.items[idx]) || null;
  const choice = App.$('.opt9.on');
  const detail = App.$('input.inp').value.trim();
  const text = App.$('textarea.ta9').value.trim();
  if (!choice) { App.toast('보기 중 하나를 골라주세요'); return false; }
  if (!text) { App.toast('까다로운 부분을 어떻게 만들지 적어주세요'); App.$('textarea.ta9').focus(); return false; }
  const body = { answers: { q1: { choice: choice.dataset.value || App.text(choice), detail }, q2: { text } } };
  const r = await api.call('team.answer', { partId: it ? it.partId : 'prt_1' }, body);
  if (data && data.items[idx]) data.items[idx].status = 'done';
  if (r.nextPartId && data) {
    idx = Math.max(0, data.items.findIndex(x => x.partId === r.nextPartId));
    render();
    App.toast('다음 파트 질문이에요');
  } else {
    App.toast('답을 모두 보냈어요 · 다른 후보를 기다려요');
    App.go(App.screen('09-1-part-split'));
  }
  return false;
});

async function load() {
  const d = await App.run(null, () => api.call('team.questions'));   // 실패하면 토스트 + 이미 지난 단계면 화면 이동
  if (d === false) return;
  data = d;
  if (IE_CONFIG.useMock) return;                       // 목업 모드: 화면의 디자인 예시 그대로
  if (!data.items.length) { App.go(App.screen('09-1-part-split')); return; }
  const i = data.items.findIndex(x => x.status !== 'done');
  // 이미 다 답한 사람이 9-2를 다시 열면(뒤로 가기 등) 마지막 파트를 "답하는 중"처럼 다시 보여줘서
  // 같은 파트에 두 번 제출하게 됐다 — 제출 직후와 같이 9-1로 돌려보낸다.
  if (i < 0) { App.toast('답을 모두 보냈어요 · 다른 후보를 기다려요'); App.go(App.screen('09-1-part-split')); return; }
  idx = i;
  // 추가 질문은 5분 제한인데 상단 타이머가 화면에 박아둔 값(08:10)이라 남은 시간이 안 보였다
  if (data.remainingSec != null) App.setTimer(data.remainingSec);
  render();
}
load();

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'stage.changed' && ev.data.stage.id !== 'team.questions') {
    const want = App.stageScreen(ev.data.stage, App.state.role, App.state.isLeader);
    if (want) App.go(App.screen(want));
  }
});
