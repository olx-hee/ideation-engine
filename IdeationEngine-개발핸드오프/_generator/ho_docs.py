import json
from ho_api import ENDPOINTS, EVENTS, ERRORS, AUTH_LABEL, E

BASE = '/api/v1'

def js(v):
    return json.dumps(v, ensure_ascii=False, indent=2)

def endpoint_md(e, level='###'):
    out = [f"{level} `{e['method']} {BASE}{e['path']}` — {e['title']}", '',
           f"- **API id**: `{e['id']}` (프론트: `api.call('{e['id']}', …)`)",
           f"- **누가 부를 수 있나**: {AUTH_LABEL[e['auth']]}",
           f"- **하는 일**: {e['desc']}"]
    if e['query']:
        out += ['', '**쿼리 파라미터**', '', '| 이름 | 값 |', '|---|---|'] + [f'| `{k}` | {v} |' for k, v in e['query'].items()]
    if e['req'] is not None:
        out += ['', '**요청 본문**', '']
        out += ['```', e['req'], '```'] if isinstance(e['req'], str) else ['```json', js(e['req']), '```']
    out += ['', f"**응답** `{e['status']}`", '']
    out += ['```json', js(e['res']), '```'] if e['res'] is not None else ['(본문 없음)']
    if e['errors']:
        out += ['', '**에러**', '', '| code | HTTP | 언제 |', '|---|---|---|'] + [f'| `{c}` | {s} | {w} |' for c, s, w in e['errors']]
    if e['notes']:
        out += ['', '**백엔드 메모**', ''] + [f'- {n}' for n in e['notes']]
    return '\n'.join(out) + '\n'

def screen_readme(s, key_to_screen):
    lines = [f"# {s['num']} · {s['title']}", '',
             f"> **보는 사람**: {s['who']}  ",
             f"> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)"
             + (' · [../../assets/js/icebreak-chat.js](../../assets/js/icebreak-chat.js) (채팅 공통)' if s.get('chat') else ''), '',
             '## 이 화면은', '', s['summary'], '']
    nav = [(r[3], r[1]) for r in s['rules']]
    if nav:
        lines += ['## 누르면 어떻게 되나', '', '| 누르는 것 | 동작 | 이동 |', '|---|---|---|']
        for label, a in nav:
            items = a if isinstance(a, list) else [a]
            act = ' / '.join(f"`{i['action']}`" for i in items if i.get('action')) or '—'
            go = items[0].get('go')
            go_txt = f"[{key_to_screen[go]['num']} {key_to_screen[go]['title']}](../{go}/README.md)" if go else '—'
            lines.append(f'| {label} | {act} | {go_txt} |')
        lines.append('')
    lines += ['## 프론트엔드', '', '**이미 구현한 것**', ''] + [f'- ✅ {x}' for x in s['front']] + ['']
    if s['todo']:
        lines += ['**남은 일**', ''] + [f'- ⬜ {x}' for x in s['todo']] + ['']
    lines += ['## 백엔드가 해야 할 일 (쉽게)', ''] + [f'- {b}' for b in s['backend']] + ['']
    lines += ['## 이 화면이 쓰는 API', '', '| 언제 | API | 요약 |', '|---|---|---|']
    for eid in s['load']:
        e = ENDPOINTS[eid]; lines.append(f"| 화면 열 때 | `{e['method']} {e['path']}` | {e['title']} |")
    for label, ids in s['acts']:
        for eid in ids:
            e = ENDPOINTS[eid]; lines.append(f"| {label} | `{e['method']} {e['path']}` | {e['title']} |")
    if not s['load'] and not s['acts']:
        lines.append('| — | 없음 | 이 화면은 서버를 부르지 않아요 |')
    lines.append('')
    ev = s.get('events') or []
    if ev:
        lines += ['## 실시간 이벤트 (웹소켓으로 받는 것)', '', '| 이벤트 | 받으면 |', '|---|---|']
        for name in ev:
            row = next(x for x in EVENTS if x[0] == name); lines.append(f'| `{name}` | {row[3]} |')
        lines += ['', '형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.', '']
    used = []
    for eid in s['load'] + [i for _, ids in s['acts'] for i in ids]:
        if eid not in used: used.append(eid)
    if used:
        lines += ['## API 상세', '', f'모든 경로 앞에 `{BASE}`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).', '']
        for eid in used:
            lines.append(endpoint_md(ENDPOINTS[eid]))
    return '\n'.join(lines)

def api_list_md(usage, key_to_screen):
    groups = [('계정 · 인증', ('auth.', 'legal.')), ('프로필', ('meta.', 'profile.', 'guestProfile.')),
              ('지난 세션 · 설정 · 요금제', ('history.', 'settings.', 'account.', 'billing.')),
              ('세션 · 대기실', ('session.',)), ('7 아이스브레이킹', ('ice.',)),
              ('8 발산', ('idea.', 'comment.', 'review.', 'vote.', 'topic.')),
              ('9 파트 나누기 · 보고서', ('team.', 'report.'))]
    out = ['# API 전체 목록', '', f'기준 주소 `{BASE}` · 총 {len(E)}개 · 자세한 요청/응답 예시는 각 화면 README의 "API 상세"에 있어요.', '',
           '> 이 목록과 `assets/js/endpoints.js`, `assets/js/mock.js`는 같은 원본에서 만들어졌어요. 경로를 바꾸면 세 곳을 함께 바꿔 주세요.', '']
    for title, prefixes in groups:
        out += [f'## {title}', '', '| 메서드 | 경로 | 권한 | 하는 일 | 쓰는 화면 |', '|---|---|---|---|---|']
        for e in E:
            if e['id'].startswith(prefixes):
                scr = ', '.join(f"[{key_to_screen[k]['num']}](../screens/{k}/README.md)" for k in usage.get(e['id'], []))
                out.append(f"| `{e['method']}` | `{e['path']}` | {AUTH_LABEL[e['auth']]} | {e['title']} | {scr or '—'} |")
        out.append('')
    out += ['## 실시간', '', f'| `WS` | `{BASE}/sessions/{{sessionId}}/stream?token=…` | 세션 참가자 | 세션 이벤트 받기 | 5 · 6 · 7 · 8 전체 |', '']
    return '\n'.join(out)

OVERVIEW = r'''# 백엔드 한눈에 보기

처음 보는 사람이 "무엇을 만들어야 하는지"를 5분 안에 알 수 있게 정리했어요.

## 1. 이 서비스는 무엇을 하나

대학생 해커톤·공모전 팀이 **첫 회의에서 주제를 정하도록** 돕는 웹앱이에요. 진행자가 방을 만들면 팀원이 코드로 들어오고, 한 세션 안에서 아래 순서로 진행돼요.

```
세션 만들기 → 대기실 → 7 아이스브레이킹(AI 1:1 인터뷰) → 8 아이디어 발산
                                                  ├ 8-1/8-2 각자 아이디어 1·2·3순위 (AI 추천 가능)
                                                  ├ 8-3 익명 순위표
                                                  ├ 8-4 익명 댓글 (아쉬운 점 필수 · 좋은 점 2개)
                                                  ├ 8-5 AI 검증 · 현실성 (등급 3단계)
                                                  ├ 8-6 투표 (1인 2표) + AI가 모은 아이디어 + 숨은 공통점
                                                  └ 8-7 결과 · 아이디어 주인 공개 · 주제 확정
                                              → 9 파트 나누기 · 보고서
                                                  ├ 9-1 파트와 후보 (프로필 스킬로)
                                                  ├ 9-2 후보가 겹친 사람만 추가 질문 2개
                                                  ├ 9-3 배치 초안 (분량 맞추기)
                                                  ├ 9-4 팀장이 고치고 확정
                                                  └ 9-5 A4 2쪽 보고서
```

## 2. 서버에 필요한 부품

```
 [브라우저]  ──REST(JSON)──▶  [API 서버] ──▶ [DB: PostgreSQL 등]
     ▲                          │   │
     └──WebSocket(실시간)───────┘   ├──▶ [작업 큐 + AI 작업자] ──▶ LLM API / 검색 API
                                    ├──▶ [Redis: 실시간 전달·잠금·캐시]
                                    └──▶ [파일 저장소: 프로필 사진] · [메일 발송] · [결제 PG 웹훅]
```

| 부품 | 왜 필요한가 |
|---|---|
| API 서버 | 화면이 부르는 REST API ([전체 목록](03-API-전체-목록.md)) |
| DB | 계정·세션·답변·아이디어·댓글·투표 저장 ([데이터 모델](04-데이터-모델.md)) |
| 실시간(WebSocket) | 대기실 입장, 진행자가 단계를 넘기면 모두의 화면이 같이 이동, 진행 인원 표시 |
| 작업 큐 + AI 작업자 | 최근 소식 검색·요약, 재료 묶기, AI 검증처럼 **몇 초~몇십 초 걸리는 일**은 요청 안에서 기다리지 말고 뒤에서 돌리고, 끝나면 이벤트로 알림 ([AI 작업 목록](05-AI-작업-목록.md)) |
| Redis | 여러 서버에 이벤트 전달(pub/sub), 중복 클릭 잠금, 방 코드 조회 캐시 |
| 파일 저장소 | 프로필 사진 |
| 메일 | 비밀번호 재설정, 이메일 변경 확인 |
| 결제 PG | Pro 결제(가격·PG 미정) — 결제 완료는 **웹훅으로만** 확정 |

언어·프레임워크는 팀이 편한 것으로(예: Node.js + NestJS, Spring Boot, FastAPI). 프론트는 JSON 모양만 맞으면 돼요.

## 3. 사람의 종류와 권한

| 종류 | 어떻게 되나 | 할 수 있는 것 |
|---|---|---|
| 회원 | 이메일/소셜 로그인 → **액세스 토큰** + **리프레시 쿠키** | 프로필·기록·설정 · (프로필 완성 후) 세션 만들기·입장 |
| 진행자 (host) | 세션을 만든 회원 | 참가자 내보내기, 시작, **단계 넘기기**, 먼저 보기 표시, 재투표, 주제 확정 |
| 참가자 (participant) | 방 코드로 들어온 회원 | 인터뷰·아이디어·댓글·투표 |
| 팀장 (leader) | 주제 확정(8-7) 때 정해지는 참가자 1명 (기본값 = 진행자) | 파트 배치 고치기·확정(9-4), 확정 뒤 보고서의 담당 고치기 |

`진행자만` API를 참가자가 부르면 `403 FORBIDDEN`, `팀장만` API를 다른 사람이 부르면 `403 NOT_LEADER`.

**게스트는 없어요.** 세션을 만들거나 방에 들어가려면 ① 회원가입 ② 로그인 ③ 프로필 작성(닉네임·맡고 싶은 역할·스킬 1개 이상)이 모두 끝나야 해요. 프로필이 없으면 `409 PROFILE_REQUIRED`.

## 3-1. 로그인 유지

| 토큰 | 어디에 | 수명 |
|---|---|---|
| 액세스 토큰 | 응답 본문 → 프론트가 저장 후 `Authorization: Bearer` | 약 1시간 |
| 리프레시 토큰 | `Set-Cookie` (HttpOnly · Secure · SameSite=Lax · Path=/api/v1/auth) | "로그인 상태 유지" 체크 시 30일, 아니면 브라우저를 닫을 때까지 |

- 액세스 토큰이 만료돼 **401**이 오면 프론트가 `POST /auth/refresh`를 한 번 부르고, 성공하면 원래 요청을 다시 보내요. 실패하면 로그인 화면.
- 리프레시 토큰은 **쓸 때마다 새것으로 교체(회전)**. 이미 쓴 토큰이 다시 오면 탈취로 보고 그 사용자의 리프레시 토큰을 모두 무효화.
- 로그아웃 · 비밀번호 변경 · 탈퇴 시 리프레시 토큰 무효화.

## 3-2. 방 코드 · 초대 링크 · 재접속

- 방 코드: **대문자·숫자 6자리** (0 O 1 I L 제외), 끝나지 않은 방끼리 중복 없음, 찾을 때 대소문자 무시.
- 초대 링크: **`https://ideationengine.app/s/{방 코드}`** — 별도 초대 토큰 없음. 웹 서버에서 `/s/{코드}` → `/screens/02-join-code/index.html?code={코드}` 로 연결.
- **재접속 허용**: 이미 참가자인 사람이 다시 들어오면(코드 재입력 · 새로고침 · 랜딩의 "세션으로 돌아가기") 새로 등록하지 않고 **현재 단계**를 돌려줘서 그 화면으로 바로 보내요.

| 상황 | 방 찾기 `GET /sessions/lookup` | 입장 `POST /sessions/{id}/join` |
|---|---|---|
| 처음 · 대기실 · 자리 있음 | 200 `alreadyJoined:false` | 200 `rejoined:false` · participant.joined |
| 처음 · 인원 가득 | 409 SESSION_FULL | 409 SESSION_FULL |
| 처음 · 이미 시작 | 409 SESSION_STARTED | 409 SESSION_STARTED |
| 이미 참가자 (진행자 포함) | 200 `alreadyJoined:true` (가득/시작이어도 OK) | 200 `rejoined:true` + 현재 stage · participant.online |
| 내보내진 사람 | 403 KICKED | 403 KICKED |
| 프로필 없음 | 200 | 409 PROFILE_REQUIRED |
| 끝난 방 · 없는 코드 | 404 SESSION_NOT_FOUND | 404 |
| 로그인 안 함 | 401 | 401 |

- 세션 화면들은 열릴 때 `GET /sessions/{id}`로 서버 단계를 확인하고, 다른 단계면 맞는 화면으로 이동해요(새로고침 복구).
- 랜딩(1-1)은 `GET /me`의 `activeSession`으로 "세션으로 돌아가기"를 보여줘요.

## 4. 세션 단계 (서버가 기억하는 "지금 어디")

모든 세션 화면은 `GET /sessions/{id}` 의 `stage`를 보고 그려요. 새로고침해도 이 값으로 원래 화면을 복구해요.

| stage.id | 화면 | 넘기는 사람 | 상단 전체 진행률(%) |
|---|---|---|---|
| `lobby` | 5 · 6 대기실 | 진행자 "세션 시작" | 0 |
| `icebreak` | 7-1~7-5 (모두 — 진행자도 인터뷰) → 진행자는 끝난 뒤 7-6 | 진행자 "발산 시작" | 3 (화면 위쪽은 질문마다 3 → 20 고정값) |
| `diverge.write` | 7-7 재료 · 8-1 · 8-2 | 진행자 | 25 |
| `diverge.board` | 8-3 익명 순위표 | 진행자 | 30 |
| `diverge.comment` | 8-4 익명 댓글 | 진행자 | 35 |
| `diverge.review` | 8-5 AI 검증 (AI 작업 끝나야 열림) | 진행자 | 45 |
| `diverge.vote` | 8-6 투표 → 마친 사람은 8-6w 대기 | 모두 투표 마치면 자동 / 진행자 | 55 |
| `diverge.result` | 8-7 결과 · 주제 확정 (참가자는 보기 전용) | 진행자 "주제 확정" | 65 |
| `team.split` | 9-1 파트와 후보 (AI 파트 나누기가 끝나야 채워짐) | 진행자 "추가 질문 시작" | 70 |
| `team.questions` | 9-2 겹친 후보만 질문 (나머지는 9-1에서 기다림) | 모두 답하거나 **5분**이 지나면 **서버가 자동** | 75 |
| `team.assign` | 9-3 배치 초안 (팀장은 9-4) | **팀장 "확정"** (진행자 아님) | 80 (팀장 화면 90) |
| `report` | 9-5 A4 보고서 | 끝 | 100 |

- 진행률 숫자는 디자인 목업 값이에요. 서버에서 한 곳에 표로 두고 내려주세요.
- 단계를 넘길 때 요청에 `from`(내가 보고 있던 단계)을 넣어서, 진행자가 두 번 누르거나 늦게 누른 요청은 `409 STAGE_MISMATCH`로 무시해요.
- **제출 단계는 전원이 내야 넘어가요** — `diverge.write`(아이디어)와 `diverge.comment`(댓글)는 아직 안 낸 사람이 있으면 `409 NOT_ALL_SUBMITTED`. 연결이 끊긴 사람 때문에 막히면 진행자가 `force: true`로 넘길 수 있어요(그때만 빈 줄이 생겨요).
- 대기실은 "세션 시작"으로만, 투표 결과는 "주제 확정"으로만 넘어가요. 그 밖의 넘기기·되돌리기가 안 되는 곳은 `409 STAGE_LOCKED` (되돌릴 수 있는 곳은 `POST /sessions/{id}/stage/prev` 명세 참고).
- 인원 수(`memberCount`)는 **진행자 포함 · 내보낸 사람 제외 · 접속 여부와 상관없이** 세요. 제출·댓글·투표 진행 인원도 같은 기준이에요.
- 단계가 바뀌면 `stage.changed` 이벤트를 **세션 전원**에게 보내요.
- **타이머**: 세션 시작 때 `endsAt`을 정하고 서버 시각 기준으로 내려줘요. **시간이 끝나도 자동으로 끊지 않아요** — 화면이 00:00이 되면 안내 창(T1)을 띄우고, 진행자가 `PUT /sessions/{id}/timer`(5분 단위 연장, 무료는 총 30분까지)로 늘리거나 그대로 진행해요.

## 5. 익명 규칙 ⚠️ 가장 중요

이 서비스의 핵심 약속이에요. **API 응답에 넣으면 안 되는 필드**를 서버에서 한 곳(직렬화 계층)에서 걸러 주세요. 테스트도 꼭 만들어 주세요.

| 정보 | 본인 | 다른 참가자 | 진행자 | 공개 시점 |
|---|---|---|---|---|
| 인터뷰 답 원문 | ✅ | ❌ | ❌ | **끝까지 비공개** |
| 인터뷰에서 뽑은 재료 | ✅ (7-5) | 이름 없이 | 이름 없이 | 재료로만 |
| 소식 카드 반응 | ✅ | ❌ | 인원 수만 | — |
| 아이디어 주인 | ✅ (내 것 표시) | ❌ (팀원 A~D 별칭) | ❌ | **8-7 투표 결과 때 공개** |
| 아이디어를 AI 추천에서 골랐는지 | ✅ | ❌ | ❌ | 끝까지 비공개 |
| 댓글 작성자 | ✅ (내 것만) | ❌ | ❌ | **끝까지 비공개** |
| 누가 어디에 투표했는지 | ✅ (내 것만) | ❌ | ❌ | **끝까지 비공개** (합계만) |
| 숨은 공통점에 누구 답이 들어갔는지 | "내 답도 들어 있어요"만 | ❌ | ❌ | 끝까지 비공개 |
| 추가 질문(9-2)의 답 · 점수 | ✅ (내 답만) | ❌ | ❌ | **끝까지 비공개** — 결과는 "추가 질문으로 정했어요"만 |
| 이야기해 볼 파트를 표시한 사람 | ✅ | ❌ | 팀장만 ✅ | 팀장 화면(9-4)에만 |
| 파트 담당·아이디어 주인 (9-1 이후) | ✅ | ✅ | ✅ | 8-7 주제 확정 뒤에는 공개 |
| 스킬 정보를 AI에 보낼 때 | — | — | — | **이름 빼고 인원 수로만** |

추가로 조심할 것:
- 별칭(팀원 A·B·C·D)과 줄 순서는 세션마다 **무작위로 한 번** 정해서 고정.
- 댓글·목록 순서를 **작성 시각순으로 주지 않기** (시간으로 사람 추측 방지).
- 로그에도 답 원문·작성자 연결을 남기지 않기(또는 접근 제한).

## 6. 요금제 규칙

| | FREE | PRO |
|---|---|---|
| 세션 시간 | 1~30분 | 60 · 90분 · 제한 없음(null) |
| 가격 | — | 미정 |

프론트가 잠금 표시를 해도 **서버가 최종 검사** (`403 PLAN_LIMIT`).

## 7. 추천 개발 순서

1. **계정**: 가입·로그인·로그인 유지(refresh)·/me·프로필 (A1 · A2 · 3 · A3) — 토큰 구조가 먼저 있어야 나머지가 편해요
2. **세션 뼈대**: 만들기·코드 입장·재접속·대기실·WebSocket·단계 넘기기·타이머 (4 · 2 · 5 · 6)
3. **아이스브레이킹**: 인터뷰 대화(AI 저가 모델) → 재료 뽑기 → 소식 검색 → 진행자 묶음 (7-x)
4. **발산 기본**: 아이디어 제출 → 익명 순위표 → 댓글 → 투표 → 결과 (8-1 · 8-3 · 8-4 · 8-6 · 8-7) — AI 없이도 끝까지 돌게
5. **발산 AI**: 추천(8-2) → AI 검증(8-5) → AI가 모은 아이디어 · 숨은 공통점(8-6)
6. **파트 나누기 · 보고서**: 파트와 후보(9-1) → 추가 질문(9-2) → 배치·분량(9-3) → 팀장 확정(9-4) → 보고서(9-5)
7. **나머지 계정**: 지난 세션·설정·결제 (A4 · A5)

각 단계가 끝날 때마다 프론트에서 `assets/js/config.js`의 `useMock`을 `false`로 바꿔 실제로 연결해 보세요.
'''

def rules_md():
    err = '\n'.join(f'| `{c}` | {s} | {w} |' for c, s, w in ERRORS)
    ev = '\n'.join(f'| `{n}` | {w} | `{d}` | {r} |' for n, w, d, r in EVENTS)
    return f'''# API 공통 규칙

## 주소

- REST: `https://<도메인>{BASE}` + 경로 (예: `POST {BASE}/sessions`)
- 실시간: `wss://<도메인>{BASE}/sessions/{{sessionId}}/stream?token=<액세스 토큰>`
- 프론트 설정: `assets/js/config.js`의 `baseUrl`, `wsUrl`

## 인증

| 토큰 | 언제 받나 | 어떻게 보내나 |
|---|---|---|
| 액세스 토큰 (회원) | 로그인·가입·소셜 로그인 응답의 `accessToken` | `Authorization: Bearer <토큰>` |
| 리프레시 토큰 (회원) | 로그인·가입·소셜 로그인 시 **httpOnly 쿠키**로 | 브라우저가 자동 전송 → `POST /auth/refresh`로 새 액세스 토큰 |

- 게스트 토큰은 없어요. 모든 세션 API는 **회원 액세스 토큰**이 필요해요.
- 토큰이 없거나 만료되면 `401 UNAUTHORIZED` → 프론트가 `POST /auth/refresh`를 한 번 시도하고, 성공하면 원래 요청을 다시 보내요. 실패(`401 REFRESH_INVALID`)하면 로그인(A1)으로.
- 프론트 저장: 액세스 토큰을 브라우저 저장소 `ie.state`에 둬요 — "로그인 상태 유지"면 `localStorage`, 아니면 `sessionStorage`. 그래서 액세스 토큰 수명은 짧게(약 1시간) 해 주세요.
- 프론트와 API 주소(도메인)가 다르면 **CORS에서 credentials 허용**(`Access-Control-Allow-Credentials: true`, Origin 정확히 지정)이 필요해요 — 리프레시 쿠키 때문.

## 요청 · 응답 형식

- 요청/응답 모두 `application/json; charset=utf-8` (사진 업로드만 `multipart/form-data`)
- 성공 응답은 **데이터를 그대로** 돌려줘요 (따로 `{{data: …}}`로 감싸지 않음). 본문이 없으면 `204`.
- 이름 규칙: JSON 필드는 `camelCase`, ID는 접두사+문자열 (`usr_…`, `ses_…`, `par_…`, `ide_…`, `aii_…`, `thr_…`, `news_…`)
- 시간: ISO 8601 + 시간대 (`2026-09-18T15:30:00+09:00`), 날짜만은 `2026-09-18`
- 목록: `?cursor=…&limit=20` → 응답 `{{ "items": [...], "nextCursor": "…" | null }}`

## 에러 형식

```json
{{
  "error": {{
    "code": "PRAISE_LIMIT",
    "message": "좋은 점은 2개까지만 쓸 수 있어요",
    "details": {{ "praiseUsed": 2, "praiseMax": 2 }}
  }}
}}
```

- `message`는 **사용자에게 그대로 보여줄 수 있는 한국어 문장**으로 써 주세요. 프론트는 이 문장을 토스트로 띄워요.
- `details`는 선택. 입력 오류(`VALIDATION`)면 `{{ "fields": {{ "email": "이메일 형식이 아니에요" }} }}` 권장.

| code | HTTP | 뜻 |
|---|---|---|
{err}

## 중복 방지

- 채팅 보내기는 `clientMessageId`를 함께 보내요. 같은 값이 다시 오면 새로 만들지 말고 이전 응답을 돌려주세요 (네트워크 재시도 대비).
- 단계 넘기기는 `from`(보고 있던 단계)을 보내요. 서버 단계와 다르면 `409 STAGE_MISMATCH`.
- 투표·아이디어 제출은 "전체 목록을 덮어쓰기"(PUT)라서 여러 번 보내도 결과가 같아요.

## 요청 횟수 제한

- 로그인·방 코드 조회·비밀번호 찾기: IP 기준 제한 (`429 TOO_MANY_ATTEMPTS`)
- AI를 부르는 API(인터뷰 답, 뜻풀이, 추천 더 보기): 사람당 제한 — 비용 보호

## 실시간 이벤트

WebSocket 연결 후 서버가 보내는 메시지 형식:

```json
{{ "type": "stage.changed", "data": {{ "stage": {{ "id": "diverge.comment", "label": "아이디어 발산", "subStep": 3, "progress": 35 }} }}, "at": "2026-09-18T15:12:03+09:00" }}
```

- 이벤트는 **"무엇이 바뀌었다"는 알림**이에요. 화면에 필요한 자세한 데이터는 프론트가 해당 GET API로 다시 가져가도 돼요.
- 연결이 끊기면 프론트가 자동으로 다시 붙어요(최대 10초 간격). (재)연결 직후 서버는 **그 사람에게만** 지금 단계를 `stage.changed`로 한 번 보내 주세요.
- 연결할 때 토큰이 없거나 만료면 닫힘 코드 `4401`, 이 세션 참가자가 아니거나 내보내진 사람이면 `4403`. 자세한 연결 규칙은 2차 전달 문서의 "실시간 연결 규칙".
- 이벤트에도 **익명 규칙**이 똑같이 적용돼요 (진행자 이벤트에 이름·작성자 넣지 않기).

| type | 받는 화면 | data 예시 | 프론트 동작 |
|---|---|---|---|
{ev}
'''

DATA_MODEL = r'''# 데이터 모델 (제안)

표 이름·필드는 제안이에요. 핵심은 **"누가 썼는지"를 저장은 하되, 응답에서는 익명 규칙대로 걸러낸다**는 점이에요.

## 계정

| 표 | 주요 필드 | 메모 |
|---|---|---|
| `users` | id, email(unique), password_hash(null 가능), nickname, avatar_url, plan(FREE/PRO), plan_expires_at, created_at, deleted_at | 소셜 전용 계정은 password_hash 없음 |
| `user_identities` | id, user_id, provider(google/kakao), provider_user_id | 소셜 연결 |
| `user_profiles` | user_id, strength, desired_role, skills(text[]), updated_at | 3 · A3 |
| `user_settings` | user_id, notify_session_invite, notify_report_ready, notify_marketing | A5 |
| `agreements` | id, user_id, type(terms/privacy/marketing), version, agreed(bool), agreed_at | 가입 시 동의 기록 |
| `refresh_tokens` | id, user_id, token_hash, remember(bool), expires_at, used_at, replaced_by, revoked_at | 회전 방식 · 로그아웃·비밀번호 변경 시 무효화 · 재사용 감지 |
| `legal_documents` | type, version, title, html, effective_date | 약관 원문 |
| `subscriptions` / `payments` | … | 결제 확정은 PG 웹훅으로 (미정) |

## 세션 · 참가자

| 표 | 주요 필드 | 메모 |
|---|---|---|
| `sessions` | id, code(대문자·숫자 6자리, 끝나지 않은 방끼리 unique), host_user_id, topic, criteria, duration_min(null=제한 없음), max_members, status(lobby/running/ended), stage_id, sub_step, started_at, ends_at, confirmed_idea_id | |
| `participants` | id, session_id, user_id(**not null**), role(host/participant), nickname, alias(A/B/C/D, 시작 시 무작위), row_order(무작위), online, last_seen_at, joined_at, kicked_at | (session_id, user_id) unique — 재접속은 같은 행을 그대로 씀 |
| `participant_profiles` | participant_id, strength, desired_role, skills(text[]) | **처음 입장할 때 스냅샷** (재접속 때는 그대로) |

## 7 아이스브레이킹

| 표 | 주요 필드 | 메모 |
|---|---|---|
| `interview_messages` | id, participant_id, role(ai/user), label, style(fq/explain/good/wait), text, question_no, client_message_id, created_at | **본인만 조회** |
| `interview_states` | participant_id, step(1~5), followup_used(bool), done(bool) | |
| `news_cards` | id, session_id, category(시장/기술/규제), title, plain, for_team, source_name, source_url, published_at, search_query | 세션당 3장 |
| `news_reactions` | card_id, participant_id, reaction(new/heard/know) | 진행자에겐 합계만 |
| `explain_requests` | id, participant_id, card_id, term, answer | |
| `materials` | id, session_id, participant_id, text, avoid(bool), kind(내부용) | 응답에 participant_id 넣지 않기 |
| `material_groups` | id, session_id, title, description, ai_pick(bool), focus(true/false/null), version | 다시 묶기 때 version 증가 |
| `material_group_items` | group_id, text, count, avoid | 표시용 요약(같은 재료 합침) |

## 8 발산

| 표 | 주요 필드 | 메모 |
|---|---|---|
| `ideas` | id, session_id, participant_id(주인), rank(1~3), text, source(own/ai), recommendation_id, created_at | 주인은 8-7 전까지 비공개 |
| `idea_recommendations` | id, participant_id, title, reason, page, picked(bool) | |
| `comments` | id, idea_id, author_participant_id, concern(text, 필수), praise(text, null) , created_at | **작성자 끝까지 비공개** · (idea_id, author) unique |
| `reviews` | idea_id(또는 ai_idea_id), grade(go/fix/re), exists_label, exists_summary, search_url, feasibility_level(상/중/하), feasibility_summary, missing_skill_count, missing_skill_summary, need_label, need_summary, timeline_label, timeline_summary, comment_summary(json), status(pending/done/failed) | AI 작업 결과 |
| `ai_ideas` | id, session_id, title, grade, sources(json: idea_id + taken_point), fixes(json) | "AI가 모음" · 최대 2개 |
| `common_threads` | id, session_id, title, why, sources(json: question + summary), candidate_ids(json) | 2명 이상 겹칠 때만 |
| `common_thread_members` | thread_id, participant_id | "내 답도 들어 있어요" 계산용, 응답 금지 |
| `common_thread_reactions` | thread_id, participant_id, reaction(didntKnow/knew) | |
| `votes` | session_id, participant_id, target_id(idea 또는 ai_idea), round(1=본투표, 2=재투표) | 1인 2표 · **누가 투표했는지 비공개** |
| `vote_finishes` | session_id, participant_id, round, finished_at | |

## 9 파트 나누기 · 배치 · 보고서

| 표 | 주요 필드 | 메모 |
|---|---|---|
| `sessions` (추가 필드) | confirmed_idea_id, leader_participant_id, assignment_version, assignment_confirmed_at | 팀장 = 배치를 확정하는 사람 (기본값 진행자) |
| `team_parts` | id, session_id, tier(core/normal/small), name, description, skill, effort(1~5, AI 추정 작업량), status(overlap/single/none), alternative, sort_order | 주제 확정 직후 AI가 만듦 |
| `part_candidates` | part_id, participant_id | 프로필 스냅샷 스킬로 고른 후보 |
| `part_questions` | id, part_id, qid(q1/q2), type(choice/text), text, options(json), context, hint | 파트마다 2개 · 같은 파트 후보는 같은 질문 |
| `part_answers` | id, part_id, participant_id, answers(json), created_at | **본인과 AI만** · (part_id, participant_id) unique |
| `part_decisions` | part_id, chosen_participant_id, method(question/single/balance/excluded), score(json, 비공개), decided_at | 공개하는 건 method 뿐 |
| `assignments` | id, session_id, part_id, assignee_participant_id, ai_assignee_participant_id, changed_by_leader(bool), version | 버전이 올라갈 때마다 team.assignment.updated |
| `part_marks` | part_id, participant_id, created_at | "이야기해 보자" 표시 · 팀장에게만 이름 공개 |
| `assignment_suggestions` | id, session_id, part_id, from_participant_id, to_participant_id, reason, status(open/accepted/dismissed), based_on_version | 분량 쏠림 제안 1개 |
| `reports` | id, session_id, version, content(json), created_at | A4 2쪽 내용 전체 · 담당이 바뀌면 새 version |

## 인덱스 · 제약 체크리스트

- `sessions.code`: 끝나지 않은 방(status≠ended) 안에서 unique
- `participants`: (session_id, user_id) unique
- `ideas`: (participant_id, rank) unique, 한 사람 최대 3개
- `comments`: (idea_id, author_participant_id) unique, 자기 아이디어 금지(서버 검사)
- `comments.praise`: 한 사람당 세션 전체 2개 이하(서버 검사)
- `votes`: 한 사람당 라운드별 2개 이하(재투표는 설정값), 숨은 공통점 id 금지
- `part_answers`: (part_id, participant_id) unique · 그 파트의 후보만 저장 가능(서버 검사)
- `assignments`: (session_id, part_id) unique · 담당은 그 세션 참가자만
- `part_marks`: (part_id, participant_id) unique
- `sessions.leader_participant_id`: 그 세션의 참가자여야 함 · 배치를 고치고 확정하는 API는 이 사람만
'''

AI_JOBS = r'''# AI 작업 목록

AI를 부르는 일은 대부분 **몇 초 이상** 걸려요. 요청 안에서 기다리지 말고 작업 큐에서 돌리고, 끝나면 실시간 이벤트로 알려주세요. 인터뷰 대화처럼 바로 답해야 하는 것만 요청 안에서 처리(또는 스트리밍)해요.

> 모델 칸의 "가벼운/중간/무거운"은 비용 기준 제안이에요. 이전 디자인 목업에서 검토했던 조합은 **키워드·짧은 판단 = Flash-Lite, 발산·분석 = Solar-Pro4, 보고·현실성 = DeepSeek, 시중 검색 = Brave 검색 API** 였어요(확정 아님).

| # | 작업 | 언제 시작 | 넣는 것 | 나오는 것 | 모델 | 실패하면 |
|---|---|---|---|---|---|---|
| 1 | 인터뷰 꼬리질문 판단 | 인터뷰 답이 올 때 (요청 안) | 질문, 답 | 충분함/꼬리질문 문장 | 가벼운 | 꼬리질문 없이 다음 질문 |
| 2 | 최근 소식 카드 3장 | **세션 시작 직후** (미리) | 세션 주제, 검색 결과 | 시장·기술·규제 카드(제목·쉽게 말하면·우리 팀에게·출처) | 검색 API + 중간 | `fallback: true` → 질문 2·3 건너뜀 |
| 3 | "이게 뭐예요?" 뜻풀이 | 버튼 누를 때 (요청 안) | 카드 내용, 단어 | 2~3문장 설명 | 가벼운 | "지금은 설명을 불러올 수 없어요" |
| 4 | 재료 뽑기 | 한 사람 인터뷰 끝날 때 | 그 사람 답 전체 | 재료 문장 목록 + avoid 표시 | 가벼운 | 답 문장을 그대로 짧게 잘라 재료로 |
| 5 | 재료 묶기 | 인터뷰가 모이면 / "다시 묶기" | 전체 재료(이름 없음) | 그룹 3~5개(제목·설명·AI 추천 표시·항목·인원 수) | 중간 | 묶지 않고 목록으로 |
| 6 | 아이디어 추천 | 8-2 열 때 / 더 보기 | 본인 재료, 본인 프로필, 주제, 심사기준 | 아이디어 4개 + 추천 이유(본인 답만 인용) | 중간 | "추천을 불러오지 못했어요" |
| 7 | AI 검증 · 현실성 | 댓글 단계 끝날 때 | 아이디어, 검색 결과, **팀 스킬 인원 수**, 인터뷰 재료, 댓글 | 등급 + 6개 관점 요약 + 검색 링크 | 검색 API + 무거운 | 해당 아이디어만 "검증 실패" 표시, 투표는 진행 |
| 8 | AI가 모은 아이디어 | 7번과 같이 | 좋은 점 받은 아이디어들 + 좋은 점·아쉬운 점 | 새 아이디어 ≤2개(출처·아쉬운 점 줄인 방법) + 7번 검증 | 무거운 | 만들지 않음(목록에서 그룹 숨김) |
| 9 | 숨은 공통점 | 아이디어 제출 끝난 뒤 | 재료 묶음 + 아이디어 | 공통점 ≤3개(서로 다른 묶음·2명 이상), 이어지는 후보 | 중간 | 만들지 않음 |
| 10 | 결과 인사이트 카드 | 투표 끝날 때 | 상위 후보 + 숨은 공통점 | "1위와 ○○는 같은 뿌리" 한 문단 | 가벼운 | 카드 숨김 |
| 11 | 파트 나누기 + 후보 찾기 | **주제 확정(8-7) 직후** | 확정 주제, AI 검증 결과, **팀 스킬(이름 없이 P1·P2)** | 핵심/보통/작은 일 파트 + 필요한 스킬 + 후보 + 없는 스킬의 대안 | 중간 | 기본 파트 묶음(화면·서버·발표·기획)으로 대체 |
| 12 | 겹친 파트 질문 만들기 | 파트 나누기 끝날 때 | 파트 이름·하는 일, 주제 | 파트마다 질문 2개(보기 4개 + 3줄 쓰기 · 주제에 맞춘 한 줄 예시) | 가벼운 | 공통 질문 템플릿 사용 |
| 13 | 겹친 후보 판단 | 모두 답하거나 시간 끝날 때 | 같은 파트 후보들의 답(이름 없이) | 누가 맡을지 + 비공개 근거 | 중간 | 프로필 스킬 수가 많은 사람으로 |
| 14 | 분량 맞추기 · 쏠림 제안 | 배치가 바뀔 때마다 (AI 아님 · 계산) | 파트 effort, 담당 | 작은 일 배분 · loadPct · 옮기기 제안 1개 | — | — |
| 15 | 보고서 만들기 | **팀장이 배치 확정할 때** | 투표·검증·댓글 요약·숨은 공통점·확정 배치 | A4 2쪽 내용(요약 + 워크플로우 4단계 + 넘겨주기) | 무거운 | 요약 없이 표만 채운 보고서 |

## 꼭 지킬 것

1. **지어내지 않기**: "이미 있나"와 최근 소식은 **검색 결과에 있는 것만** 요약하고 링크를 붙여요. 프롬프트에 "검색 결과에 없는 사실은 쓰지 말 것"을 넣고, 결과에 URL이 없으면 표시하지 않아요.
2. **이름을 AI에 보내지 않기**: 스킬은 "웹 화면 2명 · 백엔드 1명"처럼 인원 수로, 재료·댓글은 작성자 없이.
3. **본인 것만 인용**: 추천 이유(6)는 요청한 사람의 답만 인용. 추가 질문의 답(12·13)은 화면 어디에도 인용하지 않는다.
4. **참고용 표시**: 검증 결과는 판단 근거와 함께 "참고용"으로. 등급이 낮아도 투표에서 빼지 않아요.
5. **비용**: 작업 결과는 DB에 저장해서 같은 세션에서 다시 부르지 않아요. 사람당 호출 횟수 제한.
6. **말투**: 화면 문구와 같은 "~해요"체, 짧게. 어려운 용어 대신 쉬운 말.
'''

DEPLOY_MD = """# 배포 (Vercel)

화면 폴더를 그대로 올리는 **정적 사이트**예요. 빌드 과정이 없어요(HTML · CSS · JS 그대로).

## 1. 올리는 법

| 방법 | 언제 | 어떻게 |
|---|---|---|
| GitHub 연결 (권장) | 계속 고칠 때 | 이 폴더를 저장소에 올리고 Vercel에서 Import → Framework Preset **Other** · Build Command 비움 · Output Directory 비움 → push할 때마다 자동 배포 |
| CLI | 한 번 빠르게 | 이 폴더에서 `npx vercel` (처음엔 로그인) → 미리보기 주소, `npx vercel --prod` → 운영 주소 |

`_generator` · `_tools` · `_작업메모` · `design`은 `.vercelignore`로 빼 두었어요(화면과 상관없는 파일).

## 2. 주소 규칙 (vercel.json에 이미 들어 있음)

| 주소 | 하는 일 | 왜 |
|---|---|---|
| `/s/{방 코드}` | `s/index.html`(작은 이동 페이지)이 주소에서 코드를 꺼내 `screens/02-join-code/index.html?code={방 코드}`로 보냄 | 초대 링크 (docs/01 "3-2 방 코드 · 초대 링크") |
| `/oauth/callback` | `oauth/callback/index.html`이 `code` · `state`를 그대로 달고 `screens/A6-oauth-callback/index.html`로 보냄 | 소셜 로그인 콜백 — 소셜 앱에 **`https://<배포 주소>/oauth/callback`** 을 redirect URI로 등록해 주세요 |

> 왜 바로 리라이트하지 않나: 리라이트는 브라우저 주소를 그대로 두기 때문에 화면이 `?code=`를 읽지 못하고, 화면 안의 상대 경로(`screen.js` 등)도 `/s/screen.js`처럼 엉뚱한 곳을 찾아요. 그래서 한 단계 거쳐 진짜 화면 주소로 보내요(사용자에게는 똑같이 한 번에 열려요).

## 3. 백엔드에 붙이기

`assets/js/config.js`(생성기: `_generator/ho_assets.py`)에서 바꿔요.

```js
useMock: false,
baseUrl: '/api/v1',          // 아래 (가) 방법
wsUrl: 'wss://api.example.com/api/v1',
```

**(가) 같은 주소로 프록시 — 권장.** `vercel.json`의 `rewrites`에 한 줄을 더해요.

```json
{ "source": "/api/v1/:path*", "destination": "https://api.example.com/api/v1/:path*" }
```

- 브라우저가 보기에 **같은 사이트**라서 리프레시 쿠키(`SameSite=Lax`)가 그대로 오가고 **CORS 설정이 필요 없어요**.
- 단 **WebSocket은 Vercel이 프록시하지 못해요.** `wsUrl`에 백엔드 주소를 직접 적어 주세요(토큰은 주소의 `?token=`으로 가니까 쿠키가 없어도 돼요).

**(나) 다른 도메인으로 직접.** `baseUrl: 'https://api.example.com/api/v1'` 로 두면 백엔드에서:

- 쿠키를 `SameSite=None; Secure`로 (Lax면 다른 사이트 요청에 쿠키가 안 실려서 로그인 유지가 깨져요)
- `Access-Control-Allow-Origin`은 배포 주소를 **정확히**, `Access-Control-Allow-Credentials: true`
- `OPTIONS`(preflight) 응답도 열어 주기

## 4. 지금 올라가 있는 곳

| | |
|---|---|
| 주소 | **https://ideationengine-front.vercel.app** (화면 목록이 첫 페이지) |
| Vercel 프로젝트 | `roh15/ideationengine-front` (Hobby) · 목업 모드로 배포됨 |
| 검색 노출 | `X-Robots-Tag: noindex` (링크를 아는 사람만) |
| 다시 배포 | 이 폴더에서 `npx vercel --prod` (`_generator`로 다시 만든 뒤에) |

백엔드 쪽에서 미리 맞춰 두면 좋은 값이에요.

- **소셜 로그인 redirect URI**: `https://ideationengine-front.vercel.app/oauth/callback`
- **CORS Origin**(다른 도메인으로 붙일 때): `https://ideationengine-front.vercel.app`
- 위 (가) 프록시 방법을 쓰면 CORS·쿠키 설정이 필요 없어요.

## 5. 배포 뒤 확인

1. `/` 열기 → 화면 목록 → 아무 화면이나 열림
2. `/s/7K2X9M` 열기 → 방 코드 입장 화면에 코드가 채워짐
3. 백엔드를 붙였다면 각 차수 전달 문서의 **완료 기준**을 그대로 확인
4. 목업 모드로 둔 채 시연을 찍을 거면 `config.js`의 `devNav: false`(아래 개발용 바 숨김)
"""

TOKENS_MD = r'''# 디자인 토큰 · 컴포넌트 규칙

`assets/css/tokens.css`에 CSS 변수로 들어 있어요. 새 화면을 만들 때도 이 변수만 쓰세요.

## 색

| 이름 | 값 | 쓰는 곳 |
|---|---|---|
| `--key` (key/600) | `#4F46E5` | 버튼, 로고, 선택, 진행 막대 |
| `--key-50` / `--key-100` / `--key-200` | `#EEF2FF` / `#E0E7FF` / `#C7D2FE` | 연한 선택 배경, 포커스 링, 선택 테두리 |
| `--key-700` | `#4338CA` | 강조 글자 |
| `--app-bg` | `#FAFAFE` | 앱 배경 |
| `--panel` | `#FFFFFF` | 카드 |
| `--line` | `#E2E3EF` | 선 |
| `--ink` / `--muted` / `--faint` | `#1B1B2F` / `#626280` / `#9A9AB5` | 본문 / 보조 / 흐린 글자 |
| 사이드 목록 회색 | `#EDEEF5` | 8-4·8-5·8-6 왼쪽 레일 |
| `--ok` / `--warn` / `--bad` | `#059669` / `#B45309` / `#BE123C` | **판정 의미로만** (등급 점, 완료, 위험) |
| `--news` | `#0284C7` | 아이스브레이킹 최근 소식에만 |

규칙: 초록·주황·빨강은 장식에 쓰지 않아요. 등급은 **점 + 이름**(투표 목록만 점 + 범례).

## 글자

- 한글: **Noto Sans KR** (400·500·700·900) · 숫자·코드·배지: **JetBrains Mono**
- 크기는 8단계만: `--fs-display` 36 · `--fs-h1` 24 · `--fs-h2` 18 · `--fs-h3` 16 · `--fs-body` 14 · `--fs-sm` 13 · `--fs-cap` 12 · `--fs-label` 11

## 모서리

보드 18 · 카드 14~16 · 버튼·입력 10 · 작은 버튼 8 · 칩·배지 999

## 로고

IE 모노그램: 32×32 격자, 배경 `#4F46E5` 모서리 8, 흰 막대 두께 3.4. SVG는 각 화면 HTML의 `.appicon`을 그대로 쓰면 돼요.

## 자주 쓰는 클래스

| 클래스 | 뜻 |
|---|---|
| `.btn` · `.btn.ghost` · `.btn.soft` · `.btn.text` · `.btn.sm` · `.btn.lg` · `.btn.block` | 버튼 |
| `.inp` · `.ta` | 입력칸 · 여러 줄 입력 |
| `.chip` · `.chip.on` · `.chip.lock` + `.pro` | 선택 칩 · 선택됨 · Pro 잠금 |
| `.sk` · `.sk.on` | 스킬 칩(여러 개) |
| `.card` · `.panel2` · `.sc2` | 카드 · 본문 패널 · 사이드 카드 |
| `.badge` · `.badge.key` · `.badge.ok` | 작은 배지 |
| `.ibar` | 세션 상단바(로고 · 가운데 단계 이름 + 전체 진행률 · 역할 · 타이머 · 프로필) |
| `.dsteps` `.ds.cur` | 발산 안의 작은 단계 표시 |
| `.focusgrid` `.rail` `.ri.on` `.railbtn` `.detail.lift` | 왼쪽 회색 목록 + 떠 있는 흰 본문 + 목록 접기 |
| `.grade.go/.fix/.re` (+`.gbox`) | 등급(점 + 이름) |
| `.ans` | AI 답 태그(가능 · 있음 · 상 …) |
| `.b.ai` `.b.me` `.b.fq` `.b.explain` `.b.good` | 채팅 말풍선: AI · 나 · 꼬리질문 · 뜻풀이 · 끝 안내(마지막 1번만) |
'''


def first_delivery(key_to_screen):
    ids = ['auth.signup', 'auth.login', 'auth.refresh', 'auth.logout', 'auth.me', 'meta.skills', 'profile.update',
           'session.create', 'session.lookup', 'session.join', 'session.get']
    why = {'auth.signup': '회원만 입장 → 가입 필요', 'auth.login': '로그인 (A1)', 'auth.refresh': '로그인 유지 · 랜딩 자동 로그인',
           'auth.logout': '1-1 로그아웃', 'auth.me': '1-1 팝오버 · 재접속(activeSession)', 'meta.skills': '프로필 화면 칩 목록',
           'profile.update': '입장 조건(프로필) 채우기', 'session.create': '입장 테스트용 방 만들기 (대신 테스트 방을 DB에 직접 넣어도 됨)',
           'session.lookup': '2 방 찾기', 'session.join': '2 입장 · 재접속', 'session.get': '재접속 후 화면 복구'}
    rows = '\n'.join('| `%s` | `%s` | %s | %s | %s |' % (ENDPOINTS[i]['method'], ENDPOINTS[i]['path'], AUTH_LABEL[ENDPOINTS[i]['auth']], ENDPOINTS[i]['title'], why[i]) for i in ids)
    details = '\n'.join(endpoint_md(ENDPOINTS[i]) for i in ids)
    ev = '\n'.join('| `%s` | `%s` | %s |' % (n, d, r) for n, w, d, r in EVENTS if n in ('participant.joined', 'participant.online'))
    return FIRST_TEMPLATE.replace('{N}', str(len(ids))).replace('{ROWS}', rows).replace('{EV}', ev).replace('{DETAILS}', details)

FIRST_TEMPLATE = """# 백엔드 1차 전달 — 화면 1 · 1-1 · 2 (랜딩 · 로그인 상태 랜딩 · 방 코드 입장)

이번에 만들 범위와 **끝났다고 볼 수 있는 기준**이에요. 화면 폴더: `screens/01-landing`, `screens/01-1-landing-logged-in`, `screens/02-join-code` (각 README에 화면 설명).

## 정해진 규칙

1. **게스트 입장 없음** — 회원가입 → 로그인 → 프로필 작성(닉네임·맡고 싶은 역할·스킬 1개 이상)이 끝나야 방에 들어갈 수 있어요.
2. **로그인 유지** — 액세스 토큰(본문, 약 1시간) + 리프레시 토큰(httpOnly 쿠키, "로그인 상태 유지" 체크 시 30일). 401이면 프론트가 `POST /auth/refresh` 후 재시도.
3. **초대 링크 = 방 코드** — 방 코드는 대문자·숫자 6자리, 링크는 `https://ideationengine.app/s/{방 코드}`. 별도 초대 토큰 없음.
4. **재접속 허용** — 이미 참가자면 코드로 다시 들어와도 에러 없이 `rejoined: true`와 **현재 단계**를 돌려줘요. 랜딩(1-1)은 `/me`의 `activeSession`으로 "세션으로 돌아가기"를 보여줘요.

자세한 표는 [01-백엔드-한눈에-보기.md](01-백엔드-한눈에-보기.md)의 "3-1 로그인 유지"와 "3-2 방 코드 · 초대 링크 · 재접속", 공통 형식은 [02-API-공통-규칙.md](02-API-공통-규칙.md).

## 만들 API ({N}개)

화면 3개가 직접 부르는 건 refresh · logout · me · lookup · join 이에요. 하지만 **회원만 입장**이라 가입·로그인·프로필이 있어야 테스트가 되고, 입장하려면 방이 있어야 해서 함께 넣었어요.

| 메서드 | 경로 | 권한 | 하는 일 | 왜 이번에 필요한가 |
|---|---|---|---|---|
{ROWS}

실시간(WebSocket)은 이번 범위에서 **선택**이에요. 입장·재접속 때 대기실에 보낼 이벤트만 미리 정해 두었어요.

| 이벤트 | data | 받으면 |
|---|---|---|
{EV}

## 완료 기준 — 아래가 모두 통과하면 1차 끝

프론트의 `assets/js/config.js`에서 `useMock: false`, `baseUrl`을 서버 주소로 바꾸고 확인해요.

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 1 | 회원가입(A2) → 프로필 작성(3) | 1-1로 이동, 팝오버에 내 이름·이메일·FREE·역할·스킬 |
| 2 | "로그인 상태 유지" **체크** 후 로그인 → 브라우저를 완전히 닫았다 열고 랜딩(1) | 자동으로 1-1 |
| 3 | "로그인 상태 유지" **체크 안 함** → 브라우저 닫았다 열기 | 로그인 전 랜딩(1) |
| 4 | 액세스 토큰 만료(서버에서 1분으로 줄여 테스트) 후 1-1 새로고침 | 사용자 모르게 refresh → 정상 표시 |
| 5 | 로그아웃 → 뒤로 가기로 1-1 | 랜딩(1)으로 돌아감, refresh도 401 |
| 6 | 로그인 안 한 상태로 2번에 코드 입력 → 입장 | 로그인 화면 → 로그인 → 코드가 채워진 채 돌아와 자동 입장 |
| 7 | 프로필 없는 회원이 입장 | 409 PROFILE_REQUIRED → 프로필 만들기 → 저장 → 돌아와 자동 입장 |
| 8 | 초대 링크 `/s/7K2X9M` 열기 (웹 서버 리라이트 설정 후) | 2번 화면에 코드가 채워져 있음 |
| 9 | 소문자 `7k2x9m`로 입장 | 정상 입장 (대소문자 무시) |
| 10 | 틀린 코드 · 끝난 방 | "없는 방 코드" 안내 (404) |
| 11 | 인원이 가득 찬 방에 새 사람 | 409 SESSION_FULL 안내 |
| 12 | 이미 시작한 방에 새 사람 | 409 SESSION_STARTED 안내 |
| 13 | **재접속**: 대기실에 들어갔던 사람이 같은 코드로 다시 입장 | 200 `rejoined:true` → 대기실(6), 참가자 수 그대로 |
| 14 | **재접속**: 시작된(가득 찬) 방의 참가자가 코드로 다시 입장 | 에러 없이 현재 단계 화면으로 (예: 7-1) |
| 15 | **재접속**: 참가 중인 회원이 1-1을 열기 | "↩ 세션으로 돌아가기" → 누르면 현재 단계 화면 |
| 16 | 진행자가 자기 방 코드로 입장 | role=host → 진행자 화면(5 또는 7-6) |
| 17 | 같은 사람이 입장 버튼을 빠르게 두 번 | 참가자 1명만 생김 |
| 18 | 내보내진 사람이 다시 입장 | 403 KICKED 안내 |

## 프론트 쪽 참고 (이미 구현됨)

- 401 → `/auth/refresh` 한 번 → 원래 요청 재시도: `assets/js/api.js`
- 로그인 필요 시 돌아올 곳(returnTo) 저장·복귀, 단계 → 화면 이동: `assets/js/app.js` (`requireLogin`, `returnTo`, `stageScreen`)
- 방 코드 6칸 · 초대 링크 해석 · 자동 입장 · 재접속 이동: `screens/02-join-code/screen.js`
- 재접속 버튼: `screens/01-1-landing-logged-in/screen.js`

## API 상세

모든 경로 앞에 `/api/v1`이 붙어요.

{DETAILS}
"""


def team_delivery(key_to_screen):
    ids = ['team.parts', 'team.questions', 'team.answer', 'team.assignment', 'team.mark',
           'team.reassign', 'team.suggestion', 'team.revert', 'team.confirm', 'report.get']
    why = {'team.parts': '9-1 파트·후보 목록', 'team.questions': '9-2 내 추가 질문', 'team.answer': '9-2 답 제출',
           'team.assignment': '9-3 · 9-4 배치·분량', 'team.mark': '9-3 이야기해 볼 파트 표시',
           'team.reassign': '9-4 담당 바꾸기 (팀장)', 'team.suggestion': '9-4 옮기기 제안 받기/닫기 (팀장)',
           'team.revert': '9-4 AI 초안으로 되돌리기 (팀장)', 'team.confirm': '9-4 확정 → 보고서 (팀장)',
           'report.get': '9-5 A4 2쪽 보고서'}
    rows = '\n'.join('| `%s` | `%s` | %s | %s | %s |' % (ENDPOINTS[i]['method'], ENDPOINTS[i]['path'], AUTH_LABEL[ENDPOINTS[i]['auth']], ENDPOINTS[i]['title'], why[i]) for i in ids)
    changed = ['topic.confirm', 'session.advance', 'session.get']
    changed_rows = '\n'.join('| `%s` | `%s` | %s |' % (ENDPOINTS[i]['method'], ENDPOINTS[i]['path'], t) for i, t in [
        ('topic.confirm', '단계가 `team.split`로 바뀜 · 요청에 **팀장(leaderParticipantId, 선택)** 추가 · 응답에 leader'),
        ('session.advance', '9단계 규칙 추가: team.split → team.questions → (자동) team.assign · team.assign → report 는 팀장의 team.confirm 으로만'),
        ('session.get', '`me.isLeader` 추가 (팀장이면 9-4, 아니면 9-3)')])
    ev = '\n'.join('| `%s` | `%s` | %s |' % (n, d, r) for n, w, d, r in EVENTS
                   if n in ('team.parts.ready', 'team.assignment.updated', 'team.confirmed', 'report.ready', 'stage.changed'))
    details = '\n'.join(endpoint_md(ENDPOINTS[i]) for i in ids + changed)
    return TEAM_TEMPLATE.replace('{N}', str(len(ids))).replace('{ROWS}', rows).replace('{CHANGED}', changed_rows).replace('{EV}', ev).replace('{DETAILS}', details)

TEAM_TEMPLATE = """# 백엔드 2차 전달 — 화면 9-1 ~ 9-5 (파트 나누기 · 겹친 후보 질문 · 배치 초안 · 팀장 확정 · 보고서)

주제가 정해진 뒤(8-7) **누가 무엇을 맡을지 정하고 보고서를 만드는** 범위예요. 화면 폴더: `screens/09-1-part-split`, `screens/09-2-overlap-questions`, `screens/09-3-assign-draft`, `screens/09-4-leader-confirm`, `screens/09-5-report` (각 README에 화면 설명과 요청/응답 예시).

## 먼저 알아야 할 것

- 1차(계정·방 입장·재접속)가 되어 있어야 해요. 발산(8번)까지 다 안 만들었어도 **테스트용 데이터를 DB에 직접 넣어** 이 범위만 따로 만들 수 있어요(아래 "테스트 준비").
- 프론트는 이미 다 만들어져 있어요. `assets/js/config.js`에서 `useMock: false` + `baseUrl`만 바꾸면 이 API들을 실제로 불러요.
- 모양이 궁금하면 같은 명세로 동작하는 가짜 백엔드가 있어요: `python _tools/test-backend-team.py` → http://127.0.0.1:8768/index.html

## 이번 범위의 규칙

1. **파트는 세 종류** — 결과를 좌우하는 파트(core) · 보통 파트(normal) · 작은 일(small, 스킬 없이 누구나).
2. **후보는 프로필 스킬로** — 2명 이상이면 "겹침"이라 **그 사람들에게만** 추가 질문 2개를 하고, 1명이면 바로 배정, 없으면 "후보 없음 + 대안 한 줄".
3. **추가 질문의 답은 본인과 AI만** 봐요. 결과는 배치표에 **"추가 질문으로 정했어요"**라고만 나오고 점수·비교는 공개하지 않아요.
4. **분량 맞추기** — 핵심 파트가 한 사람에게 몰려도 괜찮고, 대신 **작은 일**을 다른 사람에게 더 줘서 네 사람의 분량이 비슷해지게 해요.
5. **팀장** — 주제 확정(8-7) 때 정해지는 참가자 1명(안 정하면 진행자). 배치를 고치고 **확정**하는 사람은 팀장뿐이에요.
6. **보고서** — 배치를 확정하면 AI가 A4 2쪽 내용을 만들어요. **PDF는 서버에서 만들지 않아요**(프론트가 브라우저 인쇄로 저장).
7. 익명 규칙은 그대로예요 → [01-백엔드-한눈에-보기.md](01-백엔드-한눈에-보기.md)의 "5. 익명 규칙".

## 만들 API ({N}개)

| 메서드 | 경로 | 권한 | 하는 일 | 쓰는 화면 |
|---|---|---|---|---|
{ROWS}

### 이미 있는 API 중 바뀐 것 3개

| 메서드 | 경로 | 무엇이 바뀌나 |
|---|---|---|
{CHANGED}

### 실시간 이벤트

| 이벤트 | data | 받으면 |
|---|---|---|
{EV}

## 단계 넘어가는 규칙

```
8-7 주제 확정 → team.split(9-1) ──진행자 "추가 질문 시작"──▶ team.questions(9-2)
                    │                                              │
                    └─ 겹친 후보가 없으면 바로 ───────────────────▶ team.assign(9-3 · 팀장 9-4)
                       (모두 답하거나 시간이 끝나면 서버가 자동으로 넘김)
                                                                   │
                                                  팀장 "확정" ─────▶ report(9-5)
```

## AI가 하는 일 (4가지)

| # | 언제 | 넣는 것 | 나오는 것 |
|---|---|---|---|
| 11 | 주제 확정 직후 | 확정 주제 · AI 검증 · **이름 없는** 팀 스킬(P1·P2…) | 파트 목록 + 필요한 스킬 + 후보 + 없는 스킬의 대안 |
| 12 | 파트 나누기 끝 | 파트 이름·하는 일 | 파트마다 질문 2개 |
| 13 | 답이 다 모이거나 시간 끝 | 같은 파트 후보들의 답(이름 없이) | 누가 맡을지 + **비공개** 근거 |
| 15 | 팀장이 확정할 때 | 투표·검증·댓글 요약·숨은 공통점·확정 배치 | 보고서 A4 2쪽 내용(워크플로우 4단계 포함) |

자세한 내용은 [05-AI-작업-목록.md](05-AI-작업-목록.md) 11 · 12 · 13 · 15번. 14번(분량 맞추기)은 AI가 아니라 계산이에요.

## 테스트 준비 (발산 단계를 아직 안 만들었어도 되게)

세션 하나를 아래 상태로 만들어 두면 9번만 따로 테스트할 수 있어요.

- 참가자 4명(회원·프로필 있음), 진행자 1명 포함
- 프로필 스킬 예: 노형원(프론트엔드·발표·피칭·서비스 기획) · 이세민(프론트엔드·웹 디자인·발표·피칭) · 김승희(웹 디자인·PPT 디자인·리서치·사용자 조사) · 박상진(백엔드·데이터)
- 세션 status=running, stage=`team.split`, confirmed_idea_id = 아무 아이디어, leader_participant_id = 아무 참가자
- 투표 결과·AI 검증은 보고서에 쓰이니 최소한의 값(1위 3표, 2위 2표, 등급 go)만 넣어두면 돼요

## 완료 기준 — 아래가 모두 통과하면 2차 끝

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 1 | 진행자가 8-7에서 주제 확정 | 모두 9-1로 이동, `team.split` |
| 2 | 파트 나누기 AI가 도는 중에 9-1 열기 | `ready:false` → 안내 문구, 끝나면 `team.parts.ready` 로 자동 표시 |
| 3 | 9-1 화면 | 파트별 필요한 스킬·후보(겹침/1명/후보 없음)·작은 일 개수·"내가 후보인 파트" 표시 |
| 4 | 진행자가 "추가 질문 시작" | 겹친 후보는 9-2로, 겹치지 않은 사람은 9-1에서 기다림 |
| 5 | 겹친 파트가 없는 주제 | 9-2를 건너뛰고 바로 `team.assign` |
| 6 | 9-2에서 첫 파트 제출 | 다음 파트 질문으로 바뀜 (`nextPartId`) |
| 7 | 마지막 파트까지 제출 | "답을 모두 보냈어요" → 9-1에서 기다림 |
| 8 | 다른 후보가 9-2 응답을 열어봄 | 응답 어디에도 **다른 사람 답·점수 없음** |
| 9 | 겹친 후보가 모두 답함 | 서버가 자동으로 `team.assign` → 모두 9-3(팀장은 9-4) |
| 10 | 시간이 끝났는데 답 안 한 사람이 있음 | 답한 것만으로 정하고 다음 단계로 (답 제출은 409 STAGE_CLOSED) |
| 11 | 9-3 화면 | 파트별 담당·정한 방법(추가 질문/후보 1명/분량 맞추기/대안), 사람별 분량 막대, 작은 일 배분 |
| 12 | 팀원이 파트 표시 | 팀장 화면(9-4)에 "○○ 님이 표시" — **다른 팀원에게는 안 보임** |
| 13 | 팀장이 담당 바꾸기 | 바꾼 줄 표시 + 분량 다시 계산 + 쏠리면 옮기기 제안 |
| 14 | "옮기기" / "그대로 둘게요" | 작은 일이 옮겨짐 / 제안만 닫힘 |
| 15 | "AI 초안으로 되돌리기" | 팀장이 바꾼 담당이 모두 초안으로 (팀원 표시는 남음) |
| 16 | 팀장이 아닌 사람이 담당 바꾸기 API 호출 | 403 NOT_LEADER |
| 17 | 다른 창에서 배치가 바뀐 뒤 확정 | 409 VERSION_MISMATCH → 다시 불러오면 확정됨 |
| 18 | 팀장이 확정 | 모두 9-5로, 세션 status=ended, 지난 세션 기록(A4)에 보고서 있음 |
| 19 | 보고서가 아직 만들어지는 중 | `ready:false` → 안내, `report.ready` 오면 A4 2쪽 표시 |
| 20 | 9-5 화면 | 1쪽(요약·현실성·투표·파트) · 2쪽(워크플로우 4단계·내내 하는 일)이 응답 값으로 채워짐 |
| 21 | 세션이 끝난 뒤 A4 → "보고서 보기" | 9-5에서 그 세션 보고서가 열림 |
| 22 | 그 세션 참가자가 아닌 회원이 보고서 열기 | 403 NOT_PARTICIPANT |
| 23 | 확정 뒤 팀장이 담당을 고침 | 보고서가 다시 만들어지고 `report.ready` |

## 프론트 쪽 참고 (이미 구현됨)

- 단계 → 화면 이동(팀장이면 9-4, 아니면 9-3): `assets/js/app.js` (`stageScreen`, `syncStage`)
- 9번 공통 표시: `assets/js/team.js` · 화면별 동작: 각 `screens/09-*/screen.js`
- 보고서 크게 보기 팝업 · PDF 저장(브라우저 인쇄): `screens/09-5-report/screen.js`
- 디자인이 없어서 임시로 넣은 것: 9-1 진행자용 "추가 질문 시작" 버튼 · 9-3 파트 표시 모드 · 9-4 담당 고르는 목록

## API 상세

모든 경로 앞에 `/api/v1`이 붙어요.

{DETAILS}
"""


def backend_bundle(key_to_screen, phases):
    """백엔드에게 한 번에 넘기는 총정리 문서 (지금 할 일 + 남은 일 + 결정할 것 + 확인 방법)"""
    now = [p for p in phases if '전달 완료' in p[2]]
    later = [p for p in phases if '전달 완료' not in p[2]]
    now_rows = '\n'.join(
        '| **%s** | %s | %s개 | %s |' % (n, scope, len(ids), note.split('(')[0].strip())
        for n, scope, state, ids, note in now)
    later_rows = '\n'.join(
        '| %s | %s | %s개 | %s |' % (n, scope, len(ids), ' · '.join('`%s`' % i for i in ids))
        for n, scope, state, ids, note in later)
    api_rows = []
    for n, scope, state, ids, note in phases:
        for i in ids:
            e = ENDPOINTS[i]
            api_rows.append('| %s | `%s` | `%s %s` | %s | %s |' % (n, i, e['method'], e['path'], AUTH_LABEL[e['auth']], e['title']))
    api_table = '\n'.join(api_rows)
    ev_rows = '\n'.join('| `%s` | %s | %s |' % (n, w, r) for n, w, d, r in EVENTS)
    total = sum(len(p[3]) for p in phases)
    return BUNDLE_TEMPLATE.replace('{NOW}', now_rows).replace('{LATER}', later_rows) \
        .replace('{APIS}', api_table).replace('{EVENTS}', ev_rows).replace('{TOTAL}', str(total)) \
        .replace('{NOW_COUNT}', str(sum(len(p[3]) for p in now)))

BUNDLE_TEMPLATE = """# 백엔드 전달 총정리 — 지금 할 일 · 남은 일 · 정해야 할 것

> 백엔드 담당에게 **이 문서 하나만 먼저** 주면 돼요. 나머지는 여기서 링크로 이어져요.
> 프론트엔드 화면은 이미 다 만들어져 있고, 서버만 붙이면 동작해요.

## 0. 3분 요약

- 대학생 팀이 **첫 회의에서 주제를 정하고 역할까지 나누도록** 돕는 웹앱이에요. 한 세션 = 방 만들기 → 아이스브레이킹 → 아이디어 발산 → 주제 확정 → 파트 나누기 → 보고서.
- 화면 **31개**가 HTML·CSS·JS로 완성돼 있고, 지금은 **가짜 서버(mock)** 로 돌아가요. `assets/js/config.js`에서 `useMock: false` + `baseUrl`만 바꾸면 진짜 서버를 불러요.
- API는 **{TOTAL}개**가 요청·응답 예시까지 정해져 있어요. 그중 **{NOW_COUNT}개가 지금 만들 범위**예요.
- 기술 스택은 자유예요(Node/Spring/FastAPI 등). **JSON 모양만 맞으면** 프론트는 그대로 붙어요.

## 1. 먼저 읽는 순서

| 순서 | 문서 | 왜 |
|---|---|---|
| 1 | [01-백엔드-한눈에-보기.md](01-백엔드-한눈에-보기.md) | 부품 구성 · 권한 · **세션 단계** · **익명 규칙** · 개발 순서 |
| 2 | [02-API-공통-규칙.md](02-API-공통-규칙.md) | 인증(토큰·쿠키) · 에러 형식 · 실시간 이벤트 형식 |
| 3 | [00-백엔드-1차-전달-화면1-1-1-2.md](00-백엔드-1차-전달-화면1-1-1-2.md) | **1차 범위**: 계정 · 방 입장 · 재접속 (완료 기준 18개) |
| 4 | [00-백엔드-2차-전달-화면9-파트나누기-보고서.md](00-백엔드-2차-전달-화면9-파트나누기-보고서.md) | **2차 범위**: 파트 나누기 ~ 보고서 (완료 기준 23개) |
| 5 | `screens/<화면>/README.md` | 만들 화면의 동작 설명 + 요청/응답 예시 |
| 6 | [04-데이터-모델.md](04-데이터-모델.md) · [05-AI-작업-목록.md](05-AI-작업-목록.md) · [03-API-전체-목록.md](03-API-전체-목록.md) | DB 표 제안 · AI 작업 15개 · API 전체 |

## 2. 지금 만들 범위 (전달 완료)

| 차수 | 범위 | API | 문서 |
|---|---|---|---|
{NOW}

차수 이름은 **전달 순서**예요(전달 1차 = 계정·입장, 전달 2차 = 9번 파트 나누기~보고서). 아래 3장의 번호는 **개발 순서 제안**이고요.

두 범위는 **따로 만들어도 돼요**. 9번(2차)은 발산(8번)이 없어도 테스트용 데이터를 넣어 개발할 수 있게 2차 문서에 준비 방법을 적어뒀어요.

## 3. 아직 명세만 있는 나머지 (순서 제안)

| 차수 | 범위 | API | 목록 |
|---|---|---|---|
{LATER}

## 4. 무엇을 만들어야 하나 (공통 부품)

| 부품 | 왜 필요한가 | 이번 범위에 필요한가 |
|---|---|---|
| API 서버 + DB | 계정·세션·아이디어·댓글·투표·파트·보고서 저장 | **필수** |
| 인증 (액세스 토큰 + 리프레시 쿠키) | 로그인 유지 · 401 → refresh → 재시도 | **필수 (1차)** |
| WebSocket | 대기실 입장, 단계 넘기기, 진행 인원, 배치 변경 알림 | 1차는 선택 · **2차부터 필요** |
| 작업 큐 + AI 작업자 | 소식 검색, AI 검증, 파트 나누기, 보고서 만들기 | **2차부터 필요** (AI 11~15) |
| 검색 API | "이미 있는 서비스인가" 근거 · 최근 소식 | 3차·5차 |
| Redis | 이벤트 전달 · 중복 클릭 잠금 · 방 코드 캐시 | 2차부터 권장 |
| 파일 저장소 · 메일 · 결제 PG | 프로필 사진 · 비밀번호 재설정 · Pro 결제 | 6차 |

## 5. 프론트가 이미 한 것 / 백엔드가 할 것

| 이미 되어 있음 (프론트) | 백엔드가 할 것 |
|---|---|
| 화면 31개 · 버튼 동작 · 입력 검사 | 같은 이름의 API 구현 (JSON 모양 고정) |
| 401 → `/auth/refresh` 1회 → 원래 요청 재시도 | 토큰 발급·회전·재사용 감지 |
| 로그인 후 원래 화면 복귀(returnTo) | — |
| 단계(stage) → 화면 이동, 새로고침 복구 | `GET /sessions/{id}`의 `stage`를 정확히 주기 |
| 팀장/팀원 화면 분기 | `me.isLeader` 주기 |
| 보고서 A4 2쪽 그리기 · **PDF는 브라우저 인쇄** | 보고서 내용(JSON)만 주면 됨 — **서버 PDF 생성 불필요** |
| 실시간 이벤트 수신 코드 | 이벤트 발행 |

## 6. 꼭 지켜야 하는 규칙

1. **익명 규칙** — 가장 중요해요. 응답에 넣으면 안 되는 값이 정해져 있어요([01 문서 5장](01-백엔드-한눈에-보기.md)). 한 곳(직렬화 계층)에서 걸러 주세요.
   - 끝까지 비공개: 인터뷰 답 원문 · 댓글 쓴 사람 · 누가 어디에 투표했는지 · **추가 질문(9-2)의 답과 점수**
   - 공개 시점이 있는 것: 아이디어 주인은 **8-7 결과** 때, 파트 담당은 9-1부터
   - 이야기해 볼 파트를 표시한 사람은 **팀장에게만**
2. **AI에 이름을 보내지 않기** — 스킬은 "웹 화면 2명"처럼 인원 수로, 파트 후보는 P1·P2 같은 임시 번호로.
3. **지어내지 않기** — "이미 있는 서비스"와 최근 소식은 **검색 결과에 있는 것만** 요약하고 링크를 같이 주기.
4. **단계는 서버가 기억** — 새로고침·재접속하면 `stage`로 화면을 복구해요. 단계를 넘길 때 `from`을 확인해 중복 클릭을 막아 주세요.
5. **권한** — `진행자만`/`팀장만` API를 다른 사람이 부르면 403 (`FORBIDDEN` / `NOT_LEADER`).

## 7. 실시간 이벤트 (WebSocket)

`wss://<도메인>/api/v1/sessions/{sessionId}/stream?token=<액세스 토큰>`

| type | 받는 화면 | 프론트 동작 |
|---|---|---|
{EVENTS}

## 8. 지금까지 확인한 것 · 고친 것 (프론트 쪽)

프론트를 테스트용 가짜 백엔드에 실제로 붙여서 확인했고, 그 과정에서 나온 문제는 모두 고쳤어요. **백엔드가 같은 실수를 하지 않도록** 정리했어요.

| 무엇이 문제였나 | 어떻게 고쳤나 | 백엔드가 참고할 점 |
|---|---|---|
| 액세스 토큰이 만료되면 `/me` 요청이 재시도되지 않고 로그인 화면으로 튕김 | 재시도 제외 목록을 로그인·가입·refresh 자신만으로 좁힘 | 401은 **만료**와 **권한 없음**을 구분해서 주세요(만료는 401 `UNAUTHORIZED`, 권한 문제는 403) |
| 프로필 만들기 화면에 디자인 예시 이름이 남아 새 회원 이름이 "노형원"으로 저장됨 | 실서버 모드에서는 예시를 지우고 가입 닉네임으로 채움 | 서버는 프로필 저장 시 **닉네임 필수** 검사를 꼭 해주세요 |
| 방 코드 재입장·새로고침 때 단계 복구가 어긋남 | `session.join`을 재접속까지 처리하고, 화면이 `session.get`으로 단계를 다시 맞춤 | **재접속은 새 참가자를 만들지 않기** (session_id + user_id 유니크) |
| 9번에서 팀장과 팀원이 같은 단계인데 봐야 할 화면이 다름 | 단계 → 화면 규칙에 `isLeader`를 반영 | `GET /sessions/{id}`에 **`me.isLeader`** 를 꼭 넣어 주세요 |
| 단계 이름이 옛 설계(`roles`·`report`)로 남아 있었음 | `team.split` · `team.questions` · `team.assign` · `report` 로 교체 | 단계 id는 [01 문서 4장](01-백엔드-한눈에-보기.md) 표 그대로 주세요 |
| 주제 확정 후 다음 화면으로 넘어가지 않음 | 확정하면 9-1로 이동하도록 연결 | `topic.confirm` 응답의 `stage`가 `team.split` 이어야 해요 |
| 지난 세션 기록에서 보고서를 열 수 없었음 | "보고서 보기"가 9-5로 sessionId를 넘기도록 연결 | **세션이 끝난 뒤에도** 그 세션 참가자면 보고서를 볼 수 있어야 해요 |
| 분량이 쏠렸는데 옮길 작은 일이 없을 때 제안이 비어 있음 | 제안은 `null`이 될 수 있다고 명세에 적음 | `suggestion: null` 을 정상 응답으로 처리하세요 |

**확인 방법(그대로 따라 하면 됨)**

| 하고 싶은 것 | 방법 |
|---|---|
| 화면만 둘러보기 | `index.html` 열기 (가짜 서버 모드) |
| 1차 범위를 서버에 붙여 보기 | `python _tools/test-backend-phase1.py` → http://127.0.0.1:8767/index.html |
| 9번(2차) 범위를 서버에 붙여 보기 | `python _tools/test-backend-team.py` → http://127.0.0.1:8768/index.html |
| 내 서버에 붙이기 | `assets/js/config.js` → `useMock: false`, `baseUrl: 'http://내서버/api/v1'` |

> 두 테스트 서버는 **명세대로 동작하는 예시**예요(파이썬 표준 라이브러리만 사용, 설치 불필요). 응답 모양이 헷갈리면 이 코드를 열어 보면 돼요. 실제 서버가 아니니 그대로 쓰지는 마세요.

## 9. 아직 정해지지 않은 것 (기획·디자인 결정 대기)

만들기 전에 **답이 필요한 것**이에요. 임시 결정은 괄호 안에 적었어요.

| # | 정해야 할 것 | 지금 임시 결정 |
|---|---|---|
| 1 | **팀장을 누가 정하나** — 8-7에 "팀장 고르기" UI를 넣을지 | `topic.confirm`에 `leaderParticipantId`(선택) · 안 보내면 **진행자가 팀장** |
| 2 | 보고서를 **로그인 없이** 볼 수 있는 공개 링크를 만들지 | 지금은 **참가자만** 열 수 있는 주소 |
| 3 | 세션 시간이 끝나면 자동 종료할지, 진행자에게 알리기만 할지 | 알리기만 (자동 종료 없음) |
| 4 | 회원 탈퇴 시 다른 사람과 함께한 세션의 익명 댓글·아이디어 처리 | 미정 (예: "탈퇴한 사용자") |
| 5 | 후보가 없어 범위에서 뺀 파트를 나중에 누가 맡고 싶을 때 | 미정 (지금은 담당 없이 대안만) |
| 6 | Pro 가격 · 결제 대행사(PG) · 약관/개인정보 문구 법률 검토 | 미정 (6차) |
| 7 | AI 모델·검색 API 선택과 비용 한도 | 미정 ([05 문서](05-AI-작업-목록.md) 제안만) |

## 10. 백엔드 쪽 체크리스트 (빠지기 쉬운 것)

- [ ] CORS에서 **credentials 허용** (리프레시 쿠키 때문) · Origin 정확히 지정
- [ ] 리프레시 토큰 **회전 + 재사용 감지**, 로그아웃·비밀번호 변경·탈퇴 시 무효화
- [ ] 방 코드: 대문자·숫자 6자리(0 O 1 I L 제외), 끝나지 않은 방끼리 유니크, 조회는 대소문자 무시
- [ ] 재접속: 같은 사람이 두 번 눌러도 참가자 1명 (유니크 제약 + 트랜잭션)
- [ ] 단계 넘기기: `from` 확인 → 중복/늦은 요청은 409
- [ ] 배치 확정: `version` 확인 → 다르면 409
- [ ] 익명 필터를 **테스트로 고정** (응답에 작성자·투표자·추가 질문 답이 없는지)
- [ ] 무거운 AI 작업은 요청 안에서 기다리지 말고 큐로 → 끝나면 이벤트
- [ ] 요청 횟수 제한(로그인 실패·방 코드 조회)
- [ ] 로그에 답 원문·작성자 연결을 남기지 않기

## 11. API 전체 목록 ({TOTAL}개)

| 차수 | id | 메서드 · 경로 | 권한 | 하는 일 |
|---|---|---|---|---|
{APIS}

요청/응답 예시는 각 화면 README의 "API 상세" 또는 [03-API-전체-목록.md](03-API-전체-목록.md)에 있어요. `assets/js/mock.js`(가짜 서버)와 **같은 원본**에서 만들어졌으니, 예시대로 JSON을 주면 프론트가 바로 붙어요.
"""
