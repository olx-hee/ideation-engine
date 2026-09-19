/* 1-1 랜딩 (로그인 상태) */
const GRADE_PLAN = { FREE: 'FREE', PRO: 'PRO' };
let active = null;

async function init() {
  // 로그인 확인 (없으면 리프레시 시도 → 실패하면 랜딩으로)
  if (!App.state.accessToken && !(await api.refresh())) { App.go(App.screen('01-landing')); return; }

  // 예시 데이터 지우고, 팝오버는 닫힌 상태로 시작
  const pop = App.$('.pop'); pop.hidden = true;
  App.$('.pbtn').classList.remove('open'); App.$('.pbtn').lastChild.textContent = '▾';
  App.$('.center').classList.remove('dim');
  App.$$('.pop .nm, .pop .em, .pbtn .nm, .pop .pb b, .center .slogan').forEach(el => { el.textContent = ''; });
  App.$('.pop .pb .chips').innerHTML = '';

  const me = await App.run(null, () => api.call('auth.me'));
  if (!me) return;
  App.save({ user: me.user });
  const u = me.user;
  App.$('.pop .nm').textContent = u.nickname;
  App.$('.pop .em').textContent = u.email;
  App.$('.pop .plan-free').textContent = GRADE_PLAN[u.plan] || u.plan;
  App.$('.pbtn .nm').textContent = u.nickname;
  App.$$('.avatar').forEach(av => {
    if (u.avatarUrl) { av.textContent = ''; av.style.background = `center/cover no-repeat url(${u.avatarUrl})`; }
    else av.textContent = (u.nickname || '?')[0];
  });

  const pb = App.$('.pop .pb');
  if (me.profileComplete && me.profileSummary) {
    pb.querySelector('b').textContent = me.profileSummary.desiredRole || '-';
    const chips = pb.querySelector('.chips'); const skills = me.profileSummary.skills || [];
    chips.innerHTML = skills.slice(0, 3).map(v => `<span class="sk on">✓ ${App.escape(v)}</span>`).join('') +
      (skills.length > 3 ? `<span class="sk">+${skills.length - 3}</span>` : '');
  } else {
    pb.innerHTML = '<div class="pk">내 프로필</div><div class="t-sm">아직 프로필이 없어요 · <a data-go="../03-profile-create/index.html" style="color:var(--key);font-weight:700">만들기</a></div>';
  }
  const badge = App.$('.menu .badge'); if (badge) badge.textContent = me.sessionCount;
  if (u.plan === 'PRO') App.$('.menu .mi[style]').hidden = true;

  active = me.activeSession;
  if (active) {
    App.$('.center .slogan').textContent = `진행 중인 세션이 있어요 · ${active.topic}`;
    App.$('[data-action="joinOrRejoin"]').textContent = '↩ 세션으로 돌아가기';
    const endBtn = App.$('[data-action="endActiveSession"]');
    if (endBtn) endBtn.hidden = active.role !== 'host';   // 진행자만 방을 닫을 수 있음
  } else {
    App.$('.center .slogan').textContent = `${u.nickname}님, 오늘 회의를 시작해볼까요?`;
  }
}
if (!IE_CONFIG.useMock) init();

App.action('needLogin', async () => (App.requireLogin('../04-session-create/index.html') ? undefined : false));

// 재접속: 참가 중인 세션이 있으면 방 코드로 다시 입장(서버가 rejoined로 처리) → 지금 단계 화면으로
App.action('joinOrRejoin', async () => {
  if (!active) return; // 없으면 data-go로 2번 화면
  const r = await api.call('session.join', { sessionId: active.sessionId }, { code: active.code });
  App.save({ sessionId: active.sessionId, role: r.role, participantId: r.participantId });
  App.go(App.screen(App.stageScreen(r.session.stage, r.role) || '06-lobby-participant'));
  return false;
});

App.action('endActiveSession', async () => {
  if (!active) return false;
  if (!(await App.confirm('세션을 종료할까요?', `"${active.topic}" 방이 완전히 닫혀요. 다른 참가자들에게도 종료됐다고 바로 알려줘요. 되돌릴 수 없어요.`, '종료하기'))) return false;
  await api.call('session.end', { sessionId: active.sessionId }, {});
  App.toast('세션을 종료했어요');
  active = null;
  App.save({ sessionId: null, role: null, participantId: null, code: null, inviteUrl: null, isLeader: false });
  App.$('.center .slogan').textContent = `${(App.state.user && App.state.user.nickname) || ''}님, 오늘 회의를 시작해볼까요?`;
  App.$('[data-action="joinOrRejoin"]').textContent = '→ 코드로 입장';
  App.$('[data-action="endActiveSession"]').hidden = true;
  return false;
});

App.action('logout', async () => {
  try { await api.call('auth.logout'); } catch (e) { /* 서버 실패해도 이 브라우저에서는 로그아웃 */ }
  App.logoutLocal();
});
