/* A3 프로필 수정 */
const [nick, strength] = App.$$('.mpmain input.inp');
const avatar = App.$('.avrow .avatar');

App.action('saveProfile', async () => {
  const body = { nickname: nick.value.trim(), strength: strength.value.trim() || null, desiredRole: App.text(App.$('.chips .chip.on')) || null, skills: App.$$('.grp .sk.on').map(App.text) };
  if (!body.nickname) { App.toast('닉네임을 적어주세요'); nick.focus(); return false; }
  await api.call('profile.update', {}, body);
  App.$('.mphead .badge').textContent = '✓ 저장됨 · 방금';
  App.toast('저장했어요 · 다음 세션부터 반영돼요');
  return false;
});
App.action('changeAvatar', async () => {
  const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
  f.onchange = async () => {
    const file = f.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { App.toast('5MB 이하 이미지만 올릴 수 있어요', 'error'); return; }
    const fd = new FormData(); fd.append('file', file);
    const r = await App.run(null, () => api.call('profile.avatarUpload', {}, fd));
    if (r) { avatar.style.background = `center/cover no-repeat url(${IE_CONFIG.useMock ? URL.createObjectURL(file) : r.avatarUrl})`; avatar.textContent = ''; }
  };
  f.click(); return false;
});
App.action('deleteAvatar', async () => {
  await api.call('profile.avatarDelete');
  avatar.style.background = ''; avatar.textContent = (nick.value.trim() || '?')[0];
  return false;
});
async function load() {
  App.loadAccountSide();
  const p = await api.call('profile.get');
  await App.renderSkillChips(p);          // 역할 · 스킬 칩을 서버 목록으로
  nick.value = p.nickname; strength.value = p.strength || '';
  App.$$('.chips .chip').forEach(c => c.classList.toggle('on', App.text(c) === p.desiredRole));
  App.$$('.grp .sk').forEach(s => { const on = p.skills.includes(App.text(s)); s.classList.toggle('on', on); s.textContent = (on ? '✓ ' : '') + App.text(s); });
}
if (!IE_CONFIG.useMock) load();
