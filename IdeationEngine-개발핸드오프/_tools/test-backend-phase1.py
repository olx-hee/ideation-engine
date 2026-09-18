# 1차 범위(화면 1 · 1-1 · 2) 테스트용 가짜 백엔드 — 실제 서버가 아님. 프론트가 명세대로 붙는지 확인하는 용도
# 실행: python _tools/test-backend-phase1.py  ->  브라우저에서 http://127.0.0.1:8767/index.html
#   · config.js를 useMock:false로 바꿔서 내려주므로 화면이 이 서버에 실제로 요청함
#   · 미리 준비: 진행자 host@test.com / password1234 + 방 1개 (콘솔에 ROOM 코드 출력, 인원 2명)
#   · 테스트용 주소: /__start(모든 방 시작) · /__expire(액세스 토큰 전부 만료) · /__state · /__log(최근 요청)
#   · 서버를 끄면 데이터는 모두 사라짐 (메모리 저장)
import json, os, re, secrets, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from http.cookies import SimpleCookie
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # 개발 폴더
users, access, refresh, sessions, parts = {}, {}, {}, {}, {}
state = {'expire_all': False}
LOG = []

def err(code, msg, status): return status, {'error': {'code': code, 'message': msg}}

def mk_session(host_uid):
    code = 'TEST' + secrets.choice('ABCDEFGHJKMNPQRSTUVWXYZ23456789') + secrets.choice('ABCDEFGHJKMNPQRSTUVWXYZ23456789')
    sid = 'ses_' + code
    sessions[sid] = dict(sessionId=sid, code=code, topic='테스트 주제', maxMembers=2, status='lobby', stage={'id': 'lobby', 'label': '대기실', 'subStep': None, 'progress': 0}, host=host_uid)
    parts[(sid, host_uid)] = dict(participantId='par_' + host_uid, role='host', kicked=False)
    return sessions[sid]

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
        if not t or t not in access or state['expire_all'] or access[t]['exp'] < time.time(): return None
        return access[t]['uid']

    def issue(self, uid, remember):
        at = 'at_' + secrets.token_hex(8); access[at] = {'uid': uid, 'exp': time.time() + 3600}
        rt = 'rt_' + secrets.token_hex(8); refresh[rt] = {'uid': uid, 'remember': remember, 'used': False}
        cookie = f'ie_rt={rt}; HttpOnly; SameSite=Lax; Path=/api/v1/auth' + ('; Max-Age=2592000' if remember else '')
        return at, cookie

    def me_obj(self, uid):
        u = users[uid]
        return {'id': uid, 'email': u['email'], 'nickname': u['nickname'], 'avatarUrl': None, 'plan': 'FREE'}

    def do_GET(self): self.route('GET')
    def do_POST(self): self.route('POST')
    def do_PUT(self): self.route('PUT')

    def route(self, method):
        url = urlparse(self.path)
        if url.path == '/assets/js/config.js':   # 실서버 모드로 강제
            body = open(os.path.join(ROOT, 'assets/js/config.js'), encoding='utf-8').read().replace('useMock: true', 'useMock: false')
            data = body.encode(); self.send_response(200); self.send_header('Content-Type', 'application/javascript'); self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data); return
        if url.path == '/__expire': state['expire_all'] = True; return self.send_json(200, {'ok': True})
        if url.path == '/__start':
            for s in sessions.values(): s['status'] = 'running'; s['stage'] = {'id': 'icebreak', 'label': '아이스브레이킹', 'subStep': 1, 'progress': 3}
            return self.send_json(200, {'ok': True})
        if url.path == '/__log': return self.send_json(200, LOG[-30:])
        if url.path == '/__state': return self.send_json(200, {'sessions': list(sessions.values()), 'parts': [f'{k[0]}:{k[1]}:{v["role"]}' for k, v in parts.items()]})
        if not url.path.startswith('/api/v1/'):
            return super().do_GET() if method == 'GET' else self.send_json(405, None)
        path = url.path[len('/api/v1'):]
        n = int(self.headers.get('Content-Length') or 0)
        body = json.loads(self.rfile.read(n) or b'{}') if n else {}
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        status, res, cookies = self.api(method, path, body, q)
        LOG.append(f"{method} {path} auth={'Y' if self.headers.get('Authorization','').startswith('Bearer at_') else 'N'} cookie={'Y' if 'ie_rt=' in self.headers.get('Cookie','') else 'N'} -> {status} {(res or {}).get('error',{}).get('code','') if isinstance(res,dict) else ''}")
        self.send_json(status, res, cookies)

    def api(self, m, p, b, q):
        C = ()
        if (m, p) == ('POST', '/auth/signup'):
            if any(u['email'] == b['email'] for u in users.values()): return (*err('EMAIL_TAKEN', '이미 가입된 이메일이에요', 409), C)
            uid = 'usr_' + secrets.token_hex(3); users[uid] = {'email': b['email'], 'password': b['password'], 'nickname': b['nickname'], 'profile': None}
            at, ck = self.issue(uid, False); return 201, {'user': self.me_obj(uid), 'accessToken': at, 'expiresIn': 3600}, (ck,)
        if (m, p) == ('POST', '/auth/login'):
            uid = next((k for k, u in users.items() if u['email'] == b.get('email') and u['password'] == b.get('password')), None)
            if not uid: return (*err('INVALID_CREDENTIALS', '이메일 또는 비밀번호가 달라요', 401), C)
            at, ck = self.issue(uid, bool(b.get('remember'))); return 200, {'user': self.me_obj(uid), 'accessToken': at, 'expiresIn': 3600}, (ck,)
        if (m, p) == ('POST', '/auth/refresh'):
            ck = SimpleCookie(self.headers.get('Cookie', '')); rt = ck['ie_rt'].value if 'ie_rt' in ck else None
            r = refresh.get(rt)
            if not r or r['used']: return (*err('REFRESH_INVALID', '다시 로그인해 주세요', 401), C)
            r['used'] = True; state['expire_all'] = False
            at, new = self.issue(r['uid'], r['remember']); return 200, {'user': self.me_obj(r['uid']), 'accessToken': at, 'expiresIn': 3600}, (new,)
        if (m, p) == ('POST', '/auth/logout'):
            ck = SimpleCookie(self.headers.get('Cookie', '')); rt = ck['ie_rt'].value if 'ie_rt' in ck else None
            if rt in refresh: refresh[rt]['used'] = True
            return 204, None, ('ie_rt=; Max-Age=0; Path=/api/v1/auth',)
        if (m, p) == ('GET', '/meta/skills'): return 200, {'roles': [], 'skillGroups': []}, C

        uid = self.uid()
        if not uid: return (*err('UNAUTHORIZED', '로그인이 필요해요', 401), C)
        u = users[uid]
        if (m, p) == ('GET', '/me'):
            act = next(({'sessionId': sid, 'code': s['code'], 'topic': s['topic'], 'role': parts[(sid, uid)]['role'], 'status': s['status'], 'stage': s['stage']}
                        for sid, s in sessions.items() if (sid, uid) in parts and not parts[(sid, uid)]['kicked']), None)
            pr = u['profile']
            return 200, {'user': self.me_obj(uid), 'profileComplete': bool(pr), 'profileSummary': {'desiredRole': pr['desiredRole'], 'skills': pr['skills']} if pr else None,
                         'sessionCount': sum(1 for k in parts if k[1] == uid), 'activeSession': act}, C
        if (m, p) == ('PUT', '/me/profile'):
            if not b.get('nickname') or not b.get('desiredRole') or not b.get('skills'): return (*err('VALIDATION', '닉네임·역할·스킬을 채워주세요', 400), C)
            u['profile'] = b; u['nickname'] = b['nickname']; return 200, dict(b, avatarUrl=None), C
        if (m, p) == ('POST', '/sessions'):
            if not u['profile']: return (*err('PROFILE_REQUIRED', '프로필을 먼저 만들어 주세요', 409), C)
            s = mk_session(uid); return 201, s, C
        if (m, p) == ('GET', '/sessions/lookup'):
            code = (q.get('code') or '').upper()
            s = next((x for x in sessions.values() if x['code'] == code), None)
            if not s: return (*err('SESSION_NOT_FOUND', '없는 방 코드예요', 404), C)
            pa = parts.get((s['sessionId'], uid))
            if pa and pa['kicked']: return (*err('KICKED', '이 방에서 내보내졌어요', 403), C)
            if not pa:
                if s['status'] != 'lobby': return (*err('SESSION_STARTED', '이미 시작한 방이에요', 409), C)
                if sum(1 for k in parts if k[0] == s['sessionId']) >= s['maxMembers']: return (*err('SESSION_FULL', '방이 가득 찼어요', 409), C)
            return 200, dict(sessionId=s['sessionId'], code=s['code'], topic=s['topic'], status=s['status'], alreadyJoined=bool(pa), myRole=pa['role'] if pa else None), C
        mj = re.fullmatch(r'/sessions/([\w]+)/join', p)
        if m == 'POST' and mj:
            s = sessions.get(mj.group(1))
            if not s or s['code'] != (b.get('code') or '').upper(): return (*err('SESSION_NOT_FOUND', '없는 방 코드예요', 404), C)
            pa = parts.get((s['sessionId'], uid))
            if pa:
                if pa['kicked']: return (*err('KICKED', '이 방에서 내보내졌어요', 403), C)
                return 200, {'participantId': pa['participantId'], 'role': pa['role'], 'rejoined': True, 'session': {'status': s['status'], 'stage': s['stage']}}, C
            if not u['profile']: return (*err('PROFILE_REQUIRED', '입장하기 전에 프로필을 먼저 만들어 주세요', 409), C)
            if s['status'] != 'lobby': return (*err('SESSION_STARTED', '이미 시작한 방이에요', 409), C)
            if sum(1 for k in parts if k[0] == s['sessionId']) >= s['maxMembers']: return (*err('SESSION_FULL', '방이 가득 찼어요', 409), C)
            parts[(s['sessionId'], uid)] = dict(participantId='par_' + uid, role='participant', kicked=False)
            return 200, {'participantId': 'par_' + uid, 'role': 'participant', 'rejoined': False, 'session': {'status': s['status'], 'stage': s['stage']}}, C
        mg = re.fullmatch(r'/sessions/([\w]+)', p)
        if m == 'GET' and mg:
            s = sessions.get(mg.group(1)); pa = parts.get((mg.group(1), uid)) if s else None
            if not pa: return (*err('NOT_PARTICIPANT', '이 세션 참가자가 아니에요', 403), C)
            return 200, dict(s, me={'participantId': pa['participantId'], 'role': pa['role']}, timer={'endsAt': None, 'remainingSec': 1800}), C
        return (*err('NOT_IMPLEMENTED', f'테스트 서버에 없음: {m} {p}', 501), C)

if __name__ == '__main__':
    # 진행자 계정 + 방 하나 미리 준비
    users['usr_host'] = {'email': 'host@test.com', 'password': 'password1234', 'nickname': '진행자', 'profile': {'nickname': '진행자', 'desiredRole': '발표·기획', 'skills': ['발표·피칭']}}
    s = mk_session('usr_host'); print('ROOM', s['code'], flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8767), H).serve_forever()
