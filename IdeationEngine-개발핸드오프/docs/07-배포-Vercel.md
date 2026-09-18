# 배포 (Vercel)

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
