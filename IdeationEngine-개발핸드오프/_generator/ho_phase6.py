# 6차 전달 문서 내용 — 담당: 나 (노형원의 Claude)
# · 이 파일의 SPEC만 채우면 docs/{파일}이 만들어진다 (모양은 _generator/ho_phase1.py = 1차 문서와 같음)
# · 검사/미리보기: python _generator/check_delivery.py 6   → 문제 0건이 되면 READY = True
# · 진짜 생성: python _generator/handoff.py  (READY=True + 검사 통과일 때만 docs/ 에 씀)
# · 문장 규칙: 표 칸(why · scenarios)에는 줄바꿈·| 금지(<br> 사용) · 에러는 "409 STAGE_MISMATCH"처럼 HTTP 번호와 코드를 같이
READY = True

BOUNDARY = '''이번 범위에서 **주소 · 토큰 규칙만 정하고**, 화면이 생기면 추가할 것:

- **비밀번호 재설정 확정 화면 — 지금 시연 영상에서 급한 부분은 아니니 내버려 두겠음(2026-09-18 결정).** 메일 링크 `https://ideationengine.app/reset-password?token=…`을 연 뒤 새 비밀번호를 정하는 화면 · API는 나중에 문제되면 그때 정해요. 메일 보내기(`auth.passwordReset`)까지만 이번 범위.
- 이메일 변경 확정 — 메일 링크 `https://ideationengine.app/verify-email?token=…`을 연 뒤 확정하는 화면 · API
- 소셜 로그인 콜백 화면(`/oauth/callback`) — **A6 화면을 추가했어요(2026-09-18)**: code · state를 읽어 `auth.oauth`를 부르고 returnTo로 이동, 처음 가입이면 A2로. A1 · A2 · A5의 소셜 버튼이 실제 OAuth 창을 여는 건 OAuth 앱 등록 뒤(redirectUri 확정) — 그전까지 테스트는 콘솔로.
- `POST /billing/webhook` — 결제 대행사(PG)가 정해지면. 그 전까지 `billing.checkout`은 테스트 결제창 주소만.
- A4 "보고서 보기" — 9-2 보고서 디자인 후 (`reportAvailable`은 그때까지 false).
- A5 "로그아웃"은 1차의 `auth.logout`을 그대로 써요.'''

QUESTIONS = '''| 무엇 | 지금 규칙 (바뀌면 알려드릴게요) |
|---|---|
| 소셜로 처음 가입할 때 약관 동의 화면 | 없음 — 서버는 필수 동의가 없으면 409 AGREEMENT_REQUIRED |
| 탈퇴한 사람이 함께한 세션의 익명 아이디어 · 댓글 · 표 | 임시: 남기고 계정 연결만 끊음, 이름이 필요하면 "탈퇴한 사용자" |
| 진행 중인 세션의 진행자가 탈퇴 | 임시: 탈퇴는 됨, 세션은 그대로 남음 |
| 세션이 "끝나는" 때 | 시간이 끝났을 때 동작이 정해지지 않아서, 지금은 A4에 진행 중인 세션도 보여요 |
| 소셜 연결 해제 버튼 | 화면에 없음 (API만) |
| Pro 가격 · PG · 약관 문구 법률 검토 | 미정 |'''

SPEC = dict(
    phase='6차',
    title='백엔드 6차 전달 — 화면 A1 ~ A5 (계정 나머지)',
    intro='이번에 만들 범위와 **끝났다고 볼 수 있는 기준**이에요. 화면 폴더: `screens/A1-login`, `screens/A2-signup`, `screens/A3-profile-edit`, `screens/A4-session-history`, `screens/A5-account-settings` (각 README에 화면 설명). 1차(가입 · 로그인 · 로그인 유지 · 프로필 저장)가 끝난 서버 기준이고, A4 목록을 보려면 2차 · 4차로 시작한 세션이 있어야 해요.',
    rules=[
        '**비밀번호 확인 실패는 `403 PASSWORD_MISMATCH`** — 이메일 변경 · 비밀번호 변경 · 탈퇴에서 401을 주면 프론트가 로그인 유지(refresh)를 하고 같은 요청을 한 번 더 보내요. 401은 "로그인 자체가 안 됨"에만.',
        '**가입 여부를 들키지 않기** — 비밀번호 찾기는 가입된 이메일이든 아니든 똑같이 `{"sent": true}`.',
        '**소셜 계정은 자동으로 합치지 않기** — 이메일이 같아도 로그인 후 계정 설정(A5)에서 직접 연결할 때만 합쳐요(`409 EMAIL_TAKEN`). 처음 소셜 가입은 필수 약관 동의가 있어야 해요(`409 AGREEMENT_REQUIRED`).',
        '**사진은 파일 저장소에** — 5MB 이하 JPG · PNG · WebP만, 서버에서 정사각형 512×512로 줄여 **매번 새 주소**로 저장하고 DB에는 주소만.',
        '**요금제 한도는 서버 한 곳에** — `billing.plan`과 세션 만들기의 `403 PLAN_LIMIT`가 같은 값을 써요. PRO로 바뀌는 건 PG 웹훅을 받았을 때만.',
        '**메일 링크 뒤의 화면은 아직 없음** — 재설정 · 이메일 확인 링크의 주소와 토큰 규칙만 이번에 정해요 (아래 "이번 범위의 경계").',
    ],
    rules_after='로그인 유지 규칙은 [01-백엔드-한눈에-보기.md](01-백엔드-한눈에-보기.md)의 "3-1 로그인 유지", 요금제는 "6. 요금제 규칙", 표 제안은 [04-데이터-모델.md](04-데이터-모델.md)의 "계정".',
    api_intro='계정 화면(A1 ~ A5)에서 1차에 넣지 않은 나머지 전부예요. 외부 준비물이 필요해요: **Google · 카카오 OAuth 앱 등록 · 메일 발송 · 파일 저장소 · 결제 PG(미정)**.',
    ids=[
        'auth.oauth',
        'auth.passwordReset',
        'legal.get',
        'profile.get',
        'profile.avatarUpload',
        'profile.avatarDelete',
        'history.list',
        'settings.get',
        'settings.update',
        'account.changeEmail',
        'account.changePassword',
        'account.connect',
        'account.disconnect',
        'account.withdraw',
        'billing.plan',
        'billing.checkout',
    ],
    why={
        'auth.oauth': 'A1 · A2 Google · 카카오로 계속 → 콜백 화면 A6에서 호출',
        'auth.passwordReset': 'A1 비밀번호 찾기',
        'legal.get': 'A2 약관 "보기" 팝업 본문 · 가입 동의 기록의 버전',
        'profile.get': 'A3 열 때 채우기',
        'profile.avatarUpload': 'A3 사진 변경',
        'profile.avatarDelete': 'A3 사진 삭제',
        'history.list': 'A4 목록 · 역할 칩 · 검색',
        'settings.get': 'A5 열 때 채우기 (프론트 연결은 남음)',
        'settings.update': 'A5 알림 토글',
        'account.changeEmail': 'A5 이메일 "변경"',
        'account.changePassword': 'A5 비밀번호 "변경"',
        'account.connect': 'A5 카카오 "연결하기" (버튼은 아직 안내 토스트)',
        'account.disconnect': '소셜 연결 해제 (화면 버튼은 추후)',
        'account.withdraw': 'A5 탈퇴',
        'billing.plan': '4 · A5 요금제 한도 표시 (프론트 연결은 남음)',
        'billing.checkout': 'A5 Pro로 업그레이드',
    },
    events_intro='이번 범위에 실시간 이벤트는 없어요.',
    events=[],
    done_intro='''프론트의 `assets/js/config.js`에서 `useMock: false`, `baseUrl`을 서버 주소로 바꾸고 확인해요.

준비: **회원 U** (이메일 가입 · 프로필 있음 · 2차 · 4차 테스트로 진행자 1번 · 참가자 1번 이상 **시작한 세션**이 있음), U로 로그인한 **브라우저 프로필 두 개 B1 · B2** ("로그인 상태 유지" 체크), 메일을 받을 수 있는 주소, 가입하지 않은 이메일 하나. 소셜 시나리오는 OAuth 앱 등록 후 — 콜백 화면이 없어서 **Google · 카카오 인가 주소를 직접 열어 받은 code로 콘솔에서** 불러요 (code는 한 번만 쓸 수 있어서 매번 새로). 시나리오는 **위에서부터 순서대로** 이어져요.

화면에 버튼이 없거나 서버 데이터를 아직 그리지 않는 동작은 개발자도구 **콘솔에서 `await api.call(…)`**, 요청 횟수는 **Network 탭**에서 확인해요.''',
    scenarios=[
        ('B1 A1에서 이메일 칸에 U 이메일을 적고 "비밀번호 찾기"', '"비밀번호 재설정 메일을 보냈어요" · U 메일함에 `https://ideationengine.app/reset-password?token=…` 링크'),
        ('가입하지 않은 이메일로 같은 동작', '같은 토스트 · 응답도 똑같이 `{"sent": true}` · 메일은 안 옴'),
        ('같은 브라우저에서 10분 안에 6번째 "비밀번호 찾기"', '429 TOO_MANY_ATTEMPTS 안내'),
        ('A2에서 "보기"(이용약관) · "보기"(개인정보)', '팝업 본문이 서버 약관 html (`legal.get` terms · privacy) · 새로 가입하면 DB 동의 기록에 그 version'),
        ('콘솔 `await api.call(\'legal.get\', { type: \'refund\' })`', '404 NOT_FOUND'),
        ('콘솔 `await api.call(\'auth.oauth\', { provider: \'google\' }, { code: \'bad\', redirectUri: \'https://ideationengine.app/oauth/callback\' })`', '400 OAUTH_FAILED'),
        ('provider를 `naver`로 같은 호출', '400 VALIDATION'),
        ('처음 쓰는 Google 계정의 code로 agreements 없이 `auth.oauth`', '409 AGREEMENT_REQUIRED · 계정이 만들어지지 않음'),
        ('같은 Google 계정의 새 code + agreements(terms · privacy true)', 'isNewUser true · accessToken · 리프레시 쿠키 · 한 번 더 로그인하면 isNewUser false'),
        ('U와 이메일이 같은 Google 계정(U에 연결 안 됨)의 code로 `auth.oauth`', '409 EMAIL_TAKEN · U 계정에 연결되지 않음'),
        ('B1 A3 열기', '닉네임 · 한 줄 강점 · 맡고 싶은 역할 칩 · 스킬 칩이 서버 값 (`profile.get`)'),
        ('프로필을 아직 안 만든 회원으로 콘솔 `profile.get`', 'nickname은 가입 때 닉네임 · strength · desiredRole null · skills `[]`'),
        ('U가 참가 중인 세션이 있을 때 A3에서 닉네임을 바꾸고 "변경 사항 저장"', '"✓ 저장됨 · 방금" · 새로고침해도 유지 · 그 세션 `session.participants`의 U 닉네임은 예전 그대로'),
        ('A3 "사진 변경"으로 1MB PNG', '아바타가 사진으로 · 받은 avatarUrl 이미지가 512×512 · 1-1 팝오버와 프로필 버튼도 사진'),
        ('같은 사진을 한 번 더 올림', 'avatarUrl 주소가 이전과 다름'),
        ('6MB 이미지를 고름 → 콘솔로 6MB `FormData`를 직접 `profile.avatarUpload` · 텍스트 파일도', '화면은 "5MB 이하 이미지만 올릴 수 있어요"로 막음(요청 없음) · 콘솔은 둘 다 400 VALIDATION'),
        ('A3 "사진 삭제" → 콘솔로 `profile.avatarDelete` 한 번 더', '닉네임 첫 글자로 · `profile.get` avatarUrl null · 두 번째도 204'),
        ('B1 A4 열기', '목록과 칩 숫자("전체 n · 진행자 n · 참가자 n")가 서버 값 · 시작한 세션만 (시작 안 한 대기실 방 · 내보내진 방 없음) · 최신순'),
        ('A4 "진행자" 칩 → "참가자" 칩', '각각 U가 진행자였던 / 참가자였던 세션만'),
        ('A4 검색칸에 주제 일부를 입력', '0.3초 뒤 맞는 세션만 · 칩 숫자도 검색어 기준'),
        ('주제를 확정한 세션의 줄', '"정해진 방향"에 확정한 아이디어 제목 · 버튼은 "보고서 없음"(비활성)'),
        ('콘솔 `history.list`에 `{ query: { limit: 1 } }` → 받은 nextCursor로 계속 · limit 0', '1개씩 겹치지 않고 끝에서 nextCursor null · limit 0은 400 VALIDATION'),
        ('B1 A5에서 "새 기능·이벤트 소식" 토글을 누름', '"알림 설정을 저장했어요" · `settings.get`의 notifications.marketing이 누른 뒤 토글 상태와 같음 (켜짐 true · 꺼짐 false) · 다른 알림은 그대로'),
        ('콘솔 `settings.update`에 `{ notifications: { foo: true } }`', '400 VALIDATION'),
        ('A5 이메일 "변경" → 새 이메일 + 틀린 비밀번호', '403 PASSWORD_MISMATCH 안내 · Network에 `PATCH /me/email` 요청이 **1번만** (refresh 재시도 없음)'),
        ('이메일 "변경" → 다른 회원이 쓰는 이메일 → 다시 새 이메일 + 맞는 비밀번호', '409 EMAIL_TAKEN → "새 이메일로 확인 메일을 보냈어요" · 새 주소에 verify-email 링크 · 예전 주소에 안내 메일 · `settings.get` email은 아직 예전 주소'),
        ('비밀번호 "변경" → 틀린 현재 비밀번호 → 새 비밀번호 7자', '403 PASSWORD_MISMATCH → 400 VALIDATION'),
        ('B1에서 비밀번호 "변경" 정상 완료 (서버의 액세스 토큰 수명을 1분으로 줄여 테스트)', '"비밀번호를 바꿨어요" · 1분 뒤 B1은 새로고침해도 로그인 유지 · B2는 로그인 화면으로 · 새 비밀번호로 로그인됨 · passwordChangedAt 갱신'),
        ('A5 카카오 "연결하기" → 콘솔 `account.connect` (provider kakao + 받은 code) → 다른 계정에 이미 연결된 카카오 계정의 code', '버튼은 안내 토스트만 → connections.kakao true → 409 OAUTH_TAKEN'),
        ('U에서 콘솔 `account.disconnect` (google) → 9번에서 만든 Google 전용 계정에서 `account.disconnect` (google)', '204 · `settings.get` connections.google false → 409 LAST_LOGIN_METHOD'),
        ('콘솔 `billing.plan` — FREE 계정 · DB에서 PRO로 바꾼 계정', 'maxSessionMinutes 30 · unlimitedDuration false / maxSessionMinutes null · unlimitedDuration true'),
        ('FREE 계정 A5 "Pro로 업그레이드" → PRO 계정 콘솔 `billing.checkout`', '받은 checkoutUrl(PG 테스트 결제창 또는 임시 안내 페이지)로 이동 · 요금제는 아직 FREE → 409 ALREADY_PRO'),
        ('A5 "탈퇴" → 확인 → 틀린 비밀번호', '403 PASSWORD_MISMATCH 안내 · 계정 그대로'),
        ('A5 "탈퇴" → 확인 → 맞는 비밀번호', '랜딩으로 · 같은 이메일 · 비밀번호로 로그인하면 401 INVALID_CREDENTIALS · refresh도 401 · 같은 이메일로 새로 가입 가능 · U가 함께한 세션의 다른 참가자 `vote.results`는 그대로 열림'),
    ],
    extra_sections=[
        ('이번 범위의 경계', BOUNDARY),
        ('확인이 필요한 것 (디자인 · 기획)', QUESTIONS),
    ],
    front_title='프론트 쪽 참고 (이미 구현된 것 · 아직 안 된 것)',
    front=[
        'A1: "비밀번호 찾기" → `auth.passwordReset` → 토스트: `screens/A1-login/screen.js`',
        'A2: 약관 "보기" → 팝업을 열고 `legal.get`으로 본문 채우기 · "동의하고 닫기" → 체크: `screens/A2-signup/screen.js`',
        'A3: 열 때 `profile.get`으로 채우기 · 저장 → `profile.update` · 사진 올리기(5MB 검사 → `profile.avatarUpload` multipart) · 삭제 → `profile.avatarDelete`: `screens/A3-profile-edit/screen.js`',
        'A4: `history.list`로 목록 · 칩 숫자 다시 그리기 · 역할 칩 · 검색(0.3초 기다렸다 요청): `screens/A4-session-history/screen.js`',
        'A5: 알림 토글 → `settings.update` (실패하면 되돌림) · 이메일 · 비밀번호 변경 → `account.changeEmail` · `account.changePassword` · "Pro로 업그레이드" → `billing.checkout` → 결제창 주소로 이동 · 탈퇴(확인 + 비밀번호) → `account.withdraw`: `screens/A5-account-settings/screen.js`',
        'multipart 업로드(FormData면 Content-Type을 브라우저에 맡김) · 401이면 refresh 한 번 후 재시도: `assets/js/api.js`',
        'A6 소셜 로그인 콜백: 주소의 code · state를 읽어 `auth.oauth` 호출 → 처음 가입이면 A2, 아니면 원래 가려던 곳으로: `screens/A6-oauth-callback/screen.js`',
        '⬜ 아직 안 됨 — 소셜: A1 · A2 · A5의 소셜 버튼이 아직 소셜 로그인 창을 열지 않음(안내 토스트) · `account.connect` 호출 없음 · 연결 해제 버튼 없음',
'A5: 열 때 `settings.get`(이메일 · 비밀번호 바꾼 날 · 소셜 연결 · 알림 토글)과 `billing.plan`(요금제 · 한도)으로 채워요: `screens/A5-account-settings/screen.js`',
        '3 · A3: 역할 · 스킬 칩을 `meta.skills`로 그리고 내 선택을 표시 · A3 · A4 · A5 왼쪽 메뉴(이름 · 이메일 · 요금제 · 지난 세션 수)는 `/me`로: `assets/js/app.js` (`renderSkillChips` · `loadAccountSide`)',
        '4 세션 만들기: 무료 한도를 `billing.plan`으로 (PRO면 잠금 칩 해제): `screens/04-session-create/screen.js`',
        '⬜ 아직 안 됨 — A5 이메일 · 비밀번호 변경이 브라우저 기본 입력 창(prompt) · A4 "더 불러오기"(nextCursor) · 기록이 없을 때 화면 · A4 "보고서 보기"는 9-2 디자인 후',
    ],
)
