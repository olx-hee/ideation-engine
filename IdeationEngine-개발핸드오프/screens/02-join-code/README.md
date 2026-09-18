# 2 · 방 코드 입장

> **보는 사람**: 로그인한 회원 (프로필 작성 완료)  
> **파일**: [index.html](index.html) (화면) · [screen.js](screen.js) (이 화면 동작)

## 이 화면은

진행자에게 받은 6자리 방 코드나 초대 링크(https://ideationengine.app/s/방코드)로 방에 들어간다. 로그인과 프로필이 없으면 먼저 거기로 보냈다가 돌아온다. 이미 들어갔던 방이면 재접속.

## 누르면 어떻게 되나

| 누르는 것 | 동작 | 이동 |
|---|---|---|
| 입장하기 → (Enter) | `join` | — |
| 붙여넣기 | `pasteLink` | — |
| 프로필 버튼 | — | [A1 로그인](../A1-login/README.md) |

## 프론트엔드

**이미 구현한 것**

- ✅ 방 코드 6칸: 한 글자씩 자동 이동·대문자 변환·영문/숫자만·지우면 앞 칸·붙여넣기 한 번에 채우기, Enter로 입장
- ✅ 실서버 모드: 디자인 예시로 채워진 "7K2"를 지우고 첫 칸에 커서
- ✅ 초대 링크 붙여넣기(버튼 또는 직접 입력) → 링크에서 방 코드를 꺼내 6칸에 채움
- ✅ <b>초대 링크로 앱을 연 경우</b>: <code>/s/7K2X9M</code> → 이 화면을 <code>?code=7K2X9M</code>로 열어 코드가 채워진 상태로 시작 (서버 설정은 아래 "배포 설정")
- ✅ <b>로그인 안 했으면</b> 로그인 화면으로 → 로그인 후 코드가 채워진 채로 돌아와 자동 입장
- ✅ <b>프로필이 없으면</b>(PROFILE_REQUIRED) 프로필 만들기로 → 저장 후 돌아와 자동 입장
- ✅ <b>재접속</b>: 이미 들어갔던 방이면 서버가 rejoined=true와 현재 단계를 주고, 그 단계 화면으로 바로 이동 (대기실·아이스브레이킹·발산…)
- ✅ 진행자가 자기 방 코드로 들어오면 진행자 화면으로
- ✅ 에러(없는 코드·가득 참·이미 시작·내보내짐)는 서버 문구를 토스트로

## 백엔드가 해야 할 일 (쉽게)

- <b>게스트 입장 없음.</b> 방 찾기·입장 모두 로그인 회원 토큰이 필요해요(없으면 401).
- <b>초대 링크 = 방 코드.</b> 링크는 <code>https://ideationengine.app/s/{방 코드}</code>이고 따로 초대 토큰은 없어요. 방 코드는 대문자·숫자 6자리, 대소문자 구분 없이 찾기.
- <b>방 찾기</b>(<code>GET /sessions/lookup?code=</code>): 방이 있는지·들어갈 수 있는지 확인. 이미 참가 중인 사람이면 <code>alreadyJoined: true</code>를 주고 가득 참/이미 시작 에러를 주지 않아요.
- <b>입장</b>(<code>POST /sessions/{id}/join</code>)은 처음 입장과 재접속을 한 API로 처리해요.<br>· 처음: 프로필 확인(없으면 409 PROFILE_REQUIRED) → 인원·시작 여부 확인 → 참가자 등록 → 프로필 스냅샷 → 대기실에 participant.joined(닉네임 포함)<br>· 재접속(이미 참가자): 새로 만들지 않고 200 + <code>rejoined: true</code> + 현재 status·stage, 대기실에는 participant.online만<br>· 내보내진 사람: 403 KICKED
- 같은 사람이 동시에 두 번 눌러도 참가자는 1명만(유니크: session_id + user_id). 마지막 자리 동시 입장은 트랜잭션으로.
- 방 코드 무차별 대입 방지: 사용자·IP당 요청 횟수 제한.
- <b>배포 설정</b>: 웹 서버에서 <code>/s/{방 코드}</code> 주소를 <code>/screens/02-join-code/index.html?code={방 코드}</code>로 연결(리라이트)해 주세요.

## 이 화면이 쓰는 API

| 언제 | API | 요약 |
|---|---|---|
| 입장하기 | `GET /sessions/lookup` | 방 코드로 방 찾기 |
| 입장하기 | `POST /sessions/{sessionId}/join` | 방에 들어가기 (처음 입장 · 재접속 모두) |

## 실시간 이벤트 (웹소켓으로 받는 것)

| 이벤트 | 받으면 |
|---|---|
| `participant.joined` | 참여자 줄 추가, "3 / 4" 숫자 갱신 |
| `participant.online` | 재접속한 사람 접속 점 다시 켜기 |

형식은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md#실시간-이벤트) 참고.

## API 상세

모든 경로 앞에 `/api/v1`가 붙어요. 공통 규칙(인증·에러 형식)은 [docs/02-API-공통-규칙.md](../../docs/02-API-공통-규칙.md).

### `GET /api/v1/sessions/lookup` — 방 코드로 방 찾기

- **API id**: `session.lookup` (프론트: `api.call('session.lookup', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 입장하기 전에 방이 있는지, 들어갈 수 있는지 확인한다. 초대 링크(/s/{방 코드})로 온 경우도 코드로 찾는다.

**쿼리 파라미터**

| 이름 | 값 |
|---|---|
| `code` | 방 코드 6자리 (대소문자 구분 없음) |

**응답** `200`

```json
{
  "sessionId": "ses_7K2X9",
  "code": "7K2X9M",
  "topic": "교내 해커톤에서 만들 서비스 아이디어 정하기",
  "hostNickname": "노형원",
  "memberCount": 3,
  "maxMembers": 4,
  "status": "lobby",
  "alreadyJoined": false,
  "myRole": null
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `SESSION_NOT_FOUND` | 404 | 없는 코드 · 끝난 방 |
| `SESSION_FULL` | 409 | 인원 가득 (이미 참가 중인 사람은 제외) |
| `SESSION_STARTED` | 409 | 이미 시작한 방에 새로 들어오려 함 (이미 참가 중인 사람은 제외) |
| `KICKED` | 403 | 이 방에서 내보내진 사람 |

**백엔드 메모**

- alreadyJoined=true면 재접속이다. 그때는 방이 가득 찼거나 이미 시작했어도 에러를 주지 않는다. myRole은 그 사람의 역할(host/participant).
- 코드 무차별 대입을 막기 위해 사용자·IP당 요청 횟수를 제한한다.

### `POST /api/v1/sessions/{sessionId}/join` — 방에 들어가기 (처음 입장 · 재접속 모두)

- **API id**: `session.join` (프론트: `api.call('session.join', …)`)
- **누가 부를 수 있나**: 회원 토큰
- **하는 일**: 회원을 이 세션의 참가자로 등록한다. 이미 참가자라면 새로 만들지 않고 기존 참가 정보와 현재 단계를 돌려준다(재접속).

**요청 본문**

```json
{
  "code": "7K2X9M"
}
```

**응답** `200`

```json
{
  "participantId": "par_02",
  "role": "participant",
  "rejoined": false,
  "session": {
    "status": "lobby",
    "stage": {
      "id": "lobby",
      "label": "대기실",
      "subStep": null,
      "progress": 0
    }
  }
}
```

**에러**

| code | HTTP | 언제 |
|---|---|---|
| `PROFILE_REQUIRED` | 409 | 프로필(닉네임·맡고 싶은 역할·스킬 1개 이상)이 없음 → 프론트가 프로필 만들기로 보냄 |
| `SESSION_FULL` | 409 | 처음 입장인데 인원 가득 |
| `SESSION_STARTED` | 409 | 처음 입장인데 이미 시작한 방 |
| `KICKED` | 403 | 내보내진 사람 |
| `SESSION_NOT_FOUND` | 404 | 코드가 이 세션과 다름 · 끝난 방 |

**백엔드 메모**

- 게스트 입장은 없다. 회원 토큰이 없으면 401.
- 처음 입장: 참가자를 만들고 계정 프로필을 이 세션용으로 복사(스냅샷)한 뒤, 대기실에 participant.joined 이벤트(닉네임 포함)를 보낸다.
- 재접속(이미 참가자): 200 + rejoined=true + 현재 session.status·stage. 참가자를 새로 만들거나 participant.joined를 다시 보내지 않는다. 대신 접속 표시를 켜는 participant.online 이벤트만.
- 진행자가 자기 방 코드로 들어와도 재접속으로 처리하고 role=host.
- 같은 사람이 두 번 동시에 요청해도 참가자는 1명만 생기게(유니크 제약: session_id + user_id).
- 인원 수 검사와 등록은 한 트랜잭션 안에서(마지막 자리에 두 명이 동시에 들어오는 경우).
