# 결정 반영: 회원만 입장 · 초대 링크 = 방 코드(6자리) · 로그인 유지 · 재접속
from ho_screens import SCREENS, GROUPS, R

K = {s['key']: s for s in SCREENS}

# 세션 화면이 서버 단계와 맞는지 확인할 때 쓰는 단계 id (body data-stage)
STAGE_OF = {'05-lobby-host': 'lobby', '06-lobby-participant': 'lobby',
            '07-1-icebreak-q1-discomfort': 'icebreak', '07-2-icebreak-q2-news': 'icebreak', '07-3-icebreak-q3-change': 'icebreak',
            '07-4-icebreak-q4-services': 'icebreak', '07-5-icebreak-q5-wrapup': 'icebreak', '07-6-icebreak-host': 'icebreak',
            '08-6w-vote-wait': 'diverge.vote',
            '08-t1-time-up': 'icebreak diverge.write diverge.board diverge.comment diverge.review diverge.vote diverge.result team.split team.questions team.assign report',
            '08-t2-host-advance': 'diverge.write diverge.board diverge.comment diverge.review diverge.vote',
            '08-t3-review-pending': 'diverge.review',
            '07-7-diverge-materials': 'diverge.write', '08-1-idea-write': 'diverge.write', '08-2-idea-recommend': 'diverge.write',
            '08-3-idea-board': 'diverge.board', '08-4-idea-comments': 'diverge.comment', '08-5-ai-review': 'diverge.review',
            '08-6-vote': 'diverge.vote', '08-7-vote-result-host': 'diverge.result'}

# 화면 문구 바꾸기 (디자인에도 반영 필요 — 사용자에게 안내)
BOARD_EDITS = {
    '1': [('로그인하면 프로필·지난 세션 기록이 저장돼요', '세션을 만들거나 방에 들어가려면 로그인이 필요해요')],
    '5': [('>7K2X9</div>', '>7K2X9M</div>'), ('ideationengine.app/s/7K2X9<', 'ideationengine.app/s/7K2X9M<')],
    'A1': [('      <p class="alt" style="margin-top:8px"><a style="font-weight:500;color:var(--muted)">로그인 없이 코드로 입장 →</a></p>\n', '')],
}

# ───────── 1 랜딩 ─────────
K['01-landing'].update(
 rules=[R('<button class="btn lg">＋ 세션 만들기', '＋ 세션 만들기', go='04-session-create', action='needLogin'),
        R('<button class="btn ghost lg">→ 코드로 입장', '→ 코드로 입장', go='02-join-code'),
        R('<button class="btn soft">로그인', '로그인', go='A1-login'),
        R('<button class="btn text">회원가입', '회원가입', go='A2-signup'),
        R('<span class="pbtn">', '오른쪽 위 프로필 버튼(로그인 전)', go='A1-login')],
 front=['모든 버튼 이동 연결',
        '"세션 만들기": 로그인 안 했으면 로그인 화면(A1)으로 → 로그인하면 세션 만들기(4)로 돌아옴',
        '"코드로 입장": 코드는 먼저 적게 하고, 입장 버튼을 누를 때 로그인 확인(2번 화면)',
        '앱을 다시 열었을 때 로그인 유지: 저장된 토큰이 있거나, 없어도 리프레시 쿠키로 새 토큰을 받으면 로그인 상태 랜딩(1-1)으로 이동'],
 todo=[],
 load=['auth.refresh'], acts=[],
 backend=['이 화면이 서버에 하는 일은 <b>로그인 유지 확인</b> 하나예요. 브라우저에 액세스 토큰이 없으면 <code>POST /auth/refresh</code>를 불러서, 리프레시 쿠키가 살아 있으면 새 토큰을 받고 1-1로 넘어가요.',
          '<b>"로그인 유지" 체크</b>에 따라 리프레시 쿠키 수명이 달라요: 체크하면 30일, 안 하면 브라우저를 닫을 때까지.',
          '게스트 입장은 없어요. 세션 만들기·방 입장 모두 <b>회원가입 + 로그인 + 프로필</b>이 필요해요.'],
 js=r'''/* 1 랜딩 */
// 로그인 유지: 토큰이 있거나 리프레시 쿠키로 새로 받을 수 있으면 로그인 상태 랜딩으로
if (!IE_CONFIG.useMock) {
  (async () => { if (App.state.accessToken || await api.refresh()) App.go(App.screen('01-1-landing-logged-in')); })();
}
// 세션 만들기는 로그인 필요 → 안 했으면 로그인 후 4번으로 돌아오게
App.action('needLogin', async () => (App.requireLogin('../04-session-create/index.html') ? undefined : false));
''')

# ───────── 1-1 랜딩 (로그인 상태) ─────────
K['01-1-landing-logged-in'].update(
 rules=[R('<button class="btn lg">＋ 세션 만들기', '＋ 세션 만들기', go='04-session-create', action='needLogin'),
        R('<button class="btn ghost lg">→ 코드로 입장', '→ 코드로 입장 (진행 중인 세션이 있으면 "↩ 세션으로 돌아가기")', go='02-join-code', action='joinOrRejoin'),
        R('<div class="mi hover">', '메뉴: 프로필 수정', go='A3-profile-edit'),
        R('<div class="mi">지난 세션 기록', '메뉴: 지난 세션 기록', go='A4-session-history'),
        R('<div class="mi">계정 설정', '메뉴: 계정 설정', go='A5-account-settings'),
        R('<div class="mi" style="color:var(--key-700);font-weight:500">', '메뉴: Pro로 업그레이드', go='A5-account-settings'),
        R('<div class="mi out">', '메뉴: 로그아웃', go='01-landing', action='logout')],
 front=['프로필 버튼으로 팝오버 열기/닫기, 바깥 누르면 닫힘 (실서버 모드는 닫힌 상태로 시작)',
        '실서버 모드: 화면을 열면 예시 데이터(노형원 등)를 먼저 지우고 /me 값으로 채움 — 이름·이메일·요금제·아바타 글자/사진·역할·스킬(최대 3개 + "+N")·지난 세션 수',
        '프로필이 없으면 "아직 프로필이 없어요 · 만들기"로 바꿔 보여줌',
        'PRO 회원이면 "Pro로 업그레이드" 메뉴 숨김',
        '<b>재접속</b>: 참가 중인 세션(activeSession)이 있으면 "→ 코드로 입장" 버튼이 "↩ 세션으로 돌아가기"로 바뀌고, 누르면 지금 단계 화면으로 바로 이동',
        '로그인이 안 됐거나 만료됐으면(리프레시 실패) 토큰 지우고 랜딩(1)으로',
        '로그아웃: 서버 요청이 실패해도 이 브라우저의 로그인 정보는 지우고 랜딩으로'],
 todo=[],
 load=['auth.refresh', 'auth.me'], acts=[('메뉴: 로그아웃', ['auth.logout'])],
 backend=['<b>내 계정 요약(/me)</b> 하나로 팝오버와 랜딩을 채운다: 이름·이메일·요금제·사진, 프로필 요약(없으면 null + profileComplete=false), 지난 세션 수, <b>참가 중인 세션(activeSession)</b>.',
          '<b>activeSession</b>은 재접속용이에요. 내가 참가자로 등록돼 있고 아직 끝나지 않은 세션이 있으면 그 세션의 id·방 코드·내 역할·현재 단계를 준다. 없으면 null.',
          '액세스 토큰이 만료돼서 401을 주면, 프론트가 <code>/auth/refresh</code>를 한 번 부르고 다시 요청해요.',
          '로그아웃은 리프레시 토큰을 무효화하고 쿠키를 지운다. 액세스 토큰이 만료된 상태여도 성공해야 해요.'],
 js=r'''/* 1-1 랜딩 (로그인 상태) */
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

App.action('logout', async () => {
  try { await api.call('auth.logout'); } catch (e) { /* 서버 실패해도 이 브라우저에서는 로그아웃 */ }
  App.logoutLocal();
});
''')

# ───────── 2 방 코드 입장 ─────────
K['02-join-code'].update(
 who='로그인한 회원 (프로필 작성 완료)',
 summary='진행자에게 받은 6자리 방 코드나 초대 링크(https://ideationengine.app/s/방코드)로 방에 들어간다. 로그인과 프로필이 없으면 먼저 거기로 보냈다가 돌아온다. 이미 들어갔던 방이면 재접속.',
 rules=[R('<button class="btn block" style="margin-top:28px">입장하기', '입장하기 → (Enter)', action='join'),
        R('<button class="btn ghost">붙여넣기', '붙여넣기', action='pasteLink'),
        R('<span class="pbtn">', '프로필 버튼', go='A1-login')],
 front=['방 코드 6칸: 한 글자씩 자동 이동·대문자 변환·영문/숫자만·지우면 앞 칸·붙여넣기 한 번에 채우기, Enter로 입장',
        '실서버 모드: 디자인 예시로 채워진 "7K2"를 지우고 첫 칸에 커서',
        '초대 링크 붙여넣기(버튼 또는 직접 입력) → 링크에서 방 코드를 꺼내 6칸에 채움',
        '<b>초대 링크로 앱을 연 경우</b>: <code>/s/7K2X9M</code> → 이 화면을 <code>?code=7K2X9M</code>로 열어 코드가 채워진 상태로 시작 (서버 설정은 아래 "배포 설정")',
        '<b>로그인 안 했으면</b> 로그인 화면으로 → 로그인 후 코드가 채워진 채로 돌아와 자동 입장',
        '<b>프로필이 없으면</b>(PROFILE_REQUIRED) 프로필 만들기로 → 저장 후 돌아와 자동 입장',
        '<b>재접속</b>: 이미 들어갔던 방이면 서버가 rejoined=true와 현재 단계를 주고, 그 단계 화면으로 바로 이동 (대기실·아이스브레이킹·발산…)',
        '진행자가 자기 방 코드로 들어오면 진행자 화면으로',
        '에러(없는 코드·가득 참·이미 시작·내보내짐)는 서버 문구를 토스트로'],
 todo=[],
 load=[], acts=[('입장하기', ['session.lookup', 'session.join'])],
 backend=['<b>게스트 입장 없음.</b> 방 찾기·입장 모두 로그인 회원 토큰이 필요해요(없으면 401).',
          '<b>초대 링크 = 방 코드.</b> 링크는 <code>https://ideationengine.app/s/{방 코드}</code>이고 따로 초대 토큰은 없어요. 방 코드는 대문자·숫자 6자리, 대소문자 구분 없이 찾기.',
          '<b>방 찾기</b>(<code>GET /sessions/lookup?code=</code>): 방이 있는지·들어갈 수 있는지 확인. 이미 참가 중인 사람이면 <code>alreadyJoined: true</code>를 주고 가득 참/이미 시작 에러를 주지 않아요.',
          '<b>입장</b>(<code>POST /sessions/{id}/join</code>)은 처음 입장과 재접속을 한 API로 처리해요.<br>· 처음: 프로필 확인(없으면 409 PROFILE_REQUIRED) → 인원·시작 여부 확인 → 참가자 등록 → 프로필 스냅샷 → 대기실에 participant.joined(닉네임 포함)<br>· 재접속(이미 참가자): 새로 만들지 않고 200 + <code>rejoined: true</code> + 현재 status·stage, 대기실에는 participant.online만<br>· 내보내진 사람: 403 KICKED',
          '같은 사람이 동시에 두 번 눌러도 참가자는 1명만(유니크: session_id + user_id). 마지막 자리 동시 입장은 트랜잭션으로.',
          '방 코드 무차별 대입 방지: 사용자·IP당 요청 횟수 제한.',
          '<b>배포 설정</b>: 웹 서버에서 <code>/s/{방 코드}</code> 주소를 <code>/screens/02-join-code/index.html?code={방 코드}</code>로 연결(리라이트)해 주세요.'],
 events=['participant.joined', 'participant.online'],
 js=r'''/* 2 방 코드 입장 — 회원만 · 초대 링크 = 방 코드 · 재접속 */
const CODE_LENGTH = 6;
const cells = App.$$('.codebox input');
const link = App.$('.panel input.inp');
const params = new URLSearchParams(location.search);

function setCode(code) {
  const c = String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, CODE_LENGTH);
  cells.forEach((el, i) => { el.value = c[i] || ''; el.classList.toggle('f', !!c[i]); });
  (cells.find(el => !el.value) || cells[CODE_LENGTH - 1]).focus();
}
/** 초대 링크(https://…/s/7K2X9M) 또는 코드 그대로 → 방 코드 */
function codeFrom(text) {
  const v = String(text || '').trim();
  const m = v.match(/\/s\/([0-9A-Za-z]{6})(?:[/?#]|$)/);
  if (m) return m[1];
  return /^[0-9A-Za-z]{6}$/.test(v) ? v : '';
}

if (params.get('code')) setCode(params.get('code'));
else if (!IE_CONFIG.useMock) setCode('');   // 목업 모드는 디자인 예시(7K2) 그대로

link.addEventListener('input', () => { const c = codeFrom(link.value); if (c) setCode(c); });
App.action('pasteLink', async () => {
  try { link.value = await navigator.clipboard.readText(); const c = codeFrom(link.value); if (c) setCode(c); else App.toast('초대 링크나 방 코드가 아니에요'); }
  catch (e) { App.toast('붙여넣기 권한이 없어요. 칸에 직접 붙여넣어 주세요'); link.focus(); }
  return false;
});

App.action('join', async () => {
  const code = cells.map(c => c.value).join('').toUpperCase();
  if (code.length !== CODE_LENGTH) {
    App.toast('방 코드 6자리를 모두 넣어주세요');
    (cells.find(c => !c.value) || cells[0]).focus();
    return false;
  }
  const back = `../02-join-code/index.html?code=${code}&auto=1`;
  if (!App.requireLogin(back)) return false;                       // 로그인 → 돌아와서 자동 입장

  const room = await api.call('session.lookup', { query: { code } });
  let r;
  try {
    r = await api.call('session.join', { sessionId: room.sessionId }, { code });
  } catch (err) {
    if (err.code === 'PROFILE_REQUIRED') {                          // 프로필 → 돌아와서 자동 입장
      App.toast('입장하기 전에 프로필을 먼저 만들어 주세요');
      App.go(App.screen('03-profile-create') + '?returnTo=' + encodeURIComponent(back));
      return false;
    }
    throw err;
  }
  App.save({ sessionId: room.sessionId, role: r.role, participantId: r.participantId });
  if (r.rejoined) App.toast('다시 들어왔어요');
  App.go(App.screen(App.stageScreen(r.session.stage, r.role) || '06-lobby-participant'));
  return false;
});

[...cells, link].forEach(el => el.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); App.$('[data-action="join"]').click(); }
}));
if (params.get('auto') === '1' && App.state.accessToken) App.$('[data-action="join"]').click();
''')

# ───────── 3 프로필 만들기 (회원만) ─────────
K['03-profile-create'].update(
 who='로그인한 회원 (가입 직후 · 프로필 없이 입장하려던 사람)',
 front=['역할 칩 1개 선택, 스킬 칩 여러 개 선택(✓ 표시)', '닉네임·역할·스킬 1개 이상 없으면 막기 (입장 조건과 같음)',
        '로그인 안 했으면 로그인 화면으로 (실서버 모드)', '실서버 모드: 디자인 예시(노형원·예시 역할/스킬)를 지우고, 가입 때 적은 닉네임으로 시작', '저장 후 돌아갈 곳(returnTo)이 있으면 그곳으로(예: 방 코드 입장 → 자동 입장), 없으면 로그인 상태 랜딩(1-1)'],
 todo=['스킬 칩 목록을 /meta/skills 로 그리기(지금은 HTML에 고정)'],
 load=['meta.skills'], acts=[('프로필 저장', ['profile.update'])],
 backend=['<b>역할·스킬 목록</b>은 서버에서 내려주면 앱을 새로 배포하지 않고도 스킬을 늘릴 수 있다.',
          '프로필은 계정에 저장된다(게스트 프로필은 없음). <b>닉네임 + 맡고 싶은 역할 + 스킬 1개 이상</b>이 있어야 profileComplete=true이고, 그래야 세션 만들기·입장이 된다.',
          '세션에 처음 입장할 때 프로필을 <b>복사(스냅샷)</b>해 둔다. 세션 중에 프로필을 고쳐도 AI 판단이 흔들리지 않게.',
          'AI에게 스킬 정보를 보낼 때는 이름을 빼고 "웹 화면 2명"처럼 <b>인원 수로만</b> 보낸다.'],
 js=r'''/* 3 프로필 만들기 (회원만) */
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
''')

# ───────── A1 로그인 ─────────
K['A1-login'].update(
 summary='이메일/비밀번호 또는 Google·카카오로 로그인한다. 세션을 만들거나 방에 들어가려면 로그인이 필요하다.',
 rules=[R('<button class="btn block lg" style="margin-top:20px">로그인', '로그인 (Enter)', action='login'),
        R('<button class="btn google">', 'Google로 계속', action='oauth'),
        R('<button class="btn kakao">', '카카오로 계속', action='oauth'),
        R('<a>회원가입', '회원가입', action='goSignup'),
        R('<span class="back">', '← 처음으로', go='01-landing'),
        R('<a>비밀번호 찾기', '비밀번호 찾기', action='resetPw')],
 front=['이메일·비밀번호 로그인, Enter로 로그인, 비밀번호 보기(👁)',
        '<b>로그인 상태 유지</b> 체크 → 브라우저를 닫아도 로그인 유지(서버 리프레시 쿠키 30일 + 브라우저 저장소)',
        '로그인 후 돌아갈 곳(returnTo)이 있으면 그곳으로(세션 만들기·방 입장), 없으면 1-1',
        '회원가입으로 갈 때도 돌아갈 곳을 이어서 넘김', '비밀번호 찾기 메일',
        '"로그인 없이 코드로 입장" 링크 삭제(게스트 입장 없음)'],
 todo=['소셜 로그인: 소셜 로그인 창 열기 → 콜백 페이지에서 code 받아 auth.oauth 호출 (OAuth 앱 등록 후)', '에러 문구를 입력칸 아래에 표시(지금은 토스트)'],
 load=[], acts=[('로그인', ['auth.login']), ('Google/카카오', ['auth.oauth']), ('비밀번호 찾기', ['auth.passwordReset'])],
 backend=['<b>이메일 로그인</b>: 비밀번호 해시를 비교해서 맞으면 <b>액세스 토큰</b>(본문, 약 1시간)과 <b>리프레시 토큰</b>(httpOnly 쿠키)을 준다. 연속 실패는 횟수 제한.',
          '<b>로그인 유지</b>: remember=true면 리프레시 쿠키 30일, false면 브라우저를 닫으면 사라지는 쿠키. 액세스 토큰이 만료되면 프론트가 <code>POST /auth/refresh</code>로 새로 받는다(회전 방식 — auth.refresh 명세 참고).',
          '<b>소셜 로그인</b>: 프론트가 받은 인가 code를 서버가 Google/카카오에 확인하고, 처음이면 계정을 만들고 isNewUser=true → 프론트가 프로필 만들기(3)로.',
          '<b>비밀번호 찾기</b>는 가입 여부를 들키지 않도록 항상 같은 응답.'],
 js=r'''/* A1 로그인 */
const email = App.$('.form input.inp');
const pw = App.$('.form label.pw input');

App.action('login', async () => {
  const remember = App.$('.check .box').classList.contains('on');
  const body = { email: email.value.trim(), password: pw.value, remember };
  if (!body.email || !body.password) { App.toast('이메일과 비밀번호를 입력해 주세요'); return false; }
  const r = await api.call('auth.login', {}, body);
  App.save({ remember, accessToken: r.accessToken, user: r.user });
  App.go(App.returnTo(App.screen('01-1-landing-logged-in')));
  return false;
});
App.action('goSignup', async () => { App.go(App.withReturnTo(App.screen('A2-signup'))); return false; });
App.action('oauth', async (el) => {
  const provider = el.classList.contains('kakao') ? 'kakao' : 'google';
  App.toast(`${provider === 'kakao' ? '카카오' : 'Google'} 로그인은 OAuth 앱 등록 후 연결돼요 (auth.oauth)`);
  return false;
});
App.action('resetPw', async () => {
  if (!email.value.trim()) { App.toast('이메일을 먼저 적어주세요'); email.focus(); return false; }
  await api.call('auth.passwordReset', {}, { email: email.value.trim() });
  App.toast('비밀번호 재설정 메일을 보냈어요');
  return false;
});
[email, pw].forEach(el => el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) App.$('[data-action="login"]').click(); }));
''')

# ───────── A2 회원가입: 돌아갈 곳 이어주기 ─────────
a2 = K['A2-signup']
a2['rules'] = [r for r in a2['rules'] if r[0] not in ('<button class="btn block lg" style="margin-top:16px">가입하고', '<a>로그인')] + [
    R('<button class="btn block lg" style="margin-top:16px">가입하고', '가입하고 프로필 만들기 →', action='signup'),
    R('<a>로그인', '로그인', action='goLogin')]
a2['front'] = a2['front'] + ['가입 후 프로필 만들기(3)로 — 로그인 전에 가려던 곳(returnTo)을 이어서 넘김(예: 방 코드 입장)']
a2['js'] = a2['js'].replace(
    "  const r = await api.call('auth.signup', {}, body);\n  App.save({ accessToken: r.accessToken, user: r.user, role: 'host' });\n});",
    "  const r = await api.call('auth.signup', {}, body);\n  App.save({ accessToken: r.accessToken, user: r.user });\n  App.go(App.withReturnTo(App.screen('03-profile-create')));\n  return false;\n});\nApp.action('goLogin', async () => { App.go(App.withReturnTo(App.screen('A1-login'))); return false; });")
assert 'goLogin' in a2['js']

# 5 대기실: 재접속 표시
K['05-lobby-host']['events'] = ['participant.joined', 'participant.online', 'participant.left', 'session.started']
K['05-lobby-host']['js'] = K['05-lobby-host']['js'].replace(
    "  if (ev.type === 'participant.left')",
    "  if (ev.type === 'participant.online') App.$(`.prow[data-participant-id=\"${ev.data.participantId}\"] .dot`)?.style.removeProperty('background');\n  if (ev.type === 'participant.left')")
K['06-lobby-participant']['backend'][0] += ' 새로고침하거나 다시 들어와도(재접속) 서버 단계를 확인해서 이미 시작됐으면 바로 해당 화면으로 보낸다(공통 처리).'
