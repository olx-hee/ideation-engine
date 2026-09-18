# 백엔드 N차 전달 문서 (docs/00-백엔드-N차-전달-…md) 만들기 + 검사
# · 형식은 1차 문서(docs/00-백엔드-1차-전달-화면1-1-1-2.md)와 똑같다. handoff.py가 render(ho_phase1.SPEC) == 1차 문서인지 매번 확인한다.
# · 차수별 내용은 _generator/ho_phase2.py ~ ho_phase6.py 의 SPEC 에만 적는다. (이 파일은 공통 — 차수 작업 중에는 고치지 않기)
import importlib, os, re
from ho_api import ENDPOINTS, EVENTS, ERRORS, AUTH_LABEL, E
from ho_docs import endpoint_md, BASE
import ho_status

# 차수 → (SPEC 모듈, 만들어질 파일 이름)
PHASE_FILES = {
    '1차': ('ho_phase1', '00-백엔드-1차-전달-화면1-1-1-2.md'),
    '2차': ('ho_phase2', '00-백엔드-2차-전달-화면4-5-6.md'),
    '3차': ('ho_phase3', '00-백엔드-3차-전달-화면7-1~7-7.md'),
    '4차': ('ho_phase4', '00-백엔드-4차-전달-화면8-1-8-3-8-4-8-6-8-7.md'),
    '5차': ('ho_phase5', '00-백엔드-5차-전달-화면8-2-8-5-8-6.md'),
    '6차': ('ho_phase6', '00-백엔드-6차-전달-화면A1~A5.md'),
    '7차': ('ho_phase7', '00-백엔드-7차-전달-화면9-1~9-5.md'),
}
STAGE_IDS = ['lobby', 'icebreak', 'diverge.write', 'diverge.board', 'diverge.comment', 'diverge.review', 'diverge.vote', 'diverge.result', 'team.split', 'team.questions', 'team.assign', 'report']
FRONT_TITLE = '프론트 쪽 참고 (이미 구현됨)'


def phase_ids(name):
    return next(p[3] for p in ho_status.PHASES if p[0] == name)


def render(spec):
    """SPEC(dict) → 전달 문서 마크다운. 빈 줄·표 모양까지 1차 문서와 같게."""
    ids = spec['ids']
    L = [f"# {spec['title']}", '', spec['intro'].strip(), '', '## 정해진 규칙', '']
    L += [f'{i}. {r}' for i, r in enumerate(spec['rules'], 1)]
    if spec.get('rules_after'):
        L += ['', spec['rules_after'].strip()]
    L += ['', f'## 만들 API ({len(ids)}개)', '']
    if spec.get('api_intro'):
        L += [spec['api_intro'].strip(), '']
    L += ['| 메서드 | 경로 | 권한 | 하는 일 | 왜 이번에 필요한가 |', '|---|---|---|---|---|']
    L += ['| `%s` | `%s` | %s | %s | %s |' % (ENDPOINTS[i]['method'], ENDPOINTS[i]['path'], AUTH_LABEL[ENDPOINTS[i]['auth']], ENDPOINTS[i]['title'], spec['why'][i]) for i in ids]
    L += ['', spec['events_intro'].strip()]
    if spec['events']:
        L += ['', '| 이벤트 | data | 받으면 |', '|---|---|---|']
        for ev in spec['events']:
            name, custom = (ev, None) if isinstance(ev, str) else ev
            row = next(x for x in EVENTS if x[0] == name)
            L.append('| `%s` | `%s` | %s |' % (name, row[2], custom or row[3]))
    L += ['', f"## 완료 기준 — 아래가 모두 통과하면 {spec['phase']} 끝", '', spec['done_intro'].strip(), '',
          '| # | 시나리오 | 기대 결과 |', '|---|---|---|']
    L += [f'| {i} | {s} | {r} |' for i, (s, r) in enumerate(spec['scenarios'], 1)]
    for heading, body in spec.get('extra_sections', []):
        L += ['', f'## {heading}', '', body.strip()]
    L += ['', f"## {spec.get('front_title', FRONT_TITLE)}", '']
    L += [f'- {x}' for x in spec['front']]
    L += ['', '## API 상세', '', f'모든 경로 앞에 `{BASE}`이 붙어요.', '', '\n'.join(endpoint_md(ENDPOINTS[i]) for i in ids)]
    return '\n'.join(L) + '\n'


# ───────── 검사 ─────────
KNOWN_CODES = {c: s for c, s, _ in ERRORS}
for _e in E:
    for _c, _s, _ in _e['errors']:
        KNOWN_CODES.setdefault(_c, _s)
EVENT_NAMES = {x[0] for x in EVENTS}
API_PREFIXES = {i.split('.')[0] for i in ENDPOINTS}
EVENT_PREFIXES = {n.split('.')[0] for n in EVENT_NAMES}
NOT_ID = {'api.call', 'ie.state', 'session.stage', 'session.status'}


def _json_keys(v, out):
    if isinstance(v, dict):
        for k, x in v.items():
            out.add(k); _json_keys(x, out)
    elif isinstance(v, list):
        for x in v:
            _json_keys(x, out)
    return out


FIELD_NAMES = set()   # 명세의 요청·응답·이벤트 JSON 필드 이름 — `stage.id` `timer.endsAt` 같은 "필드 경로"는 API id로 보지 않음
for _e in E:
    _json_keys(_e['req'], FIELD_NAMES); _json_keys(_e['res'], FIELD_NAMES)
FIELD_NAMES |= set(re.findall(r'"(\w+)":', ' '.join(x[2] for x in EVENTS)))
ALLOWED_CODE_WORDS = {'HTTP_401', 'NOT_IMPLEMENTED'}
PATH_ROOTS = ('screens/', 'assets/', 'docs/', '_tools/', '_generator/')


def _texts(spec):
    """검사할 모든 문장 (위치 이름, 문장)"""
    out = [('title', spec.get('title', '')), ('intro', spec.get('intro', '')), ('rules_after', spec.get('rules_after', '')),
           ('api_intro', spec.get('api_intro', '')), ('events_intro', spec.get('events_intro', '')), ('done_intro', spec.get('done_intro', ''))]
    out += [(f'rules[{i}]', r) for i, r in enumerate(spec.get('rules', []), 1)]
    out += [(f'why[{k}]', v) for k, v in spec.get('why', {}).items()]
    for i, sc in enumerate(spec.get('scenarios', []), 1):
        out += [(f'scenarios[{i}].시나리오', sc[0] if len(sc) > 0 else ''), (f'scenarios[{i}].기대결과', sc[1] if len(sc) > 1 else '')]
    out += [(f'events[{ev[0]}]', ev[1]) for ev in spec.get('events', []) if not isinstance(ev, str)]
    out += [(f'extra[{h}]', h + '\n' + b) for h, b in spec.get('extra_sections', [])]
    out += [(f'front[{i}]', x) for i, x in enumerate(spec.get('front', []), 1)]
    return out


def check(spec, root, name):
    """문제 목록(문자열)을 돌려준다. 빈 목록이면 통과."""
    P = []
    need = ['phase', 'title', 'intro', 'rules', 'ids', 'why', 'events_intro', 'events', 'done_intro', 'scenarios', 'front']
    P += [f'SPEC에 {k} 가 없음' for k in need if k not in spec]
    if P:
        return P
    if spec['phase'] != name:
        P.append(f"phase 값이 {name} 이 아님: {spec['phase']}")
    want, ids = phase_ids(name), spec['ids']
    if sorted(ids) != sorted(want) or len(set(ids)) != len(ids):
        P.append(f'ids가 ho_status.PHASES의 {name} 목록과 다름 — 빠짐 {sorted(set(want) - set(ids))} · 남음 {sorted(set(ids) - set(want))} · 중복 {sorted({i for i in ids if ids.count(i) > 1})}')
    if set(spec['why']) != set(ids):
        P.append(f"why 키가 ids와 다름 — 빠짐 {sorted(set(ids) - set(spec['why']))} · 남음 {sorted(set(spec['why']) - set(ids))}")
    if not spec['rules']:
        P.append('rules(정해진 규칙)가 비어 있음')
    for k in ('title', 'intro', 'events_intro', 'done_intro'):
        if not str(spec[k]).strip():
            P.append(f'{k} 가 비어 있음')
    P += [f'why[{k}] 가 비어 있음' for k, v in spec['why'].items() if not str(v).strip()]
    P += [f'rules[{i}] 가 비어 있음' for i, r in enumerate(spec['rules'], 1) if not str(r).strip()]
    P += [f'front[{i}] 가 비어 있음' for i, x in enumerate(spec['front'], 1) if not str(x).strip()]
    if not spec['events'] and '없' not in spec['events_intro']:
        P.append('events가 비어 있으면 events_intro에 "이번 범위에 실시간 이벤트는 없어요"처럼 적기')
    for ev in spec['events']:
        n = ev if isinstance(ev, str) else ev[0]
        if n not in EVENT_NAMES:
            P.append(f'없는 실시간 이벤트: {n}')
    if len(spec['scenarios']) < 8:
        P.append(f"완료 기준 시나리오가 너무 적음({len(spec['scenarios'])}개) — 8개 이상")
    for i, sc in enumerate(spec['scenarios'], 1):
        if not (isinstance(sc, (tuple, list)) and len(sc) == 2 and all(isinstance(x, str) and x.strip() for x in sc)):
            P.append(f'scenarios[{i}] 는 ("시나리오", "기대 결과") 두 문장이어야 함')
    if not spec['front']:
        P.append('front(프론트 쪽 참고)가 비어 있음')
    mine = {f for _, f in PHASE_FILES.values()}
    for where, t in _texts(spec):
        t = t or ''
        one_line = where.startswith(('why', 'scenarios', 'events[', 'rules', 'front'))
        if one_line and '\n' in t:
            P.append(f'{where}: 줄바꿈 금지 (표 한 칸/목록 한 줄) → <br> 사용')
        if where.startswith(('why', 'scenarios', 'events[')) and re.search(r'(?<!\\)\|', t):
            P.append(f'{where}: 표 안에 | 문자 금지 (\\| 또는 / 로)')
        for bad in ('TODO', 'FIXME', 'TBD', '???', 'XXX'):
            if bad in t:
                P.append(f'{where}: 작성 중 표시 "{bad}" 가 남아 있음')
        for st, code in re.findall(r'\b([1-5]\d\d)\s+`?([A-Z][A-Z0-9_]{3,})\b', t):
            if code in KNOWN_CODES and KNOWN_CODES[code] != int(st):
                P.append(f'{where}: {st} {code} — 명세의 HTTP 상태는 {KNOWN_CODES[code]}')
        for code in re.findall(r'\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b', t):
            if code not in KNOWN_CODES and code not in ALLOWED_CODE_WORDS:
                P.append(f'{where}: 명세에 없는 에러 코드 {code} (ho_api.py ERRORS 또는 API errors에 있어야 함)')
        for tok in re.findall(r"(?<![\w/.])([a-z]+\.[a-zA-Z]+)(?![\w/(])", t):
            pre, _, post = tok.partition('.')
            if tok in NOT_ID or tok in STAGE_IDS or tok in spec.get('allow_words', ()) or tok.endswith(('.js', '.md', '.py', '.css', '.html', '.json')):
                continue
            if tok not in ENDPOINTS and tok not in EVENT_NAMES and tok not in STAGE_IDS and post in FIELD_NAMES:
                continue
            if pre == 'diverge':
                if tok not in STAGE_IDS:
                    P.append(f'{where}: 없는 단계 id {tok}')
            elif (pre in API_PREFIXES or pre in EVENT_PREFIXES) and tok not in ENDPOINTS and tok not in EVENT_NAMES:
                P.append(f'{where}: 없는 API id / 이벤트 이름 {tok}')
        for path in re.findall(r'`((?:' + '|'.join(re.escape(r) for r in PATH_ROOTS) + r')[^`\s]*)`', t):
            clean = path.rstrip('/')
            if os.path.basename(clean) in mine:
                continue
            if not os.path.exists(os.path.join(root, clean)):
                P.append(f'{where}: 없는 파일/폴더 `{path}`')
    return P


def load_spec(name):
    mod = importlib.import_module(PHASE_FILES[name][0])
    return mod, mod.SPEC


def ready_docs(out_dir):
    """docs/에 실제로 있는 차수 전달 문서 {차수: (파일 이름, 시나리오 수)} — 현황 문서 · README · 화면 목록이 이걸 보고 적는다"""
    out = {}
    for name, (modname, fname) in PHASE_FILES.items():
        if os.path.exists(os.path.join(out_dir, 'docs', fname)):
            out[name] = (fname, len(load_spec(name)[1]['scenarios']))
    return out


def build_all(out_dir):
    """2차~6차: READY=True 이고 검사를 통과한 것만 docs/ 에 쓴다. 출력할 상태 줄 목록을 돌려준다."""
    lines, problems = [], []
    for name in ['2차', '3차', '4차', '5차', '6차', '7차']:
        modname, fname = PHASE_FILES[name]
        stale = os.path.join(out_dir, 'docs', fname)
        if os.path.exists(stale):
            os.remove(stale)   # 이번에 다시 통과한 것만 남긴다 (예전에 만든 문서가 남아서 잘못 전달되지 않게)
        if not os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), modname + '.py')):
            lines.append(f'{name} 전달 문서: 파일 없음 ({modname}.py)')
            continue
        mod, spec = load_spec(name)
        if not getattr(mod, 'READY', False):
            lines.append(f'{name} 전달 문서: 작성 중 (READY=False · 검사/미리보기: python _generator/check_delivery.py {name[0]})')
            continue
        P = check(spec, out_dir, name)
        if P:
            problems += [f'{name}: {p}' for p in P]
            lines.append(f'{name} 전달 문서: [X] 검사 실패 {len(P)}건 -> 쓰지 않음')
            continue
        with open(os.path.join(out_dir, 'docs', fname), 'w', encoding='utf-8', newline='\n') as f:
            f.write(render(spec))
        lines.append(f"{name} 전달 문서: ok (API {len(spec['ids'])} · 시나리오 {len(spec['scenarios'])}) -> docs/{fname}")
    return lines, problems
