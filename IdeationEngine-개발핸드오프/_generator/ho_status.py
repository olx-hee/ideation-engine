# 팀 공유용 진행 현황 문서 (팀공유-진행현황.md) — 화면·API 표는 실제 정의(SCREENS, ENDPOINTS)에서 자동 생성
from ho_api import ENDPOINTS, E, EVENTS

UPDATED = '2026-09-18'   # 9-1 ~ 9-5 추가

# 실서버 모드(테스트 백엔드)로 직접 확인한 화면
VERIFIED = {
    '01-landing': '확인 완료',
    '01-1-landing-logged-in': '확인 완료',
    '02-join-code': '확인 완료',
    '03-profile-create': '확인 완료 (가입·입장 흐름 안에서)',
    'A1-login': '확인 완료 (로그인 · 상태 유지)',
    'A2-signup': '확인 완료 (가입 → 프로필)',
    '06-lobby-participant': '일부 (새로고침 시 서버 단계로 이동만)',
    '07-1-icebreak-q1-discomfort': '일부 (재접속 도착 화면으로만)',
    '07-6-icebreak-host': '일부 (진행자 재접속 도착 화면으로만)',
    '09-1-part-split': '확인 완료',
    '09-2-overlap-questions': '확인 완료',
    '09-3-assign-draft': '확인 완료',
    '09-4-leader-confirm': '확인 완료',
    '09-5-report': '확인 완료',
    '08-7-vote-result-host': '일부 (주제 확정 → 9-1 이동만)',
}

# 화면 README의 "남은 일"에 더해, 실서버 연결 때 필요한 것 (디자인 예시 데이터가 HTML에 고정돼 있는 부분)
EXTRA_TODO = {
    '04-session-create': ['화면을 열 때 로그인·프로필 확인 (지금은 1 랜딩의 버튼에서만 확인)'],
}

SESSION_KEYS_PREFIX = ('05', '06', '07', '08')

# 백엔드 개발 단계 — 모든 API가 정확히 한 번씩 들어가야 함 (아래 assert로 검사)
PHASES = [
    ('1차', '계정 기본 · 방 입장 · 재접속 (화면 1 · 1-1 · 2)', '명세·완료 기준 전달 완료 → **백엔드 작업 시작 전**',
     ['auth.signup', 'auth.login', 'auth.refresh', 'auth.logout', 'auth.me', 'meta.skills', 'profile.update',
      'session.create', 'session.lookup', 'session.join', 'session.get'],
     '`docs/00-백엔드-1차-전달-화면1-1-1-2.md` (완료 기준 18개 포함)'),
    ('2차', '대기실 · 실시간 · 단계 진행 (화면 4 · 5 · 6)', '명세만 있음',
     ['session.participants', 'session.kick', 'session.start', 'session.advance', 'session.back', 'session.extend'],
     'WebSocket 서버 + 이벤트(participant.* · session.started · stage.changed · timer.sync) 포함'),
    ('3차', '아이스브레이킹 (화면 7-1 ~ 7-7)', '명세만 있음',
     ['ice.state', 'ice.send', 'ice.skip', 'ice.news', 'ice.react', 'ice.explain', 'ice.progress', 'ice.myMaterials',
      'ice.overview', 'ice.regroup', 'ice.focus', 'ice.materials'],
     'AI 작업 1~5번 (docs/05-AI-작업-목록.md) · 검색 API 필요'),
    ('4차', '발산 기본 — AI 없이 끝까지 (화면 8-1 · 8-3 · 8-4 · 8-6 · 8-7)', '명세만 있음',
     ['idea.mine', 'idea.submit', 'idea.board', 'comment.targets', 'comment.list', 'comment.create',
      'vote.state', 'vote.candidate', 'vote.save', 'vote.finish', 'vote.results', 'vote.revote', 'topic.confirm'],
     '익명 규칙이 가장 중요 (docs/01 "5. 익명 규칙")'),
    ('5차', '발산 AI (화면 8-2 · 8-5 · 8-6의 AI 부분)', '명세만 있음',
     ['idea.recommend', 'review.list', 'review.get', 'vote.aiIdea', 'vote.thread', 'vote.threadReact'],
     'AI 작업 6~10번 · 작업 큐 필요'),
    ('6차', '계정 나머지 (A1 소셜·비밀번호 찾기 · A2 약관 · A3 · A4 · A5)', '명세만 있음',
     ['auth.oauth', 'auth.passwordReset', 'legal.get', 'profile.get', 'profile.avatarUpload', 'profile.avatarDelete',
      'history.list', 'settings.get', 'settings.update', 'account.changeEmail', 'account.changePassword',
      'account.connect', 'account.disconnect', 'account.withdraw', 'billing.plan', 'billing.checkout'],
     'OAuth 앱 등록 · 메일 발송 · 파일 저장소 · 결제 PG(미정) 필요'),
    ('7차', '파트 나누기 · 배치 · 보고서 (화면 9-1 ~ 9-5)', '명세만 있음',
     ['team.parts', 'team.questions', 'team.answer', 'team.assignment', 'team.mark',
      'team.reassign', 'team.suggestion', 'team.revert', 'team.confirm', 'report.get'],
     'AI 작업 11~15 · 바뀐 API 3개(topic.confirm · session.advance · session.get) · `_tools/test-backend-team.py`(가짜 백엔드)'),
]

def _check_phases():
    ids = [i for p in PHASES for i in p[3]]
    missing = sorted(set(ENDPOINTS) - set(ids)); dup = sorted({i for i in ids if ids.count(i) > 1}); unknown = sorted(set(ids) - set(ENDPOINTS))
    assert not missing and not dup and not unknown, ('단계 표 오류', missing, dup, unknown)
    return len(ids)

def status_md(SCREENS, KEY, DELIVERED=None):
    total = _check_phases()
    DELIVERED = DELIVERED or {}
    ready = [n for n in DELIVERED if n != '1차']
    L = []
    A = L.append
    A(f'# IdeationEngine 진행 현황 — 팀 공유 ({UPDATED})')
    A('')
    A('> 이 문서 하나만 읽으면 **무엇을 했고 · 어디까지 됐고 · 무엇을 해야 하는지** 알 수 있게 정리했어요.')
    A('> 팀원의 Claude에게는 이 파일을 먼저 읽히면 돼요 → 맨 아래 **"Claude에게 — 이어서 작업하는 법"**.')
    A('')
    A('## 0. 한눈에 보기')
    A('')
    A('| 영역 | 상태 |')
    A('|---|---|')
    A('| 디자인 | 화면 1 ~ 9-5 + 계정 A1 ~ A5 **확정** (목업 v14). 9번(파트 나누기 ~ A4 보고서)까지 그려짐 |')
    A(f'| 프론트엔드 | {len(SCREENS)}개 화면 HTML·CSS 완료(디자인과 똑같음), JS 동작 완료(가짜 서버 모드). **실서버 연결까지 확인된 건 1 · 1-1 · 2 (+ 3 · A1 · A2 흐름)** |')
    A(f'| 백엔드 | API {total}개 + 실시간 이벤트 {len(EVENTS)}개 **명세 완료**. 실제 서버 구현은 **아직 시작 전** — 1차 전달 완료' + (f' · {" · ".join(ready)} 전달 문서 준비됨' if ready else '') + ' |')
    A('| 보류 | 모바일·반응형(지금은 필요 없음) · 로딩 중/데이터 없음/에러 화면(나중에) |')
    A('')
    A('## 1. 받은 파일 구성')
    A('')
    A('```')
    A('IdeationEngine-개발핸드오프/')
    A('├─ 팀공유-진행현황.md        ← 지금 이 문서')
    A('├─ README.md                 개발 폴더 사용법 (프론트·백엔드)')
    A(f'├─ index.html                화면 목록 — 브라우저로 열면 {len(SCREENS)}개 화면을 눌러볼 수 있음')
    A('├─ design/                   디자인 목업 원본 (IdeationEngine-디자이너-목업-v14.html · 모든 화면 + 디자인 규칙)')
    A('├─ screens/<화면>/           화면별 index.html · screen.js · README.md(설명·남은 일·API 요청/응답 예시)')
    A('├─ assets/css · assets/js    공통 스타일 · 공통 동작 · API 클라이언트 · 가짜 서버')
    A('├─ docs/                     00 백엔드 차수별 전달(1차 ~) · 01 백엔드 한눈에 보기 · 02 API 공통 규칙 · 03 API 전체 목록 · 04 데이터 모델 · 05 AI 작업 · 06 디자인 토큰')
    A('├─ _generator/               ★ 위 파일들을 만드는 스크립트 (수정은 여기서 → 다시 생성)')
    A('├─ _tools/test-backend-phase1.py   1차 범위(계정·입장) 테스트용 가짜 백엔드')
    A('└─ _tools/test-backend-team.py     9번 범위(파트 나누기 ~ 보고서) 테스트용 가짜 백엔드')
    A('```')
    A('')
    A('## 2. 지금까지 한 일')
    A('')
    A('### 디자인')
    A('')
    A('- 디자인 시스템: 키 컬러 **Indigo 600 `#4F46E5`** (11단계 팔레트) · 폰트 **Noto Sans KR / JetBrains Mono** · 글자 크기 **8단계만** · 화면 **1280×800 고정** · 로고 **IE 모노그램**(단색, 광택 없음)')
    A('- 화면: 랜딩 · 로그인 상태 팝오버 · 방 코드 입장 · 프로필(4그룹 20개 스킬) · 세션 만들기(무료 30분, 초과는 🔒PRO · 인원 수) · 대기실(진행자/참가자) · 계정(로그인 · 회원가입 · 약관 팝업 2개 · 프로필 수정 · 지난 세션 · 계정 설정)')
    A('- 아이스브레이킹 7-1 ~ 7-7: AI와 1:1 인터뷰 · 최근 소식 카드 · 진행자 재료 묶음 (추가 색은 하늘색 `#0284C7` 하나만)')
    A('- 발산 8-1 ~ 8-7: 내 아이디어 · AI 추천 · 익명 순위표 · 익명 댓글 · AI 검증·현실성 · 투표(+AI가 모은 아이디어 · 숨은 공통점 · 목록 접기) · 결과·주인 공개·주제 확정')
    A('- 파트 나누기 9-1 ~ 9-5 (2026-09-18 추가): 파트와 후보 · 겹친 후보만 추가 질문 · 배치 초안(분량 맞추기) · 팀장 확정 · **A4 세로 2쪽 보고서**(누르면 크게 보기 · PDF 저장) — 색은 키 컬러만 사용')
    A('')
    A('### 프론트엔드')
    A('')
    A(f'- {len(SCREENS)}개 화면을 실제 HTML·CSS·JS로 구현, 디자인 목업과 모양이 같음 (입력칸은 실제로 입력되는 칸으로)')
    A('- 2026-09-18: 투표 마친 뒤 대기 화면(8-6w) 추가 · 8-7 참가자 보기 전용 · 진행자도 인터뷰(5 → 7-1, 7-5에서 7-6 링크) · 제출 강제(session.advance 409 NOT_ALL_SUBMITTED + force)')
    A('- 버튼 이동·동작 전부 연결, 공통 동작(칩·토글·약관 동의·목록 접기·방 코드 칸·채팅·투표 2표 제한 등)')
    A('- API 클라이언트 `api.call()` + **가짜 서버(mock)** — 백엔드 없이 전체 흐름을 눌러볼 수 있음')
    A('- 로그인 유지(401 → 자동 refresh → 재시도) · 로그인 후 원래 화면으로 돌아오기 · 재접속(서버 단계 → 화면 이동) · 세션 화면 새로고침 복구')
    A('- 9번: 단계에 따라 팀장은 9-4 · 팀원은 9-3으로 자동 이동, 겹친 후보만 9-2로, 보고서 크게 보기 팝업과 A4 인쇄까지 동작')
    A('')
    A('### 백엔드 명세')
    A('')
    A(f'- API {total}개 요청·응답 JSON 예시 · 권한 · 에러 코드 · 백엔드 메모 (화면별 README + docs/03)')
    A('- 전체 구조 · 권한 · 세션 단계 · **익명 규칙** · 로그인 유지 · 재접속 표 (docs/01) · 공통 규칙·실시간 이벤트 (docs/02) · 데이터 모델 (docs/04) · AI 작업 10개 (docs/05)')
    for n, (f, c) in DELIVERED.items():
        A(f'- **{n} 전달 문서** (`docs/{f}`): API {len(next(p[3] for p in PHASES if p[0] == n))}개 + 완료 기준 시나리오 {c}개' + (' — 전달 완료' if n == '1차' else ''))
    A('')
    A('### 확인(테스트)한 것')
    A('')
    A(f'- {len(SCREENS)}개 화면 전부: 스크립트 오류 없음 · 모든 버튼에 동작 연결 · 모든 이동 링크 파일 존재 · 화면 밖으로 넘침 없음 (가짜 서버 모드)')
    A('- 모양: 입력칸이 많은 화면(2 · 4 · A2 · 7-2 · 8-1 · 8-4)을 목업과 비교해 같음을 확인')
    A('- 동작(가짜 서버): 투표 2표 제한 · 목록 접기 · 8-6 본문 전환 · 채팅 꼬리질문 · 세션 시간 30분 제한 · 약관 팝업 · 8-2 순위 고르기 · 8-4 댓글 필수/좋은 점 2개')
    A('- **실서버 모드**(테스트용 백엔드 `_tools/test-backend-phase1.py`)로 22개 시나리오 통과: 로그인 없이 코드 → 로그인 → 가입 → 프로필 → 자동 입장 · 프로필 없는 회원 · 가득 찬 방 · 시작한 방 · 없는 코드 · 6자리 미입력 · 대기실 재접속(인원 안 늘어남) · 시작된 방 소문자 코드 재접속 · "세션으로 돌아가기" · 새로고침 복구 · 진행자 자기 방 · 토큰 만료 자동 유지 · 로그인 유지 저장 · 로그아웃')
    A('- **실서버 모드(9번)**: 테스트용 백엔드 `_tools/test-backend-team.py`로 확인 — 주제 확정 → 9-1 파트·후보 → 겹친 후보만 9-2 → 답 제출 → 자동으로 배치 → 9-3 표시 → 팀장 9-4에서 담당 바꾸기·제안 옮기기·되돌리기·확정 → 9-5 보고서 2쪽 · 팀장 아닌 사람의 담당 변경 403 · 확정 version 불일치 409')
    A('- ⚠️ **아직 확인 못 한 것**: 실제 백엔드(아직 없음) · WebSocket 실시간(코드만 있음) · 화면 4 · 5 · 7 · 8 · A3 · A4 · A5의 실서버 연결')
    A('')
    A('## 3. 정해진 규칙 (결정 기록)')
    A('')
    A('| 주제 | 결정 |')
    A('|---|---|')
    A('| 입장 | **게스트 없음** — 회원가입 → 로그인 → 프로필(닉네임·맡고 싶은 역할·스킬 1개 이상) 후에만 세션 만들기·입장 |')
    A('| 방 코드 · 초대 링크 | 대문자·숫자 **6자리**, 초대 링크 = `https://ideationengine.app/s/{방 코드}` (별도 토큰 없음) |')
    A('| 로그인 유지 | 액세스 토큰(약 1시간) + 리프레시 쿠키(체크 시 30일) · `POST /auth/refresh` |')
    A('| 재접속 | 허용 — 이미 참가자면 코드 재입력·랜딩 "세션으로 돌아가기"·새로고침으로 현재 단계에 복귀 |')
    A('| 요금제 | 무료 세션 최대 30분 · 60/90분·제한 없음은 PRO(가격 미정) |')
    A('| 투표 | **1인 2표** · 누가 어디 투표했는지 끝까지 비공개 · 마친 사람은 대기 화면(8-6w) · 결과(8-7)는 참가자도 같은 화면(보기 전용) |')
    A('| 진행자 인터뷰 | **진행자도 참가자와 똑같이 7-1~7-5 인터뷰** → 끝나면 진행자 화면(7-6) (2026-09-18) |')
    A('| 시간 종료 | 자동으로 끝내지 않음 · 00:00이 되면 안내 창 → 진행자가 **5분 더**(`session.extend`, 무료는 총 30분까지) 또는 **이대로 계속** · 참가자는 안내만 (2026-09-18) |')
    A('| 제출 강제 | 아이디어(8-1) · 댓글(8-4)은 **전원이 내야 다음 단계** (409 NOT_ALL_SUBMITTED) · 이탈자 때문에 막히면 진행자가 force로 넘김 (2026-09-18) |')
    A('| 익명 | 아이디어 주인은 8-7 결과 때만 공개 · 댓글 작성자·투표자·인터뷰 원문은 끝까지 비공개 · AI에는 이름 없이 인원 수로만 |')
    A('| AI 검증 | 참고용 · 등급(바로 해볼 만해요/보완하면 좋아요/다시 생각해 봐요)이 낮아도 투표에서 빼지 않음 |')
    A('| 파트 나누기 | 파트 = 핵심 / 보통 / 작은 일 · 후보는 프로필 스킬로 · 겹치면 그 사람들에게만 추가 질문 2개 |')
    A('| 추가 질문 | 답과 점수는 **끝까지 비공개**, 결과는 "추가 질문으로 정했어요"만 표시 |')
    A('| 분량 | 핵심 파트가 한 사람에게 몰려도 됨 · 대신 작은 일로 네 사람 분량을 비슷하게 |')
    A('| 팀장 | 배치를 고치고 확정하는 참가자 1명 · 주제 확정(8-7) 때 정함(기본값 진행자) |')
    A('| 보고서 | A4 세로 2쪽 · 페이지를 누르면 크게 보기 · PDF는 **브라우저 인쇄**로 저장(서버 PDF 없음) |')
    A('| 대기실 | QR·입장 잠그기 없음 (방 코드 + 링크만) |')
    A('| 색 | 키 컬러 외 추가 색 최소 · 초록/주황/빨강은 판정 의미로만 · 투표 목록 등급은 점 + 범례 |')
    A('')
    A('## 4. 해야 할 일')
    A('')
    A('### 4-1. 디자인')
    A('')
    A('| 할 일 | 비고 |')
    A('|---|---|')
    A('| **8-7에 "팀장 고르기" UI** | 지금은 진행자가 그대로 팀장 (API는 준비됨 · topic.confirm의 leaderParticipantId) |')
    A('| **9-1 진행자용 "추가 질문 시작 →" 버튼** | 디자인에 없어서 임시로 넣음 (실서버 모드에서 진행자에게만 보임) |')
    A('| **9-3 파트 표시 모드 · 9-4 담당 고르는 목록** | 표시한 줄 배지 · 흰 카드 목록으로 임시 구현 (디자인 확인 필요) |')
    A('| 9-1 AI가 파트를 나누는 중 · 9-5 보고서 만드는 중 기다리는 화면 | 지금은 안내 문구만 |')
    A('| 9-5에서 팀장이 담당을 다시 고치는 화면 | API는 team.reassign으로 준비됨 |')
    A('| 목업(v14)에 문구 반영: **A1** "로그인 없이 코드로 입장 →" 링크 삭제 | 개발 화면에는 이미 반영 |')
    A('| 목업(v14)에 문구 반영: **1 랜딩** "로그인하면 프로필·지난 세션 기록이 저장돼요" → "세션을 만들거나 방에 들어가려면 로그인이 필요해요" | 개발 화면에는 이미 반영 |')
    A('| **1-1 랜딩** 참가 중인 세션이 있을 때 상태 디자인 | 지금은 기존 버튼 글자만 "↩ 세션으로 돌아가기", 문구 "진행 중인 세션이 있어요 · 주제" |')
    A('| 8-7 팀장 고르기 · 9-1 "추가 질문 시작" · 9-3 파트 표시 · 9-4 담당 목록 | 프론트가 임시로 넣음 — 디자인 확인 필요 (T1 시간 종료 · T2 진행자 넘기기 · T3 검증 중 · 8-6w 대기 · A6 콜백은 2026-09-18 목업 추가) |')
    A('| 7-7(재료 보기)과 8-1(내 아이디어)의 입력칸 역할 겹침 정리 | 7-7을 재료 보기 전용으로 할지 결정 |')
    A('| 로그인 전 프로필 버튼 동작 | 지금은 로그인 화면으로 이동 (1-1 메모의 "작은 팝오버"는 미디자인) |')
    A('| 7-6 진행자 "이전 단계" 버튼의 뜻 | 지금 규칙: 아이스브레이킹 → 대기실은 안 돼서 항상 409 (2차 문서) |')
    A('| 8-1 ~ 8-6 진행자 단계 넘기기 버튼 | 없음 — 지금은 7-6 "발산 시작"만 (테스트는 콘솔) |')
    A('| 소셜 로그인 콜백 화면 · 소셜 첫 가입 약관 동의 · 메일 링크(비밀번호 재설정 · 이메일 확인)를 연 뒤 화면 | 없음 (6차 문서에 주소 · 규칙만) |')
    A('| (나중에) 로딩 중 · 데이터 없음 · 에러 화면 | 보류 |')
    A('')
    A('### 4-2. 기획 · 정책 결정')
    A('')
    A('- 세션 시간이 끝났을 때: 자동 종료 vs 진행자에게 알림')
    A('- 회원 탈퇴 시 다른 사람과 함께한 세션의 익명 댓글·아이디어 처리 (6차 문서의 임시 규칙: 남기고 "탈퇴한 사용자")')
    A('- AI 추천 "더 보기" 한도 (5차 문서의 임시 규칙: 사람당 5묶음)')
    A('- Pro 가격 · 결제 대행사(PG) · 약관/개인정보 문구 법률 검토')
    A('- 보고서를 로그인 없이 볼 수 있는 공개 링크를 만들지 (지금은 참가자만 열 수 있는 주소)')
    A('- 후보가 없어 범위에서 뺀 파트를 나중에 누군가 맡고 싶을 때의 처리')
    A('')
    A('### 4-3. 프론트엔드 — 화면별')
    A('')
    A('- ✅ 목업 모드 = 가짜 서버로 모든 버튼이 동작함 · 🔌 실서버 = 실제(테스트) 백엔드에 붙여서 확인했는지')
    A('- "남은 일"은 각 화면 README의 남은 일 + 실서버 연결 때 필요한 것(디자인 예시 데이터가 HTML에 고정된 부분)을 합친 것')
    A('')
    A('| 번호 | 화면 | 폴더 | 목업 모드 | 🔌 실서버 | 남은 일 |')
    A('|---|---|---|---|---|---|')
    for s in SCREENS:
        todo = list(s['todo']) + [t for t in EXTRA_TODO.get(s['key'], []) if t not in s['todo']]
        cell = '<br>'.join('⬜ ' + t.replace('|', '/') for t in todo) if todo else '없음'
        A(f"| {s['num']} | {s['title']} | `screens/{s['key']}` | ✅ | {VERIFIED.get(s['key'], '⬜ 안 함')} | {cell} |")
    A('')
    A('**세션 화면(5 ~ 8-7) 공통으로 남은 일**')
    A('')
    A('- ✅ 상단바 단계 이름 · 진행률 · 타이머 · 프로필 버튼 이름을 서버 값으로 (실서버 모드)')
    A('- ⬜ WebSocket 실제 서버와 연결 테스트 (이벤트 처리 코드는 들어 있음)')
    A('- ⬜ WebSocket 재연결 때 최신 액세스 토큰 쓰기 · 닫힘 코드 4401/4403이면 재연결 멈추기 (2차 문서)')
    A('- ⬜ `stage.changed` 처리가 없는 화면(7-6 · 7-7 · 8-6 · 8-7)에 자동 이동 넣기 (지금은 새로고침해야 이동)')
    A('')
    A('**전체 공통으로 남은 일**: 토큰 만료·로그인 유지는 완료 · ⬜ 소셜 로그인 콜백 페이지 · ⬜ 웹 서버 설정 `/s/{방 코드}` → `screens/02-join-code/index.html?code={방 코드}` · ⬜ (나중에) 로딩/빈/에러 화면 · (지금 필요 없음) 모바일')
    A('')
    A('### 4-4. 백엔드 — 단계별')
    A('')
    A('| 단계 | 범위 | 상태 | API | 참고 |')
    A('|---|---|---|---|---|')
    for name, scope, state, ids, note in PHASES:
        if name != '1차' and name in DELIVERED:
            state = '명세 · 완료 기준 문서 준비됨 (전달 전)'
            note = f'{note} · `docs/{DELIVERED[name][0]}` (완료 기준 {DELIVERED[name][1]}개)'
        A(f"| **{name}** | {scope} | {state} | {len(ids)}개: " + ' · '.join(f'`{ENDPOINTS[i]["method"]} {ENDPOINTS[i]["path"]}`' for i in ids) + f' | {note} |')
    A('')
    A(f'합계 {total}개 = docs/03-API-전체-목록.md 와 같음. 공통으로 필요한 것: DB · Redis(실시간 전달·잠금) · 작업 큐(AI) · CORS(credentials) · 요청 횟수 제한 · 익명 규칙 필터링(응답에서 작성자·주인·투표자 제거)')
    A('')
    A('**시연 영상 촬영(목업 모드)**: `assets/js/config.js`에서 `devNav: false`(아래 이동 바 · MOCK 배지 숨김) → 화면은 **Alt+→ / Alt+←** 로 세션 흐름 순서대로 넘겨요(목업 서버는 실시간 이벤트를 안 보내서 자동 이동이 없음). 진행자 1인 흐름: 1 → A1 → 4 → 5 → 7-1~7-7 → 8-1~8-7 → 9-1~9-5. 7-2 카드의 `[예시]` 표기는 실서버가 검색으로 채우기 전까지 남아요.')
    A('')
    A('**차수별 완료 확인 방법**: 서버를 띄우고 `assets/js/config.js`에서 `useMock: false`, `baseUrl`을 서버 주소로 → 그 차수 전달 문서(`docs/00-백엔드-N차-…`)의 완료 기준 표를 위에서부터. 1차는 `_tools/test-backend-phase1.py`(가짜 백엔드)가 같은 명세로 동작하니 비교용으로 참고.')
    A('')
    A('## 5. 실행 방법')
    A('')
    A('| 하고 싶은 것 | 방법 |')
    A('|---|---|')
    A('| 화면 둘러보기 | `index.html`을 브라우저로 열기 (또는 폴더에서 `python -m http.server 8766` → http://127.0.0.1:8766) · 화면 아래 검은 바 ◀ ▶ 로 순서대로 이동 |')
    A('| 디자인 원본 보기 | `design/IdeationEngine-디자이너-목업-v14.html` |')
    A('| 1차 범위를 실서버 모드로 눌러보기 | `python _tools/test-backend-phase1.py` → http://127.0.0.1:8767/index.html (방 코드는 콘솔에 출력, 진행자 `host@test.com` / `password1234`) |')
    A('| 9번(파트 나누기~보고서)을 실서버 모드로 눌러보기 | `python _tools/test-backend-team.py` → http://127.0.0.1:8768/index.html (콘솔의 안내대로 로그인: `hyeongwon@test.com` 등 / `password1234`) |')
    A('| 화면·문서 수정 후 다시 만들기 | `python _generator/handoff.py` (Python 3.10 이상, 추가 설치 없음) |')
    A('')
    A('## 6. Claude에게 — 이어서 작업하는 법')
    A('')
    A('이 프로젝트를 이어받은 Claude는 아래를 지켜 주세요.')
    A('')
    A('1. **먼저 읽기**: 이 문서 → `README.md` → 작업할 화면의 `screens/<화면>/README.md` → 백엔드면 `docs/01`, `docs/02`, `docs/00`.')
    A('2. **생성된 파일을 직접 고치지 않기**: `screens/` `assets/` `docs/` `README.md` `index.html` `design/` 은 `_generator/handoff.py`가 **덮어써서 다시 만들어요.** 직접 고치면 다음 생성 때 사라져요. 수정은 아래 원본에서 하고 `python _generator/handoff.py`를 실행하세요.')
    A('   - 화면 모양(HTML·CSS)과 디자인 목업: `_generator/design_mockup.py`')
    A('   - 화면 동작(screen.js)·버튼 연결·화면 README 내용: `_generator/ho_screens.py` (기본) → `_generator/ho_screens_v2.py` (1 · 1-1 · 2 · 3 · A1 · A2 · 5 덮어쓰기) → `_generator/ho_screens_team.py` (9-1 ~ 9-5 추가 + 8-5 · 8-6 · 8-7 · A4 연결)')
    A('   - API 명세(요청·응답·에러·메모) — 문서 · endpoints.js · mock.js가 모두 여기서 나옴: `_generator/ho_api.py`')
    A('   - 공통 JS·CSS(app.js · api.js · shell.css · 채팅 · 가짜 서버 동작): `_generator/ho_assets.py`')
    A('   - docs 문서: `_generator/ho_docs.py` · 이 현황 문서: `_generator/ho_status.py`')
    A('   - 백엔드 차수별 전달 문서(docs/00-백엔드-N차-…): `_generator/ho_phaseN.py`의 SPEC (모양 · 검사: `ho_delivery.py`, 미리보기: `python _generator/check_delivery.py N`)')
    A(f'3. **다시 만든 뒤 확인**: 생성기가 `screens {len(SCREENS)} endpoints {total}` · `rules ok` · `N차 전달 문서: ok`를 출력하는지(버튼 연결 규칙을 못 찾으면 경고, 전달 문서 검사에 걸리면 문제 목록이 나와요). 그다음 로컬 서버로 열어서 스크립트 오류·버튼 동작을 확인하세요.')
    A('4. **목업 모드 규칙**: `useMock: true`에서는 HTML에 들어 있는 디자인 예시가 그대로 보여야 해요(디자인과 픽셀 동일). 서버 데이터로 다시 그리는 코드는 `if (!IE_CONFIG.useMock)` 안에 넣으세요.')
    A('5. **디자인 원칙** (사용자가 가장 중요하게 여김): **난잡하지 않고 깔끔하게** · 색은 키 컬러 중심으로 최소한 · 글자 크기 8단계 · 화면 1280×800 안에 스크롤 없이 · 초록 체크·강한 강조 박스 남발 금지 · 문구는 짧은 "~해요"체.')
    A('6. **익명 규칙을 깨지 않기**: 새 API나 화면을 만들 때 docs/01의 "5. 익명 규칙" 표를 꼭 확인.')
    A('7. **소통**: 사용자(디자이너)에게는 한국어로, 개발 용어는 쉽게 풀어서 설명.')
    A('')
    A('---')
    A('')
    A(f'자동 생성: `_generator/ho_status.py` · 기준일 {UPDATED} · 화면 {len(SCREENS)}개 · API {total}개 · 실시간 이벤트 {len(EVENTS)}개')
    return '\n'.join(L) + '\n'
