# IdeationEngine 개발 핸드오프 폴더 생성기 (화면 1 ~ 9-5)
# 실행: python _generator/handoff.py  ->  상위 폴더(개발 폴더)의 screens/ assets/ docs/ README 등을 다시 만듦 (design/ 목업 포함)
import os, re, io, json, shutil, runpy, contextlib, html as H
HERE = os.path.dirname(os.path.abspath(__file__))
import sys; sys.path.insert(0, HERE)
from ho_api import ENDPOINTS, E
from ho_screens_team import SCREENS, GROUPS, STAGE_OF, BOARD_EDITS
from ho_assets import SHELL_CSS, CONFIG_JS, APP_JS, API_JS, MOCK_OVERRIDES_JS, CHAT_JS, TEAM_JS
import ho_docs as D
import ho_status
import ho_delivery as DL, ho_phase1
sys.stdout.reconfigure(errors='replace')

OUT = os.path.dirname(HERE)   # _generator 의 상위 폴더 = 개발 폴더

with contextlib.redirect_stdout(io.StringIO()):
    g = runpy.run_path(os.path.join(HERE, 'design_mockup.py'))
S, CSS = g['S'], g['CSS']
KEY = {s['key']: s for s in SCREENS}
warnings = []

def board_of(num):
    sec = next(x for x in S if f'id="s{num}"' in x)
    i = sec.index('<div class="board">') + len('<div class="board">')
    j = sec.rindex('</div>\n</div></section>')
    return sec[i:j]

# ── 목업 div → 실제 입력칸 ──
def attr(s): return H.escape(s, quote=True)
def to_inputs(h):
    h = h.replace('<div class="inp pw">••••••••••<span>👁</span></div>',
                  '<label class="inp pw"><input class="bare" type="password" value="password1234" autocomplete="current-password"><span class="eye" title="비밀번호 보기">👁</span></label>')
    def inp(m):
        cls = m.group(1).split(); style = m.group(2) or ''; text = m.group(3)
        ph = 'ph' in cls; cls = ' '.join(['inp'] + [c for c in cls if c not in ('ph', 'focus')])
        st = f' style="{style}"' if style else ''
        if 'min-height' in style:
            return f'<textarea class="{cls}"{st} placeholder="{attr(text)}"></textarea>' if ph else f'<textarea class="{cls}"{st}>{text}</textarea>'
        return f'<input class="{cls}"{st} placeholder="{attr(text)}">' if ph else f'<input class="{cls}"{st} value="{attr(text)}">'
    h = re.sub(r'<div class="inp((?: [\w-]+)*)"(?: style="([^"]*)")?>([^<]*)</div>', inp, h)
    def ta(m):
        cls = m.group(1).split(); text = m.group(2); ph = 'ph' in cls
        c = ' '.join(['ta'] + [x for x in cls if x not in ('ph', 'focus')])
        return f'<textarea class="{c}" placeholder="{attr(text)}"></textarea>' if ph else f'<textarea class="{c}">{text}</textarea>'
    h = re.sub(r'<div class="ta((?: [\w-]+)*)">([^<]*)</div>', ta, h)
    h = re.sub(r'<div class="rin ph">([^<]*)</div>', lambda m: f'<input class="rin" placeholder="{attr(m.group(1))}">', h)
    h = re.sub(r'<div class="rin">([^<]*)</div>', lambda m: f'<input class="rin" value="{attr(m.group(1))}">', h)
    h = re.sub(r'<span class="mini">(\d+)</span>', r'<input class="mini" type="number" min="1" max="30" value="\1" aria-label="세션 시간(분)">', h)
    def codebox(m):
        inner = m.group(1)
        inner = re.sub(r'<b class="f">(.)</b>', r'<input class="f" maxlength="1" value="\1" aria-label="방 코드">', inner)
        inner = inner.replace('<b class="c">|</b>', '<input maxlength="1" data-autofocus aria-label="방 코드">').replace('<b></b>', '<input maxlength="1" aria-label="방 코드">')
        return f'<div class="codebox">{inner}</div>'
    h = re.sub(r'<div class="codebox">(.*?)</div>', codebox, h, flags=re.S)
    return h

# ── data-go / data-action 넣기 ──
def apply_rules(h, s):
    for needle, attrs, all_, label in s['rules']:
        pos, count, idx = 0, 0, 0
        while True:
            k = h.find(needle, pos)
            if k < 0: break
            a = attrs[idx] if isinstance(attrs, list) else attrs
            if a:
                end = h.index('>', k)
                ins = ''
                if a.get('action'): ins += f' data-action="{a["action"]}"'
                if a.get('go'): ins += f' data-go="../{a["go"]}/index.html"'
                h = h[:end] + ins + h[end:]
            count += 1; idx += 1; pos = k + len(needle) + 1
            if not all_ and not isinstance(attrs, list): break
            if isinstance(attrs, list) and idx >= len(attrs): break
        if count == 0: warnings.append(f"{s['key']}: 못 찾음 → {needle}")
    return h

# ── 보기 좋게 줄바꿈 (블록 태그만, 화면 모양은 그대로) ──
BLOCK = r'div|section|aside|table|tr|ul|ol|li|label'
def pretty(h, base=2):
    out, depth, stack, pos = [], base, [], 0
    for m in re.finditer(rf'<(/?)({BLOCK})\b[^>]*>', h):
        out.append(h[pos:m.start()]); pos = m.end(); tag = m.group(0)
        if not m.group(1):
            if stack: stack[-1] = True
            out.append('\n' + '  ' * depth + tag); stack.append(False); depth += 1
        else:
            depth -= 1; had = stack.pop() if stack else False
            out.append(('\n' + '  ' * depth + tag) if had else tag)
    out.append(h[pos:])
    return ''.join(out)

def build_board(s):
    num = s['num']
    b = board_of(num)
    if s.get('views'):                                    # 8-6: 세 가지 본문을 한 페이지에
        d6, d6b, d6c = g['DETAIL6'], g['DETAIL6B'], g['DETAIL6C']
        assert b.count(d6) == 1
        tag = '<div class="panel2 detail lift"'
        b = b.replace(d6, d6.replace(tag, tag + ' data-view="idea"', 1)
                      + d6b.replace(tag, tag + ' data-view="ai" hidden', 1)
                      + d6c.replace(tag, tag + ' data-view="thread" hidden', 1))
    if s.get('modals'):                                   # A2: 약관 팝업 두 개를 숨겨서 포함
        base = g['A2_BODY']
        for typ, title, sub, content in [('terms', '이용약관', '시행일 2026.09.01 · 예시 문구 (법률 검토 필요)', g['TERMS']),
                                         ('privacy', '개인정보 수집·이용 동의', '필수 · 예시 문구 (법률 검토 필요)', g['PRIVACY'])]:
            ov = g['modal'](title, sub, content, 0)[len(base):]
            ov = ov.replace('<div class="overlay">', f'<div class="overlay" data-modal="{typ}" hidden>', 1)
            ov = ov.replace('<div class="sbtrack"><i style="margin-top:0%"></i></div>', '<div class="legal">', 1)
            ov = ov.replace('</div>\n  <div class="mf">', '</div></div>\n  <div class="mf">', 1)
            b += ov
    for a, bb in BOARD_EDITS.get(num, []):
        assert a in b, (num, a[:40])
        b = b.replace(a, bb)
    if num == '7-1':
        b = b.replace('placeholder="최근 소식을 불러오는 중이에요"', 'placeholder="최근 소식을 불러오는 중이에요" disabled')
    if num == '7-5':
        b = b.replace('placeholder="인터뷰가 끝났어요"', 'placeholder="인터뷰가 끝났어요" disabled')
    b = to_inputs(b)
    b = apply_rules(b, s)
    return pretty(b)

PAGE = '''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{num} {title} · IdeationEngine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap">
<link rel="stylesheet" href="../../assets/css/tokens.css">
<link rel="stylesheet" href="../../assets/css/components.css">
<link rel="stylesheet" href="../../assets/css/shell.css">
</head>
<body data-screen="{key}"{stage}>
<!--
  ===== 화면 {num} · {title} =====
  보는 사람 : {who}
  설명·API  : README.md (같은 폴더)
  동작      : screen.js{chatnote}
  크기      : 1280×800 기준 보드를 창에 맞춰 확대/축소 (assets/js/app.js · fit)
-->
<main class="stage">
<div class="board">{board}
</div>
</main>

<script src="../../assets/js/config.js"></script>
<script src="../../assets/js/endpoints.js"></script>
<script src="../../assets/js/mock.js"></script>
<script src="../../assets/js/screens.js"></script>
<script src="../../assets/js/app.js"></script>
<script src="../../assets/js/api.js"></script>
{chat}{team}<script src="screen.js"></script>
</body>
</html>
'''

def w(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f: f.write(text)


# ── CSS ──
k = CSS.index(':root{'); depth = 0
for i in range(k, len(CSS)):
    if CSS[i] == '{': depth += 1
    elif CSS[i] == '}':
        depth -= 1
        if depth == 0: end = i + 1; break
tokens = CSS[k:end]
components = CSS[:k] + CSS[end:]
w(f'{OUT}/assets/css/tokens.css', '/* tokens.css — 색 · 글자 크기 · 폰트 · 그림자 변수 (docs/06-디자인-토큰.md) */\n' + tokens.replace(';', ';\n  ').replace('{', '{\n  ') + '\n')
w(f'{OUT}/assets/css/components.css', '/* components.css — 디자인 목업(v14)에서 그대로 옮긴 컴포넌트 스타일.\n   목업 문서용 클래스(.doc .memo .screen .shot .cap 등)도 섞여 있지만 화면에는 영향 없음. */\n'
  + re.sub(r'\n{2,}', '\n', components.strip()) + '\n')
w(f'{OUT}/assets/css/shell.css', SHELL_CSS + '\n/* 약관 팝업: 실제 스크롤 */\n.mb{overflow-y:auto;padding-bottom:18px}\n.mb::after,.mb .sbtrack{display:none}\n')

# ── JS ──
w(f'{OUT}/assets/js/config.js', CONFIG_JS)
w(f'{OUT}/assets/js/endpoints.js', '/* endpoints.js — API 목록 (자동 생성 · 문서: docs/03-API-전체-목록.md) */\nwindow.IE_ENDPOINTS = '
  + json.dumps({e['id']: {'method': e['method'], 'path': e['path'], 'auth': e['auth'], 'title': e['title']} for e in E}, ensure_ascii=False, indent=2) + ';\n')
mock_data = json.dumps({e['id']: e['res'] for e in E}, ensure_ascii=False, indent=2)
w(f'{OUT}/assets/js/mock.js', '''/* mock.js — 백엔드 없이 화면을 돌리기 위한 가짜 서버 (config.js useMock=true 일 때만 사용)
   · data: API id별 예시 응답 = 각 화면 README의 "응답" 예시와 같음
   · overrides: 입력에 따라 결과가 달라지는 API 흉내 */
window.IE_MOCK = (function () {
  const data = ''' + mock_data.replace('\n', '\n  ') + ''';
''' + MOCK_OVERRIDES_JS + '''
  const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));
  return {
    data,
    async handle(id, ctx) {
      await new Promise((r) => setTimeout(r, (window.IE_CONFIG || {}).mockDelay || 300));
      if (overrides[id]) { const r = overrides[id](ctx); if (r != null) return clone(r); }
      return clone(data[id]);
    },
    stream() { return { close() {} }; }   // 목업에서는 실시간 이벤트를 보내지 않음
  };
})();
''')
order = SCREENS
w(f'{OUT}/assets/js/screens.js', '/* screens.js — 화면 순서 (개발용 이동 바 · 화면 목록) */\nwindow.IE_SCREENS = '
  + json.dumps([{'key': s['key'], 'num': s['num'], 'title': s['title']} for s in order], ensure_ascii=False, indent=2) + ';\n')
w(f'{OUT}/assets/js/app.js', APP_JS)
w(f'{OUT}/assets/js/api.js', API_JS)
w(f'{OUT}/assets/js/icebreak-chat.js', CHAT_JS)
w(f'{OUT}/assets/js/team.js', TEAM_JS)

# ── 화면 ──
usage = {}
for s in SCREENS:
    for eid in s['load'] + [i for _, ids in s['acts'] for i in ids]:
        assert eid in ENDPOINTS, (s['key'], eid)
        usage.setdefault(eid, [])
        if s['key'] not in usage[eid]: usage[eid].append(s['key'])
    chat = '<script src="../../assets/js/icebreak-chat.js"></script>\n' if s.get('chat') else ''
    team = '<script src="../../assets/js/team.js"></script>\n' if s.get('team') else ''
    note = (' + ../../assets/js/icebreak-chat.js' if s.get('chat') else '') + (' + ../../assets/js/team.js' if s.get('team') else '')
    page = PAGE.format(stage=(' data-stage="' + STAGE_OF[s['key']] + '"' if s['key'] in STAGE_OF else ''), num=s['num'], title=H.escape(s['title']), key=s['key'], who=s['who'], board=build_board(s), chat=chat, team=team,
                       chatnote=note)
    w(f"{OUT}/screens/{s['key']}/index.html", page)
    w(f"{OUT}/screens/{s['key']}/screen.js", s['js'])
    w(f"{OUT}/screens/{s['key']}/README.md", D.screen_readme(s, KEY))

# ── 문서 ──
w(f'{OUT}/docs/00-백엔드-1차-전달-화면1-1-1-2.md', D.first_delivery(KEY))
assert DL.render(ho_phase1.SPEC) == D.first_delivery(KEY), '차수 전달 문서 모양(ho_delivery.render)이 1차 문서와 달라졌어요'
assert not DL.check(ho_phase1.SPEC, OUT, '1차'), DL.check(ho_phase1.SPEC, OUT, '1차')
delivery_lines, delivery_problems = DL.build_all(OUT)   # 2차~6차 (READY + 검사 통과만)
DELIVERED = DL.ready_docs(OUT)                           # {차수: (파일, 시나리오 수)}
w(f'{OUT}/팀공유-진행현황.md', ho_status.status_md(SCREENS, KEY, DELIVERED))
w(f'{OUT}/docs/01-백엔드-한눈에-보기.md', D.OVERVIEW)
w(f'{OUT}/docs/02-API-공통-규칙.md', D.rules_md())
w(f'{OUT}/docs/03-API-전체-목록.md', D.api_list_md(usage, KEY))
w(f'{OUT}/docs/04-데이터-모델.md', D.DATA_MODEL)
w(f'{OUT}/docs/05-AI-작업-목록.md', D.AI_JOBS)
w(f'{OUT}/docs/06-디자인-토큰.md', D.TOKENS_MD)

deliv_tree = '\n'.join(f'   ├─ {f}  ★ 백엔드 {n} 전달 (만들 API · 완료 기준 {c}개)' for n, (f, c) in DELIVERED.items())
deliv_read = ' · '.join(f'[{n}](docs/{f})' for n, (f, c) in DELIVERED.items())
deliv_links = ''.join(f'<a href="docs/{f}">백엔드 {n} 전달</a>' for n, (f, c) in DELIVERED.items())
# ── 배포 (Vercel) ──
# /s/{방 코드} 와 /oauth/callback 은 "작은 이동 페이지"를 거쳐 실제 화면으로 보낸다.
#  · 리라이트만 쓰면 브라우저 주소가 /s/7K2X9M 그대로라서 화면이 ?code= 를 못 읽고,
#    화면 안의 상대 경로(screen.js 등)도 /s/screen.js 로 잘못 요청된다.
GO_PAGE = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>{title} · IdeationEngine</title>
<meta name="robots" content="noindex">
<style>body{{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;font:14px/1.6 "Noto Sans KR",sans-serif;color:#626280;background:#FAFAFE}}</style>
<script>
  // {why}
  (function () {{
    {js}
  }})();
</script>
</head>
<body><p>{text} <a id="fallback" href="{fallback}">이동하지 않으면 눌러주세요</a></p></body>
</html>
"""
w(f'{OUT}/s/index.html', GO_PAGE.format(
    title='방 코드로 입장', why='초대 링크 /s/{방 코드} → 방 코드 입장 화면(2)으로',
    js="var m = location.pathname.match(/\\/s\\/([0-9A-Za-z]{6})/);\n    var to = '/screens/02-join-code/index.html' + (m ? '?code=' + m[1].toUpperCase() : '');\n    location.replace(to);",
    text='방으로 들어가는 중이에요…', fallback='/screens/02-join-code/index.html'))
w(f'{OUT}/oauth/callback/index.html', GO_PAGE.format(
    title='소셜 로그인 처리', why='소셜 로그인 redirect URI → A6 콜백 화면으로 (code · state 그대로)',
    js="location.replace('/screens/A6-oauth-callback/index.html' + location.search);",
    text='로그인 처리 중이에요…', fallback='/screens/A6-oauth-callback/index.html'))
w(f'{OUT}/vercel.json', json.dumps({
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "rewrites": [{"source": "/s/:code", "destination": "/s/index.html"}],
    "headers": [{"source": "/(.*)", "headers": [{"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
                                                {"key": "X-Content-Type-Options", "value": "nosniff"},
                                                {"key": "X-Robots-Tag", "value": "noindex"}]}],
}, ensure_ascii=False, indent=2) + '\n')
w(f'{OUT}/.vercelignore', '# 배포에 올리지 않는 것 (화면과 상관없는 파일 · 계정 정보)\n_generator/\n_tools/\n_작업메모/\n_미리보기/\ndesign/\n__pycache__/\n.vercel/\n.env*\n')
w(f'{OUT}/docs/07-배포-Vercel.md', D.DEPLOY_MD)

rows = '\n'.join(f"| {s['num']} | [{s['title']}](screens/{s['key']}/README.md) | `screens/{s['key']}/` | {s['who']} | {len(set(s['load'] + [i for _, ids in s['acts'] for i in ids]))} |" for s in SCREENS)
README = f'''# IdeationEngine 개발 핸드오프 · 화면 1 ~ 9-5

디자인 목업 **v14** 기준으로 만든 **실제로 동작하는 HTML·CSS·JS 화면 {len(SCREENS)}개**와 **화면별 API 명세·백엔드 설명**이에요.
(투표는 **1인 2표** · 9 파트 나누기 ~ 보고서 포함)

## 정해진 규칙 (2026-09-18)

- **게스트 입장 없음** — 회원가입 → 로그인 → 프로필 작성까지 끝나야 세션을 만들거나 방에 들어갈 수 있어요.
- **방 코드 = 대문자·숫자 6자리**, **초대 링크 = `https://ideationengine.app/s/{{방 코드}}`** (별도 초대 토큰 없음)
- **로그인 유지** — 액세스 토큰(약 1시간) + 리프레시 쿠키(로그인 상태 유지 체크 시 30일), `POST /auth/refresh`
- **재접속 허용** — 이미 들어갔던 방은 코드로 다시 들어오거나 랜딩의 "세션으로 돌아가기"로 지금 단계 화면에 바로 복귀

## 5분 안에 보기

1. **`index.html`을 브라우저로 열기** → 화면 목록에서 아무 화면이나 누르기
2. 화면 아래 검은 바의 **◀ ▶** 로 흐름 순서대로 이동 (주소 뒤에 `?dev=0`을 붙이면 숨김)
3. 버튼·입력은 실제로 동작해요. 지금은 **MOCK(가짜 서버)** 로 응답하고, 백엔드가 준비되면 `assets/js/config.js`에서 `useMock: false`로 바꾸면 돼요.

> 파일을 더블클릭해서 열어도 되지만, VS Code **Live Server** 같은 로컬 서버로 열면 클립보드 복사 등 모든 기능이 정상 동작해요.

## 폴더 구조

```
IdeationEngine-개발핸드오프/
├─ 팀공유-진행현황.md         ★ 무엇을 했고 · 어디까지 됐고 · 무엇을 해야 하는지 (팀원·Claude는 여기부터)
├─ index.html                 화면 목록 (여기서 시작)
├─ README.md                  지금 이 문서
├─ assets/
│  ├─ css/
│  │  ├─ tokens.css           색·글자 크기 변수
│  │  ├─ components.css       디자인 목업의 컴포넌트 스타일 (그대로)
│  │  └─ shell.css            실제 페이지용 추가 (입력칸·화면 맞춤·토스트·개발용 바)
│  └─ js/
│     ├─ config.js            ★ 환경 설정 (useMock, API 주소)
│     ├─ app.js               공통 동작 (이동·액션·칩·토글·레일 접기·타이머…)
│     ├─ api.js               ★ 백엔드 호출: api.call('id', params, body) · 실시간 realtime.connect
│     ├─ endpoints.js         API 목록 (자동 생성)
│     ├─ mock.js              가짜 서버 응답 (자동 생성)
│     ├─ icebreak-chat.js     7-1~7-5 채팅 공통
│     └─ screens.js           화면 순서
├─ screens/
│  └─ <번호-이름>/
│     ├─ index.html           화면 (마크업)
│     ├─ screen.js            이 화면만의 동작
│     └─ README.md            ★ 화면 설명 · 누르면 어떻게 되나 · 남은 일 · 백엔드가 할 일 · API 요청/응답 예시
├─ design/                    디자인 목업 원본 (v14)
├─ _generator/                ★ 이 폴더 전체를 만드는 스크립트 — 수정은 여기서 하고 `python _generator/handoff.py`
├─ _tools/test-backend-phase1.py  1차 범위(계정·입장) 테스트용 가짜 백엔드
├─ _tools/test-backend-team.py    7차(9번 파트 나누기 ~ 보고서) 테스트용 가짜 백엔드
└─ docs/
{deliv_tree}
   ├─ 00-핸드오프-README.md    README 사본 (배포한 사이트에서도 열 수 있게)
   ├─ 01-백엔드-한눈에-보기.md  ★ 백엔드 처음 보는 사람은 여기부터
   ├─ 02-API-공통-규칙.md      인증 · 에러 형식 · 실시간 이벤트
   ├─ 03-API-전체-목록.md      API {len(E)}개 표
   ├─ 04-데이터-모델.md        DB 표 제안
   ├─ 05-AI-작업-목록.md       AI·검색 작업
   ├─ 06-디자인-토큰.md        색·글자·컴포넌트 클래스
   └─ 07-배포-Vercel.md       배포 · 주소 규칙(/s/방코드 · /oauth/callback) · 백엔드 연결
```

## 화면 목록

| 번호 | 화면 (README) | 폴더 | 보는 사람 | API 수 |
|---|---|---|---|---|
{rows}

## 프론트엔드 개발자에게

- **화면 = `screens/<화면>/index.html`의 `.board` 안쪽.** React/Vue 등으로 옮길 때 이 마크업을 컴포넌트로 옮기고, 클래스 이름은 그대로 두고 `tokens.css` → `components.css` → `shell.css` 순서로 전역 import 하면 모양이 똑같이 나와요.
- **크기**: 모든 화면은 1280×800 기준으로 디자인됐고, 지금은 창 크기에 맞춰 통째로 확대/축소(zoom)해요. **반응형·모바일 레이아웃은 남은 일**이에요.
- **이동**: 버튼에 `data-go="../화면/index.html"` · **동작**: `data-action="이름"` + 화면의 `screen.js`에서 `App.action('이름', async (el) => {{ … }})`. 동작이 `false`를 돌려주면 이동하지 않아요. 로딩 표시와 에러 토스트는 공통으로 처리돼요.
- **API**: `await api.call('comment.create', {{ ideaId }}, {{ concern, praise }})` — id 목록은 `docs/03-API-전체-목록.md`. 경로의 `{{sessionId}}`는 자동으로 채워져요.
- **목업 모드 규칙**: `useMock: true`일 때는 HTML에 들어 있는 예시 내용을 그대로 보여주고, `false`일 때만 각 `screen.js`의 `load()`가 서버 데이터로 다시 그려요. 그래서 목업 모드에서는 디자인과 픽셀이 같아요.
- **실시간**: `realtime.connect(App.sessionId(), ev => …)` — 진행자가 단계를 넘기면 `stage.changed`를 받아 다음 화면으로 이동하는 코드가 들어 있어요.
- **공통으로 남은 일**
  - ⬜ 반응형·모바일, 다크 모드
  - ⬜ 로딩(스켈레톤)·빈 화면·에러 화면 디자인 적용 (지금은 버튼 흐림 + 토스트)
  - ⬜ 토큰 갱신(리프레시) · 로그인 후 원래 화면으로 돌아가기
  - ⬜ 세션 화면 공통: 들어올 때 `session.get`으로 단계 확인 → 다른 단계면 그 화면으로 보내기, 상단 진행률·타이머를 서버 값으로
  - ⬜ 각 README의 "남은 일" 목록

## 백엔드 개발자에게 — 읽는 순서

0. **차수별 작업 범위** (만들 API · 정해진 규칙 · 완료 기준): {deliv_read} — 차수 순서대로 만들어요
1. [docs/01-백엔드-한눈에-보기.md](docs/01-백엔드-한눈에-보기.md) — 부품 · 권한 · 세션 단계 · **익명 규칙** · 개발 순서
2. [docs/02-API-공통-규칙.md](docs/02-API-공통-규칙.md) — 인증 · 에러 형식 · 실시간 이벤트
3. 만들 화면의 `screens/<화면>/README.md` — "백엔드가 해야 할 일"과 요청/응답 예시
4. [04 데이터 모델](docs/04-데이터-모델.md) · [05 AI 작업](docs/05-AI-작업-목록.md) · [03 전체 목록](docs/03-API-전체-목록.md)

응답 예시는 `assets/js/mock.js`와 **같은 원본**이라, 예시대로 JSON을 돌려주면 프론트가 바로 붙어요.

## 수정하는 법 (중요)

`screens/` `assets/` `docs/` `README.md` `index.html` `design/` `팀공유-진행현황.md` 는 **자동으로 만들어진 파일**이에요. 직접 고치면 다음 생성 때 덮어써져요.
수정은 `_generator/` 안의 원본에서 하고 `python _generator/handoff.py`를 실행하세요 (어떤 파일을 고치면 되는지는 `팀공유-진행현황.md` 6장).

## 개발하면서 디자인·기획에 확인이 필요한 것

- 7-7(발산 시작 · 재료)과 8-1(내 아이디어 정하기)의 입력칸 역할이 겹침 — 7-7을 재료 보기 전용으로 둘지
- 참가자가 보는 8-7(결과 보기 전용) · 투표를 마친 뒤 기다리는 화면 · 검증이 아직 안 끝났을 때 화면
- 세션 시간이 끝났을 때 동작(자동 종료 vs 진행자에게 알림)
- 회원 탈퇴 시 다른 사람과 함께한 세션의 익명 댓글·아이디어 처리 (임시 규칙: 남기고 "탈퇴한 사용자")
- Pro 가격 · 결제 대행사 · 약관 법률 검토
- 7-6 진행자 "이전 단계" 버튼의 뜻 (지금 규칙: 아이스브레이킹 → 대기실은 안 돼서 409)
- 8-1 ~ 8-6에서 진행자가 단계를 넘기는 버튼 (지금은 7-6 "발산 시작"만 있음)
- 소셜 로그인 콜백 화면 · 소셜로 처음 가입할 때 약관 동의 화면
- 비밀번호 재설정 · 이메일 변경 확인 메일의 링크를 연 뒤 화면
- **팀장을 누가 정하나** — 지금은 주제 확정(8-7) 때 진행자가 그대로 팀장 (topic.confirm의 leaderParticipantId는 준비됨)
- 9-1의 진행자용 "추가 질문 시작 →" 버튼 · 9-3의 파트 표시 모드 · 9-4의 담당 고르는 목록 — 디자인 없이 임시로 넣음
- 보고서를 로그인 없이 볼 수 있는 공개 링크를 만들지
'''
w(f'{OUT}/README.md', README)
# Vercel은 README.md를 배포에서 기본으로 빼기 때문에, 배포한 사이트에서도 열 수 있게 같은 내용을 docs 안에 한 벌 더 둔다.
w(f'{OUT}/docs/00-핸드오프-README.md', README)

cards = ''
for gid, gtitle, gdesc in GROUPS:
    items = ''.join(f'''<div class="it"><span class="n">{s['num']}</span><a class="t" href="screens/{s['key']}/index.html">{H.escape(s['title'])}</a><span class="w">{H.escape(s['who'])}</span><span class="d">{H.escape(s['summary'])}</span><span class="l"><a href="screens/{s['key']}/index.html">화면 열기 →</a><a class="r" href="screens/{s['key']}/README.md">설명 · API</a></span></div>''' for s in SCREENS if s['group'] == gid)
    cards += f'<section><h2>{gtitle}</h2><p>{gdesc}</p><div class="grid">{items}</div></section>'
INDEX = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IdeationEngine 화면 목록</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap">
<link rel="stylesheet" href="assets/css/tokens.css">
<style>
body{{margin:0;background:var(--app-bg);color:var(--ink);font-family:var(--sans);font-size:14px;line-height:1.5}}
.wrap{{max-width:1180px;margin:0 auto;padding:48px 24px 80px}}
.top{{display:flex;align-items:center;gap:14px}}
.top h1{{margin:0;font-size:28px;font-weight:900;letter-spacing:-.02em}}
.logo{{width:40px;height:40px;border-radius:10px;background:var(--key);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;letter-spacing:-.04em}}
.sub{{color:var(--muted);margin:10px 0 0}}
.links{{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}}
.links a{{font-size:13px;color:var(--ink);text-decoration:none;border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:6px 12px}}
.links a.k{{background:var(--key);border-color:var(--key);color:#fff}}
section{{margin-top:40px}} h2{{margin:0;font-size:18px}} section>p{{margin:2px 0 14px;color:var(--muted);font-size:13px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}}
.it{{display:flex;flex-direction:column;gap:4px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;color:inherit;text-decoration:none;transition:box-shadow .15s,border-color .15s}}
.it:hover{{border-color:var(--key-200);box-shadow:0 8px 24px rgba(30,27,75,.08)}}
.n{{font-family:var(--mono);font-size:11px;color:#fff;background:var(--key);border-radius:6px;padding:1px 7px;align-self:flex-start}}
.t{{font-weight:700}} .w{{font-size:12px;color:var(--key-700)}} .d{{font-size:12px;color:var(--muted)}}
.l{{margin-top:auto;padding-top:8px;display:flex;justify-content:space-between;font-size:12px;color:var(--key)}}
.t{{color:inherit;text-decoration:none}}
.l a{{color:var(--key);text-decoration:none}} .l a.r{{color:var(--muted)}}
.mock{{margin-top:18px;font-size:12px;color:var(--muted);background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:10px 12px}}
code{{font-family:var(--mono);font-size:12px}}
</style></head>
<body><div class="wrap">
<div class="top"><span class="logo">IE</span><h1>IdeationEngine 화면 목록</h1></div>
<p class="sub">디자인 목업 v14 기준 · 화면 {len(SCREENS)}개 · API {len(E)}개</p>
<div class="links"><a class="k" href="docs/00-핸드오프-README.md">README (처음 읽기)</a><a href="팀공유-진행현황.md">진행 현황</a><a href="docs/00-백엔드-전달-총정리.md">백엔드 전달 총정리</a><a href="docs/01-백엔드-한눈에-보기.md">백엔드 한눈에 보기</a><a href="docs/02-API-공통-규칙.md">API 공통 규칙</a><a href="docs/03-API-전체-목록.md">API 전체 목록</a><a href="docs/04-데이터-모델.md">데이터 모델</a><a href="docs/05-AI-작업-목록.md">AI 작업</a><a href="docs/06-디자인-토큰.md">디자인 토큰</a><a href="docs/07-배포-Vercel.md">배포(Vercel)</a></div>
<div class="mock">지금은 <code>assets/js/config.js</code>의 <code>useMock: true</code> — 버튼을 누르면 가짜 서버가 응답해요. 화면 아래 검은 바로 순서대로 이동할 수 있어요.</div>
{cards}
</div></body></html>
'''
w(f'{OUT}/index.html', INDEX)

print('screens', len(SCREENS), 'endpoints', len(E))
print('\n'.join(warnings) if warnings else 'rules ok')
print('\n'.join(delivery_lines))
if delivery_problems:
    print('전달 문서 검사 문제:\n' + '\n'.join('  - ' + p for p in delivery_problems))
