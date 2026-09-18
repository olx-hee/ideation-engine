# 2차 전달 문서 내용 — 담당: 나 (노형원의 Claude)
# · 이 파일의 SPEC만 채우면 docs/{파일}이 만들어진다 (모양은 _generator/ho_phase1.py = 1차 문서와 같음)
# · 검사/미리보기: python _generator/check_delivery.py 2   → 문제 0건이 되면 READY = True
# · 진짜 생성: python _generator/handoff.py  (READY=True + 검사 통과일 때만 docs/ 에 씀)
# · 문장 규칙: 표 칸(why · scenarios)에는 줄바꿈·| 금지(<br> 사용) · 에러는 "409 STAGE_MISMATCH"처럼 HTTP 번호와 코드를 같이
READY = True

STAGE_TABLE = '''서버 한 곳(설정 표)에 두고 `session.get` · `session.start` · `session.advance` · `session.back` · `stage.changed`가 모두 같은 값을 써요. 사람마다 다르지 않아요.

| stage.id | label | subStep | progress | 참가자 화면 | 진행자 화면 | 이 단계에 들어갈 때 할 일 (문서) |
|---|---|---|---|---|---|---|
| `lobby` | 대기실 | null | 0 | 6 | 5 | — |
| `icebreak` | 아이스브레이킹 | 1 | 3 | 7-1 | 7-1 (인터뷰 뒤 7-6) | 소식 카드 작업 시작 (3차) |
| `diverge.write` | 아이디어 발산 | 1 | 25 | 8-1 | 8-1 | 인터뷰 마무리 (3차) |
| `diverge.board` | 아이디어 발산 | 2 | 30 | 8-3 | 8-3 | 아이디어 제출 마감 (4차) · 숨은 공통점 작업 (5차) |
| `diverge.comment` | 아이디어 발산 | 3 | 35 | 8-4 | 8-4 | — |
| `diverge.review` | 아이디어 발산 | 4 | 45 | 8-5 | 8-5 | 댓글 마감 (4차) · AI 검증 작업 (5차) |
| `diverge.vote` | 아이디어 발산 | 5 | 55 | 8-6 | 8-6 | 투표 열기 (4차) |
| `diverge.result` | 아이디어 발산 | null | 65 | 8-7 | 8-7 | 투표 마감 · `vote.closed` (4차) |
| `team.split` | 파트 나누기 · 보고서 | null | 70 | 9-1 | 9-1 | `topic.confirm`으로만 들어감 (4차) · 파트 나누기 AI 작업 (7차) |
| `team.questions` | 파트 나누기 · 보고서 | null | 75 | 9-2 (겹친 후보) · 9-1 (나머지) | 9-1 | 진행자 "추가 질문 시작" · 겹친 후보 없으면 건너뜀 (7차) |
| `team.assign` | 파트 나누기 · 보고서 | null | 80 | 9-3 (팀장은 9-4) | 9-3 | 모두 답하거나 **5분**이 지나면 **서버가 자동** (7차) |
| `report` | 파트 나누기 · 보고서 | null | 100 | 9-5 | 9-5 | **팀장의 `team.confirm`으로만** (7차) |

- 아이스브레이킹 화면 위쪽 진행률(7-1 3% → 7-5 18%, 7-6 20%)은 화면마다 고정값이라 서버는 `icebreak` 단계에서 항상 3을 줘요.
- 넘기기 순서는 표의 위에서 아래. `lobby`는 `session.start`로만, `diverge.result`는 `topic.confirm`으로만 넘어가요 (그 밖은 409 STAGE_LOCKED).
- 되돌리기는 `diverge.write`~`diverge.vote`에서 한 칸 위로만. `icebreak` → `lobby`, `diverge.result` → `diverge.vote`는 409 STAGE_LOCKED (결과에서 투표로는 `vote.revote`로만).
- 되돌려도 저장된 데이터는 지우지 않아요. "들어갈 때 할 일"을 다시 들어올 때 또 할지는 그 차수 문서를 따라요.'''

REALTIME = '''**연결**
- 주소: `wss://<도메인>/api/v1/sessions/{sessionId}/stream?token=<액세스 토큰>` (프론트 `assets/js/config.js`의 `wsUrl`이 null이면 페이지 주소 기준으로 만들어요 — API 도메인이 다르면 `wsUrl`을 채워야 해요)
- 연결할 때 한 번만 토큰을 확인해요. 토큰이 없거나 만료 → 닫힘 코드 `4401`, 이 세션 참가자가 아니거나 내보내진 사람 → `4403`. 연결된 뒤에 토큰이 만료돼도 끊지 않아요.
- 한 사람이 여러 창으로 연결해도 돼요 (같은 참가자로 봄).

**접속 표시 (대기실 점)**
- 그 참가자의 연결이 0개 → 1개가 되면 `participant.online`, 1개 → 0개가 되면 `participant.left`를 세션 전원에게. (1차의 재접속 입장 때 보내는 `participant.online`과 같은 이벤트)
- 처음 입장(1차 `session.join`)은 `participant.joined`만 보내요.
- `session.participants`의 `online`도 이 기준.

**연결 직후**
- (재)연결되면 서버가 **그 사람에게만** 지금 단계를 `stage.changed`로 한 번 보내요. 연결이 끊긴 사이에 단계가 넘어갔어도 화면이 따라가게 하려는 거예요.

**계속 보내는 것**
- `timer.sync`: 타이머가 있는 세션(시작 후, durationMin이 null이 아님)에서 1분마다 `{ endsAt, serverNow }`를 전원에게.
- 30초마다 ping. 응답이 없으면 연결을 닫고 `participant.left` 처리.

**보내는 순서 · 범위**
- 상태를 DB에 먼저 저장하고 나서 이벤트를 보내요 (이벤트를 받은 화면이 바로 `session.get`을 불러도 새 상태가 보이게).
- 이 문서의 이벤트는 모두 **세션 전원**에게 보내요 (`participant.kicked`는 내보내진 본인 포함 — 본인에게 보낸 뒤 그 연결을 닫음).
- 서버가 여러 대면 Redis pub/sub 같은 걸로 모든 서버의 연결에 전달해요.
- 이벤트에도 익명 규칙이 똑같이 적용돼요 (docs/01 5장). 대기실 이벤트의 닉네임은 괜찮아요 — 대기실은 익명 단계가 아니에요.'''

BOUNDARY = '''- **3차**: 세션 시작 직후 최근 소식 카드 작업(AI 2번) 시작, 인터뷰 관련 API · `icebreak.*` 이벤트.
- **4차**: 단계가 바뀔 때의 마감 처리(아이디어 제출 · 댓글 · 투표), 모두 투표를 마치면 서버가 스스로 `diverge.result`로 넘기고 `vote.closed`를 보내는 것, `vote.revote` · `topic.confirm`의 단계 이동.
- **5차**: `diverge.review`에 들어갈 때 AI 검증 작업 시작 · 검증이 끝나기 전 `diverge.review` → `diverge.vote` 넘기기는 409 STAGE_LOCKED.
- **2차에서는** 단계 값만 바뀌면 돼요. 그래서 이 문서의 시나리오 중 8-x 화면은 "화면이 이동하는지"만 확인해요 (그 화면들이 부르는 3~5차 API는 아직 없어서 콘솔에 에러가 나는 건 무시).'''

QUESTIONS = '''| 무엇 | 지금 규칙 (바뀌면 알려드릴게요) |
|---|---|
| 7-6 "이전 단계" 버튼이 무엇을 되돌리는지 | 아이스브레이킹 → 대기실은 안 되므로 항상 409 STAGE_LOCKED. 디자인 확인 중 |
| 세션 시간이 끝났을 때 | **결정됨(2026-09-18)**: 자동으로 끝내지 않음 · 안내 창(T1)에서 진행자가 `session.extend`로 연장하거나 그대로 진행 |
| 8-x에서 진행자가 단계를 넘기는 버튼 | **추가됨(2026-09-18)**: 진행자 하단 막대(T2) "다음 단계 →" · 안 낸 사람이 있으면 확인 창 → `force` |
| 진행자의 연결이 끊겼을 때 | 세션은 그대로. 진행자가 다시 들어오면 이어서 진행 |
| 대기실에서 나간(연결만 끊긴) 참가자 | 참가자로 남음 (내보내기 전까지 인원에 포함, 시작 후 재접속 가능) |'''

SPEC = dict(
    phase='2차',
    title='백엔드 2차 전달 — 화면 4 · 5 · 6 (세션 만들기 · 대기실 · 실시간 · 단계 진행)',
    intro='이번에 만들 범위와 **끝났다고 볼 수 있는 기준**이에요. 화면 폴더: `screens/04-session-create`, `screens/05-lobby-host`, `screens/06-lobby-participant`, 단계 넘기기 버튼이 있는 `screens/07-6-icebreak-host` (각 README에 화면 설명). 1차(계정 · 방 만들기 · 입장 · 재접속)가 끝난 서버 기준이에요.',
    rules=[
        '**실시간(WebSocket)이 이번 범위의 핵심** — 입장 · 나감 · 내보내기 · 세션 시작 · 단계 넘기기가 새로고침 없이 모두의 화면에 반영돼야 해요. 연결 규칙은 아래 "실시간 연결 규칙".',
        '**단계는 서버가 한 곳에서 관리** — 진행자만 넘기고 되돌려요. 요청의 `from`이 서버 단계와 다르면 `409 STAGE_MISMATCH`, 넘기거나 되돌릴 수 없는 곳이면 `409 STAGE_LOCKED`. 제출 단계(`diverge.write` · `diverge.comment`)는 전원이 내야 넘어가고 아니면 `409 NOT_ALL_SUBMITTED`(진행자가 `force: true`로만 예외). DB에 먼저 저장하고 나서 `stage.changed`를 보내요. 값은 아래 "단계 표".',
        '**인원 수 = 진행자 포함 · 내보낸 사람 제외 · 접속 여부와 상관없이** — 시작 조건(2명 이상)과 뒤 차수의 제출 · 댓글 · 투표 인원도 같은 기준이에요.',
        '**내보내기는 대기실에서만** — 내보낸 사람은 다시 들어올 수 없어요(1차의 `403 KICKED`).',
        '**타이머는 서버 시각 기준, 끝나도 자동 종료 없음** — 시작할 때 `endsAt` = 시작 시각 + 세션 시간. 화면은 열릴 때 `session.get`의 `remainingSec`으로 맞춰요. 00:00이 되면 화면이 안내 창(T1)을 띄우고, 진행자가 `session.extend`(5분 단위 · 무료는 총 30분까지 `403 PLAN_LIMIT`)로 늘리거나 "이대로 계속"을 골라요. 연장하면 모두에게 `timer.sync`.',
    ],
    rules_after='세션 단계 · 인원 기준은 [01-백엔드-한눈에-보기.md](01-백엔드-한눈에-보기.md)의 "4. 세션 단계", 이벤트 형식은 [02-API-공통-규칙.md](02-API-공통-규칙.md)의 "실시간 이벤트".',
    api_intro='화면 4(세션 만들기)가 부르는 `session.create`는 1차에서 만들었어요. 이번에는 대기실(5 · 6)과 그 뒤 **모든 단계 이동의 바탕**(시작 · 넘기기 · 되돌리기 · 실시간)을 만들어요. 3~5차 테스트가 모두 이 위에서 돌아가요.',
    ids=[
        'session.participants',
        'session.kick',
        'session.start',
        'session.advance',
        'session.back',
        'session.extend',
    ],
    why={
        'session.participants': '6 대기실 인원 숫자 (입장 · 나감 이벤트를 받을 때마다 다시 불러옴)',
        'session.kick': '5 대기실에서 잘못 들어온 사람 내보내기',
        'session.start': '5 "세션 시작하기" → 모두 아이스브레이킹으로',
        'session.advance': '7-6 "발산 시작" · 그 뒤 모든 단계 넘기기 (3~5차 테스트의 바탕) · 제출 단계는 전원 제출 확인(NOT_ALL_SUBMITTED)',
        'session.back': '진행자가 한 단계 되돌리기',
        'session.extend': 'T1 "5분 더 진행하기" (시간 종료 안내 창)',
    },
    events_intro='실시간(WebSocket)은 이번 범위에서 **필수**예요. 아래 이벤트는 모두 세션 전원에게 보내요.',
    events=[
        ('participant.joined', '5: 참여자 줄 추가 · 6: 인원 숫자 다시 불러오기'),
        ('participant.left', '5: 그 사람 접속 점을 회색으로 · 6: 인원 숫자 다시 불러오기 (나간 게 아니라 연결이 끊긴 것일 수도 있음)'),
        'participant.online',
        ('participant.kicked', '내보내진 본인: "진행자가 방에서 내보냈어요" → 랜딩 (5는 누른 즉시 줄을 지움)'),
        ('session.started', '참가자 6 → 7-1 · 진행자 5도 7-1 (진행자도 인터뷰, 끝나면 7-6)'),
        ('stage.changed', '그 단계 화면으로 이동 — 처리 있는 화면: 7-1~7-5 · 8-1 · 8-3 · 8-4 · 8-5 (나머지는 새로고침하면 이동)'),
        ('timer.sync', '타이머 보정 (프론트 처리는 아직 없음 — 화면을 열 때 `session.get`으로 맞춤)'),
    ],
    done_intro='''프론트의 `assets/js/config.js`에서 `useMock: false`, `baseUrl`을 서버 주소로 바꾸고 확인해요.

사람마다 **다른 브라우저 프로필**(또는 다른 브라우저)로 로그인해요 — 같은 프로필의 창끼리는 로그인 정보가 섞여요. **진행자 H · 참가자 P1 · P2** 세 사람, H가 4번 화면에서 **인원 4명 · 30분** 방을 만들고 시작해요. 시나리오는 **위에서부터 순서대로** 이어져요.

화면에 버튼이 없는 동작은 그 사람 창의 개발자도구 **콘솔에서 `await api.call(…)`**, 실시간 메시지는 **Network → WS(stream) → Messages**에서 확인해요.''',
    scenarios=[
        ('H가 4에서 세션 만들기', '5 대기실로 이동, 방 코드 6자리 · 초대 링크가 방금 받은 값'),
        ('아직 아무도 안 들어왔을 때 H가 "▶ 세션 시작하기"', '409 NOT_ENOUGH_MEMBERS 안내, 대기실에 그대로'),
        ('P1이 2에서 방 코드로 입장', 'P1은 6으로 · H의 5에 **새로고침 없이** P1 줄이 생김 (`participant.joined`)'),
        ('P2가 입장', 'P1의 6 "현재 n / 4명 입장"이 서버 값 **3 / 4**로 바뀜'),
        ('P1 콘솔 `await api.call(\'session.participants\')`', 'H · P1 · P2 3명, 필드는 participantId · nickname · role · online · isMe만 (스킬 · 이메일 없음), isMe는 P1 줄만 true'),
        ('방에 들어오지 않은 다른 회원이 콘솔로 `session.participants` (sessionId를 넣어서)', '403 NOT_PARTICIPANT'),
        ('P1이 6 창(탭)을 닫음', 'H의 5에서 P1 줄 접속 점이 회색 (`participant.left`) · participants 응답에서 P1 online:false'),
        ('P1이 1-1에서 "↩ 세션으로 돌아가기"로 다시 들어옴', 'H의 5에서 P1 점이 다시 켜짐 (`participant.online`) · 줄이 새로 생기지 않음'),
        ('P1 콘솔로 H를 내보내기 `await api.call(\'session.kick\', { participantId: \'H의 participantId\' })`', '403 FORBIDDEN (진행자만)'),
        ('H 콘솔로 자기 자신을 내보내기', '400 VALIDATION'),
        ('H가 5에서 P2 줄(새로 생긴 줄)을 누르고 확인', 'H 화면에서 줄이 사라짐 · P2 화면 "진행자가 방에서 내보냈어요" → 랜딩 · P1의 6 인원이 **2 / 4**로'),
        ('P2가 6 화면을 다시 엶 (뒤로 가기 또는 주소 직접 입력)', '403 KICKED 안내 → 방 코드 입장(2) 화면 · WS 연결은 4403으로 닫힘'),
        ('H가 "▶ 세션 시작하기"', 'H도 7-1(인터뷰) · P1의 6은 **자동으로** 7-1 (`session.started`) · H는 인터뷰가 끝나면 링크로 7-6'),
        ('타이머가 00:00이 됨 (서버에서 세션 시간을 1분으로 줄여 테스트)', 'H · P1 화면에 안내 창 — H에게는 "5분 더 / 이대로 계속", P1에게는 "진행자가 정하는 중" · 단계는 그대로'),
        ('H가 "5분 더 진행하기"', '`session.extend` 200 · 모두에게 `timer.sync` → 타이머가 05:00부터 다시 · 무료 세션이 총 30분을 넘기면 403 PLAN_LIMIT 토스트'),
        ('H 콘솔 `session.advance`(from: diverge.write) — 아직 안 낸 사람이 있을 때', '409 NOT_ALL_SUBMITTED · details에 pendingCount · 단계 그대로 · `force: true`로 다시 보내면 넘어감 (4차 문서에 자세히)'),
        ('P1이 7-1을 새로고침', '위쪽 타이머가 서버 남은 시간(약 29분)으로 맞춰짐 · `session.get`의 stage.id icebreak · timer.endsAt = 시작 시각 + 30분'),
        ('WS Messages를 1분 넘게 봄 · 새로고침 직후 첫 메시지를 봄', '1분마다 `timer.sync` · 연결 직후 첫 메시지는 지금 단계의 `stage.changed`'),
        ('H 콘솔로 `session.start` 다시 · `session.kick`(P1)', '둘 다 409 SESSION_STARTED'),
        ('H가 7-6에서 "이전 단계"', '409 STAGE_LOCKED 안내, 단계 그대로 (아이스브레이킹 → 대기실 불가)'),
        ('H가 7-6에서 "발산 시작 →"', 'H는 7-7 · P1의 7-1은 **자동으로** 8-1 (`stage.changed` diverge.write)'),
        ('H 콘솔 `await api.call(\'session.advance\', {}, { from: \'icebreak\' })` (이미 넘어간 뒤)', '409 STAGE_MISMATCH, 단계는 diverge.write 그대로'),
        ('P1 콘솔로 `session.advance` (from diverge.write)', '403 FORBIDDEN'),
        ('H 콘솔 `session.back` (from diverge.write)', '단계 icebreak · P1의 8-1은 그대로 → 새로고침하면 7-1 · H가 7-7을 새로고침해도 7-1 (진행자도 인터뷰 화면으로)'),
        ('H가 7-6에서 다시 "발산 시작 →"', 'P1의 7-1이 자동으로 8-1 · 응답 stage diverge.write'),
        ('H 콘솔로 from을 바꿔 가며 넘기기: diverge.write → board → comment → review → vote', 'P1 화면이 8-1 → 8-3 → 8-4 → 8-5 → 8-6으로 자동 이동, 넘길 때마다 응답 stage가 단계 표의 값'),
        ('H 콘솔 `session.back` (from diverge.vote)', '단계 diverge.review · P1의 8-6은 그대로 → 새로고침하면 8-5'),
        ('H 콘솔로 다시 넘기기: review → vote → result', 'P1의 8-5 → 8-6 자동 이동 · result로 넘긴 뒤 P1이 새로고침하면 8-7'),
        ('H 콘솔로 `session.advance` · `session.back` (from diverge.result)', '둘 다 409 STAGE_LOCKED'),
        ('`/stream`에 토큰 없이 연결 · 방에 안 들어온 회원 토큰으로 연결 (콘솔 `new WebSocket(…)` 후 `onclose`의 code)', '각각 4401 · 4403으로 닫힘'),
    ],
    extra_sections=[
        ('단계 표', STAGE_TABLE),
        ('실시간 연결 규칙', REALTIME),
        ('이번 범위의 경계', BOUNDARY),
        ('확인이 필요한 것 (디자인 · 기획)', QUESTIONS),
    ],
    front_title='프론트 쪽 참고 (이미 구현된 것 · 아직 안 된 것)',
    front=[
        '5 대기실: 방 코드 · 초대 링크(세션 만들기 직후 저장값) · 복사 · `participant.joined`로 줄 추가 · `participant.online`/`participant.left`로 접속 점 · 줄 누르면 확인 → `session.kick` → 줄 삭제 · 시작 → `session.start` → **7-1(진행자도 인터뷰)**: `screens/05-lobby-host/screen.js`',
        '6 대기실: `session.started` → 7-1 · `participant.kicked`(나) → 랜딩 · 입장/나감 이벤트 때 `session.participants`로 인원 숫자: `screens/06-lobby-participant/screen.js`',
        '7-6: "발산 시작" → `session.advance`(from icebreak) → 7-7 · "이전 단계" → `session.back`(from icebreak): `screens/07-6-icebreak-host/screen.js`',
        '`stage.changed` 자동 이동: 7-1~7-5 → 8-1 `assets/js/icebreak-chat.js` · 8-1 → 8-3 · 8-3 → 8-4 · 8-4 → 8-5 · 8-5 → 8-6 (각 화면 `screen.js`)',
        '세션 화면을 열 때 `session.get`으로 단계 확인 → 다른 단계면 그 화면으로 · 타이머 맞추기: `assets/js/app.js` (`syncStage`, `stageScreen`, `setTimer`)',
        'WebSocket 연결 · 끊기면 자동 재연결(최대 10초 간격): `assets/js/api.js` (`realtime.connect`)',
'5 대기실: 참여자 줄 · 인원 배지를 `session.participants`로, 방 코드 · 초대 링크는 저장값이 없으면 `session.get`으로 (재접속 대비) · 혼자면 시작 버튼 잠김: `screens/05-lobby-host/screen.js`',
        '6 대기실: 처음 열 때 인원 수(`session.participants`)와 내 프로필 카드(`/me`)를 서버 값으로: `screens/06-lobby-participant/screen.js`',
        '8-1 ~ 8-6 진행자 하단 막대(다음 단계 → · 제출 강제 확인 창): `assets/js/app.js` (`hostBar`) — 실서버 모드에서 진행자에게만 붙어요',
        '⬜ 아직 안 됨 — 7-6 · 7-7에는 `stage.changed` 처리가 없음 (새로고침해야 이동) · 상단 단계 이름 · 진행률은 화면별 고정값',
'상단바 단계 이름 · 진행률과 타이머 보정(`timer.sync`)을 서버 값으로: `assets/js/app.js` (`setStage` · `setTimer`) · `assets/js/api.js`',
        'WebSocket 재연결: 연결할 때마다 최신 토큰을 쓰고, 4401이면 토큰을 새로 받아 한 번 더 시도, 4403이면 재연결을 멈춰요: `assets/js/api.js`',
    ],
)
