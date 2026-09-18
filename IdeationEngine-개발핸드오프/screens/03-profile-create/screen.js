/* 3 프로필 만들기 (회원만) */
const [nick, strength] = App.$$('.page input.inp');
if (!IE_CONFIG.useMock && App.requireLogin()) {
  // 실서버 모드: 디자인 예시(노형원 · 예시 역할/스킬)를 지우고 가입할 때 적은 닉네임으로 시작
  nick.value = (App.state.user && App.state.user.nickname) || '';
  strength.value = '';
  App.$$('.chips .chip.on').forEach(c => c.classList.remove('on'));
  App.$$('.grp .sk.on').forEach(sk => { sk.classList.remove('on'); sk.textContent = App.text(sk); });
  App.renderSkillChips({});   // 역할 · 스킬 칩을 서버 목록(meta.skills)으로
}

App.action('saveProfile', async () => {
  const body = {
    nickname: nick.value.trim(),
    strength: strength.value.trim() || null,
    desiredRole: App.text(App.$('.chips .chip.on')) || null,
    skills: App.$$('.grp .sk.on').map(App.text),
  };
  if (!body.nickname) { App.toast('닉네임을 적어주세요'); nick.focus(); return false; }
  if (!body.desiredRole) { App.toast('맡고 싶은 역할을 골라주세요'); return false; }
  if (!body.skills.length) { App.toast('할 수 있는 것을 1개 이상 골라주세요'); return false; }
  if (!App.requireLogin()) return false;
  await api.call('profile.update', {}, body);
  App.toast('프로필을 저장했어요');
  App.go(App.returnTo(App.screen('01-1-landing-logged-in')));
  return false;
});
