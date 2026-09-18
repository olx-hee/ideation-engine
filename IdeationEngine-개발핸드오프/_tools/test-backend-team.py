# 9번 범위(파트 나누기 · 겹친 후보 질문 · 배치 초안 · 팀장 확정 · 보고서) 테스트용 가짜 백엔드 — 실제 서버가 아님
# 실행: python _tools/test-backend-team.py  ->  브라우저에서 http://127.0.0.1:8768/index.html
#   · config.js를 useMock:false로 바꿔서 내려주므로 화면이 이 서버에 실제로 요청함
#   · 미리 준비된 세션 1개 (참가자 4명 · 주제 확정됨 · 단계 team.split · 팀장 김승희)
#   · 계정 (비밀번호는 모두 password1234)
#       hyeongwon@test.com  노형원 (진행자 · 프론트엔드/발표·피칭/서비스 기획)
#       semin@test.com      이세민 (프론트엔드/웹 디자인/발표·피칭)
#       seunghee@test.com   김승희 (팀장 · 웹 디자인/PPT 디자인/리서치·사용자 조사)
#       sangjin@test.com    박상진 (백엔드/데이터)
#   · 테스트용 주소: /__state · /__log · /__timeup(추가 질문 마감) · /__reset
#   · 서버를 끄면 데이터는 모두 사라짐 (메모리 저장)
import json, os, re, secrets, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from http.cookies import SimpleCookie
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # 개발 폴더
SID = 'ses_TEAM01'
LOG = []

PEOPLE = [
    ('par_01', 'usr_01', 'hyeongwon@test.com', '노형원', 'host', ['프론트엔드', '발표·피칭', '서비스 기획']),
    ('par_02', 'usr_02', 'semin@test.com', '이세민', 'participant', ['프론트엔드', '웹 디자인', '발표·피칭']),
    ('par_03', 'usr_03', 'seunghee@test.com', '김승희', 'participant', ['웹 디자인', 'PPT 디자인', '리서치·사용자 조사']),
    ('par_04', 'usr_04', 'sangjin@test.com', '박상진', 'participant', ['백엔드', '데이터']),
]
PARTS = [
    dict(partId='prt_1', tier='core', name='화면 만들기', desc='공지 목록 · 마감 알림 화면', skill='프론트엔드', effort=5),
    dict(partId='prt_2', tier='core', name='서버 · 공지 모으기', desc='게시판 글 가져오기 · 알림 보내기', skill='백엔드', effort=5),
    dict(partId='prt_3', tier='core', name='발표 · 시연', desc='문제 정의 · 시연 흐름 · 질의응답', skill='발표·피칭', effort=3),
    dict(partId='prt_4', tier='normal', name='화면 디자인', desc='화면 분위기 · 컴포넌트 스타일', skill='웹 디자인', effort=3),
    dict(partId='prt_5', tier='normal', name='발표 자료', desc='장표 구성 · 시각화', skill='PPT 디자인', effort=3),
    dict(partId='prt_6', tier='normal', name='기획 · 범위 관리', desc='기능 범위 · 진행 조율', skill='서비스 기획', effort=3),
    dict(partId='prt_7', tier='normal', name='메일·LMS 자동 연동', desc='AI 검증에서 나온 팀에 없는 스킬', skill='외부 API 연동', effort=3),
]
SMALL = [('prt_s1', '경쟁 서비스 조사'), ('prt_s2', '사용자 인터뷰 3명'), ('prt_s3', '시연용 예시 공지 만들기'),
         ('prt_s4', '제출 문서 · 보고서 정리'), ('prt_s5', '기능 테스트 · 버그 기록'), ('prt_s6', '회의록 · 일정 챙기기')]
TOPIC = {'ideaId': 'ide_c1', 'title': '과제 공지와 마감을 한곳에 모아 알려주는 웹', 'owner': {'nickname': '노형원', 'rank': 1}, 'votes': 3, 'feasibility': '상'}
STAGES = {'diverge.result': 65, 'team.split': 70, 'team.questions': 75, 'team.assign': 80, 'report': 100}
QTEXT = {
    '화면 만들기': ('비슷한 화면을 끝까지 만들어 본 적 있나요?',
                 [('none', '아직 없어요'), ('tutorial', '수업·튜토리얼로 따라 만들어 봤어요'), ('solo', '혼자 기능 있는 화면을 완성해 봤어요'), ('team', '팀 프로젝트에서 화면 파트를 맡아 완성했어요')],
                 '무엇을, 어떤 기술로 만들었는지 한 줄', '여러 곳에서 모은 공지를 **한 목록에 마감 가까운 순**으로 보여주고, **마감 하루 전**인 건 눈에 띄게 표시하기'),
    '발표 · 시연': ('사람들 앞에서 발표나 시연을 맡아 본 적 있나요?',
                 [('none', '아직 없어요'), ('class', '수업 발표를 해 봤어요'), ('contest', '공모전·해커톤에서 발표해 봤어요'), ('lead', '발표와 질의응답을 주도해서 맡아 봤어요')],
                 '어떤 자리에서, 무엇을 발표했는지 한 줄', '공지를 놓쳐 마감을 넘긴 문제를 **짧게 공감**시키고, **시연 한 장면**으로 해결을 보여주기'),
    '화면 디자인': ('화면 디자인을 처음부터 끝까지 맡아 본 적 있나요?',
                 [('none', '아직 없어요'), ('class', '수업 과제로 해 봤어요'), ('solo', '혼자 서비스 화면을 디자인해 봤어요'), ('team', '팀 프로젝트의 화면 디자인을 맡아 끝냈어요')],
                 '어떤 화면을, 어떤 도구로 만들었는지 한 줄', '공지 목록이 **한눈에 읽히고**, 마감이 가까운 공지가 **눈에 먼저 들어오게** 만들기'),
}
DEFAULT_Q = ('이 파트와 비슷한 일을 해 본 적 있나요?',
             [('none', '아직 없어요'), ('class', '수업·과제로 해 봤어요'), ('solo', '혼자 해 봤어요'), ('team', '팀 프로젝트에서 맡아 끝냈어요')],
             '무엇을 어떻게 했는지 한 줄', '이 파트에서 제일 까다로운 부분을 어떻게 풀지')

users, access, refresh = {}, {}, {}
S = {}


def reset():
    S.clear()
    S.update(dict(stage='team.split', status='running', leader='par_03', answers={}, marks={},
                  decided={}, assign=None, version=1, changed=set(), suggestion=None, dismissed=set(),
                  confirmed=False, report=None, questions_closed=False))
    S['candidates'] = {p['partId']: [q[0] for q in PEOPLE if p['skill'] in q[5]] for p in PARTS}
    decide_singles()


def person(pid):
    return next(p for p in PEOPLE if p[0] == pid)


def who(pid, me=None):
    p = person(pid)
    d = {'participantId': pid, 'nickname': p[3]}
    if me == pid: d['isMe'] = True
    return d


def decide_singles():
    for p in PARTS:
        c = S['candidates'][p['partId']]
        if len(c) == 1: S['decided'][p['partId']] = c[0]


def overlaps():
    return [p for p in PARTS if len(S['candidates'][p['partId']]) > 1]


def questions_for(part):
    q = QTEXT.get(part['name'], DEFAULT_Q)
    return [dict(qid='q1', type='choice', text=q[0], options=[{'value': v, 'label': l} for v, l in q[1]],
                 detailLabel=q[2], detailPlaceholder='예: 어떤 프로젝트에서 무엇을 맡았는지'),
            dict(qid='q2', type='text', text='이 파트에서 제일 까다로운 부분을 어떻게 만들지 3줄로 적어주세요',
                 context=q[3], hint='정답을 맞히는 문제가 아니에요. 얼마나 구체적으로 그려지는지를 봐요.')]


def close_questions():
    """겹친 후보 판단: 답이 더 구체적인(길이) 사람 · 답이 없으면 후보 순서"""
    for p in overlaps():
        cands = S['candidates'][p['partId']]
        best, score = cands[0], -1
        for c in cands:
            a = S['answers'].get((p['partId'], c))
            v = len(((a or {}).get('q2') or {}).get('text', '')) if a else -1
            if v > score: best, score = c, v
        S['decided'][p['partId']] = best
    S['questions_closed'] = True
    S['stage'] = 'team.assign'
    build_assignment()


def loads(assign):
    out = {p[0]: 0 for p in PEOPLE}
    for row in assign:
        if row['assignee']: out[row['assignee']] += row['effort']
    return out


def build_assignment():
    rows = []
    for p in PARTS:
        pid = p['partId']
        a = S['decided'].get(pid)
        method = 'excluded' if not S['candidates'][pid] else ('question' if len(S['candidates'][pid]) > 1 else 'single')
        rows.append(dict(partId=pid, name=p['name'], tier=p['tier'], effort=p['effort'], assignee=a, method=method,
                         ai=a, label='' if method != 'single' else f"후보 1명 · {p['skill']}",
                         alternative='링크 붙여넣기로 대신' if method == 'excluded' else None))
    # 작은 일: 분량이 적은 사람에게 차례로
    for pid, name in SMALL:
        cur = loads(rows)
        pick = min(PEOPLE, key=lambda q: (cur[q[0]], q[0]))[0]
        rows.append(dict(partId=pid, name=name, tier='small', effort=2, assignee=pick, method='balance',
                         ai=pick, label='분량 맞추기', alternative=None))
    S['assign'] = rows
    S['suggestion'] = None
    make_suggestion()


def make_suggestion():
    rows = S['assign']
    ld = loads(rows)
    vals = [v for v in ld.values()]
    avg = sum(vals) / len(vals)
    over = [pid for pid, v in ld.items() if v > avg * 1.15]
    if not over: return
    heavy = max(over, key=lambda k: ld[k])
    light = min(ld, key=lambda k: ld[k])
    row = next((r for r in rows if r['tier'] == 'small' and r['assignee'] == heavy), None)
    if not row or heavy == light: return
    key = (row['partId'], heavy, light)
    if key in S['dismissed']: return
    S['suggestion'] = dict(suggestionId='sug_' + row['partId'], partId=row['partId'], partName=row['name'],
                           frm=heavy, to=light,
                           reason=f"{next(r['name'] for r in rows if r['assignee'] == heavy and r['tier'] != 'small')}을(를) 맡으면서 "
                                  f"{person(heavy)[3]} 님 분량이 많아졌어요. 작은 일 하나를 옮기면 다시 비슷해져요.")


def assignment_json(me):
    rows = S['assign']
    ld = loads(rows)
    top = max(ld.values()) or 1
    avg = sum(ld.values()) / len(ld)
    is_leader = me == S['leader']
    members = []
    for pid, _u, _e, nick, _r, _s in PEOPLE:
        rs = [r for r in rows if r['assignee'] == pid]
        ai = [r for r in rows if r['ai'] == pid]
        members.append(dict(who(pid, me), counts={'core': sum(1 for r in rs if r['tier'] == 'core'),
                                                  'normal': sum(1 for r in rs if r['tier'] == 'normal'),
                                                  'small': sum(1 for r in rs if r['tier'] == 'small')},
                            loadPct=round(ld[pid] * 100 / top), over=ld[pid] > avg * 1.15,
                            changeFromDraft=None if len(rs) == len(ai) and ld[pid] == sum(r['effort'] for r in ai)
                            else ('more' if ld[pid] > sum(r['effort'] for r in ai) else 'less')))
    parts = []
    for r in rows:
        marks = [who(m) for m in S['marks'].get(r['partId'], [])]
        d = dict(partId=r['partId'], name=r['name'], tier=r['tier'],
                 assignee=who(r['assignee'], me) if r['assignee'] else None,
                 method=r['method'], methodLabel=r['label'], changed=r['partId'] in S['changed'])
        if r['alternative']: d['alternative'] = r['alternative']
        if r['partId'] in S['changed'] and r['ai']: d['aiAssignee'] = who(r['ai'])
        if is_leader and marks: d['marks'] = marks
        parts.append(d)
    changes = []
    if is_leader:
        for pid, ms in S['marks'].items():
            for m in ms:
                changes.append({'type': 'mark', 'partId': pid, 'partName': next(r['name'] for r in rows if r['partId'] == pid), 'by': who(m)})
        for pid in S['changed']:
            r = next(x for x in rows if x['partId'] == pid)
            changes.append({'type': 'change', 'partId': pid, 'partName': r['name'], 'from': who(r['ai']), 'to': who(r['assignee'])})
    sg = S['suggestion']
    small_counts = [{'nickname': person(p[0])[3], 'count': sum(1 for r in rows if r['tier'] == 'small' and r['assignee'] == p[0]),
                     'why': f"핵심 파트 {sum(1 for r in rows if r['tier'] == 'core' and r['assignee'] == p[0])}개"} for p in PEOPLE]
    return dict(status='confirmed' if S['confirmed'] else 'draft', version=S['version'],
                leader=who(S['leader']), viewer={'participantId': me, 'isLeader': is_leader},
                members=members, parts=parts,
                balance={'note': '핵심 파트가 몰린 사람에게는 작은 일을 주지 않고, 적은 사람일수록 작은 일을 더 맡아 분량이 비슷해지게 했어요.',
                         'smallTaskCounts': [c for c in small_counts if c['count']]},
                myParts=[r['name'] for r in rows if r['assignee'] == me],
                markedByMe=[pid for pid, ms in S['marks'].items() if me in ms],
                changes=changes if is_leader else None,
                suggestion=(dict(suggestionId=sg['suggestionId'], partId=sg['partId'], partName=sg['partName'],
                                 **{'from': who(sg['frm'])}, to=who(sg['to']), reason=sg['reason']) if (sg and is_leader) else None))


def build_report():
    rows = S['assign']
    name = lambda pid: person(pid)[3]
    by_tier = lambda t: [{'name': r['name'], 'assignee': name(r['assignee'])} for r in rows if r['tier'] == t and r['assignee']]
    lead_part = {}
    for r in rows:
        if r['tier'] == 'core' and r['assignee'] and r['assignee'] not in lead_part: lead_part[r['assignee']] = r['name']
    stages = []
    plan = [('범위와 설계 정하기', '핵심 기능 2개의 화면 흐름 · 공지를 가져올 게시판 3곳', '범위와 흐름 정리'),
            ('만들기', '공지 목록 · 마감 알림이 동작하는 웹', '만들기'),
            ('합치고 확인하기', '처음부터 끝까지 시연되는 버전', '합치고 확인하기'),
            ('발표 준비', '발표 자료 · 시연 · 제출 문서', '발표 준비')]
    for i, (nm, make, verb) in enumerate(plan, 1):
        tasks = []
        for p in PEOPLE:
            mine = [r['name'] for r in rows if r['assignee'] == p[0] and r['tier'] != 'small']
            small = [r['name'] for r in rows if r['assignee'] == p[0] and r['tier'] == 'small']
            text = (mine[0] + ' — ' + verb) if mine else (small[0] if small else '팀 작업 돕기')
            tasks.append({'nickname': p[3], 'text': text, 'lead': '이끌기' if lead_part.get(p[0]) and i == 2 else None})
        stages.append({'no': i, 'name': nm, 'current': i == 1, 'make': make, 'tasks': tasks,
                       'handoffs': ['앞 단계 결과를 다음 담당에게 넘기기']})
    S['report'] = {
        'ready': True, 'reportId': 'rep_TEAM01', 'sessionId': SID, 'version': 1,
        'createdAt': time.strftime('%Y-%m-%dT%H:%M:%S+09:00'),
        'meta': {'date': time.strftime('%Y-%m-%d'), 'memberCount': len(PEOPLE), 'durationMin': 70, 'sessionTopic': '교내 해커톤 서비스 아이디어'},
        'topic': {'title': TOPIC['title'], 'summary': '메일·학교 사이트·단톡에 흩어진 과제 공지와 마감을 한 화면에 모아 알려줘요.', 'owner': TOPIC['owner']},
        'why': {'votes': {'total': 8, 'top': 3, 'gapToSecond': 1},
                'review': {'grade': 'go', 'summary': '학교 공지를 모아주는 건 드물어요', 'searchUrl': 'https://search.example.com/?q=test'},
                'praise': {'count': 2, 'points': ['다들 겪는 문제라 공감이 커요', '발표하기 쉬워요']},
                'thread': '"누가 무엇을 했는지"가 한곳에 안 남는 문제와 이어져요'},
        'feasibility': {'level': '상', 'summary': '웹 화면 2명 · 백엔드 1명으로 만들 수 있어요',
                        'missingSkills': [{'name': '메일·LMS 자동 연동', 'decision': '이번 범위에서 빼고 링크 붙여넣기로 대신'}],
                        'scope': '핵심 기능은 공지 모으기 · 마감 알림 두 가지'},
        'votes': {'maxVotesPerPerson': 2, 'ranks': [
            {'rank': 1, 'title': TOPIC['title'], 'owner': '노형원', 'votes': 3},
            {'rank': 2, 'title': '관심 있는 학교 행사·특강 소식만 골라 알려주는 웹', 'owner': '김승희', 'votes': 2},
            {'rank': 3, 'title': '회의 후 할 일 정리 · 열람실 빈자리 제보판', 'owner': None, 'tieCount': 2, 'votes': 1}]},
        'parts': {'leader': name(S['leader']), 'core': by_tier('core'), 'normal': by_tier('normal'), 'small': by_tier('small'),
                  'excluded': [{'name': r['name'], 'alternative': r['alternative']} for r in rows if r['method'] == 'excluded']},
        'workflow': {'stages': stages, 'always': [{'text': '회의록 · 일정 챙기기', 'nickname': name(next(r['assignee'] for r in rows if r['name'].startswith('회의록')))},
                                                  {'text': '기능 범위 지키기', 'nickname': name(next((r['assignee'] for r in rows if r['name'].startswith('기획')), PEOPLE[0][0]))}]},
        'anonymous': ['댓글 쓴 사람', '누가 어디에 투표했는지', '인터뷰 답 원문', '추가 질문의 답'],
        'shareUrl': f'http://127.0.0.1:8768/screens/09-5-report/index.html?sessionId={SID}',
    }


def err(code, msg, status): return status, {'error': {'code': code, 'message': msg}}


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass

    def send_json(self, status, body, cookies=()):
        data = b'' if body is None else json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        if body is not None: self.send_header('Content-Type', 'application/json; charset=utf-8')
        for c in cookies: self.send_header('Set-Cookie', c)
        self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data)

    def uid(self):
        a = self.headers.get('Authorization', '')
        t = a[7:] if a.startswith('Bearer ') else None
        if not t or t not in access or access[t]['exp'] < time.time(): return None
        return access[t]['uid']

    def pid(self):
        u = self.uid()
        return next((p[0] for p in PEOPLE if p[1] == u), None)

    def issue(self, uid, remember):
        at = 'at_' + secrets.token_hex(8); access[at] = {'uid': uid, 'exp': time.time() + 3600}
        rt = 'rt_' + secrets.token_hex(8); refresh[rt] = {'uid': uid, 'remember': remember}
        return at, f'ie_rt={rt}; HttpOnly; SameSite=Lax; Path=/api/v1/auth' + ('; Max-Age=2592000' if remember else '')

    def do_GET(self): self.route('GET')
    def do_POST(self): self.route('POST')
    def do_PUT(self): self.route('PUT')
    def do_DELETE(self): self.route('DELETE')

    def route(self, method):
        url = urlparse(self.path)
        if url.path == '/assets/js/config.js':
            body = open(os.path.join(ROOT, 'assets/js/config.js'), encoding='utf-8').read().replace('useMock: true', 'useMock: false')
            data = body.encode(); self.send_response(200); self.send_header('Content-Type', 'application/javascript')
            self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data); return
        if url.path == '/__state':
            return self.send_json(200, {'stage': S['stage'], 'leader': S['leader'], 'version': S['version'],
                                        'decided': S['decided'], 'marks': {k: list(v) for k, v in S['marks'].items()},
                                        'assign': [{'part': r['name'], 'who': person(r['assignee'])[3] if r['assignee'] else None} for r in (S['assign'] or [])],
                                        'confirmed': S['confirmed'], 'suggestion': (S['suggestion'] or {}).get('partName')})
        if url.path == '/__log': return self.send_json(200, LOG[-40:])
        if url.path == '/__timeup':
            if S['stage'] == 'team.questions': close_questions()
            return self.send_json(200, {'stage': S['stage']})
        if url.path == '/__reset': reset(); return self.send_json(200, {'ok': True})
        if not url.path.startswith('/api/v1/'):
            return super().do_GET() if method == 'GET' else self.send_json(405, None)
        path = url.path[len('/api/v1'):]
        n = int(self.headers.get('Content-Length') or 0)
        body = json.loads(self.rfile.read(n) or b'{}') if n else {}
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        status, res, cookies = self.api(method, path, body, q)
        LOG.append(f"{method} {path} -> {status} {(res or {}).get('error', {}).get('code', '') if isinstance(res, dict) else ''}")
        self.send_json(status, res, cookies)

    def api(self, m, p, b, q):
        C = ()
        if (m, p) == ('POST', '/auth/login'):
            u = next((x for x in PEOPLE if x[2] == b.get('email')), None)
            if not u or b.get('password') != 'password1234': return (*err('INVALID_CREDENTIALS', '이메일 또는 비밀번호가 달라요', 401), C)
            at, ck = self.issue(u[1], bool(b.get('remember')))
            return 200, {'user': {'id': u[1], 'email': u[2], 'nickname': u[3], 'avatarUrl': None, 'plan': 'FREE'}, 'accessToken': at, 'expiresIn': 3600}, (ck,)
        if (m, p) == ('POST', '/auth/refresh'):
            ck = SimpleCookie(self.headers.get('Cookie', '')); rt = ck['ie_rt'].value if 'ie_rt' in ck else None
            r = refresh.get(rt)
            if not r: return (*err('REFRESH_INVALID', '다시 로그인해 주세요', 401), C)
            at, new = self.issue(r['uid'], r['remember'])
            u = next(x for x in PEOPLE if x[1] == r['uid'])
            return 200, {'user': {'id': u[1], 'email': u[2], 'nickname': u[3], 'avatarUrl': None, 'plan': 'FREE'}, 'accessToken': at, 'expiresIn': 3600}, (new,)
        if (m, p) == ('POST', '/auth/logout'): return 204, None, ('ie_rt=; Max-Age=0; Path=/api/v1/auth',)
        if (m, p) == ('GET', '/meta/skills'): return 200, {'roles': [], 'skillGroups': []}, C

        me = self.pid()
        if not me: return (*err('UNAUTHORIZED', '로그인이 필요해요', 401), C)
        p0 = person(me)
        if (m, p) == ('GET', '/me'):
            return 200, {'user': {'id': p0[1], 'email': p0[2], 'nickname': p0[3], 'avatarUrl': None, 'plan': 'FREE'},
                         'profileComplete': True, 'profileSummary': {'desiredRole': '개발·구현', 'skills': p0[5]},
                         'sessionCount': 1, 'activeSession': {'sessionId': SID, 'code': 'TEAM01', 'topic': TOPIC['title'],
                                                              'role': p0[4], 'status': S['status'], 'stage': self.stage_obj()}}, C
        if p in (f'/sessions/{SID}', f'/sessions/{SID}/'):
            if m == 'GET':
                return 200, {'sessionId': SID, 'code': 'TEAM01', 'topic': TOPIC['title'], 'durationMin': 70, 'maxMembers': 4,
                             'status': S['status'], 'stage': self.stage_obj(), 'timer': {'endsAt': None, 'remainingSec': 600},
                             'host': {'participantId': 'par_01', 'nickname': '노형원'},
                             'me': {'participantId': me, 'role': p0[4], 'isLeader': me == S['leader']}, 'memberCount': 4}, C
        if (m, p) == ('GET', f'/sessions/{SID}/vote/results'):
            return 200, {'totalVotes': 8, 'memberCount': 4, 'unvotedCount': 9, 'ties': [],
                         'ranks': [{'rank': 1, 'id': 'ide_c1', 'title': TOPIC['title'], 'grade': 'go', 'votes': 3, 'owner': {'nickname': '노형원', 'rank': 1}},
                                   {'rank': 2, 'id': 'ide_b1', 'title': '관심 있는 학교 행사·특강 소식만 골라 알려주는 웹', 'grade': 'go', 'votes': 2, 'owner': {'nickname': '김승희', 'rank': 1}}],
                         'insight': {'title': '1위와 3위는 같은 숨은 공통점에서 나왔어요', 'body': '둘 다 기록이 한곳에 남지 않는 문제를 풀어요.', 'threadId': 'thr_1'}}, C
        if (m, p) == ('POST', f'/sessions/{SID}/topic'):
            if p0[4] != 'host': return (*err('FORBIDDEN', '진행자만 할 수 있어요', 403), C)
            if b.get('leaderParticipantId'): S['leader'] = b['leaderParticipantId']
            S['stage'] = 'team.split'
            return 200, {'topic': {'ideaId': b.get('ideaId'), 'title': TOPIC['title']}, 'leader': who(S['leader']), 'stage': self.stage_obj()}, C
        if (m, p) == ('POST', f'/sessions/{SID}/stage/next'):
            if p0[4] != 'host': return (*err('FORBIDDEN', '진행자만 할 수 있어요', 403), C)
            if b.get('from') and b['from'] != S['stage']: return (*err('STAGE_MISMATCH', '이미 다음 단계로 넘어갔어요', 409), C)
            if S['stage'] == 'team.split':
                S['stage'] = 'team.questions' if overlaps() else 'team.assign'
                if S['stage'] == 'team.assign': close_questions()
            elif S['stage'] == 'team.questions':
                close_questions()
            return 200, {'stage': self.stage_obj()}, C
        if (m, p) == ('GET', f'/sessions/{SID}/team/parts'):
            parts = []
            for x in PARTS:
                c = S['candidates'][x['partId']]
                st = 'overlap' if len(c) > 1 else ('single' if c else 'none')
                d = dict(partId=x['partId'], tier=x['tier'], name=x['name'], desc=x['desc'], skill=x['skill'],
                         status=st, candidates=[who(i, me) for i in c])
                if st == 'none': d['alternative'] = '링크 붙여넣기로 대신하기'
                parts.append(d)
            pending = sum(1 for x in overlaps() if me in S['candidates'][x['partId']] and (x['partId'], me) not in S['answers'])
            return 200, {'ready': True, 'topic': TOPIC, 'parts': parts,
                         'smallTasks': {'count': len(SMALL), 'names': [n for _, n in SMALL], 'note': '분량이 비슷해지게 나눠요'},
                         'mine': [{'partId': x['partId'], 'name': x['name'],
                                   'status': 'overlap' if len(S['candidates'][x['partId']]) > 1 else 'single'}
                                  for x in PARTS if me in S['candidates'][x['partId']]],
                         'myPendingQuestions': pending}, C
        if (m, p) == ('GET', f'/sessions/{SID}/team/questions/me'):
            items = []
            for x in overlaps():
                if me not in S['candidates'][x['partId']]: continue
                a = S['answers'].get((x['partId'], me))
                items.append(dict(partId=x['partId'], partName=x['name'], status='done' if a else 'next',
                                  otherCandidateCount=len(S['candidates'][x['partId']]) - 1,
                                  questions=questions_for(x), answer=a))
            for it in items:
                if it['status'] != 'done': it['status'] = 'answering'; break
            return 200, {'remainingSec': 160, 'items': items}, C
        mq = re.fullmatch(rf'/sessions/{SID}/team/questions/(\w+)/answer', p)
        if m == 'PUT' and mq:
            part = mq.group(1)
            if S['questions_closed'] or S['stage'] not in ('team.questions',): return (*err('STAGE_CLOSED', '추가 질문이 마감됐어요', 409), C)
            if me not in S['candidates'].get(part, []) or len(S['candidates'][part]) < 2: return (*err('NOT_CANDIDATE', '이 파트의 후보가 아니에요', 403), C)
            ans = (b.get('answers') or {})
            if not (ans.get('q1') or {}).get('choice'): return (*err('VALIDATION', '보기 중 하나를 골라주세요', 400), C)
            if not ((ans.get('q2') or {}).get('text') or '').strip(): return (*err('VALIDATION', '3줄 답을 적어주세요', 400), C)
            S['answers'][(part, me)] = ans
            rest = [x['partId'] for x in overlaps() if me in S['candidates'][x['partId']] and (x['partId'], me) not in S['answers']]
            everyone = all((x['partId'], c) in S['answers'] for x in overlaps() for c in S['candidates'][x['partId']])
            if everyone: close_questions()
            return 200, {'saved': True, 'nextPartId': rest[0] if rest else None, 'remaining': len(rest)}, C
        if (m, p) == ('GET', f'/sessions/{SID}/team/assignment'):
            if not S['assign']: return (*err('PARTS_NOT_READY', '아직 배치 초안이 없어요', 409), C)
            return 200, assignment_json(me), C
        mm = re.fullmatch(rf'/sessions/{SID}/team/parts/(\w+)/mark', p)
        if m == 'PUT' and mm:
            if S['confirmed']: return (*err('STAGE_CLOSED', '이미 확정됐어요', 409), C)
            part = mm.group(1); S['marks'].setdefault(part, set())
            if b.get('marked'): S['marks'][part].add(me)
            else: S['marks'][part].discard(me)
            S['version'] += 1
            return 200, {'partId': part, 'marked': bool(b.get('marked'))}, C
        ma = re.fullmatch(rf'/sessions/{SID}/team/parts/(\w+)/assignee', p)
        if m == 'PUT' and ma:
            if me != S['leader']: return (*err('NOT_LEADER', '팀장만 바꿀 수 있어요', 403), C)
            part = ma.group(1); target = b.get('participantId')
            row = next((r for r in S['assign'] if r['partId'] == part), None)
            if not row or not any(x[0] == target for x in PEOPLE): return (*err('VALIDATION', '없는 파트이거나 참가자가 아니에요', 400), C)
            if row['method'] == 'excluded': return (*err('VALIDATION', '후보가 없어 범위에서 뺀 파트예요', 400), C)
            row['assignee'] = target
            if target == row['ai']: S['changed'].discard(part)
            else: S['changed'].add(part)
            S['version'] += 1; S['suggestion'] = None; make_suggestion()
            if S['confirmed']: build_report()
            return 200, assignment_json(me), C
        ms = re.fullmatch(rf'/sessions/{SID}/team/suggestions/(\w+)', p)
        if m == 'POST' and ms:
            if me != S['leader']: return (*err('NOT_LEADER', '팀장만 할 수 있어요', 403), C)
            sg = S['suggestion']
            if not sg or sg['suggestionId'] != ms.group(1): return (*err('SUGGESTION_STALE', '제안이 바뀌었어요', 409), C)
            if b.get('accept'):
                row = next(r for r in S['assign'] if r['partId'] == sg['partId'])
                row['assignee'] = sg['to']; S['changed'].add(row['partId'])
            else:
                S['dismissed'].add((sg['partId'], sg['frm'], sg['to']))
            S['version'] += 1; S['suggestion'] = None; make_suggestion()
            return 200, assignment_json(me), C
        if (m, p) == ('POST', f'/sessions/{SID}/team/assignment/revert'):
            if me != S['leader']: return (*err('NOT_LEADER', '팀장만 할 수 있어요', 403), C)
            if S['confirmed']: return (*err('ASSIGNMENT_CONFIRMED', '이미 확정됐어요', 409), C)
            for r in S['assign']: r['assignee'] = r['ai']
            S['changed'].clear(); S['version'] += 1; S['suggestion'] = None; make_suggestion()
            return 200, assignment_json(me), C
        if (m, p) == ('POST', f'/sessions/{SID}/team/assignment/confirm'):
            if me != S['leader']: return (*err('NOT_LEADER', '팀장만 확정할 수 있어요', 403), C)
            if S['confirmed']: return (*err('ASSIGNMENT_CONFIRMED', '이미 확정됐어요', 409), C)
            if b.get('version') and b['version'] != S['version']: return (*err('VERSION_MISMATCH', '그 사이 배치가 바뀌었어요. 다시 불러온 뒤 확정해 주세요', 409), C)
            S['confirmed'] = True; S['stage'] = 'report'; S['status'] = 'ended'; build_report()
            return 200, {'status': 'confirmed', 'reportReady': True, 'stage': self.stage_obj()}, C
        if (m, p) == ('GET', f'/sessions/{SID}/report'):
            if not S['report']: return 200, {'ready': False}, C
            return 200, S['report'], C
        return (*err('NOT_IMPLEMENTED', f'테스트 서버에 없음: {m} {p}', 501), C)

    def stage_obj(self):
        return {'id': S['stage'], 'label': '파트 나누기 · 보고서', 'subStep': None, 'progress': STAGES.get(S['stage'], 70)}


if __name__ == '__main__':
    reset()
    print('READY  http://127.0.0.1:8768/index.html')
    print('  로그인: hyeongwon@test.com(진행자) · semin@test.com · seunghee@test.com(팀장) · sangjin@test.com / password1234')
    print('  단계:', S['stage'], '· 팀장: 김승희')
    ThreadingHTTPServer(('127.0.0.1', 8768), H).serve_forever()
