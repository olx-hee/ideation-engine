# 화면 목록 — 폴더 이름, 연결(이동/액션), 화면 스크립트, 문서 내용
# rules: (정확한 태그 시작 문자열, {속성}, 전부적용여부)  → 그 태그에 data-go / data-action 속성을 넣는다
#        속성 자리에 리스트를 주면 같은 태그가 여러 번 나올 때 순서대로 적용
#        'go' 값은 화면 key (자동으로 ../key/index.html)
#        'label' 은 문서의 "이동" 표에만 쓰임

def R(needle, label, go=None, action=None, all=False, extra=None):
    a = {}
    if go: a['go'] = go
    if action: a['action'] = action
    if extra: a.update(extra)
    return (needle, a, all, label)

NOT_MOCK = "if (!IE_CONFIG.useMock) load();"

SCREENS = [
# ───────────────────────── 1 · 시작 ─────────────────────────
dict(key='01-landing', num='1', group='start', title='랜딩', who='누구나 (로그인 전)',
 summary='서비스 첫 화면. 세션을 만들거나(진행자) 방 코드로 들어가거나(팀원), 로그인·회원가입으로 간다.',
 rules=[R('<button class="btn lg">＋ 세션 만들기', '＋ 세션 만들기', go='04-session-create'),
        R('<button class="btn ghost lg">→ 코드로 입장', '→ 코드로 입장', go='02-join-code'),
        R('<button class="btn soft">로그인', '로그인', go='A1-login'),
        R('<button class="btn text">회원가입', '회원가입', go='A2-signup'),
        R('<span class="pbtn">', '오른쪽 위 프로필 버튼(로그인 전)', go='A1-login')],
 front=['모든 버튼 이동 연결', '로그인 토큰이 있으면(목업 모드 제외) 로그인 상태 랜딩(1-1)으로 보냄'],
 todo=['"세션 만들기"는 로그인이 필요함 → 로그인 안 했으면 A1로 보내고 돌아올 주소(returnTo)를 기억하기'],
 load=[], acts=[],
 backend=['이 화면 자체는 서버에 요청하지 않는다. 로그인 여부는 브라우저에 저장된 토큰으로만 판단한다.'],
 js=r'''/* 1 랜딩 */
if (App.state.accessToken && !IE_CONFIG.useMock) App.go(App.screen('01-1-landing-logged-in'));
'''),

dict(key='01-1-landing-logged-in', num='1-1', group='start', title='랜딩 (로그인 상태) · 프로필 팝오버', who='로그인한 회원',
 summary='로그인한 사람이 보는 랜딩. 오른쪽 위 프로필 버튼을 누르면 이름·이메일·요금제·프로필 요약과 메뉴가 나온다.',
 rules=[R('<button class="btn lg">＋ 세션 만들기', '＋ 세션 만들기', go='04-session-create'),
        R('<button class="btn ghost lg">→ 코드로 입장', '→ 코드로 입장', go='02-join-code'),
        R('<div class="mi hover">', '메뉴: 프로필 수정', go='A3-profile-edit'),
        R('<div class="mi">지난 세션 기록', '메뉴: 지난 세션 기록', go='A4-session-history'),
        R('<div class="mi">계정 설정', '메뉴: 계정 설정', go='A5-account-settings'),
        R('<div class="mi" style="color:var(--key-700);font-weight:500">', '메뉴: Pro로 업그레이드', go='A5-account-settings'),
        R('<div class="mi out">', '메뉴: 로그아웃', go='01-landing', action='logout')],
 front=['프로필 버튼으로 팝오버 열기/닫기, 바깥 누르면 닫힘', '메뉴 이동 연결', '로그아웃(토큰 지우기)', '실서버 모드에서 /me 로 이름·이메일·요금제·스킬 채우기'],
 todo=['사진이 있으면 아바타에 사진 표시', '"지난 세션 기록" 숫자 배지를 sessionCount로'],
 load=['auth.me'], acts=[('메뉴: 로그아웃', ['auth.logout'])],
 backend=['<b>내 계정 요약(/me)</b> 하나로 팝오버를 채운다. 이름·이메일·요금제(FREE/PRO)·맡고 싶은 역할·스킬 3개 정도·지난 세션 수.',
          '로그아웃은 서버에 저장된 리프레시 토큰을 지워서, 같은 토큰으로 다시 로그인되지 않게 한다.'],
 js=r'''/* 1-1 랜딩 (로그인 상태) */
async function load() {
  const me = await api.call('auth.me');
  App.$('.pop .nm').textContent = me.user.nickname;
  App.$('.pop .em').textContent = me.user.email;
  App.$('.pop .plan-free').textContent = me.user.plan;
  App.$('.pbtn .nm').textContent = me.user.nickname;
  App.$$('.pop .pb .sk').forEach((s, i) => { const v = me.profileSummary.skills[i]; if (v) s.textContent = '✓ ' + v; else s.remove(); });
  App.$('.pop .pb b').textContent = me.profileSummary.desiredRole;
  App.$('.center .slogan').textContent = `${me.user.nickname}님, 오늘 회의를 시작해볼까요?`;
}
''' + NOT_MOCK + r'''
App.action('logout', async () => {
  await api.call('auth.logout');
  App.save({ accessToken: null, user: null });
});
'''),

dict(key='02-join-code', num='2', group='start', title='방 코드 입장', who='팀원 (로그인 없어도 됨)',
 summary='진행자에게 받은 방 코드나 초대 링크로 방에 들어간다.',
 rules=[R('<button class="btn block" style="margin-top:28px">입장하기', '입장하기 →', action='join'),
        R('<button class="btn ghost">붙여넣기', '붙여넣기', action='pasteLink'),
        R('<span class="pbtn">', '프로필 버튼', go='A1-login')],
 front=['코드 칸: 한 글자씩 자동 이동·대문자 변환·지우면 앞 칸으로·붙여넣기 한 번에 채우기',
        '초대 링크 붙여넣기(클립보드)', '방 찾기 → 입장 → 프로필이 필요하면 3번, 아니면 대기실(6번)'],
 todo=['⚠️ 디자인에는 "6자리 코드"라고 쓰여 있지만 예시 방 코드(7K2X9)는 5자리 — 자릿수를 하나로 정해야 함',
       '초대 링크로 앱을 열었을 때(…/s/7K2X9) 이 화면을 건너뛰고 바로 입장 처리'],
 load=[], acts=[('입장하기', ['session.lookup', 'session.join'])],
 backend=['<b>방 찾기</b>: 코드(또는 초대 링크 토큰)로 방이 있는지, 꽉 찼는지, 이미 시작했는지 알려준다. 코드를 마구 넣어보는 공격을 막기 위해 IP당 요청 횟수를 제한한다.',
          '<b>입장</b>: 로그인한 회원이면 계정으로 참가자를 만들고, 로그인 안 한 사람이면 <b>게스트 토큰</b>을 새로 발급한다. 게스트 토큰은 이 세션 안에서만 쓸 수 있는 임시 신분증이다.',
          '입장하면 대기실의 진행자 화면에 실시간으로 "참여자 추가"를 보낸다(participant.joined).'],
 events=['participant.joined'],
 js=r'''/* 2 방 코드 입장 */
const cells = App.$$('.codebox input');
const link = App.$('.panel input.inp');

App.action('pasteLink', async () => {
  try { link.value = await navigator.clipboard.readText(); }
  catch (e) { App.toast('붙여넣기 권한이 없어요. 직접 붙여넣어 주세요'); link.focus(); }
  return false;
});

App.action('join', async () => {
  const code = cells.map(c => c.value).join('');
  const invite = (link.value.match(/\/s\/([A-Za-z0-9]+)/) || [])[1];
  if (code.length < 5 && !invite) {
    App.toast('방 코드 또는 초대 링크를 넣어주세요');
    (cells.find(c => !c.value) || cells[0]).focus();
    return false;
  }
  const query = invite ? { invite } : { code };
  const room = await api.call('session.lookup', { query });
  const r = await api.call('session.join', { sessionId: room.sessionId }, query);
  App.save({ sessionId: room.sessionId, role: 'participant', participantId: r.participantId, guestToken: r.guestToken || App.state.guestToken });
  App.go(App.screen(r.needsProfile ? '03-profile-create' : '06-lobby-participant'));
  return false;
});
'''),

dict(key='03-profile-create', num='3', group='start', title='프로필 만들기', who='처음 가입한 회원 · 로그인 없이 입장한 팀원',
 summary='닉네임, 한 줄 강점(선택), 맡고 싶은 역할, 할 수 있는 스킬(4그룹 20개)을 적는다. AI가 역할·현실성을 판단할 때 참고한다.',
 rules=[R('<button class="btn lg">프로필 저장', '프로필 저장 →', action='saveProfile'),
        R('<span class="pbtn">', '프로필 버튼', go='01-1-landing-logged-in')],
 front=['역할 칩 1개 선택, 스킬 칩 여러 개 선택(✓ 표시)', '닉네임 비었으면 막기',
        '회원이면 내 프로필 저장, 게스트면 이 세션용 프로필 저장', '저장 후 진행자는 세션 만들기(4), 팀원은 대기실(6)로'],
 todo=['저장 중 버튼 비활성은 공통 처리됨 — 성공 토스트 문구 확정'],
 load=['meta.skills'], acts=[('프로필 저장 (회원)', ['profile.update']), ('프로필 저장 (게스트)', ['guestProfile.update'])],
 backend=['<b>역할·스킬 목록</b>은 서버에서 내려주면 앱을 새로 배포하지 않고도 스킬을 늘릴 수 있다.',
          '회원 프로필은 계정에 저장된다. <b>게스트</b>(로그인 없이 코드로 들어온 사람) 프로필은 그 세션에만 저장된다.',
          '세션이 시작되는 순간 모든 참가자의 프로필을 <b>복사(스냅샷)</b>해 둔다. 세션 중에 누가 프로필을 고쳐도 AI 판단이 흔들리지 않게 하기 위해서다.',
          'AI에게 스킬 정보를 보낼 때는 이름을 빼고 "웹 화면 2명"처럼 <b>인원 수로만</b> 보낸다.'],
 js=r'''/* 3 프로필 만들기 */
const [nick, strength] = App.$$('.page input.inp');

App.action('saveProfile', async () => {
  const body = {
    nickname: nick.value.trim(),
    strength: strength.value.trim() || null,
    desiredRole: App.text(App.$('.chips .chip.on')) || null,
    skills: App.$$('.grp .sk.on').map(App.text),
  };
  if (!body.nickname) { App.toast('닉네임을 적어주세요'); nick.focus(); return false; }
  if (App.state.accessToken || IE_CONFIG.useMock) await api.call('profile.update', {}, body);
  else await api.call('guestProfile.update', {}, body);
  App.toast('프로필을 저장했어요');
  App.go(App.screen(App.state.role === 'participant' ? '06-lobby-participant' : '04-session-create'));
  return false;
});
'''),

dict(key='04-session-create', num='4', group='start', title='세션 만들기', who='진행자 (로그인 회원)',
 summary='이번 회의에서 정할 주제, 세션 시간, 참여 인원, 공모전 심사기준(선택)을 정하고 방을 만든다. 무료는 최대 30분.',
 rules=[R('<button class="btn lg" style="width:100%">세션 만들고', '세션 만들고 방 코드 받기 →', go='05-lobby-host', action='createSession'),
        R('<a class="t-sm" style="color:var(--key);font-weight:700;text-decoration:none">', '업그레이드 →', go='A5-account-settings'),
        R('<a>Pro 알아보기', 'Pro 알아보기 →', go='A5-account-settings'),
        R('<span class="pbtn">', '프로필 버튼', go='01-1-landing-logged-in')],
 front=['시간 칩(10·20·30분) ↔ 직접 입력 칸 연동, 30 넘게 입력하면 30으로 되돌리고 안내', '🔒PRO 칩 누르면 안내 토스트',
        '인원 − / + (2~8) ↔ 인원 칩 연동', '주제 비었으면 막기', '방 만들기 성공 → 방 코드 저장 후 대기실(5)'],
 todo=['주제 입력칸을 여러 줄(textarea)로 할지 결정'],
 load=['billing.plan'], acts=[('세션 만들고 방 코드 받기', ['session.create'])],
 backend=['<b>세션(방) 만들기</b>: 주제·시간·인원을 저장하고, 방 코드와 초대 링크를 만들어 준다. 만든 사람이 진행자가 된다.',
          '<b>요금제 검사는 서버가 최종 판단</b>한다. 화면에서 막아도, 무료 회원이 60분·90분·제한 없음(null)으로 요청하면 403 PLAN_LIMIT.',
          '방 코드는 헷갈리는 글자(0과 O, 1과 I)를 빼고, 현재 열려 있는 방끼리 겹치지 않게 만든다.',
          '"공모전 주제·심사기준"은 선택 입력이며, 뒤에서 AI 검증(8-5)과 추천(8-2)의 참고 자료로 쓴다.'],
 js=r'''/* 4 세션 만들기 */
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
  App.save({ sessionId: s.sessionId, code: s.code, inviteUrl: s.inviteUrl, role: 'host' });
});
'''),

dict(key='05-lobby-host', num='5', group='start', title='대기실 (진행자)', who='진행자',
 summary='방 코드와 초대 링크를 팀원에게 알려주고, 들어온 사람을 확인한 뒤 세션을 시작한다.',
 rules=[R('<button class="btn block lg" style="margin-top:auto">▶ 세션 시작하기', '▶ 세션 시작하기', go='07-1-icebreak-q1-discomfort', action='startSession'),
        R('<button class="btn soft sm">📋 코드 복사', '📋 코드 복사', action='copyCode'),
        R('<button class="btn">🔗 링크 복사', '🔗 링크 복사', action='copyLink'),
        R('<span class="pbtn">', '프로필 버튼', go='01-1-landing-logged-in')],
 front=['방 코드·초대 링크 복사', '참여자 줄 누르면 확인 후 내보내기', '실시간으로 참여자 추가 · 인원 숫자 갱신', '세션 시작 → 진행자 아이스브레이킹 화면(7-6)'],
 todo=['대기실의 세션 시간 문구(30분)를 session.get 값으로'],
 load=['session.get', 'session.participants'],
 acts=[('참여자 줄 → 내보내기', ['session.kick']), ('▶ 세션 시작하기', ['session.start'])],
 backend=['<b>세션 상태</b>와 <b>참여자 목록</b>을 준다. 참여자 목록에는 이름·접속 여부만 넣고 스킬·답변은 넣지 않는다.',
          '누가 들어오거나 나가면 <b>실시간 이벤트</b>로 이 화면에 알려준다(웹소켓). 새로고침 없이 줄이 생긴다.',
          '<b>세션 시작</b>을 누르면: 입장을 닫고 → 타이머를 시작하고 → 참가자 프로필 스냅샷을 확정하고 → 모두에게 session.started 이벤트를 보낸다. 이때 "최근 소식 검색" 같은 AI 작업을 미리 시작해 두면 뒤에서 기다리는 시간이 줄어든다.'],
 events=['participant.joined', 'participant.left', 'session.started'],
 js=r'''/* 5 대기실 (진행자) */
const codeEl = App.$('.roomcode');
const linkInput = App.$('.card input.inp');
if (App.state.code) codeEl.textContent = App.state.code;
if (App.state.inviteUrl) linkInput.value = App.state.inviteUrl.replace(/^https?:\/\//, '');

/* 실서버 모드: 방 코드·초대 링크·참여자 줄을 서버 값으로 (목업 모드는 HTML 예시 그대로) */
async function load() {
  if (!App.state.code) {                       // 재접속이라 브라우저에 저장된 값이 없을 때
    const s = await api.call('session.get');
    codeEl.textContent = s.code;
    linkInput.value = (s.inviteUrl || '').replace(/^https?:\/\//, '');
    App.save({ code: s.code, inviteUrl: s.inviteUrl });
  }
  renderRoster(await api.call('session.participants'));
}
function renderRoster(r) {
  const rows = App.$$('.prow:not(.empty)');
  const tplHost = rows[0], tplMember = rows[1] || rows[0], empty = App.$('.prow.empty');
  rows.forEach(x => x.remove());
  (r.items || []).forEach(it => {
    const host = it.role === 'host';
    const el = (host ? tplHost : tplMember).cloneNode(true);
    el.dataset.participantId = it.participantId;
    el.querySelector('.avatar').textContent = (it.nickname || '?')[0];
    const nameEl = el.children[1];
    if (nameEl.firstChild && nameEl.firstChild.nodeType === 3) nameEl.firstChild.nodeValue = it.nickname + ' ';
    else nameEl.insertBefore(document.createTextNode(it.nickname + ' '), nameEl.firstChild);
    const badge = nameEl.querySelector('.badge.key'); if (badge) badge.hidden = !it.isMe;
    const hint = nameEl.querySelector('.muted'); if (hint) hint.hidden = host || it.isMe;
    el.querySelector('.dot').style.background = it.online ? '' : 'var(--line)';
    list.insertBefore(el, empty);
  });
  if (empty) empty.hidden = (r.items || []).length >= r.maxMembers;
  badge.textContent = `${(r.items || []).length} / ${r.maxMembers}`;
}
if (!IE_CONFIG.useMock) load();

App.action('copyCode', async () => { await App.copy(codeEl.textContent.trim()); return false; });
App.action('copyLink', async () => { await App.copy('https://' + linkInput.value.replace(/^https?:\/\//, '')); return false; });
App.action('startSession', async () => { await api.call('session.start', {}, {}); });

const list = App.$('.prow').parentElement;
const badge = App.$('.badge.ok');
function count() {
  const n = App.$$('.prow:not(.empty)').length;
  const max = badge.textContent.split('/')[1].trim();
  badge.textContent = `${n} / ${max}`;
  const start = App.$('[data-action="startSession"]');
  if (start) { start.classList.toggle('disabled', n < 2); start.title = n < 2 ? '팀원이 1명 이상 들어와야 시작할 수 있어요' : ''; }   // 혼자면 시작 못 함
}
count();

list.addEventListener('click', async (e) => {
  const row = e.target.closest('.prow');
  if (!row || row.classList.contains('empty') || row.querySelector('.badge.key')) return;
  const name = row.children[1].firstChild.textContent.trim();
  if (!(await App.confirm(`${name} 님을 내보낼까요?`, '내보낸 사람은 이 세션에 다시 들어올 수 없어요.', '내보내기'))) return;
  const ok = await App.run(null, () => api.call('session.kick', { participantId: row.dataset.participantId || 'par_02' }));
  if (ok !== false) { row.remove(); count(); }
});

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'participant.joined') {
    const row = document.createElement('div'); row.className = 'prow'; row.dataset.participantId = ev.data.participantId;
    row.innerHTML = `<span class="avatar">${App.escape(ev.data.nickname[0])}</span><span style="flex:1">${App.escape(ev.data.nickname)}</span><span class="dot"></span>`;
    list.insertBefore(row, App.$('.prow.empty')); count();
  }
  if (ev.type === 'participant.left') App.$(`.prow[data-participant-id="${ev.data.participantId}"] .dot`)?.style.setProperty('background', 'var(--line)');
});
'''),

dict(key='06-lobby-participant', num='6', group='start', title='대기실 (참가자)', who='팀원',
 summary='입장이 끝났다는 확인과 내 프로필 요약, 현재 입장 인원을 보며 진행자가 시작하길 기다린다.',
 rules=[],
 front=['진행자가 시작하면(session.started) 자동으로 아이스브레이킹 질문 1(7-1)로 이동', '입장 인원 실시간 갱신(참여자가 들어오거나 나갈 때)', '진행자가 나를 내보내면(participant.kicked) 안내 후 랜딩으로'],
 todo=[],
 load=['session.get'], acts=[],
 backend=['이 화면은 <b>기다리는 화면</b>이라 실시간 이벤트가 핵심이다. 진행자가 시작 버튼을 누르면 서버가 session.started를 보내고, 화면이 스스로 다음 화면으로 넘어간다.',
          '연결이 끊겼다가 다시 붙으면 session.get으로 현재 단계를 다시 확인해서 이미 시작됐으면 바로 이동시킨다.'],
 events=['participant.joined', 'participant.left', 'participant.kicked', 'session.started'],
 js=r'''/* 6 대기실 (참가자) */
const countEl = App.$('.panel .muted.t-sm b');
/* 실서버 모드: 처음 열 때 인원 수를 서버 값으로 (그 뒤에는 입장·나감 이벤트로 갱신) */
if (!IE_CONFIG.useMock) {
  api.call('session.participants').then(r => { countEl.textContent = `${r.items.length} / ${r.maxMembers}`; }).catch(() => {});
  /* 내 프로필 카드(예시 "이세민")를 로그인한 사람으로 */
  api.call('auth.me').then(me => {
    const card = App.$('.panel .me2') || App.$('.panel');
    const nameEl = App.$$('.panel b').find(b => b.textContent.trim().length && !b.textContent.includes('/'));
    if (nameEl) nameEl.textContent = me.user.nickname;
    App.$$('.panel .avatar').forEach(av => { av.textContent = (me.user.nickname || '?')[0]; });
    const chips = App.$('.panel .chips');
    if (chips && me.profileSummary) {
      chips.innerHTML = (me.profileSummary.skills || []).slice(0, 4).map(v => `<span class="sk on">✓ ${App.escape(v)}</span>`).join('');
    }
  }).catch(() => {});
}
realtime.connect(App.sessionId(), async (ev) => {
  if (ev.type === 'session.started') App.go(App.screen('07-1-icebreak-q1-discomfort'));
  if (ev.type === 'participant.kicked' && ev.data.participantId === App.state.participantId) { App.toast('진행자가 방에서 내보냈어요'); App.go(App.screen('01-landing')); }
  if (ev.type === 'participant.joined' || ev.type === 'participant.left') {
    const r = await api.call('session.participants');
    countEl.textContent = `${r.items.length} / ${r.maxMembers}`;
  }
});
'''),

# ───────────────────────── 7 · 아이스브레이킹 ─────────────────────────
dict(key='07-1-icebreak-q1-discomfort', num='7-1', group='ice', title='아이스브레이킹 · 질문 1 불편했던 순간', who='팀원 (진행자도 참여 가능)', chat=True,
 summary='AI와 1:1로 짧게 인터뷰한다. 답이 짧으면 꼬리질문을 1번 하고, 다음 질문(최근 소식)을 준비한다.',
 rules=[R('<button class="btn off">보내기', '보내기 / Enter', action='sendMessage'),
        R('<span class="skip">', '넘어가기', action='skip')],
 front=['보내기·Enter로 답 보내기, 내 말풍선 즉시 추가', 'AI 응답(꼬리질문=연보라, 뜻풀이=하늘색, 끝 안내=초록) 그리기', '질문 번호·진행 막대·"오늘 나눌 이야기" 표시 갱신',
        '팀 진행 실시간 갱신', '진행자가 발산으로 넘기면 자동 이동'],
 todo=[],
 load=['session.get', 'ice.state', 'ice.progress'], acts=[('보내기', ['ice.send']), ('넘어가기', ['ice.skip'])],
 backend=['<b>AI 인터뷰 대화</b>: 사람이 답을 보내면 서버가 AI(저가 모델)에게 "이 답이 충분히 구체적인가?"를 물어서, 짧으면 꼬리질문 1번, 충분하면 다음 질문을 돌려준다. 질문 5개는 순서가 정해져 있다.',
          '<b>답 원문은 본인만</b> 볼 수 있다. 진행자·팀원에게 가는 어떤 API에도 원문을 넣지 않는다. 대신 AI가 답에서 "재료"(짧은 요약)를 뽑아 이름 없이 발산 단계로 넘긴다.',
          '질문 2(최근 소식)는 검색이 필요해서 느릴 수 있다. 세션 시작 때 미리 검색해 두고, 준비가 늦으면 "찾는 중" 메시지를 먼저 보낸 뒤 icebreak.news.ready 이벤트로 알린다.',
          '"팀 진행" 카드는 이름과 "몇 번째 질문인지"만 보낸다.'],
 events=['icebreak.progress', 'icebreak.news.ready', 'stage.changed'],
 js=r'''/* 7-1 질문 1 — 공통 채팅 동작은 assets/js/icebreak-chat.js */
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'icebreak.news.ready') App.go(App.screen('07-2-icebreak-q2-news')); // 실제로는 같은 화면에서 카드만 추가하면 됨
});
'''),

dict(key='07-2-icebreak-q2-news', num='7-2', group='ice', title='아이스브레이킹 · 질문 2 최근 소식 카드', who='팀원', chat=True,
 summary='세션 주제 주변의 최근 소식(시장·기술·규제) 3장을 보여주고, 들어봤는지 반응을 받는다. 모르는 말은 "이게 뭐예요?"로 풀이.',
 rules=[R('<button class="btn">보내기', '보내기 / Enter', action='sendMessage'),
        R('<span class="skip">', '넘어가기', action='skip'),
        R('<a>이게 뭐예요?', '이게 뭐예요?', action='explain', all=True)],
 front=['카드별 반응(처음 들어요·들어봤어요·잘 알아요) 선택 → 서버 저장', '"이게 뭐예요?" → 내 질문 말풍선 + 뜻풀이 말풍선, "내가 물어본 말" 갱신', '채팅 공통 동작'],
 todo=[],
 load=['ice.news'], acts=[('반응 버튼', ['ice.react']), ('이게 뭐예요?', ['ice.explain'])],
 backend=['<b>최근 소식 카드</b>: 세션 주제로 실제 검색(예: Brave 검색 API)을 해서 최근 기사·공식 자료를 찾고, <b>검색 결과에 있는 내용만</b> AI가 "쉽게 말하면 / 우리 팀에게" 문장으로 요약한다. 없는 사실을 지어내면 안 된다. 출처 이름·링크·날짜를 꼭 함께 준다.',
          '모든 참가자가 <b>같은 카드 3장</b>을 본다. 세션 시작 때 한 번 만들어 저장해 둔다.',
          '<b>반응</b>은 사람별로 저장하지만, 진행자 화면(7-6)에는 이름 없이 인원 수만 집계해서 보여준다.',
          '<b>뜻풀이</b>는 AI가 짧게 설명하고, 사람이 물어본 단어 목록을 저장한다(나중에 "잘 아는 사람이 1명" 같은 힌트에 쓸 수 있음 — 이름 없이).'],
 events=['icebreak.progress'],
 js=r'''/* 7-2 최근 소식 카드 */
const REACTION = { '처음 들어요': 'new', '들어봤어요': 'heard', '잘 알아요': 'know' };
App.$$('.nc').forEach((c, i) => { c.dataset.cardId = c.dataset.cardId || 'news_' + (i + 1); });

document.addEventListener('ie:reaction', (e) => {
  const card = e.target.closest('.nc'); if (!card) return;
  App.$$('.nc').forEach(c => c.classList.toggle('on', c === card));
  api.call('ice.react', { cardId: card.dataset.cardId }, { reaction: REACTION[e.detail] }).catch(err => App.toast(err.message, 'error'));
});

/* 실서버 모드: 카드 3장을 ice.news로 그린다 (반응·뜻풀이가 서버 카드 id로 가게) */
function renderNews(r) {
  const cards = App.$$('.nc');
  if (!cards.length) return;
  const tpl = cards[0], wrap = tpl.parentElement;
  const fill = (el, text) => { if (!el) return; const b = el.querySelector('b'); el.textContent = ''; if (b) el.appendChild(b); el.appendChild(document.createTextNode(text || '')); };
  cards.forEach(c => c.remove());
  (r.cards || []).forEach((c, i) => {
    const el = tpl.cloneNode(true);
    el.classList.toggle('on', i === 0);
    el.dataset.cardId = c.cardId;
    el.dataset.term = c.title;
    el.querySelector('.ncat').textContent = c.category;
    el.querySelector('.ndate').textContent = (c.source && c.source.publishedAt) || '';
    el.querySelector('.nt').textContent = c.title;
    fill(el.querySelector('.ne'), c.plain);
    fill(el.querySelector('.nteam'), c.forTeam);
    const src = el.querySelector('.nsrc span');
    if (src) {
      const name = (c.source && c.source.name) || '';
      const url = c.source && c.source.url;
      src.innerHTML = '출처 ' + (url ? `<a class="linkish" href="${App.escape(url)}" target="_blank" rel="noopener">${App.escape(name)}</a>` : App.escape(name));
    }
    const pick = { new: 0, heard: 1, know: 2 }[c.myReaction];
    el.querySelectorAll('.rb').forEach((b, n) => b.classList.toggle('on', pick === n));
    wrap.appendChild(el);
  });
  if (r.fallback) App.toast('최근 소식을 찾지 못해 질문 2·3은 건너뛰어요');
}
if (!IE_CONFIG.useMock) api.call('ice.news').then(renderNews).catch(err => App.toast(err.message, 'error'));

App.action('explain', async (el) => {
  const card = el.closest('.nc');
  const term = card.dataset.term || App.text(card.querySelector('.nt')).replace(/^\[예시\]\s*/, '');
  App.chat.bubble('user', null, `"${term}" 이게 뭐예요?`);
  const r = await api.call('ice.explain', {}, { cardId: card.dataset.cardId, term });
  App.chat.bubble('ai', 'explain', r.message.text);
  const asked = App.$('.asked'); if (asked) asked.textContent = r.askedTerms.join(' · ');
  return false;
});
'''),

dict(key='07-3-icebreak-q3-change', num='7-3', group='ice', title='아이스브레이킹 · 질문 3 변화 × 내 경험', who='팀원', chat=True,
 summary='내가 반응한 소식 카드를 요약해서 보여주고, 그 변화 때문에 불편해지거나 가능해질 사람을 묻는다.',
 rules=[R('<button class="btn">보내기', '보내기 / Enter', action='sendMessage'), R('<span class="skip">', '넘어가기', action='skip')],
 front=['채팅 공통 동작(보내기·꼬리질문·넘어가기·진행 갱신)'],
 todo=['질문 속 "반응한 카드 요약"(qlist)을 서버 메시지 데이터로 그리기 — 메시지에 attachments 필드를 두는 것을 제안'],
 load=['ice.state'], acts=[('보내기', ['ice.send']), ('넘어가기', ['ice.skip'])],
 backend=['질문 3은 질문 2에서 이 사람이 누른 <b>반응을 함께 보여주는</b> 질문이다. 서버가 질문 메시지를 만들 때 {"attachments":[{"type":"newsReactions","items":[…]}]} 처럼 카드 요약을 붙여 보내면 프론트가 표로 그린다.',
          '꼬리질문 규칙은 질문 1과 같다(짧거나 모호하면 1번).'],
 events=['icebreak.progress'], js='/* 7-3 — 채팅 공통 동작만 사용 (assets/js/icebreak-chat.js) */\n'),

dict(key='07-4-icebreak-q4-services', num='7-4', group='ice', title='아이스브레이킹 · 질문 4 요즘 쓰는 서비스', who='팀원', chat=True,
 summary='요즘 자주 쓰는 서비스와 아쉬운 점을 묻는다. 힌트 칩은 생각할 방향만 준다.',
 rules=[R('<button class="btn">보내기', '보내기 / Enter', action='sendMessage'), R('<span class="skip">', '넘어가기', action='skip')],
 front=['힌트 칩 누르면 입력칸에 "힌트 — " 채우고 커서 이동', '채팅 공통 동작'],
 todo=['힌트 칩 목록을 질문 메시지 데이터(hints)로 받기'],
 load=['ice.state'], acts=[('보내기', ['ice.send']), ('넘어가기', ['ice.skip'])],
 backend=['질문 메시지에 {"hints":["수업·과제","팀플 협업","돈·결제","학교생활"]}를 붙여 보낸다. 힌트는 답을 대신 채우지 않는다.',
          '답이 충분히 구체적이면 꼬리질문 없이 바로 마지막 질문으로 넘어간다.'],
 events=['icebreak.progress'], js='/* 7-4 — 채팅 공통 동작 + 힌트 칩(app.js 공통) */\n'),

dict(key='07-5-icebreak-q5-wrapup', num='7-5', group='ice', title='아이스브레이킹 · 질문 5 마무리 · 내 재료', who='팀원', chat=True,
 summary='마지막 질문(해보고 싶은 것·피하고 싶은 것) 후 인터뷰 끝. 내 답에서 AI가 뽑은 재료를 나에게만 보여준다.',
 rules=[],
 front=['인터뷰가 끝난 상태(입력칸 비활성)', '실서버 모드: 내 재료를 ice.myMaterials로 다시 그림(피할 것만 회색 태그)', '진행자가 발산으로 넘기면 자동 이동', '진행자면 "진행자 화면으로 가서 팀 재료 보기 →" 링크(7-6) 표시'],
 todo=[],
 load=['ice.state', 'ice.myMaterials'], acts=[],
 backend=['<b>재료 뽑기</b>: 인터뷰가 끝나면 AI가 이 사람의 모든 답에서 짧은 "재료" 문장을 뽑는다. 종류 라벨은 화면에 보이지 않고, <b>"피할 것"만</b> 표시한다(avoid=true).',
          '재료는 <b>이름 없이</b> 발산 단계로 넘어가고, 삭제·빼기 기능은 없다(디자인 결정).',
          '"끝! 수고했어요" 초록 말풍선은 인터뷰 전체에서 이 마지막 한 번만 쓴다(style="good").'],
 events=['stage.changed'],
 js=r'''/* 7-5 마무리 */
App.$('.comp input').disabled = true;
if (App.state.role === 'host') App.chat.hostLink();   // 진행자도 인터뷰를 한 뒤 7-6으로
async function load() {
  const r = await api.call('ice.myMaterials');
  const box = App.$('.mats'); box.querySelectorAll('.mrow').forEach(n => n.remove());
  r.items.forEach(it => {
    const d = document.createElement('div'); d.className = 'mrow' + (it.avoid ? ' av' : '');
    d.innerHTML = (it.avoid ? '<span class="avoid">피할 것</span>' : '') + App.escape(it.text); box.appendChild(d);
  });
}
''' + NOT_MOCK + '\n'),

dict(key='07-6-icebreak-host', num='7-6', group='ice', title='아이스브레이킹 · 진행자', who='진행자 (7-1~7-5 인터뷰를 마친 뒤)',
 summary='팀원별 인터뷰 진도, 최근 소식 반응(인원 수), AI가 비슷한 것끼리 묶은 재료 11개를 보고 "먼저 이야기할 묶음"만 표시한 뒤 발산을 시작한다.',
 rules=[R('<button class="btn ghost sm">다시 묶기', '다시 묶기', action='regroup'),
        R('<button class="btn ghost">이전 단계', '이전 단계', action='prevStage'),
        R('<button class="btn lg">발산 시작', '발산 시작 →', go='07-7-diverge-materials', action='nextStage')],
 front=['"먼저 보기" 토글 → 서버 저장', '다시 묶기 · 이전 단계 · 발산 시작', '실시간 진도 갱신, 늦게 들어온 답 안내'],
 todo=[],
 load=['ice.overview'], acts=[('먼저 보기', ['ice.focus']), ('다시 묶기', ['ice.regroup']), ('이전 단계', ['session.back']), ('발산 시작', ['session.advance'])],
 backend=['<b>진행자 요약</b>: 사람별 진도(몇 번째 질문/완료), 소식 카드 반응 합계(처음·들어봄·잘 앎 <b>인원 수</b>), AI 재료 묶음을 한 번에 준다.',
          '<b>재료 묶기</b>: 모든 사람의 재료를 AI가 비슷한 것끼리 3~5개 그룹으로 묶고, 그룹 제목·한 줄 설명을 만든다. 재료마다 "몇 명이 말했는지"(count)만 붙이고 누가 말했는지는 넣지 않는다.',
          '진행자는 재료를 <b>고르거나 지우지 않는다</b>. "먼저 보기" 표시만 한다. 재료는 전부 발산으로 넘어간다.',
          '인터뷰를 늦게 끝낸 사람의 재료가 들어오면 icebreak.groups.updated로 알리고, 진행자가 "다시 묶기"를 눌러야 반영한다(화면이 갑자기 바뀌지 않게).',
          '<b>단계 넘기기</b>는 진행자만 가능. 넘기면 모두에게 stage.changed를 보내서 모든 화면이 같이 이동한다.'],
 events=['icebreak.progress', 'icebreak.groups.updated', 'stage.changed'],
 js=r'''/* 7-6 아이스브레이킹 진행자 */
App.$$('.gp').forEach((g, i) => { g.dataset.groupId = g.dataset.groupId || 'grp_' + (i + 1); });

document.addEventListener('ie:focus', (e) => {
  const gp = e.target.closest('.gp');
  api.call('ice.focus', { groupId: gp.dataset.groupId }, { focus: e.detail }).catch(err => App.toast(err.message, 'error'));
});
/* 실서버 모드: 진도 · 소식 반응 · 재료 묶음을 ice.overview로 그린다 */
function renderOverview(r) {
  // 1) 인터뷰 진행
  const prs = App.$$('.pr');
  if (prs.length) {
    const box = prs[0].parentElement;
    const tplDone = prs.find(x => !x.querySelector('.bar')) || prs[0];
    const tplBar = prs.find(x => x.querySelector('.bar')) || prs[0];
    prs.forEach(x => x.remove());
    (r.progress || []).forEach(m => {
      const el = (m.done ? tplDone : tplBar).cloneNode(true);
      el.querySelector('.nm2').textContent = m.nickname + (m.isMe ? ' (나)' : '');
      const st = el.querySelector('.st');
      st.textContent = m.done ? '완료' : `${m.step} / 5`;
      st.classList.toggle('done', !!m.done);
      const bar = el.querySelector('.bar i'); if (bar) bar.style.width = (m.step || 0) * 20 + '%';
      box.appendChild(el);
    });
  }
  // 2) 소식 카드 반응 (인원 수만)
  const rxs = App.$$('.rx');
  if (rxs.length) {
    const box = rxs[0].parentElement, tpl = rxs[0];
    rxs.forEach(x => x.remove());
    (r.newsReactions || []).forEach(c => {
      const el = tpl.cloneNode(true);
      const t = el.querySelector('.rx-t');
      t.innerHTML = `<span class="c">${App.escape(c.category)}</span>${App.escape(c.title)}`;
      const total = Object.values(c.counts || {}).reduce((a, b) => a + b, 0) || 1;
      const bars = el.querySelectorAll('.stack3 i');
      [['s-new', 'new'], ['s-heard', 'heard'], ['s-know', 'know']].forEach(([cls, key], i) => {
        const bar = bars[i]; if (bar) { bar.className = cls; bar.style.width = ((c.counts || {})[key] || 0) * 100 / total + '%'; }
      });
      box.appendChild(el);
    });
  }
  // 3) 재료 묶음
  const gps = App.$$('.gp');
  if (gps.length) {
    const box = gps[0].parentElement, tpl = gps[0];
    const tplRow = tpl.querySelector('.mrow');
    gps.forEach(x => x.remove());
    (r.groups || []).forEach(g => {
      const el = tpl.cloneNode(true);
      el.dataset.groupId = g.groupId;
      el.classList.toggle('on', !!g.focus);
      el.querySelector('.gp-h b').textContent = g.title;
      const ai = el.querySelector('.ai2'); if (ai) ai.hidden = !g.aiPick;
      const tg = el.querySelector('.tg');
      if (tg) { tg.hidden = g.focus === null; tg.classList.toggle('on', !!g.focus); tg.textContent = g.focus ? '먼저 보기 ✓' : '먼저 보기'; }
      const d = el.querySelector('.gp-d'); if (d) d.textContent = g.desc || '';
      el.querySelectorAll('.mrow').forEach(x => x.remove());
      (g.items || []).forEach(it => {
        const row = tplRow.cloneNode(true);
        row.innerHTML = `${App.escape(it.text)}<span class="cnt">${it.count}명</span>`;
        if (it.avoid) row.insertBefore(Object.assign(document.createElement('span'), { className: 'avoid', textContent: '피할 것' }), row.firstChild);
        el.appendChild(row);
      });
      box.appendChild(el);
    });
  }
  // 4) 재료 개수 · 힌트
  App.$$('.hmain p').forEach(p => { if (p.textContent.startsWith('발산 재료')) p.textContent = `발산 재료 ${r.materialCount}개 · 비슷한 것끼리 묶었어요`; });
  const hint = App.$$('.sc2 p').find(p => p.textContent.includes('발산 때') || p.textContent.includes('있어요'));
  if (hint && r.hint) hint.textContent = r.hint;
}
async function load() { renderOverview(await api.call('ice.overview')); }
if (!IE_CONFIG.useMock) load();

App.action('regroup', async () => { const r = await api.call('ice.regroup', {}, {}); if (!IE_CONFIG.useMock) renderOverview(Object.assign({ progress: [], newsReactions: [] }, r)); App.toast('재료를 다시 묶었어요'); return false; });
App.action('prevStage', async () => { await api.call('session.back', {}, { from: 'icebreak' }); App.toast('이전 단계로 돌아갔어요'); return false; });
App.action('nextStage', async () => { await api.call('session.advance', {}, { from: 'icebreak' }); });

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'icebreak.progress') {
    const row = App.$$('.pr').find(r => r.querySelector('.nm2').textContent.startsWith(ev.data.nickname));
    if (row && ev.data.done) { row.querySelector('.bar')?.remove(); const st = row.querySelector('.st'); st.textContent = '완료'; st.classList.add('done'); }
    else if (row) { row.querySelector('.bar i').style.width = ev.data.step * 20 + '%'; row.querySelector('.st').textContent = ev.data.step + ' / 5'; }
  }
  if (ev.type === 'icebreak.groups.updated') App.toast(`새 재료 ${ev.data.newMaterials}개가 들어왔어요 · "다시 묶기"로 반영해요`);
});
'''),

dict(key='07-7-diverge-materials', num='7-7', group='ice', title='발산 시작 — 재료 보기', who='모두',
 summary='아이스브레이킹에서 모인 재료 11개(먼저 보기 묶음은 펼치고 나머지는 한 줄)를 보여주며 발산을 시작한다.',
 rules=[R('<button class="btn">제출', '제출', go='08-1-idea-write', action='submitIdea')],
 front=['아이디어 한 줄 적고 제출 → 8-1(내 아이디어 정하기) 칸에 이어서 채워짐'],
 todo=['⚠️ 8-1이 생기면서 이 화면의 입력칸과 역할이 겹침 — "재료 보기 전용"으로 둘지, 8-1 위쪽에 재료 패널로 합칠지 결정 필요'],
 load=['ice.materials'], acts=[],
 backend=['발산 화면 위쪽 재료 패널용 API 하나면 된다. <b>먼저 보기로 표시된 묶음</b>과 <b>나머지 묶음</b>을 나눠서 준다. 이름·출처는 없다.',
          '같은 데이터를 8-1의 "아이스브레이킹 재료 11개 보기" 링크에서도 쓴다.'],
 events=['stage.changed'],
 js=r'''/* 7-7 발산 시작 — 재료 */
/* 실서버 모드: 재료를 ice.materials로 그린다 (먼저 보기 묶음은 펼치고, 나머지는 한 줄) */
function renderMaterials(r) {
  const fg = App.$('.fg'), rest = App.$('.rest');
  const tplCard = App.$('.fgc'), tplRow = App.$('.fgc .mrow'), tplPill = App.$('.rest .pill2');
  if (fg && tplCard && tplRow) {
    fg.innerHTML = '';
    (r.focusGroups || []).forEach(g => {
      const el = tplCard.cloneNode(true);
      el.querySelectorAll('.mrow').forEach(x => x.remove());
      el.querySelector('.h').innerHTML = `${App.escape(g.title)}<em>먼저 보기</em>`;
      (g.items || []).forEach(it => {
        const row = tplRow.cloneNode(true);
        row.innerHTML = (it.avoid ? '<span class="avoid">피할 것</span>' : '') + App.escape(it.text);
        el.appendChild(row);
      });
      fg.appendChild(el);
    });
  }
  if (rest && tplPill) {
    rest.innerHTML = '';
    (r.otherGroups || []).forEach(g => {
      const b = document.createElement('b'); b.textContent = g.title; rest.appendChild(b);
      const wrap = document.createElement('div');
      (g.items || []).forEach(it => {
        const pill = tplPill.cloneNode(true);
        pill.innerHTML = (it.avoid ? '<span class="avoid">피할 것</span>' : '') + App.escape(it.text);
        wrap.appendChild(pill);
      });
      rest.appendChild(wrap);
    });
  }
  App.$$('.matpanel b').forEach(b => { if (b.textContent.startsWith('아이스브레이킹에서 모인 재료')) b.textContent = `아이스브레이킹에서 모인 재료 ${r.total}개`; });
}
if (!IE_CONFIG.useMock) api.call('ice.materials').then(renderMaterials).catch(err => App.toast(err.message, 'error'));

App.action('submitIdea', async () => {
  const inp = App.$('.comp-row input');
  const text = inp.value.trim();
  if (!text) { App.toast('아이디어를 입력해 주세요'); inp.focus(); return false; }
  App.save({ draftIdeas: [...(App.state.draftIdeas || []), text].slice(0, 3) });
});
'''),

# ───────────────────────── 8 · 발산 ─────────────────────────
dict(key='08-1-idea-write', num='8-1', group='div', title='발산 · 내 아이디어 정하기', who='모두 (각자)',
 summary='원래 해보고 싶었던 아이디어를 최대 3개, 하고 싶은 순서대로 적는다. 투표가 끝날 때까지 익명.',
 rules=[R('<button class="btn">이 순서로 제출', '이 순서로 제출', go='08-3-idea-board', action='submitIdeas'),
        R('<button class="btn ghost">AI 추천 보기', 'AI 추천 보기', go='08-2-idea-recommend'),
        R('<a class="linkish">아이스브레이킹 재료', '아이스브레이킹 재료 11개 보기', go='07-7-diverge-materials')],
 front=['↑ ↓로 순위 바꾸기(맨 위·맨 아래는 비활성)', '7-7에서 적은 초안 자동 채우기', '빈 칸은 빼고 1~3개 제출'],
 todo=['세 번째 칸이 비었을 때 "AI 추천으로 채우기" 버튼(참고 목업)을 넣을지 결정', '작성 중 내용 자동 저장 (다시 들어왔을 때 idea.mine으로 채우는 건 구현됨)'],
 load=['idea.mine'], acts=[('이 순서로 제출', ['idea.submit'])],
 backend=['<b>내 아이디어 저장</b>: 최대 3개를 순위와 함께 저장한다. 다시 제출하면 덮어쓴다.',
          '<b>아이디어 주인</b>(누가 냈는지)은 DB에는 저장하지만, <b>투표 결과(8-7) 전까지 어떤 API 응답에도 넣지 않는다</b>. 진행자도 볼 수 없다.',
          '제출 인원 수만 실시간으로 알린다(ideas.submitted). 모두 내면 진행자가 순위표로 넘긴다.'],
 events=['ideas.submitted', 'stage.changed'],
 js=r'''/* 8-1 내 아이디어 정하기 */
const rows = App.$$('.rrow .rin');
if (!IE_CONFIG.useMock) rows.forEach(r => { r.value = ''; });   // 실서버 모드: 디자인 예시 아이디어를 지우고 시작
(App.state.draftIdeas || []).forEach((t, i) => { if (rows[i] && !rows[i].value) rows[i].value = t; });

async function load() { const r = await api.call('idea.mine'); r.ideas.forEach(it => { if (rows[it.rank - 1]) rows[it.rank - 1].value = it.text; }); }
''' + NOT_MOCK + r'''

App.action('submitIdeas', async () => {
  const ideas = rows.map(r => r.value.trim()).filter(Boolean).map((text, i) => ({ rank: i + 1, text, source: 'own' }));
  if (!ideas.length) { App.toast('아이디어를 1개 이상 적어주세요'); rows[0].focus(); return false; }
  await api.call('idea.submit', {}, { ideas });
  App.save({ draftIdeas: [] });
  App.toast('제출했어요. 모두 내면 순위표가 열려요');
});

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'ideas.submitted') App.progress(ev.data.submittedCount, ev.data.memberCount);   // 진행자 막대(T2)
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.board') App.go(App.screen('08-3-idea-board'));
});
'''),

dict(key='08-2-idea-recommend', num='8-2', group='div', title='발산 · AI 추천에서 고르기', who='모두 (각자)',
 summary='생각해 둔 아이디어가 없거나 모자라면, 내 인터뷰를 바탕으로 한 AI 추천에서 골라 1·2·3순위에 넣는다.',
 rules=[R('<button class="btn block" style="margin-top:auto">이 순서로 제출', '이 순서로 제출', go='08-3-idea-board', action='submitIdeas'),
        R('<button class="btn ghost sm">다른 추천 더 보기', '다른 추천 더 보기', action='moreRecs')],
 front=['추천 카드의 1·2·3 버튼 → 순위 배정(같은 순위는 한 카드만, 다시 누르면 해제)', '오른쪽 "내 순위" 목록 자동 갱신', '고른 순서로 제출'],
 todo=['고른 문장 고치기(디자인 문구: "문장은 자유롭게 고쳐도 돼요") — 내 순위 목록을 입력칸으로 바꾸는 방식 제안'],
 load=['idea.recommend'], acts=[('다른 추천 더 보기', ['idea.recommend']), ('이 순서로 제출', ['idea.submit'])],
 backend=['<b>AI 추천</b>: 이 사람의 인터뷰 재료 + 프로필 + 세션 주제로 아이디어 4개와 <b>추천 이유 한 줄</b>을 만든다. 추천 이유에는 <b>본인 답만</b> 인용한다(다른 사람 답 인용 금지).',
          '"다른 추천 더 보기"는 커서로 다음 묶음을 준다. 같은 추천이 반복되지 않게 이미 보여준 것을 기억한다.',
          '추천에서 고른 아이디어도 저장 방식은 8-1과 같다. source="ai"는 통계용으로만 쓰고 <b>팀에게는 똑같이 "내 아이디어"로</b> 보인다.'],
 events=['ideas.submitted'],
 js=r'''/* 8-2 AI 추천에서 고르기 */
let recs = App.$$('.rec');
recs.forEach((rec, i) => {
  rec.dataset.recId = rec.dataset.recId || 'rec_' + (i + 1);
  const on = rec.querySelector('.seg span.on'); if (on) rec.dataset.rank = parseInt(on.textContent, 10);
});
function paint() {
  const picks = [1, 2, 3].map(r => recs.find(x => +x.dataset.rank === r));
  App.$$('.mine li').forEach((li, i) => { li.lastChild.textContent = picks[i] ? App.text(picks[i].querySelector('b')) : '비어 있어요'; });
  recs.forEach(rec => {
    rec.classList.toggle('on', !!rec.dataset.rank);
    rec.querySelectorAll('.seg span').forEach((s, i) => { const on = +rec.dataset.rank === i + 1; s.classList.toggle('on', on); s.textContent = on ? `${i + 1}순위` : i + 1; });
  });
}
document.addEventListener('click', (e) => {
  const s = e.target.closest('.seg span'); if (!s) return;
  const rec = s.closest('.rec'); const r = [...s.parentElement.children].indexOf(s) + 1;
  if (+rec.dataset.rank === r) delete rec.dataset.rank;
  else { recs.forEach(o => { if (+o.dataset.rank === r) delete o.dataset.rank; }); rec.dataset.rank = r; }
  paint();
});

/* 실서버 모드: 추천 카드를 idea.recommend로 그린다 ("더 보기"는 받은 nextCursor로) */
let nextCursor = null;
function renderRecs(items, append) {
  const box = App.$('.recs'), tpl = App.$('.rec');
  if (!box || !tpl) return;
  if (!append) box.innerHTML = '';
  items.forEach(it => {
    const el = tpl.cloneNode(true);
    el.classList.remove('on');
    delete el.dataset.rank;
    el.dataset.recId = it.recommendationId;
    el.querySelector('b').textContent = it.title;
    el.querySelector('p').textContent = '추천 이유 · ' + it.reason;
    el.querySelectorAll('.seg span').forEach((sp, i) => { sp.className = ''; sp.textContent = String(i + 1); });
    box.appendChild(el);
  });
  recs = App.$$('.rec');
  paint();
}
async function load() {
  const r = await api.call('idea.recommend');
  nextCursor = r.nextCursor;
  renderRecs(r.items || [], false);
}
if (!IE_CONFIG.useMock) load();

App.action('moreRecs', async () => {
  if (IE_CONFIG.useMock) { App.toast('새 추천 4개를 받았어요 (목업이라 목록은 그대로예요)'); return false; }
  if (!nextCursor) { App.toast('더 보여드릴 추천이 없어요'); return false; }
  const r = await api.call('idea.recommend', { query: { cursor: nextCursor } });
  nextCursor = r.nextCursor;
  renderRecs(r.items || [], true);
  App.toast(`새 추천 ${(r.items || []).length}개를 받았어요`);
  return false;
});
App.action('submitIdeas', async () => {
  const ideas = [1, 2, 3].map(r => recs.find(x => +x.dataset.rank === r)).filter(Boolean)
    .map((rec, i) => ({ rank: i + 1, text: App.text(rec.querySelector('b')), source: 'ai', recommendationId: rec.dataset.recId }));
  if (!ideas.length) { App.toast('마음에 드는 추천을 1개 이상 골라주세요'); return false; }
  await api.call('idea.submit', {}, { ideas });
});
paint();
'''),

dict(key='08-3-idea-board', num='8-3', group='div', title='발산 · 익명 순위표', who='모두',
 summary='모두의 1·2·3순위를 이름 대신 팀원 A·B·C·D로 보여준다. 줄 순서는 섞여 있고, 내 줄만 나에게 표시된다.',
 rules=[],
 front=['진행자가 댓글 단계로 넘기면 자동 이동', '실서버 모드에서 순위표 다시 그리기(renderBoard)'],
 todo=['아직 제출 안 한 사람이 있을 때의 빈 줄 모양(디자인 필요)'],
 load=['idea.board'], acts=[],
 backend=['<b>익명 순위표</b>: 세션마다 참가자에게 A·B·C·D 별칭을 <b>무작위로 한 번</b> 정해서 고정한다(새로고침해도 같은 별칭).',
          '줄 순서도 한 번 섞어서 고정한다. 제출 순서나 입장 순서로 사람을 추측하지 못하게.',
          '<b>isMe</b>는 요청한 사람 본인 줄에만 true. 별칭↔사람 연결은 진행자에게도 주지 않는다.',
          '누가 AI 추천을 골랐는지(source)는 절대 보내지 않는다.'],
 events=['stage.changed'],
 js=r'''/* 8-3 익명 순위표 */
function renderBoard(r) {
  const tb = App.$('.rtab');
  tb.querySelectorAll('tr:not(:first-child)').forEach(n => n.remove());
  r.rows.forEach(row => {
    const tr = document.createElement('tr'); if (row.isMe) tr.className = 'me';
    const cells = [1, 2, 3].map(k => row.ideas.find(i => i.rank === k));
    tr.innerHTML = `<td class="who">팀원 ${App.escape(row.alias)}${row.isMe ? '<span class=metag>나</span>' : ''}</td>` +
      cells.map((c, i) => `<td class="${i === 0 ? 'r1' : ''}">${c ? App.escape(c.text) : ''}</td>`).join('');
    tb.appendChild(tr);
  });
  App.$('.dvh .aside').textContent = r.submittedCount === r.memberCount ? `${r.memberCount}명 모두 제출했어요` : `${r.submittedCount} / ${r.memberCount}명 제출`;
}
async function load() { renderBoard(await api.call('idea.board')); }
''' + NOT_MOCK + r'''
realtime.connect(App.sessionId(), (ev) => { if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.comment') App.go(App.screen('08-4-idea-comments')); });
'''),

dict(key='08-4-idea-comments', num='8-4', group='div', title='발산 · 익명 댓글', who='모두 (각자)',
 summary='다른 사람 아이디어에 비판적으로 댓글을 단다. 아쉬운 점은 모든 아이디어에 필수, 좋은 점은 1인 2개까지. 내 아이디어엔 못 단다.',
 rules=[R('<button class="btn">댓글 저장', '댓글 저장', action='saveComment')],
 front=['왼쪽 목록에서 아이디어 고르기(제목 바뀜)', '« 로 목록 접기 → 본문 가운데로, » 목록으로 다시 열기', '아쉬운 점 비었으면 막기',
        '저장하면 댓글 목록에 추가, 목록 상태 "완료", 오른쪽 위 할당량(4/9 · 1/2)과 "1개 남음" 갱신'],
 todo=['댓글을 저장하면 다음 안 쓴 아이디어로 자동 이동'],
 load=['comment.targets', 'comment.list'], acts=[('목록에서 아이디어 선택', ['comment.list']), ('댓글 저장', ['comment.create'])],
 backend=['<b>댓글 대상 목록</b>: 내 아이디어를 뺀 모든 아이디어를 별칭(팀원 A…) 순서로, 내가 댓글을 썼는지 상태와 함께 준다. 할당량(아쉬운 점 몇 개 남았는지, 좋은 점 몇 개 썼는지)도 같이.',
          '<b>댓글 목록</b>은 <b>작성자 정보를 절대 포함하지 않는다</b>. 순서도 작성 시각순으로 주지 않는다(시간으로 사람 추측 방지).',
          '<b>규칙은 서버가 지킨다</b>: 아쉬운 점 비면 400, 내 아이디어면 403 OWN_IDEA, 좋은 점이 세션 전체에서 2개를 넘으면 409 PRAISE_LIMIT. 한 아이디어에 내 댓글은 1개(다시 저장하면 수정).',
          '진행자에게는 "몇 명이 다 썼는지"만 실시간으로(comments.progress).'],
 events=['comments.progress', 'stage.changed'],
 js=r'''/* 8-4 익명 댓글 */
const [concern, praise] = App.$$('textarea.ta');
App.$$('.rail .ri').forEach((r, i) => { r.dataset.ideaId = r.dataset.ideaId || 'ide_' + i; });
let current = App.$('.rail .ri.on');

function addComment(c) {
  const d = document.createElement('div'); d.className = 'cm' + (c.type === 'praise' ? ' plus' : '');
  d.innerHTML = `<span>${c.type === 'praise' ? '좋은 점' : '아쉬운 점'}</span>${App.escape(c.text)}`;
  App.$('.clist').appendChild(d);
}
function renderComments(r) {
  App.$$('.clist .cm').forEach(n => n.remove()); r.items.forEach(addComment);
  App.$('.clist h6 small').textContent = `아쉬운 점 ${r.counts.concern} · 좋은 점 ${r.counts.praise}`;
}
document.addEventListener('ie:select', async (e) => {
  current = e.detail;
  App.$('.detail .dt').textContent = App.text(current.querySelector('.t'));
  concern.value = ''; praise.value = '';
  if (!IE_CONFIG.useMock) {
    const r = await api.call('comment.list', { ideaId: current.dataset.ideaId });
    renderComments(r);
    if (r.mine) { concern.value = r.mine.concern || ''; praise.value = r.mine.praise || ''; }   // 이미 쓴 댓글은 고칠 수 있게
  }
});

App.action('saveComment', async () => {
  const body = { concern: concern.value.trim(), praise: praise.value.trim() || null };
  if (!body.concern) { App.toast('아쉬운 점은 꼭 적어주세요'); concern.focus(); return false; }
  const r = await api.call('comment.create', { ideaId: current.dataset.ideaId }, body);
  addComment({ type: 'concern', text: body.concern }); if (body.praise) addComment({ type: 'praise', text: body.praise });
  const st = current.querySelector('.s'); st.textContent = body.praise ? '완료 · 좋은 점' : '완료'; st.classList.remove('k');
  const [c, p] = App.$$('.counts b');
  c.textContent = `${r.quota.concernDone} / ${r.quota.concernTotal}`; p.textContent = `${r.quota.praiseUsed} / ${r.quota.praiseMax}`;
  App.$$('.cf .cl small')[1].textContent = `선택 · ${Math.max(0, r.quota.praiseMax - r.quota.praiseUsed)}개 남음`;
  concern.value = ''; praise.value = '';
  App.toast('익명으로 저장했어요');
  return false;
});
/* 실서버 모드: 왼쪽 목록과 할당량을 comment.targets로 그린다 */
function renderQuota(q) {
  if (!q) return;
  const [c, p] = App.$$('.counts b');
  if (c) c.textContent = `${q.concernDone} / ${q.concernTotal}`;
  if (p) p.textContent = `${q.praiseUsed} / ${q.praiseMax}`;
  const small = App.$$('.cf .cl small')[1];
  if (small) small.textContent = `선택 · ${Math.max(0, q.praiseMax - q.praiseUsed)}개 남음`;
}
function renderTargets(r) {
  const rail = App.$('.rail');
  const tplLabel = rail.querySelector('.rgl'), tplItem = rail.querySelector('.ri'), note = rail.querySelector('.rmore');
  if (!tplLabel || !tplItem) return;
  rail.innerHTML = '';
  (r.groups || []).forEach(g => {
    const lab = tplLabel.cloneNode(true); lab.textContent = `팀원 ${g.alias}`; rail.appendChild(lab);
    (g.items || []).forEach(it => {
      const el = tplItem.cloneNode(true);
      el.classList.remove('on');
      el.dataset.ideaId = it.ideaId;
      el.querySelector('.n').textContent = it.rank;
      el.querySelector('.t').textContent = it.title;
      const st = el.querySelector('.s');
      const done = it.status === 'done';
      st.textContent = done ? (it.praised ? '완료 · 좋은 점' : '완료') : '아직';
      st.classList.toggle('k', !done);
      rail.appendChild(el);
    });
  });
  if (note) rail.appendChild(note);
  renderQuota(r.quota);
  App.$('.rail .ri')?.click();   // 첫 줄 선택 → 오른쪽 댓글도 서버 값으로
}
async function load() { renderTargets(await api.call('comment.targets')); }
if (!IE_CONFIG.useMock) load();
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'comments.progress') App.progress(ev.data.doneCount, ev.data.memberCount);   // 진행자 막대(T2)
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.review') App.go(App.screen('08-5-ai-review'));
});
'''),

dict(key='08-5-ai-review', num='8-5', group='div', title='발산 · AI 검증 · 현실성', who='모두 (같은 화면)',
 summary='AI가 아이디어 12개를 이미 있나·우리 팀 구현 가능성(상/중/하)·팀에 없는 스킬·필요한가·기간·댓글 요약으로 살피고 3등급으로 나눈다. 참고용이며 모두 투표에 올라간다.',
 rules=[],
 front=['왼쪽 목록에서 아이디어 고르기', '« 목록 접기', '실서버 모드에서 선택한 아이디어의 검증 내용을 불러와 본문 다시 그리기(renderReview)'],
 todo=[],
 load=['review.list', 'review.get'], acts=[('목록에서 아이디어 선택', ['review.get'])],
 backend=['<b>AI 검증</b>은 댓글 단계가 끝나면 서버가 아이디어마다 돌리는 <b>뒤쪽 작업</b>이다(시간이 걸리므로 작업 큐로). 끝나면 reviews.ready 이벤트.',
          '① <b>이미 있나</b>: 실제 검색 결과가 근거여야 하고, 검색 결과 링크(searchUrl)를 꼭 준다.',
          '② <b>우리 팀 구현 가능성 상/중/하</b>: 팀원 프로필 스킬을 "웹 화면 2명 · 백엔드 1명"처럼 <b>인원 수로만</b> AI에 보낸다. 이름은 AI에 보내지 않는다.',
          '③ <b>팀에 없는 스킬</b>: 이 아이디어에 필요한데 팀에 없는 스킬 개수와 설명. 뒤에 역할 정하기(9-1)의 "빈 역할"로 이어진다.',
          '④ 필요한가(인터뷰 재료 근거) ⑤ 기간 안에 되나 ⑥ 익명 댓글 요약(개수 + 요점).',
          '<b>등급</b>: 대부분 긍정이면 go(바로 해볼 만해요), 한두 관점에 걸리면 fix(보완하면 좋아요), 이미 비슷한 게 많거나 기간 안에 어려우면 re(다시 생각해 봐요). <b>등급이 낮아도 빼지 않는다.</b>'],
 events=['reviews.ready', 'stage.changed'],
 js=r'''/* 8-5 AI 검증 */
const GRADE = { go: '바로 해볼 만해요', fix: '보완하면 좋아요', re: '다시 생각해 봐요' };
App.$$('.rail .ri').forEach((r, i) => { r.dataset.ideaId = r.dataset.ideaId || 'ide_' + i; });

function renderReview(r) {
  const d = App.$('.detail');
  d.querySelector('.dk').textContent = `팀원 ${r.alias}의 ${r.rank}순위`;
  d.querySelector('.dt').textContent = r.title;
  const g = d.querySelector('.dhead .grade'); g.className = 'grade gbox ' + r.grade; g.lastChild.textContent = GRADE[r.grade];
  const rows = d.querySelectorAll('.qa > div');
  const set = (i, label, text, link) => {
    rows[i].innerHTML = `<span class="ans">${App.escape(label)}</span>${App.escape(text)}` +
      (link ? ` <a class="linkish" href="${App.escape(link)}" target="_blank" rel="noopener">검색 결과 보기</a>` : '');
  };
  set(0, r.exists.label, r.exists.summary, r.exists.searchUrl);
  set(1, r.feasibility.level, r.feasibility.summary);
  set(2, r.missingSkills.count + '개', r.missingSkills.summary);
  set(3, r.need.label, r.need.summary);
  set(4, r.timeline.label, r.timeline.summary);
  const c = r.commentSummary;
  rows[5].innerHTML = `아쉬운 점 ${c.concern} · ${c.concernPoints.map(App.escape).join(' · ')}<br>좋은 점 ${c.praise} · ${c.praisePoints.map(App.escape).join(' · ')}`;
}
document.addEventListener('ie:select', async (e) => {
  App.$('.detail .dt').textContent = App.text(e.detail.querySelector('.t'));
  if (!IE_CONFIG.useMock) renderReview(await api.call('review.get', { ideaId: e.detail.dataset.ideaId }));
});
/* 검증 중(T3): review.list의 ready가 false면 안내를 띄우고, reviews.ready가 오면 걷는다 */
function pending(r) {
  App.$('.tdim')?.remove(); if (r.ready) return;
  const done = r.doneCount ?? 0, total = r.total ?? 0, pct = total ? Math.round(done * 100 / total) : 0;
  App.$('.tdim')?.remove();
  const dim = document.createElement('div'); dim.className = 'tdim';
  dim.innerHTML = `<div class="tdlg" style="text-align:center"><div class="avatar" style="width:72px;height:72px;font-size:var(--fs-h1);margin:0 auto 14px">AI</div><h3>검증하는 중이에요</h3><p>아이디어 ${total}개 중 <b>${done}개</b> 끝남 · 검색 근거 확인 중</p><div class="tpend"><div class="bar" style="width:360px"><i style="width:${pct}%"></i></div></div><p class="quiet">끝나면 자동으로 보여요 · 검증에 실패한 아이디어는 "검증 실패"로 표시되고 그대로 투표에 올라가요</p></div>`;
  (App.$('.board') || document.body).appendChild(dim);
}
/* 실서버 모드: 등급별 목록을 review.list로 그린다 ("N개 더 보기"로 4개씩) */
function renderList(r) {
  const rail = App.$('.rail');
  const tplLabel = rail.querySelector('.rgl'), tplItem = rail.querySelector('.ri'), tplMore = rail.querySelector('.rmore');
  if (!tplLabel || !tplItem) return;
  rail.innerHTML = '';
  (r.groups || []).forEach(g => {
    const lab = tplLabel.cloneNode(true);
    const badge = lab.querySelector('.grade');
    if (badge) { badge.className = 'grade ' + g.grade; badge.lastChild.textContent = g.label || GRADE[g.grade] || g.grade; }
    const small = lab.querySelector('small'); if (small) small.textContent = (g.items || []).length;
    rail.appendChild(lab);
    const hidden = [];
    (g.items || []).forEach((it, i) => {
      const el = tplItem.cloneNode(true);
      el.classList.remove('on');
      el.dataset.ideaId = it.ideaId;
      el.querySelector('.t').textContent = it.title;
      if (i >= 4) { el.hidden = true; hidden.push(el); }
      rail.appendChild(el);
    });
    if (hidden.length && tplMore) {
      const more = tplMore.cloneNode(true);
      more.textContent = `${hidden.length}개 더 보기`;
      more.addEventListener('click', () => { hidden.forEach(x => { x.hidden = false; }); more.remove(); });
      rail.appendChild(more);
    }
  });
  App.$('.rail .ri')?.click();
}
async function load() {
  const r = await api.call('review.list');
  pending(r);
  if (r.ready) renderList(r);
}
if (!IE_CONFIG.useMock) load();
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'reviews.ready' && !IE_CONFIG.useMock) load();
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.vote') App.go(App.screen('08-6-vote'));
});
'''),

dict(key='08-6-vote', num='8-6', group='div', title='발산 · 투표 (+ AI가 모은 아이디어 · 숨은 공통점)', who='모두 (각자)',
 summary='1인 2표로 해보고 싶은 아이디어에 투표한다. 누르면 처음 적은 내용·AI 검증·익명 댓글을 다시 본다. 목록 아래에 AI가 좋은 점을 모은 아이디어(투표 가능)와 숨은 공통점(참고용, 투표 아님)이 있다.',
 rules=[R('<button class="btn">이 아이디어에 투표', '이 아이디어에 투표', action='voteCurrent', all=True),
        R('<button class="btn ghost sm" style="margin-left:8px">투표 마치기', '투표 마치기', action='finishVote')],
 views=True,
 front=['왼쪽 목록 항목 종류에 따라 오른쪽 본문 전환: 투표 후보 / AI가 모은 아이디어 / 숨은 공통점',
        '체크박스 또는 "이 아이디어에 투표"로 표 넣기·빼기, <b>2표 넘으면 막기</b>, 남은 표 점(●○) 갱신, 서버 저장 실패 시 되돌리기',
        '숨은 공통점의 "몰랐어요 / 이미 알았어요" 저장', '« 목록 접기', '투표 마치기 → 대기 화면(8-6w)으로', '이미 마쳤으면(vote.state finished) 열 때 바로 8-6w', '투표 인원 실시간 갱신', 'vote.closed면 모두 8-7로'],
 todo=['숨은 공통점 본문 안의 후보 체크박스로도 표를 넣고 뺄 수 있게 (지금은 보기 전용)'],
 load=['vote.state'],
 acts=[('투표 후보 선택', ['vote.candidate']), ('AI가 모은 아이디어 선택', ['vote.aiIdea']), ('숨은 공통점 선택', ['vote.thread']),
       ('체크 / 이 아이디어에 투표', ['vote.save']), ('몰랐어요 / 이미 알았어요', ['vote.threadReact']), ('투표 마치기', ['vote.finish'])],
 backend=['<b>1인 2표</b>. 서버는 "지금 체크된 전체 목록"을 받아 저장한다(추가·취소를 한 번에). 2표 넘으면 409 VOTE_LIMIT. 숨은 공통점 id는 후보가 아니므로 400.',
          '<b>누가 어디에 투표했는지는 끝까지 비공개</b>. 결과(8-7)에는 합계만 쓴다. 자기 아이디어에 투표하는 것은 허용.',
          '<b>AI가 모은 아이디어</b>: 댓글 단계에서 <b>좋은 점을 받은</b> 아이디어들의 좋은 점만 모아 AI가 새 아이디어를 최대 2개 만든다. 어디서 가져왔는지(sources)와 원래 아쉬운 점을 어떻게 줄였는지(fixes)를 공개하고, 새로 AI 검증을 돌린다. "AI가 모음" 표시를 항상 붙이고, 원래 아이디어보다 낫다고 내세우지 않는다.',
          '<b>숨은 공통점</b>: 아이스브레이킹 재료 중 <b>서로 다른 묶음에 있었지만 뿌리가 같은</b> 것들을 AI가 찾는다. <b>2명 이상</b> 겹칠 때만 만들고, 답 원문은 인용하지 않고 요약만. 선입견을 막기 위해 <b>아이디어 제출 전에는 API가 403</b>을 준다. 투표 선택지가 아니다.',
          '"내 답도 들어 있어요"(includesMine)는 요청한 본인에게만 계산해서 준다. 누가 말했는지는 진행자도 모른다.',
          '투표 인원만 실시간으로(vote.progress). 모두 마치면 vote.closed.'],
 events=['vote.progress', 'vote.closed', 'stage.changed'],
 js=r'''/* 8-6 투표 */
let MAX_VOTES = 2;
const rail = App.$('.rail');
const views = { idea: App.$('[data-view="idea"]'), ai: App.$('[data-view="ai"]'), thread: App.$('[data-view="thread"]') };

// 목록 항목에 종류 붙이기: 그룹 제목 순서 = 투표 후보 → AI가 모은 아이디어 → 숨은 공통점
let kind = 'idea', groupIndex = 0;
[...rail.children].forEach((el, i) => {
  if (el.classList.contains('rgl')) kind = ['idea', 'ai', 'thread'][groupIndex++] || kind;
  else if (el.classList.contains('ri')) { el.dataset.kind = kind; el.dataset.id = el.dataset.id || ({ idea: 'ide_', ai: 'aii_', thread: 'thr_' }[kind] + i); }
});

const current = () => App.$('.rail .ri.on');
const checked = () => App.$$('.rail .ri .cb.on');
function paintDots() { const used = checked().length; App.$$('.dots3 i').forEach((d, i) => d.classList.toggle('e', i >= used)); }
function syncVoteButton() {
  const cb = current()?.querySelector('.cb');
  App.$$('[data-action="voteCurrent"]').forEach(b => { b.textContent = cb && cb.classList.contains('on') ? '✓ 투표했어요 · 취소' : '이 아이디어에 투표'; });
}
function show(k) { Object.entries(views).forEach(([key, v]) => { v.hidden = key !== k; }); }

document.addEventListener('ie:select', (e) => {
  const item = e.detail; show(item.dataset.kind);
  if (item.dataset.kind !== 'thread') views[item.dataset.kind].querySelector('.dt').textContent = App.text(item.querySelector('.t'));
  syncVoteButton();
  if (!IE_CONFIG.useMock) loadDetail(item);
});

const GRADE_LABEL = { go: '바로 해볼 만해요', fix: '보완하면 좋아요', re: '다시 생각해 봐요' };
function setGrade(el, grade) {
  if (!el) return;
  el.hidden = !grade;
  if (!grade) return;
  el.className = el.className.replace(/\b(go|fix|re)\b/g, '').trim() + ' ' + grade;
  el.lastChild.textContent = GRADE_LABEL[grade] || grade;
}
/** `<div><span class="ans">값</span>설명 [<a>링크</a>]</div>` 한 줄 채우기 */
function setAns(row, label, text, link, linkText) {
  if (!row) return;
  row.innerHTML = `<span class="ans">${App.escape(label ?? '')}</span>${App.escape(text ?? '')}` +
    (link ? ` <a class="linkish" href="${App.escape(link)}" target="_blank" rel="noopener">${linkText || '검색 결과 보기'}</a>` : '');
}
function renderCandidate(r) {
  const v = views.idea;
  v.querySelector('.dk').textContent = `팀원 ${r.alias}의 ${r.rank}순위`;
  v.querySelector('.dt').textContent = r.title;
  setGrade(v.querySelector('.grade'), r.grade);
  v.querySelector('.orig').textContent = r.originalText || '';
  const rows = v.querySelectorAll('.qa.tight > div');
  const rv = r.review || {};
  if (rv.exists) setAns(rows[0], rv.exists.label, rv.exists.summary, rv.exists.searchUrl);
  if (rv.feasibility) setAns(rows[1], rv.feasibility.level, rv.feasibility.summary);
  if (rv.need) setAns(rows[2], rv.need.label, rv.need.summary);
  if (rv.timeline) setAns(rows[3], rv.timeline.label, rv.timeline.summary);
  const cm = v.querySelectorAll('.cm');
  const items = (r.comments && r.comments.items) || [];
  if (cm.length) {
    const tpl = cm[0], box = tpl.parentElement;
    cm.forEach(x => x.remove());
    items.forEach(c => {
      const el = tpl.cloneNode(true);
      el.className = 'cm' + (c.type === 'praise' ? ' plus' : '');
      el.innerHTML = `<span>${c.type === 'praise' ? '좋은 점' : '아쉬운 점'}</span>${App.escape(c.text)}`;
      box.appendChild(el);
    });
  }
  v.querySelectorAll('h6 small, .sech small').forEach(s => {
    if (s.textContent.includes('아쉬운 점') && r.comments) s.textContent = `아쉬운 점 ${r.comments.concern} · 좋은 점 ${r.comments.praise}`;
  });
}
function renderAiIdea(r) {
  const v = views.ai;
  v.querySelector('.dt').textContent = r.title;
  setGrade(v.querySelector('.grade.gbox'), r.grade);
  const srcs = v.querySelectorAll('.src');
  if (srcs.length) {
    const tpl = srcs[0], box = tpl.parentElement;
    srcs.forEach(x => x.remove());
    (r.sources || []).forEach(sc => {
      const el = tpl.cloneNode(true);
      el.querySelector('.m').innerHTML = `팀원 ${App.escape(sc.alias)}의 ${sc.rank}순위 · <span class="grade ${App.escape(sc.grade || '')}"><i></i>${App.escape(GRADE_LABEL[sc.grade] || '')}</span>`;
      el.querySelector('.tt').textContent = sc.title;
      el.querySelector('.g').innerHTML = `<span>가져온 점</span>${App.escape(sc.takenPoint || '')}`;
      box.appendChild(el);
    });
  }
  const fixes = v.querySelectorAll('.fixrow');
  if (fixes.length) {
    const tpl = fixes[0], box = tpl.parentElement;
    fixes.forEach(x => x.remove());
    (r.fixes || []).forEach(f => {
      const el = tpl.cloneNode(true);
      el.innerHTML = `<span class="p">${App.escape(f.problem)}<small>아쉬운 점 ${f.concernCount}</small></span><span class="a">→</span><span>${App.escape(f.fix)}</span>`;
      box.appendChild(el);
    });
  }
  const cells = v.querySelectorAll('.vgrid > div');
  const rv = r.review || {};
  const put = (cell, val, link) => {
    if (!cell) return;
    const b = cell.querySelector('b');
    cell.innerHTML = '';
    if (b) cell.appendChild(b);
    cell.insertAdjacentHTML('beforeend', `<span class="ans">${App.escape(val ?? '')}</span>` + (link ? `<a class="linkish" href="${App.escape(link)}" target="_blank" rel="noopener">검색 결과</a>` : ''));
  };
  put(cells[0], rv.exists, rv.searchUrl); put(cells[1], rv.feasibility); put(cells[2], rv.need); put(cells[3], rv.timeline);
}
function renderThread(r, index) {
  const v = views.thread;
  v.querySelector('.dk').textContent = `투표 참고 · 숨은 공통점 ${index}`;
  v.querySelector('.dt').textContent = r.title;
  const mineChip = v.querySelector('.dhead .quiet'); if (mineChip) mineChip.hidden = !r.includesMine;
  const froms = v.querySelectorAll('.from');
  if (froms.length) {
    const tpl = froms[0], box = tpl.parentElement;
    froms.forEach(x => x.remove());
    (r.sources || []).forEach(sc => {
      const el = tpl.cloneNode(true);
      el.innerHTML = `<span>${App.escape(sc.question)}</span>${App.escape(sc.summary)}`;
      box.appendChild(el);
    });
  }
  const why = v.querySelector('.sec p'); if (why) why.textContent = r.why || '';
  const heads = v.querySelectorAll('h6');
  heads.forEach(h => {
    if (h.textContent.startsWith('어디서 나왔나요')) { const s = h.querySelector('small'); if (s) s.textContent = `${r.answerCount}명의 답 · 인터뷰 재료 요약 · 원문 인용 없음`; }
    if (h.textContent.startsWith('이 공통점과 이어지는 후보')) h.childNodes[0].nodeValue = `이 공통점과 이어지는 후보 ${(r.candidates || []).length}개`;
  });
  const crows = v.querySelectorAll('.crow');
  if (crows.length) {
    const tpl = crows[0], box = tpl.parentElement;
    crows.forEach(x => x.remove());
    (r.candidates || []).forEach(c => {
      const el = tpl.cloneNode(true);
      const cb = el.querySelector('.cb');
      cb.classList.toggle('on', !!c.votedByMe); cb.textContent = c.votedByMe ? '✓' : '';
      el.querySelector('.t').innerHTML = App.escape(c.title) + (c.isMine ? ' <small>내 아이디어</small>' : '') + (c.isAi ? ' <span class="aitag">AI가 모음</span>' : '');
      setGrade(el.querySelector('.grade'), c.grade);
      box.appendChild(el);
    });
  }
  const pick = { didntKnow: 0, knew: 1 }[r.myReaction];
  v.querySelectorAll('.rbtn').forEach((b, i) => b.classList.toggle('on', pick === i));
}
async function loadDetail(item) {
  const id = item.dataset.id;
  if (item.dataset.kind === 'idea') renderCandidate(await api.call('vote.candidate', { ideaId: id }));
  else if (item.dataset.kind === 'ai') renderAiIdea(await api.call('vote.aiIdea', { aiIdeaId: id }));
  else {
    const list = App.$$('.rail .ri').filter(x => x.dataset.kind === 'thread');
    renderThread(await api.call('vote.thread', { threadId: id }), list.indexOf(item) + 1);
  }
}

async function toggleVote(cb) {
  const on = !cb.classList.contains('on');
  if (on && checked().length >= MAX_VOTES) { App.toast(`한 사람당 ${MAX_VOTES}표까지예요. 다른 표를 먼저 빼주세요`); return; }
  const set = (v) => { cb.classList.toggle('on', v); cb.textContent = v ? '✓' : ''; paintDots(); syncVoteButton(); };
  set(on);
  try { await api.call('vote.save', {}, { ids: checked().map(c => c.closest('.ri').dataset.id) }); }
  catch (err) { set(!on); App.toast(err.message, 'error'); }
}
rail.addEventListener('click', (e) => { const cb = e.target.closest('.cb'); if (cb) toggleVote(cb); });
App.action('voteCurrent', async () => { const cb = current()?.querySelector('.cb'); if (cb) await toggleVote(cb); return false; });
App.action('finishVote', async () => {
  if (!checked().length && !(await App.confirm('아직 투표하지 않았어요', '그래도 투표를 마칠까요? 마친 뒤에는 표를 바꿀 수 없어요.', '마치기'))) return false;
  const r = await api.call('vote.finish', {}, {});
  App.toast(`투표를 마쳤어요 · ${r.votedCount} / ${r.memberCount}명`);
  App.go(App.screen('08-6w-vote-wait'));   // 결과 기다리는 화면으로
  return false;
});
document.addEventListener('ie:reaction', (e) => {
  if (!e.target.closest('[data-view="thread"]')) return;
  api.call('vote.threadReact', { threadId: current()?.dataset.id || 'thr_1' }, { reaction: e.detail === '몰랐어요' ? 'didntKnow' : 'knew' })
    .catch(err => App.toast(err.message, 'error'));
});
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'vote.progress') { App.progress(ev.data.votedCount, ev.data.memberCount); App.$$('.dfoot2 .quiet').forEach(q => { if (q.textContent.startsWith('투표한 사람')) q.textContent = `투표한 사람 ${ev.data.votedCount} / ${ev.data.memberCount} · 모두 투표하면 결과가 열려요`; }); }
  if (ev.type === 'vote.closed') App.go(App.screen('08-7-vote-result-host'));   // 모두 결과로 (참가자는 보기 전용)
});
paintDots(); syncVoteButton();

/* 실서버 모드: 왼쪽 목록을 vote.state로 다시 그린다 (목업 모드는 HTML 예시 그대로) */
function renderVote(r) {
  MAX_VOTES = r.maxVotes || MAX_VOTES;
  const labels = App.$$('.rail .rgl');
  const tplVote = App.$('.rail .ri .cb')?.closest('.ri');
  const tplThread = App.$('.rail .ri .n')?.closest('.ri');
  if (!tplVote || !labels.length) return;
  const groups = [['idea', labels[0], r.candidates || []], ['ai', labels[1], r.aiIdeas || []], ['thread', labels[2], r.commonThreads || []]];
  rail.innerHTML = '';
  groups.forEach(([kind, label, items]) => {
    if (!label || (!items.length && kind !== 'idea')) return;
    const lab = label.cloneNode(true);
    const small = lab.querySelector('small');
    if (small && kind !== 'thread') small.textContent = items.length;
    rail.appendChild(lab);
    items.forEach((it, i) => {
      const tpl = kind === 'thread' ? (tplThread || tplVote) : tplVote;
      const el = tpl.cloneNode(true);
      el.classList.remove('on');
      el.dataset.kind = kind; el.dataset.id = it.id;
      el.querySelector('.t').textContent = it.title;
      const cb = el.querySelector('.cb');
      if (cb) { const on = (r.myVotes || []).includes(it.id); cb.classList.toggle('on', on); cb.textContent = on ? '✓' : ''; }
      const gd = el.querySelector('.gd'); if (gd) { gd.className = 'gd ' + (it.grade || ''); gd.hidden = !it.grade; }
      const n = el.querySelector('.n'); if (n) n.textContent = i + 1;
      const st = el.querySelector('.s'); if (st) st.textContent = `후보 ${it.candidateCount}`;
      const mine = el.querySelector('small'); if (mine) mine.hidden = !it.isMine;
      rail.appendChild(el);
    });
  });
  App.$$('.dfoot2 .quiet').forEach(q => { if (q.textContent.startsWith('투표한 사람')) q.textContent = `투표한 사람 ${r.votedCount} / ${r.memberCount} · 모두 투표하면 결과가 열려요`; });
  paintDots(); syncVoteButton();
  App.$('.rail .ri')?.click();   // 첫 줄 선택 → 오른쪽 본문도 서버 값으로
}
async function load() {
  const r = await api.call('vote.state');
  if (r.finished) { App.go(App.screen('08-6w-vote-wait')); return; }   // 이미 마쳤으면 대기 화면
  renderVote(r);
}
if (!IE_CONFIG.useMock) load();
'''),

dict(key='08-6w-vote-wait', num='8-6w', group='div', title='발산 · 투표 마침 — 결과 기다리기', who='모두 (각자)',
 summary='투표를 마친 사람이 결과가 열릴 때까지 기다리는 화면. 대기실(6)과 같은 틀. 모두 마치면(또는 진행자가 넘기면) 자동으로 결과(8-7)로 간다.',
 rules=[],
 front=['열 때 vote.state로 확인 — 아직 안 마쳤으면 8-6으로 돌려보냄, 마쳤으면 "n / m명 투표 완료" 표시', 'vote.progress로 인원 갱신', 'vote.closed 또는 stage.changed(diverge.result)면 8-7로 자동 이동'],
 todo=[],
 load=['vote.state'], acts=[],
 backend=['이 화면은 <b>기다리는 화면</b>이라 새 API가 없다. vote.state의 finished · votedCount · memberCount와 vote.progress · vote.closed 이벤트만 쓴다.',
          '모두 vote.finish를 하면 서버가 단계를 diverge.result로 <b>먼저 저장</b>하고 stage.changed → vote.closed를 보낸다(4차 문서). 이 화면은 둘 중 먼저 오는 것으로 이동한다.'],
 events=['vote.progress', 'vote.closed', 'stage.changed'],
 js=r'''/* 8-6w 투표 마침 · 결과 기다리기 */
const cnt = App.$('.wait-count b');
async function load() {
  const r = await api.call('vote.state');
  if (!r.finished) { App.go(App.screen('08-6-vote')); return; }   // 아직 안 마친 사람은 투표 화면으로
  cnt.textContent = `${r.votedCount} / ${r.memberCount}`;
}
''' + NOT_MOCK + r'''
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'vote.progress') cnt.textContent = `${ev.data.votedCount} / ${ev.data.memberCount}`;
  if (ev.type === 'vote.closed') App.go(App.screen('08-7-vote-result-host'));
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.result') App.go(App.screen('08-7-vote-result-host'));
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.vote') App.go(App.screen('08-6-vote'));   // 재투표
});
'''),

dict(key='08-7-vote-result-host', num='8-7', group='div', title='발산 · 투표 결과 · 주제 확정 (진행자 · 참가자는 보기 전용)', who='모두 (진행자만 확정 · 재투표 버튼)',
 summary='투표 결과(8표)와 함께 이때 처음으로 아이디어 주인을 공개한다. 진행자가 확정할 주제를 고르면 역할 정하기로 넘어간다.',
 rules=[R('<button class="btn block lg">1위로 확정하고', '○위로 확정하고 역할 정하기 →', action='confirmTopic'),
        R('<button class="btn ghost sm" style="margin-top:10px;width:100%">동점만 다시 투표', '동점만 다시 투표', action='revote')],
 front=['결과 줄 누르면 라디오 선택 + 버튼 문구 "N위로 확정하고…" 변경', '주제 확정', '동점 재투표(확인 창)', '실서버 모드에서 결과 목록 그리기(renderResults)', '참가자는 같은 화면에서 라디오·확정·재투표 버튼을 숨김(보기 전용) · 진행자가 확정하면 토스트 · 재투표가 열리면 8-6으로'],
 todo=['역할 정하기(9-1) 연결 — 9-1은 디자인 수정 후 작업'],
 load=['vote.results'], acts=[('주제 확정', ['topic.confirm']), ('동점만 다시 투표', ['vote.revote'])],
 backend=['<b>투표 결과</b>: 표 수 순위와 함께 <b>이때 처음으로 아이디어 주인(닉네임과 몇 순위였는지)을 공개</b>한다. 댓글 쓴 사람과 누가 어디에 투표했는지는 <b>끝까지</b> 비공개.',
          'AI가 모은 아이디어는 주인 대신 "어느 아이디어의 좋은 점을 모았는지"(sourceOwners)를 보여준다.',
          '동점(ties)을 계산해서 준다. "동점만 다시 투표"를 누르면 동점 후보만으로 짧은 재투표를 열고, 모두의 화면을 투표(8-6)로 되돌린다.',
          '결과 화면의 인사이트 카드("1위와 ○○는 같은 숨은 공통점…")는 숨은 공통점 데이터에서 상위 후보끼리 연결된 것을 골라 만든다(참고용).',
          '<b>주제 확정</b>: 고른 아이디어를 세션 주제로 저장하고 역할 정하기 단계로 넘긴다(topic.confirmed + stage.changed). 역할 초안 AI 작업을 이때 시작한다.',
          '표를 받지 못한 아이디어도 주인과 함께 기록(보고서·지난 세션)에 남긴다.'],
 events=['vote.closed', 'topic.confirmed', 'stage.changed'],
 js=r'''/* 8-7 투표 결과 · 주제 확정 (진행자) · 보기 전용 (참가자) */
const isHost = App.state.role === 'host';
function applyRole() {   // 참가자: 라디오 · 확정 · 재투표 숨김
  if (isHost) return;
  App.$$('[data-action="confirmTopic"],[data-action="revote"]').forEach(b => { b.hidden = true; });
  App.$$('.res7 .radio').forEach(r => { r.style.visibility = 'hidden'; });
  const p = App.$('.dvh p'); if (p) p.textContent = '진행자가 주제를 확정하면 함께 파트 나누기로 넘어가요. 누가 어디에 투표했는지는 공개되지 않아요.';
  const lh = App.$('.listh span'); if (lh) lh.textContent = '표 수 순이에요 · 확정은 진행자가 해요';
  App.$$('p.note').forEach(n => { n.hidden = true; });
}
applyRole();
/* 팀장 고르기: 진행자 카드의 sel9를 실제 <select>로 (실서버 모드 · session.participants) */
async function leaderSelect() {
  const box = App.$('.sel9'); if (!box || !isHost) return;
  const r = await api.call('session.participants');
  const sel = document.createElement('select'); sel.id = 'leaderSel'; sel.className = 'sel9'; sel.style.width = '100%';
  r.items.forEach(p => { const o = document.createElement('option'); o.value = p.participantId; o.textContent = p.nickname + (p.role === 'host' ? ' (진행자)' : ''); if (p.role === 'host') o.selected = true; sel.appendChild(o); });
  box.replaceWith(sel);
}
if (!IE_CONFIG.useMock) leaderSelect();
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.vote') App.go(App.screen('08-6-vote'));   // 동점 재투표
  if (ev.type === 'topic.confirmed' && !isHost) { App.toast(`주제가 "${ev.data.title}"(으)로 확정됐어요`); App.go(App.screen('09-1-part-split')); }
});
const confirmBtn = App.$('[data-action="confirmTopic"]');
App.$$('.res7').forEach((r, i) => { r.dataset.id = r.dataset.id || 'idea_' + i; });

document.addEventListener('ie:pick', (e) => { confirmBtn.textContent = `${App.text(e.detail.querySelector('.num'))}위로 확정하고 역할 정하기 →`; });

App.action('confirmTopic', async () => {
  const pick = App.$('.res7 .radio.on').closest('.res7');
  const leader = App.$('#leaderSel')?.value || undefined;   // 팀장 고르기(진행자 카드) — 없으면 서버가 진행자를 팀장으로
  await api.call('topic.confirm', {}, leader ? { ideaId: pick.dataset.id, leaderParticipantId: leader } : { ideaId: pick.dataset.id });
  App.toast(`"${App.text(pick.querySelector('.rt'))}"(으)로 확정했어요 · 역할 정하기(9-1)는 다음 작업에서 연결돼요`);
  return false;
});
App.action('revote', async () => {
  if (!(await App.confirm('동점인 아이디어만 다시 투표할까요?', '동점 후보만 가지고 짧은 재투표를 열어요. 모두의 화면이 투표로 돌아가요.', '재투표 열기'))) return false;
  const ids = ties.length ? ties : App.$$('.res7').filter(r => App.text(r.querySelector('.num')) === '3').map(r => r.dataset.id);
  if (!ids.length) { App.toast('동점인 아이디어가 없어요'); return false; }
  await api.call('vote.revote', {}, { ids, maxVotes: 1 });
  App.toast('동점 재투표를 열었어요');
  return false;
});

function renderResults(r) {
  App.$('.dvh p').textContent = `${r.memberCount}명이 ${r.totalVotes}표를 썼어요. 확정할 주제를 고르면 역할 정하기로 넘어가요.`;
  const box = App.$('.detail'); box.querySelectorAll('.res7').forEach(n => n.remove());
  const anchor = box.querySelector('.more'); const top = Math.max(...r.ranks.map(x => x.votes), 1);
  const GRADE = { go: '바로 해볼 만해요', fix: '보완하면 좋아요', re: '다시 생각해 봐요' };
  r.ranks.forEach((x, i) => {
    const owner = x.aiMerged
      ? `<div class="own"><span class="aitag">AI가 모음</span>${x.sourceOwners.map(o => `${App.escape(o.nickname)} 님 ${o.rank}순위`).join(' · ')}의 좋은 점</div>`
      : `<div class="own"><i>${App.escape(x.owner.nickname[0])}</i>${App.escape(x.owner.nickname)} 님의 ${x.owner.rank}순위</div>`;
    const row = document.createElement('div'); row.className = 'res7' + (x.rank <= 2 ? ' top' : ''); row.dataset.id = x.id;
    row.innerHTML = `<span class="radio${i === 0 ? ' on' : ''}"></span><span class="num${x.rank === 1 ? ' n1' : ''}">${x.rank}</span>` +
      `<div><div class="rt">${App.escape(x.title)}</div>${owner}</div><span class="grade ${x.grade}"><i></i>${GRADE[x.grade]}</span>` +
      `<div class="vbar"><i style="width:${Math.round(x.votes * 100 / top)}%"></i></div><span class="vc">${x.votes}표</span>`;
    box.insertBefore(row, anchor);
  });
  anchor.textContent = `표를 받지 못한 아이디어 ${r.unvotedCount}개도 주인과 함께 기록에 남아요`;
  applyRole();
}
let ties = [];   // 서버가 계산한 동점 후보 (동점 재투표에 사용)
function renderInsight(ins) {
  const card = App.$('.sc2');
  if (!card) return;
  if (!ins) { card.hidden = true; return; }
  card.hidden = false;
  const h = card.querySelector('h4'); if (h) h.textContent = ins.title;
  const ps = card.querySelectorAll('p'); if (ps[0]) ps[0].textContent = ins.body;
}
async function load() {
  const r = await api.call('vote.results');
  ties = (r.ties || []).flatMap(t => t.ids || []);
  renderResults(r);
  renderInsight(r.insight);
}
''' + NOT_MOCK + '\n'),

# ───────────────────────── A · 계정 ─────────────────────────
dict(key='08-t1-time-up', num='T1', group='div', title='세션 시간이 끝났을 때 (안내 창)', who='모두 (진행자에게만 버튼)',
 summary='타이머가 00:00이 되면 지금 보던 화면 위에 뜨는 안내 창. 세션은 자동으로 끝나지 않고, 진행자가 "5분 더"(session.extend) 또는 "이대로 계속"을 고른다. 참가자는 안내만 본다. 이 화면은 그 창의 목업이다(실제로는 app.js가 모든 세션 화면에 띄움).',
 rules=[R('<button class="btn gray">이대로 계속 진행하기', '이대로 계속 진행하기', action='timeUpDismiss'),
        R('<button class="btn">5분 더 진행하기', '5분 더 진행하기', action='timeUpExtend')],
 front=['타이머 00:00 → 모든 세션 화면에서 안내 창(app.js `App.timeUp`)', '진행자: "5분 더" → session.extend → 타이머 다시 시작 · "이대로 계속" → 창만 닫힘', '참가자: "진행자가 정하는 중" 안내 + 확인'],
 todo=[],
 load=[], acts=[('5분 더 진행하기', ['session.extend'])],
 backend=['<b>자동 종료 없음</b>(2026-09-18 결정). 서버는 endsAt이 지나도 아무것도 하지 않는다. 진행자가 session.extend를 부르면 endsAt을 늘리고 timer.sync를 모두에게 보낸다.',
          '무료 세션은 총 30분을 넘길 수 없다(403 PLAN_LIMIT). durationMin이 null이면 타이머가 없으니 이 창도 안 뜬다.'],
 events=['timer.sync'],
 js=r"""/* T1 세션 시간 종료 안내 (목업) — 실제 동작은 assets/js/app.js 의 App.timeUp */
App.action('timeUpDismiss', async () => { App.$('.tdim')?.remove(); App.toast('이대로 계속 진행해요'); return false; });
App.action('timeUpExtend', async () => { const r = await api.call('session.extend', {}, { addMin: 5 }); App.setTimer(r.timer.remainingSec); App.$('.tdim')?.remove(); App.toast('5분 더 진행해요'); return false; });
"""),

dict(key='08-t2-host-advance', num='T2', group='div', title='진행자 단계 넘기기 + 제출 확인 (하단 막대 · 확인 창)', who='진행자',
 summary='8-1 ~ 8-6에서 진행자에게만 보이는 하단 막대("제출 n / m명 · 다음 단계 →")와, 안 낸 사람이 있을 때 뜨는 확인 창. "그냥 넘기기"만 force=true로 보낸다. 이 화면은 그 막대·창의 목업이다(실제로는 app.js가 진행자 화면에 붙임).',
 rules=[R('<button class="btn">다음 단계 →', '다음 단계 →', action='hostAdvance'),
        R('<button class="btn gray">기다리기', '기다리기', action='forceCancel'),
        R('<button class="btn">그냥 넘기기', '그냥 넘기기', action='forceAdvance')],
 front=['진행자 하단 막대(app.js `App.hostBar`) — ideas.submitted · comments.progress · vote.progress로 숫자 갱신', '"다음 단계 →" → session.advance(from) · 409 NOT_ALL_SUBMITTED면 확인 창', '"그냥 넘기기" → session.advance(from, force: true)'],
 todo=['막대의 첫 숫자(화면 열 때) — 지금은 이벤트가 와야 채워짐 → idea.board · comment.targets · vote.state 응답으로 채우기'],
 load=[], acts=[('다음 단계 →', ['session.advance']), ('그냥 넘기기', ['session.advance'])],
 backend=['<b>제출 강제</b>(2026-09-18 결정): diverge.write · diverge.comment에서 아직 안 낸 사람이 있으면 session.advance는 409 NOT_ALL_SUBMITTED + details {pendingCount, memberCount}. force=true면 넘어간다.',
          '누가 안 냈는지는 진행자에게도 알려주지 않는다(익명). 인원 수만.'],
 events=['ideas.submitted', 'comments.progress', 'vote.progress'],
 js=r"""/* T2 진행자 넘기기 + 제출 확인 (목업) — 실제 동작은 assets/js/app.js 의 App.hostBar */
App.action('hostAdvance', async () => { App.toast('안 낸 사람이 있으면 확인 창이 떠요 (목업에서는 이미 떠 있음)'); return false; });
App.action('forceCancel', async () => { App.$('.tdim')?.remove(); App.toast('기다려요 · 모두 내면 다시 눌러주세요'); return false; });
App.action('forceAdvance', async () => { await api.call('session.advance', {}, { from: 'diverge.write', force: true }); App.$('.tdim')?.remove(); App.toast('다음 단계로 넘겼어요 · 안 낸 사람 줄은 빈 칸으로 남아요'); return false; });
"""),

dict(key='08-t3-review-pending', num='T3', group='div', title='AI 검증이 아직 안 끝났을 때 (8-5 · ready=false)', who='모두',
 summary='댓글 단계가 끝나면 AI 검증(5차)이 뒤에서 돈다. 끝나기 전에 8-5를 열면 이 안내가 뜨고, reviews.ready가 오면 목록이 그려진다. 진행자도 끝나기 전엔 투표로 넘길 수 없다(409 STAGE_LOCKED).',
 rules=[],
 front=['8-5가 열릴 때 review.list의 ready · doneCount · total로 진행 표시(8-5 screen.js `pending`)', 'reviews.ready → 다시 불러와서 안내 걷기'],
 todo=['검증에 실패한 아이디어의 "검증 실패" 표시(목록 그리기와 함께)'],
 load=['review.list'], acts=[],
 backend=['review.list는 검증이 끝나기 전에도 200으로 답하되 ready=false · doneCount · total을 준다(5차). 끝나면 reviews.ready 이벤트.',
          '한 아이디어의 검증이 실패해도 전체를 막지 않는다 — 그 아이디어만 "검증 실패"로 두고 ready=true.'],
 events=['reviews.ready'],
 js=r"""/* T3 검증 중 (목업) — 실제 동작은 screens/08-5-ai-review/screen.js 의 pending() */
"""),

dict(key='A1-login', num='A1', group='account', title='로그인', who='누구나',
 summary='이메일/비밀번호 또는 Google·카카오로 로그인한다. 로그인 없이 코드로 입장하는 길도 있다.',
 rules=[R('<button class="btn block lg" style="margin-top:20px">로그인', '로그인', go='01-1-landing-logged-in', action='login'),
        R('<button class="btn google">', 'Google로 계속', action='oauth'),
        R('<button class="btn kakao">', '카카오로 계속', action='oauth'),
        R('<a>회원가입', '회원가입', go='A2-signup'),
        R('<a style="font-weight:500;color:var(--muted)">로그인 없이', '로그인 없이 코드로 입장 →', go='02-join-code'),
        R('<span class="back">', '← 처음으로', go='01-landing'),
        R('<a>비밀번호 찾기', '비밀번호 찾기', action='resetPw')],
 front=['이메일·비밀번호 로그인, 로그인 상태 유지 체크', '비밀번호 보기(👁)', 'Enter로 로그인', '비밀번호 찾기 메일', '로그인 성공 시 토큰 저장 → 1-1'],
 todo=['소셜 로그인: 소셜 로그인 창 열기 → 콜백 페이지에서 code 받아 auth.oauth 호출', '로그인 후 원래 가려던 화면(returnTo)으로 돌아가기', '에러 문구를 입력칸 아래에 표시(지금은 토스트)'],
 load=[], acts=[('로그인', ['auth.login']), ('Google/카카오', ['auth.oauth']), ('비밀번호 찾기', ['auth.passwordReset'])],
 backend=['<b>이메일 로그인</b>: 비밀번호 해시를 비교해서 맞으면 <b>액세스 토큰</b>(짧게, 예: 1시간)과 <b>리프레시 토큰</b>(길게, httpOnly 쿠키)을 준다. 연속 실패는 횟수 제한.',
          '<b>소셜 로그인</b>: 프론트가 받은 인가 code를 서버가 Google/카카오 서버에 확인하고 이메일을 받아온다. 처음이면 계정을 만들고 isNewUser=true → 프론트가 프로필 만들기(3)로 보낸다.',
          '<b>비밀번호 찾기</b>는 가입 여부를 들키지 않도록 항상 같은 응답을 준다.'],
 js=r'''/* A1 로그인 */
const email = App.$('.form input.inp');
const pw = App.$('.form label.pw input');

App.action('login', async () => {
  const body = { email: email.value.trim(), password: pw.value, remember: App.$('.check .box').classList.contains('on') };
  if (!body.email || !body.password) { App.toast('이메일과 비밀번호를 입력해 주세요'); return false; }
  const r = await api.call('auth.login', {}, body);
  App.save({ accessToken: r.accessToken, user: r.user });
});
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
pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') App.$('[data-action="login"]').click(); });
'''),

dict(key='A2-signup', num='A2', group='account', title='회원가입 (+ 약관 팝업 A2-1 · A2-2)', who='누구나',
 summary='이메일·비밀번호·닉네임과 약관 동의로 가입한다. 약관 "보기"를 누르면 이용약관(A2-1)·개인정보 수집·이용 동의(A2-2) 팝업이 뜬다.',
 rules=[R('<button class="btn block lg" style="margin-top:16px">가입하고', '가입하고 프로필 만들기 →', go='03-profile-create', action='signup'),
        R('<a>보기', '보기 (이용약관 / 개인정보)', extra=None, action=None),
        R('<a>로그인', '로그인', go='A1-login'),
        R('<span class="back">', '← 처음으로', go='01-landing'),
        R('<button class="btn google">', 'Google로 계속', action='oauth'),
        R('<button class="btn kakao">', '카카오로 계속', action='oauth'),
        R('<button class="btn gray">닫기', '팝업: 닫기', action='closeModal', all=True),
        R('<span class="mx">', '팝업: ×', action='closeModal', all=True),
        R('<button class="btn black">동의하고 닫기', '팝업: 동의하고 닫기', action='agreeModal', all=True)],
 modals=True,
 front=['비밀번호 확인 일치 표시(✓ 일치해요 / 달라요)', '전체 동의 ↔ 개별 동의 연동', '"보기" → 약관 팝업 열기(안에서 스크롤), 닫기·×·동의하고 닫기(해당 체크 켜기)',
        '필수 약관·8자 비밀번호 검사(목업 서버), 가입 성공 시 토큰 저장 → 프로필 만들기(3)'],
 todo=['약관 본문을 legal.get으로 채우기(지금 예시 문구 — 법률 검토 필요)', '이메일 형식·중복 확인을 입력 중에 보여줄지 결정'],
 load=['legal.get'], acts=[('보기', ['legal.get']), ('가입하고 프로필 만들기', ['auth.signup']), ('Google/카카오', ['auth.oauth'])],
 backend=['<b>회원가입</b>: 이메일 중복 확인(409 EMAIL_TAKEN), 비밀번호 규칙 확인, 비밀번호는 해시로만 저장.',
          '<b>약관 동의 기록</b>: 어떤 버전의 약관에 언제 동의했는지 저장한다. 필수 2개(이용약관·개인정보)는 반드시 true, 마케팅은 선택.',
          '<b>약관 원문</b>은 버전 관리해서 legal.get으로 내려준다(팝업이 가져다 씀).'],
 js=r'''/* A2 회원가입 + 약관 팝업 */
const [email, nick] = App.$$('.form input.inp');
const [pw, pw2] = App.$$('.form label.pw input');
const ok = App.$('.okt');
const boxes = App.$$('.terms .check:not(.all) .box');

function checkPw() {
  const same = pw.value && pw.value === pw2.value;
  ok.hidden = !pw2.value; ok.textContent = same ? '✓ 일치해요' : '비밀번호가 달라요'; ok.style.color = same ? '' : 'var(--bad)';
}
pw.addEventListener('input', checkPw); pw2.addEventListener('input', checkPw);

async function openModal(type) {
  const m = App.$(`.overlay[data-modal="${type}"]`); m.hidden = false; m.querySelector('.mb').scrollTop = 0;
  if (!IE_CONFIG.useMock) { const d = await api.call('legal.get', { type }); m.querySelector('.mb .legal').innerHTML = d.html; }
}
App.action('openTerms', async () => { openModal('terms'); return false; });
App.action('openPrivacy', async () => { openModal('privacy'); return false; });
App.action('closeModal', async (el) => { el.closest('.overlay').hidden = true; return false; });
App.action('agreeModal', async (el) => {
  const m = el.closest('.overlay'); const box = boxes[m.dataset.modal === 'terms' ? 0 : 1];
  if (!box.classList.contains('on')) box.closest('.check').click();
  m.hidden = true; return false;
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') App.$$('.overlay').forEach(o => { o.hidden = true; }); });

App.action('oauth', async () => { App.toast('소셜 가입은 OAuth 앱 등록 후 연결돼요 (auth.oauth)'); return false; });
App.action('signup', async () => {
  if (pw.value !== pw2.value) { App.toast('비밀번호가 서로 달라요'); pw2.focus(); return false; }
  if (!nick.value.trim()) { App.toast('닉네임을 적어주세요'); nick.focus(); return false; }
  const body = {
    email: email.value.trim(), password: pw.value, nickname: nick.value.trim(),
    agreements: { terms: boxes[0].classList.contains('on'), privacy: boxes[1].classList.contains('on'), marketing: boxes[2].classList.contains('on') },
  };
  const r = await api.call('auth.signup', {}, body);
  App.save({ accessToken: r.accessToken, user: r.user, role: 'host' });
});
'''),

dict(key='A3-profile-edit', num='A3', group='account', title='프로필 수정', who='로그인 회원',
 summary='프로필 사진, 닉네임, 한 줄 강점, 맡고 싶은 역할, 할 수 있는 스킬을 고친다. 다음 세션부터 반영된다.',
 rules=[R('<button class="btn">변경 사항 저장', '변경 사항 저장', action='saveProfile'),
        R('<button class="btn ghost">취소', '취소', go='01-1-landing-logged-in'),
        R('<button class="btn ghost sm">변경', '사진 변경', action='changeAvatar'),
        R('<button class="btn text sm">삭제', '사진 삭제', action='deleteAvatar'),
        R('<a class="on">👤 프로필 수정', '왼쪽 메뉴: 프로필 수정', go='A3-profile-edit'),
        R('<a class="">🗂️ 지난 세션 기록', '왼쪽 메뉴: 지난 세션 기록', go='A4-session-history'),
        R('<a class="">⚙️ 계정 설정', '왼쪽 메뉴: 계정 설정', go='A5-account-settings'),
        R('<a style="color:var(--key);font-weight:700">', '왼쪽 아래: Pro로 업그레이드', go='A5-account-settings'),
        R('<span class="pbtn">', '프로필 버튼', go='01-1-landing-logged-in')],
 front=['역할·스킬 선택(3번과 같은 동작)', '사진 올리기(파일 선택 → 미리보기) · 삭제(첫 글자로)', '저장 → "✓ 저장됨 · 방금"', '실서버 모드: 화면을 열면 profile.get으로 닉네임·강점·역할·스킬 채움'],
 todo=['저장 안 하고 나갈 때 확인'],
 load=['profile.get', 'meta.skills'], acts=[('변경 사항 저장', ['profile.update']), ('사진 변경', ['profile.avatarUpload']), ('사진 삭제', ['profile.avatarDelete'])],
 backend=['3번(프로필 만들기)과 같은 데이터를 고친다. 저장 시각(updatedAt)을 돌려줘서 "저장됨 · 9/12"를 표시한다.',
          '<b>사진</b>은 파일 저장소(S3 같은 곳)에 올리고 주소만 DB에 저장한다. 5MB 이하 이미지만, 서버에서 정사각형으로 줄인다.',
          '진행 중인 세션에는 반영하지 않는다(세션은 시작할 때 복사한 스냅샷을 씀).'],
 js=r'''/* A3 프로필 수정 */
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
''' + NOT_MOCK + '\n'),

dict(key='A4-session-history', num='A4', group='account', title='지난 세션 기록', who='로그인 회원',
 summary='내가 진행했거나 참여한 세션 목록. 결정된 방향과 보고서 보기.',
 rules=[R('<button class="btn ghost sm">보고서 보기', '보고서 보기', action='openReport', all=True),
        R('<a class="">👤 프로필 수정', '왼쪽 메뉴: 프로필 수정', go='A3-profile-edit'),
        R('<a class="on">🗂️ 지난 세션 기록', '왼쪽 메뉴: 지난 세션 기록', go='A4-session-history'),
        R('<a class="">⚙️ 계정 설정', '왼쪽 메뉴: 계정 설정', go='A5-account-settings'),
        R('<a style="color:var(--key);font-weight:700">', '왼쪽 아래: Pro로 업그레이드', go='A5-account-settings'),
        R('<span class="pbtn">', '프로필 버튼', go='01-1-landing-logged-in')],
 front=['전체/진행자/참가자 필터', '주제 검색(입력 멈추면 0.3초 뒤 요청)', '실서버 모드에서 목록 다시 그리기(render)', '보고서 없음은 비활성 버튼'],
 todo=['보고서 화면(9-2) 연결 — 디자인 수정 후', '목록 끝에서 더 불러오기(nextCursor)', '기록이 하나도 없을 때 빈 화면 디자인'],
 load=['history.list'], acts=[('필터 / 검색', ['history.list'])],
 backend=['내가 <b>진행자였거나 참가자였던</b> 세션을 최신순으로 준다. 필터별 개수(counts)도 같이 준다.',
          '"정해진 방향"은 주제 확정(8-7)에서 고른 아이디어 제목. 중간에 끝난 세션은 decidedTopic=null, endedEarly=true, reportAvailable=false.',
          '세션은 회원만 참여할 수 있으므로, 참여했던 모든 세션이 계정 기록에 남는다.'],
 js=r'''/* A4 지난 세션 기록 */
const search = App.$('.srch input');
let role = 'all', timer;

function render(r) {
  const list = App.$('.slist'); list.querySelectorAll('.srow:not(.h)').forEach(n => n.remove());
  r.items.forEach(it => {
    const row = document.createElement('div'); row.className = 'srow';
    const meta = `${it.myRole === 'host' ? '진행자' : '참가자'} · ${it.memberCount}명 · ${it.durationMin}분`;
    const decided = it.decidedTopic ? App.escape(it.decidedTopic) : (it.endedEarly ? '— (중간 종료)' : '—');
    row.innerHTML = `<span class="dt">${it.date.replaceAll('-', '.')}</span><span class="tp">${App.escape(it.topic)}</span><span class="mt">${meta}</span>` +
      `<span class="rs"${it.decidedTopic ? '' : ' style="color:var(--faint)"'}>${decided}</span>` +
      `<span>${it.reportAvailable ? `<button class="btn ghost sm" data-action="openReport" data-session-id="${it.sessionId}">보고서 보기</button>` : '<button class="btn ghost sm disabled" disabled>보고서 없음</button>'}</span>`;
    list.appendChild(row);
  });
  const chips = App.$$('.chips .chip'); chips[0].textContent = `전체 ${r.counts.all}`; chips[1].textContent = `진행자 ${r.counts.host}`; chips[2].textContent = `참가자 ${r.counts.participant}`;
}
async function load() { if (IE_CONFIG.useMock) return; render(await api.call('history.list', { query: { role, q: search.value.trim() } })); }
if (!IE_CONFIG.useMock) App.loadAccountSide();

document.addEventListener('ie:chip', (e) => {
  role = e.detail.startsWith('진행자') ? 'host' : e.detail.startsWith('참가자') ? 'participant' : 'all';
  if (IE_CONFIG.useMock) App.toast(`필터: ${e.detail} (백엔드 연결 후 목록이 바뀌어요)`);
  load();
});
search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 300); });
App.action('openReport', async () => { App.toast('보고서 화면(9-2)은 디자인 수정 후 연결돼요'); return false; });
load();
'''),

dict(key='A5-account-settings', num='A5', group='account', title='계정 설정', who='로그인 회원',
 summary='로그인 정보(이메일·비밀번호·소셜 연결), 알림, 요금제(FREE → Pro), 로그아웃·탈퇴.',
 rules=[R('<button class="btn ghost sm">변경', '변경 (이메일 / 비밀번호)', extra=None),
        R('<button class="btn ghost sm">연결하기', '카카오 연결하기', action='connect'),
        R('<button class="btn">Pro로 업그레이드', 'Pro로 업그레이드 →', action='upgrade'),
        R('<button class="btn ghost sm">로그아웃', '로그아웃', go='01-landing', action='logout'),
        R('<button class="btn danger sm">탈퇴', '탈퇴', go='01-landing', action='withdraw'),
        R('<a class="">👤 프로필 수정', '왼쪽 메뉴: 프로필 수정', go='A3-profile-edit'),
        R('<a class="">🗂️ 지난 세션 기록', '왼쪽 메뉴: 지난 세션 기록', go='A4-session-history'),
        R('<a class="on">⚙️ 계정 설정', '왼쪽 메뉴: 계정 설정', go='A5-account-settings'),
        R('<a style="color:var(--key);font-weight:700">', '왼쪽 아래: Pro로 업그레이드', action='upgrade'),
        R('<span class="pbtn">', '프로필 버튼', go='01-1-landing-logged-in')],
 front=['알림 토글 → 바로 저장(실패 시 되돌림)', '이메일 변경·비밀번호 변경(간단한 입력 창)', 'Pro 결제 시작(결제창 주소 받기)', '로그아웃', '탈퇴(확인 + 비밀번호)'],
 todo=['이메일·비밀번호 변경을 prompt 대신 팝업으로(디자인 필요)', '가격 확정 후 요금제 카드 문구'],
 load=['settings.get', 'billing.plan'],
 acts=[('알림 토글', ['settings.update']), ('이메일 변경', ['account.changeEmail']), ('비밀번호 변경', ['account.changePassword']),
       ('카카오 연결하기', ['account.connect']), ('Pro로 업그레이드', ['billing.checkout']), ('로그아웃', ['auth.logout']), ('탈퇴', ['account.withdraw'])],
 backend=['<b>설정 불러오기/저장</b>: 알림 3개(세션 초대·보고서 완성·마케팅)는 바뀐 것만 PATCH.',
          '<b>이메일 변경</b>은 새 주소로 확인 메일을 보내고 링크를 눌러야 바뀐다. <b>비밀번호 변경</b>은 현재 비밀번호를 확인하고, 다른 기기 로그인을 끊는다.',
          '<b>소셜 연결 해제</b> 시 마지막 로그인 수단이면 막는다(409).',
          '<b>결제</b>: 결제 대행사(PG) 결제창 주소를 만들어 주고, <b>결제 완료는 PG가 서버로 보내는 웹훅으로만</b> 확정한다(프론트 응답을 믿지 않음). 요금제가 바뀌면 billing.plan의 한도도 바뀐다.',
          '<b>탈퇴</b>: 비밀번호 확인 후 계정 삭제. 다른 사람과 함께한 세션의 익명 댓글·아이디어를 어떻게 남길지 정책 결정이 필요하다(예: "탈퇴한 사용자").'],
 js=r'''/* A5 계정 설정 */
const NOTI = { '세션 초대 알림': 'sessionInvite', '보고서 완성 알림': 'reportReady', '새 기능·이벤트 소식': 'marketing' };

document.addEventListener('ie:toggle', (e) => {
  const key = NOTI[App.text(e.target.closest('.sr').firstElementChild)]; if (!key) return;
  api.call('settings.update', {}, { notifications: { [key]: e.detail } })
    .then(() => App.toast('알림 설정을 저장했어요'))
    .catch(err => { e.target.classList.toggle('on'); App.toast(err.message, 'error'); });
});
/* 실서버 모드: 로그인 정보 · 소셜 연결 · 알림 · 요금제를 서버 값으로 */
function fillSettings(s) {
  App.$$('.sr').forEach(row => {
    const label = App.text(row.querySelector('.sk2') || {});
    const val = row.querySelector('.sv');
    if (label === '이메일' && val) val.textContent = s.email;
    if (label === '비밀번호' && val) val.textContent = s.passwordChangedAt ? `마지막 변경 ${s.passwordChangedAt.slice(0, 10).replaceAll('-', '.')}` : '아직 만들지 않았어요';
    const name = App.text(row.firstElementChild || {});
    if (/Google|카카오/.test(name)) {
      const on = s.connections && s.connections[/Google/.test(name) ? 'google' : 'kakao'];
      const badge = row.querySelector('.badge'), btn = row.querySelector('button');
      if (badge) badge.hidden = !on;
      if (btn) btn.hidden = !!on;
    }
  });
  const keys = ['sessionInvite', 'reportReady', 'marketing'];
  App.$$('.sc .sr .toggle').forEach((t, i) => { if (keys[i]) t.classList.toggle('on', !!(s.notifications || {})[keys[i]]); });
}
async function load() {
  App.loadAccountSide();
  const s = await App.run(null, () => api.call('settings.get'));
  if (s) fillSettings(s);
  const p = await App.run(null, () => api.call('billing.plan'));
  if (p) {
    App.$$('.plan-free').forEach(el => { el.textContent = p.plan; });
    const mini = App.$('.planmini');
    if (mini && p.limits) mini.childNodes.forEach?.call(mini.childNodes, n => { if (n.nodeType === 3 && n.nodeValue.includes('세션 최대')) n.nodeValue = p.limits.unlimitedDuration ? '세션 시간 제한 없음' : `세션 최대 ${p.limits.maxSessionMinutes}분`; });
  }
}
if (!IE_CONFIG.useMock) load();

App.action('changeEmail', async () => {
  const newEmail = prompt('새 이메일 주소'); if (!newEmail) return false;
  const password = prompt('확인을 위해 현재 비밀번호를 입력해 주세요'); if (!password) return false;
  await api.call('account.changeEmail', {}, { newEmail, password });
  App.toast('새 이메일로 확인 메일을 보냈어요'); return false;
});
App.action('changePassword', async () => {
  const currentPassword = prompt('현재 비밀번호'); if (!currentPassword) return false;
  const newPassword = prompt('새 비밀번호 (8자 이상)'); if (!newPassword) return false;
  await api.call('account.changePassword', {}, { currentPassword, newPassword });
  App.toast('비밀번호를 바꿨어요'); return false;
});
App.action('connect', async () => { App.toast('카카오 연결은 OAuth 앱 등록 후 연결돼요 (account.connect)'); return false; });
App.action('upgrade', async () => {
  const r = await api.call('billing.checkout', {}, { plan: 'PRO', period: 'monthly' });
  if (IE_CONFIG.useMock) { App.toast('결제창 주소를 받았어요 (목업)'); return false; }
  location.href = r.checkoutUrl; return false;
});
App.action('logout', async () => { await api.call('auth.logout'); App.save({ accessToken: null, user: null }); });
App.action('withdraw', async () => {
  if (!confirm('정말 탈퇴할까요? 세션 기록이 모두 삭제되고 복구할 수 없어요.')) return false;
  const password = prompt('확인을 위해 비밀번호를 입력해 주세요'); if (!password) return false;
  await api.call('account.withdraw', {}, { password });
  App.save({ accessToken: null, user: null });
});
'''),

dict(key='A6-oauth-callback', num='A6', group='account', title='소셜 로그인 처리 중 (콜백)', who='로그인하려는 사람',
 summary='Google · 카카오 로그인 창에서 /oauth/callback?code=…&state=… 로 돌아온 직후. code를 auth.oauth로 보내고, 처음 가입이면 약관 동의(A2)로, 아니면 원래 가려던 화면(returnTo)으로 간다.',
 rules=[],
 front=['주소의 code · state · provider를 읽어 auth.oauth 호출 → 토큰 저장 → returnTo로 이동', 'AGREEMENT_REQUIRED(처음 가입)면 A2로 · OAUTH_FAILED면 안내 + A1로', '5초 넘게 안 넘어가면 "다시 시도" 링크'],
 todo=['OAuth 앱 등록 후 redirectUri 확정', 'A5 "연결하기"(account.connect)도 같은 콜백 화면을 쓸지 결정'],
 load=[], acts=[('열릴 때', ['auth.oauth'])],
 backend=['auth.oauth의 redirectUri는 이 화면 주소(https://ideationengine.app/oauth/callback). state는 프론트가 만들어 sessionStorage에 두고 돌아왔을 때 비교한다.',
          '처음 가입이면 409 AGREEMENT_REQUIRED → 프론트가 A2(약관 동의)로 보낸 뒤 다시 auth.oauth를 부른다(6차 문서).'],
 events=[],
 js=r"""/* A6 소셜 로그인 콜백 */
(async () => {
  const q = new URLSearchParams(location.search);
  const provider = q.get('provider') || sessionStorage.getItem('ie.oauth.provider') || 'google';
  const code = q.get('code'), state = q.get('state');
  if (IE_CONFIG.useMock) { App.toast('목업: 소셜 로그인 처리 중 화면이에요 (실서버에서는 1초 안에 넘어가요)'); return; }
  if (!code || state !== sessionStorage.getItem('ie.oauth.state')) { App.toast('로그인 정보가 맞지 않아요. 다시 시도해 주세요', 'error'); App.go(App.screen('A1-login')); return; }
  try {
    const r = await api.call('auth.oauth', { provider }, { code, redirectUri: location.origin + '/oauth/callback' });
    App.save({ accessToken: r.accessToken, user: r.user });
    App.go(App.returnTo(App.screen('01-1-landing-logged-in')));
  } catch (err) {
    if (err.code === 'AGREEMENT_REQUIRED') { sessionStorage.setItem('ie.oauth.pending', JSON.stringify({ provider, code })); App.go(App.screen('A2-signup')); return; }
    App.toast(err.message || '소셜 로그인에 실패했어요', 'error'); App.go(App.screen('A1-login'));
  }
})();
"""),
]

# A5 "변경" 버튼 두 개: 순서대로 이메일 / 비밀번호
for s in SCREENS:
    if s['key'] == 'A5-account-settings':
        s['rules'][0] = ('<button class="btn ghost sm">변경', [{'action': 'changeEmail'}, {'action': 'changePassword'}], True, '변경 (이메일 / 비밀번호)')
    if s['key'] == 'A2-signup':
        s['rules'][1] = ('<a>보기', [{'action': 'openTerms'}, {'action': 'openPrivacy'}], True, '보기 (이용약관 / 개인정보)')

GROUPS = [('start', '1 · 시작', '랜딩 · 방 입장 · 프로필 · 세션 만들기 · 대기실'),
          ('ice', '7 · 아이스브레이킹', 'AI와 1:1 인터뷰 → 재료 모으기'),
          ('div', '8 · 아이디어 발산', '내 아이디어 → 익명 순위표 → 익명 댓글 → AI 검증 → 투표 → 결과'),
          ('account', 'A · 계정', '로그인 · 회원가입 · 프로필 수정 · 지난 세션 · 계정 설정')]
