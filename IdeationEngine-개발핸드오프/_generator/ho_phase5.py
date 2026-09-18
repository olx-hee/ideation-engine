# 5차 전달 문서 내용 — 담당: 나 (노형원의 Claude)
# · 이 파일의 SPEC만 채우면 docs/{파일}이 만들어진다 (모양은 _generator/ho_phase1.py = 1차 문서와 같음)
# · 검사/미리보기: python _generator/check_delivery.py 5   → 문제 0건이 되면 READY = True
# · 진짜 생성: python _generator/handoff.py  (READY=True + 검사 통과일 때만 docs/ 에 씀)
# · 문장 규칙: 표 칸(why · scenarios)에는 줄바꿈·| 금지(<br> 사용) · 에러는 "409 STAGE_MISMATCH"처럼 HTTP 번호와 코드를 같이
READY = True

JOBS = '''AI 작업 번호는 [05-AI-작업-목록.md](05-AI-작업-목록.md)와 같아요. **요청 안에서 기다리는 건 6번(추천)뿐**이고 나머지는 작업 큐에서 돌려요.

| # | 작업 | 시작 | 결과가 들어가는 곳 | 실패하면 |
|---|---|---|---|---|
| 6 | 아이디어 추천 | 8-2에서 `idea.recommend`를 부를 때 (요청 안) | `idea.recommend` | 503 AI_UNAVAILABLE |
| 9 | 숨은 공통점 | `diverge.board`에 들어갈 때 (아이디어 제출 마감 뒤) | `vote.state`의 commonThreads · `vote.thread` | 만들지 않음 (빈 목록) |
| 7 | AI 검증 · 현실성 | `diverge.review`에 들어갈 때 (댓글 마감 뒤) | `review.list` · `review.get` · `vote.state` · `vote.candidate`의 등급과 검증 · `vote.results`의 등급 | 그 아이디어만 failed, 투표는 진행 |
| 8 | AI가 모은 아이디어 | 7번과 같이 | `vote.state`의 aiIdeas · `vote.aiIdea` · `vote.results`의 aiMerged 줄 | 만들지 않음 (빈 목록) |
| 10 | 결과 인사이트 | `diverge.result`에 들어갈 때 | `vote.results`의 insight | null |

- 7 · 8번이 **모두** done 또는 failed가 되면 `review.list`의 ready = true, 그리고 `reviews.ready`를 세션 전원에게.
- 작업 하나가 3분 안에 끝나지 않으면 failed. AI · 검색 호출 실패는 2번까지 다시 시도.
- **검증이 끝나기 전(ready = false)에는 `diverge.review` → `diverge.vote` 넘기기가 409 STAGE_LOCKED** (2차 단계 표에 더해지는 규칙).
- 결과는 DB에 저장하고 다시 부르지 않아요. 되돌리기로 같은 단계에 다시 들어오면 **입력이 바뀐 것만**(예: 댓글이 달라진 아이디어) 다시 돌려요.
- 인사이트(10번)는 가벼운 작업이라 금방 끝나지만, 끝나기 전에 `vote.results`를 부르면 insight = null이에요.'''

BOUNDARY = '''- **4차 응답의 빈칸을 이번에 채워요**: `vote.state`(candidates의 grade · aiIdeas · commonThreads) · `vote.candidate`(review) · `vote.results`(ranks의 grade · aiMerged 줄 · insight). 4차에서는 null / 빈 목록이었어요.
- `vote.save`는 4차 규칙("지금 후보 목록에 있는 id만")을 그대로 쓰면 AI가 모은 아이디어(`aii_…`)도 자동으로 받아요. 숨은 공통점(`thr_…`)은 후보가 아니라서 400 NOT_A_CANDIDATE.
- `idea.submit`의 `recommendationId`: 이 사람에게 실제로 보여준 추천이면 "골랐음"으로 기록하고, 아니면 **에러 없이 무시**(아이디어는 저장). 통계용이라 제출을 막지 않아요.
- 재료(AI 입력)는 3차에서 만든 것을 써요. 9-1 역할 정하기의 AI 초안은 이번 범위가 아니에요 (9-1 디자인 수정 후).'''

QUESTIONS = '''| 무엇 | 지금 규칙 (바뀌면 알려드릴게요) |
|---|---|
| 8-5 검증 중(ready = false) · 검증 실패 화면 | **추가됨(2026-09-18)**: 검증 중 화면(T3) — `review.list`의 `ready` · `doneCount`로 진행 표시, `reviews.ready`면 목록 표시 · 실패한 아이디어는 "검증 실패" 표시 |
| 8-6 AI가 모은 아이디어 · 숨은 공통점 본문 | 디자인은 있고 프론트 그리기가 남음 |
| 추천 "더 보기" 한도 | 사람당 5묶음 (기획 확인 필요) |
| 검증이 도는 동안 진행자 화면 | 8-5 예시 화면 그대로 (진행자용 대기 안내 없음) |'''

SPEC = dict(
    phase='5차',
    title='백엔드 5차 전달 — 화면 8-2 · 8-5 · 8-6 (발산 AI)',
    intro='이번에 만들 범위와 **끝났다고 볼 수 있는 기준**이에요. 화면 폴더: `screens/08-2-idea-recommend`, `screens/08-5-ai-review`, `screens/08-6-vote` (AI가 모은 아이디어 · 숨은 공통점 부분), 결과의 AI 줄이 보이는 `screens/08-7-vote-result-host` (각 README에 화면 설명). 2차 · 3차 · 4차가 끝난 서버 기준이에요.',
    rules=[
        '**AI는 참고용 — 등급이 낮아도 빼지 않기** — 검증 등급(바로 해볼 만해요 / 보완하면 좋아요 / 다시 생각해 봐요)과 상관없이 모든 아이디어가 투표 후보예요. 검증이 실패해도 투표는 진행해요.',
        '**이름을 AI에 보내지 않기** — 스킬은 "웹 화면 2명"처럼 인원 수로, 재료 · 댓글은 작성자 없이. 추천 이유는 **요청한 사람의 답만** 인용하고 서버가 실제로 있는 말인지 확인해요.',
        '**지어내지 않기** — "이미 있나"와 검색 링크는 실제 검색 결과만. 결과가 없으면 "확인 못 함"으로 두고 링크를 만들지 않아요.',
        '**오래 걸리는 AI는 작업 큐로** — 단계에 들어갈 때 시작하고, 끝나면 `ready`와 `reviews.ready`로 알려요. 결과는 저장해서 다시 부르지 않아요. 시작 시점은 아래 "AI 작업 · 언제 무엇을".',
        '**공개 시점** — AI가 모은 아이디어 · 숨은 공통점은 **투표 단계부터** (그 전에는 403 FORBIDDEN, 선입견 방지). 아이디어 주인 이름은 결과(8-7)에서만.',
    ],
    rules_after='익명 규칙은 [01-백엔드-한눈에-보기.md](01-백엔드-한눈에-보기.md)의 "5. 익명 규칙", AI 작업의 입력 · 출력 · 모델 제안은 [05-AI-작업-목록.md](05-AI-작업-목록.md).',
    api_intro='4차에서 AI 없이 끝까지 돌던 발산에 **추천 · 검증 · AI가 모은 아이디어 · 숨은 공통점 · 인사이트**를 붙여요. 새 API는 6개지만, 4차 API(`vote.state` · `vote.candidate` · `vote.results`)의 비어 있던 칸도 이번에 채워져요.',
    ids=[
        'idea.recommend',
        'review.list',
        'review.get',
        'vote.aiIdea',
        'vote.thread',
        'vote.threadReact',
    ],
    why={
        'idea.recommend': '8-2 AI 추천 · "다른 추천 더 보기"',
        'review.list': '8-5 등급별 목록 · 검증이 끝났는지(ready)',
        'review.get': '8-5 본문 (이미 있나 · 구현 가능성 · 없는 스킬 · 필요 · 기간 · 댓글 요약)',
        'vote.aiIdea': '8-6 "AI가 모은 아이디어" 본문 (투표 후보)',
        'vote.thread': '8-6 "숨은 공통점" 본문 (참고용, 투표 아님)',
        'vote.threadReact': '8-6 숨은 공통점 "몰랐어요 / 이미 알았어요"',
    },
    events_intro='이번 범위의 실시간 이벤트는 하나예요 (세션 전원에게).',
    events=[
        ('reviews.ready', '8-5의 "검증 중" 안내를 걷음 (`screens/08-5-ai-review/screen.js`) — 목록은 아직 예시라서 내용 확인은 `review.list` 응답으로'),
    ],
    done_intro='''프론트의 `assets/js/config.js`에서 `useMock: false`, `baseUrl`을 서버 주소로 바꾸고 확인해요. **2차 · 3차 · 4차가 끝난 서버** 기준이에요.

사람마다 **다른 브라우저 프로필**(또는 다른 브라우저)로 로그인해요. **진행자 H · 참가자 P1 · P2 · P3 (4명)**. 아이스브레이킹 인터뷰는 모두 끝까지 답해서 재료를 만들고, 댓글 단계에서 **좋은 점을 2개 이상의 아이디어에** 남겨요 (AI가 모은 아이디어를 만들 수 있게). 시나리오는 **위에서부터 순서대로** 이어져요.

화면이 아직 서버 데이터를 그리지 않는 동작은 그 사람 창의 개발자도구 **콘솔에서 `await api.call(…)`**, 단계 넘기기는 **진행자 콘솔 `session.advance`**, 실시간 메시지는 **Network → WS(stream) → Messages**에서 확인해요. AI · 검색 결과 문장은 매번 달라서 **문장 내용이 아니라 모양 · 규칙**을 확인해요.''',
    scenarios=[
        ('(diverge.write) P1 콘솔 `await api.call(\'idea.recommend\')`', '추천 4개(recommendationId · title · reason) + nextCursor · reason에 따옴표로 인용한 말이 P1의 인터뷰 답(`ice.state`)에 실제로 있음'),
        ('P1이 같은 요청을 다시', '같은 4개 · 서버 로그에서 AI 호출이 늘지 않음'),
        ('P1 콘솔 `await api.call(\'idea.recommend\', { query: { cursor: \'받은 nextCursor\' } })`', '새 4개, 앞 묶음과 겹치지 않음'),
        ('P1이 cursor를 `nope`으로', '400 VALIDATION'),
        ('P1이 "더 보기"를 계속해서 6번째 묶음을 요청', '429 TOO_MANY_ATTEMPTS'),
        ('P2 콘솔 `idea.recommend`', 'P2의 답만 인용 (P1 · P3 답을 인용하지 않음)'),
        ('(테스트 서버의 AI 키를 잠시 틀리게 하고) P3가 처음으로 `idea.recommend`', '503 AI_UNAVAILABLE'),
        ('P1이 8-2에서 추천 카드 하나를 1순위로 고르고 "이 순서로 제출"', '에러 없이 제출됨 (카드 · recommendationId가 예시 값이라 서버 추천과 다르면 "골랐음" 기록만 안 됨) · P1 `idea.mine`의 source "ai"'),
        ('아직 diverge.write일 때 P1 콘솔 `vote.thread` · `vote.aiIdea` (아무 id)', '둘 다 403 FORBIDDEN'),
        ('H가 diverge.board로 넘긴 뒤 P1 콘솔 `idea.recommend`', '409 STAGE_CLOSED'),
        ('P2 콘솔 `idea.board`', 'P1 줄에 source · recommendationId가 없음 (다른 아이디어와 똑같이 보임)'),
        ('(댓글까지 마친 뒤) H가 diverge.review로 넘기고 P1이 바로 `review.list`', '참가자 화면은 8-5로 자동 이동 · 응답 ready:false · groups 빈 목록'),
        ('검증이 도는 동안 H 콘솔 `session.advance` (from diverge.review)', '409 STAGE_LOCKED, 단계 그대로'),
        ('검증이 끝날 때까지 WS Messages를 보고 `review.list`를 다시', '`reviews.ready` 도착 · ready:true · total = 제출된 아이디어 수 · 모든 아이디어가 go / fix / re (또는 failed) 그룹 중 딱 한 곳에'),
        ('P1 콘솔 `review.get` (아무 아이디어)', 'status done · grade · 6개 관점이 모두 있음 · exists.searchUrl을 열면 실제 검색 결과 페이지 · commentSummary 개수 = 그 아이디어 `comment.list`의 counts'),
        ('`review.list` · `review.get` 응답과 서버 로그의 AI 요청 본문 확인', '응답에는 별칭(alias)만, 닉네임 · participantId · 댓글 작성자 없음 · AI 요청에는 닉네임 · 이메일이 없고 스킬은 인원 수로만'),
        ('P1 8-5 콘솔 `App.$(\'.rail .ri\').dataset.ideaId = \'진짜 ideaId\'` 후 그 줄을 누름', '본문의 제목 · "팀원 ○의 n순위" · 등급 · 6줄 · "검색 결과 보기" 링크가 서버 값으로 바뀜'),
        ('(테스트용으로 한 아이디어의 검증을 실패시킨 세션에서) `review.list` · `review.get`', 'failed 그룹에 그 아이디어 · review.get status failed, grade와 관점은 null · ready는 true라 넘기기 가능'),
        ('H가 diverge.vote로 넘김 · P1 콘솔 `vote.state`', '참가자 8-5 → 8-6 자동 이동 · candidates의 grade가 모두 채워짐 (failed만 null) · re 등급 아이디어도 후보에 있음'),
        ('P1 콘솔 `vote.state`의 aiIdeas와 각 `vote.aiIdea`', 'aiIdeas 0~2개 · sources의 아이디어는 모두 좋은 점을 받은 아이디어 · sources에 이름 없이 alias만 · review 채워짐'),
        ('P1 콘솔 `vote.save` ids = [aii id, 아이디어 id] → 다시 [thr id]', '첫 번째 저장됨 (remaining 0) · 두 번째 400 NOT_A_CANDIDATE'),
        ('P1 · H 콘솔 `vote.thread` (commonThreads의 id)', 'answerCount 2 이상 · sources는 요약 (인터뷰 답 문장을 그대로 옮기지 않음) · includesMine은 DB common_thread_members에 있는 사람만 true · 진행자 응답에도 이름 없음'),
        ('P1 콘솔 `vote.threadReact` knew → didntKnow → reaction `x`', 'myReaction knew → didntKnow (`vote.thread`에도 반영) · 마지막은 400 VALIDATION'),
        ('H 콘솔 `session.back` (from diverge.vote) 후 다시 `session.advance` (from diverge.review)', '댓글이 그대로라 검증을 다시 돌리지 않음 (ready 바로 true · 서버 로그 AI 호출 그대로) · 넘기기 성공'),
        ('모두 투표를 마쳐 결과로 넘어감 · H의 8-7', '결과 줄에 등급이 보임 ("undefined" 아님) · AI가 모은 아이디어가 표를 받았으면 "AI가 모음 · ○○ 님 n순위 … 의 좋은 점" 줄'),
        ('H 콘솔 `vote.results`', 'aiMerged 줄의 sourceOwners에 닉네임 · 순위 (이때 처음 공개) · insight는 {title · body · threadId} 또는 null · 댓글 작성자 · 투표한 곳은 여전히 없음'),
    ],
    extra_sections=[
        ('AI 작업 · 언제 무엇을', JOBS),
        ('이번 범위의 경계', BOUNDARY),
        ('확인이 필요한 것 (디자인 · 기획)', QUESTIONS),
    ],
    front_title='프론트 쪽 참고 (이미 구현된 것 · 아직 안 된 것)',
    front=[
        '8-2: 추천 카드 1 · 2 · 3순위 고르기 · 오른쪽 "내 순위" · "다른 추천 더 보기" → `idea.recommend` (받은 개수 토스트) · 제출 → `idea.submit` (source ai + recommendationId): `screens/08-2-idea-recommend/screen.js`',
        '8-5: 목록에서 고르면 `review.get` → 본문 다시 그리기 (renderReview: 등급 · 6관점 · 검색 결과 링크 · 댓글 요약) · `stage.changed`(diverge.vote) → 8-6: `screens/08-5-ai-review/screen.js`',
        '8-6: 목록 종류(후보 / AI가 모은 아이디어 / 숨은 공통점)에 따라 본문 전환 · 고르면 `vote.candidate` / `vote.aiIdea` / `vote.thread` 부르기 (loadDetail) · 숨은 공통점 반응 → `vote.threadReact`: `screens/08-6-vote/screen.js`',
        '8-7: aiMerged 줄은 "AI가 모음" + sourceOwners, 줄마다 등급: `screens/08-7-vote-result-host/screen.js` (renderResults)',
'8-2: 추천 카드를 `idea.recommend`로 그리고, "다른 추천 더 보기"는 응답의 `nextCursor`로 이어 받아요: `screens/08-2-idea-recommend/screen.js`',
        '⬜ 아직 안 됨 — 8-2: 고른 문장을 화면에서 고치기(디자인 문구 "문장은 자유롭게 고쳐도 돼요")',
        '8-5: 화면을 열 때 `review.list`로 **검증 중 안내(T3)**를 띄우고 `reviews.ready`를 받으면 걷어요: `screens/08-5-ai-review/screen.js`',
'8-5: 등급별 목록을 `review.list`로 그리고("N개 더 보기" 포함), 고르면 `review.get`으로 본문: `screens/08-5-ai-review/screen.js`',
        '8-6: 목록(후보 · AI가 모은 아이디어 · 숨은 공통점)을 `vote.state`로, 본문은 `vote.candidate` · `vote.aiIdea`(출처 · 줄인 점 · 검증) · `vote.thread`(어디서 나왔나 · 왜 · 이어지는 후보 · 내 반응)로 그려요: `screens/08-6-vote/screen.js`',
        '8-7: 인사이트 카드를 `vote.results`의 `insight`로, 동점 재투표는 응답의 `ties`로: `screens/08-7-vote-result-host/screen.js`',
        '⬜ 아직 안 됨 — 8-5: 검증 실패(failed) 아이디어를 고르면 본문이 비어요 (pending · failed 전용 화면 디자인 필요) · 8-6 숨은 공통점 본문의 후보 체크박스는 보기 전용',
    ],
)
