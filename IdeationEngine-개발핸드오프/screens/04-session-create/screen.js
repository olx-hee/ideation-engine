/* 4 세션 만들기 */
let FREE_MAX = 30;   // 무료 한도 — 실서버 모드에서는 billing.plan 값으로 바꾼다
const topic = App.$('.page input.inp');
const criteria = App.$$('.page input.inp').pop();
const mini = App.$('input.mini');
const timeCard = mini.closest('.card');
const memberCard = App.$('.stepper').closest('.card');
const memberNum = App.$('.stepper b');
App.$('.stepper').dataset.min = 2; App.$('.stepper').dataset.max = 8;
if (!IE_CONFIG.useMock) { topic.value = ''; criteria.value = ''; topic.focus(); }   // 실서버 모드: 디자인 예시 문구를 지우고 시작

timeCard.addEventListener('ie:chip', (e) => { const m = parseInt(e.detail, 10); if (!isNaN(m)) mini.value = m; });
mini.addEventListener('input', () => {
  if (+mini.value > FREE_MAX) { mini.value = FREE_MAX; App.toast('무료 플랜은 30분까지예요. 더 길게 하려면 Pro가 필요해요'); }
  timeCard.querySelectorAll('.chips .chip:not(.lock)').forEach(c => c.classList.toggle('on', parseInt(c.textContent, 10) === +mini.value));
});
memberCard.addEventListener('ie:stepper', (e) => memberCard.querySelectorAll('.chips .chip').forEach(c => c.classList.toggle('on', +c.textContent === e.detail)));
memberCard.addEventListener('ie:chip', (e) => { memberNum.textContent = e.detail; });

if (!IE_CONFIG.useMock) {
  api.call('billing.plan').then(p => {
    const max = p && p.limits ? p.limits.maxSessionMinutes : null;
    if (max) { FREE_MAX = max; mini.max = max; }
    if (p && p.limits && p.limits.unlimitedDuration) {   // PRO: 잠금 칩 풀기
      App.$$('.chips .chip.lock').forEach(c => { c.classList.remove('lock'); c.querySelector('.pro')?.remove(); });
      FREE_MAX = 24 * 60;
    }
  }).catch(() => {});
}

App.action('createSession', async () => {
  const body = {
    topic: topic.value.trim(),
    durationMin: +mini.value || null,
    maxMembers: +memberNum.textContent,
    criteria: criteria.value.trim() || null,
  };
  if (!body.topic) { App.toast('이번 회의에서 정할 것을 적어주세요'); topic.focus(); return false; }
  const s = await api.call('session.create', {}, body);
  // 새 방이니 participantId·isLeader도 이 방 값으로 덮어쓴다 — 예전 세션 값이 남아 있으면 다른
  // 방의 참가자 id로 내 이벤트를 판별하거나(내보내짐 안내를 놓침) 팀장 화면으로 잘못 간다.
  App.save({ sessionId: s.sessionId, code: s.code, inviteUrl: s.inviteUrl, role: 'host',
    participantId: s.me.participantId, isLeader: false });
});
