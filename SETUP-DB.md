# MongoDB 연결하기 (무료, 약 10분)

지금 이 앱은 서버를 껐다 켜면 데이터가 사라지는 **임시 저장** 상태입니다.
MongoDB(무료 클라우드 DB)를 연결하면 세션이 **영구 저장**됩니다.
코드는 이미 준비돼 있어서, **연결 문자열 하나만** 넣으면 됩니다.

> ⚠️ 연결 문자열에는 **DB 비밀번호가 들어 있습니다.** 채팅창이나 코드에 붙여넣지 말고,
> 아래 설명대로 **`.env` 파일에만** 넣어주세요. (`.env`는 git에 올라가지 않도록 이미 제외돼 있습니다)

---

## 1. MongoDB Atlas 계정 만들기 (무료)

1. https://www.mongodb.com/cloud/atlas/register 접속 → 이메일로 가입(또는 구글 로그인).
2. 첫 클러스터 만들기에서 **무료 요금제(M0 / Shared / Free)**를 선택합니다.
3. 클라우드 지역은 가까운 곳(예: 서울/도쿄)을 고르고 **Create** 를 누릅니다. (몇 분 걸립니다)

## 2. 접속 계정(사용자) 만들기

1. 왼쪽 메뉴 **Database Access** → **Add New Database User**
2. 사용자 이름과 **비밀번호**를 정합니다. (이 비밀번호를 3단계에서 씁니다)
   - 비밀번호에 `@ : / ?` 같은 특수문자는 피하는 게 편합니다(주소에서 충돌 방지).
3. 권한은 기본(Read and write to any database)으로 두고 저장.

## 3. 내 컴퓨터에서 접속 허용

1. 왼쪽 메뉴 **Network Access** → **Add IP Address**
2. 개발 중에는 **Allow access from anywhere (0.0.0.0/0)** 를 선택하면 편합니다.
   (실서비스 배포 때는 서버 IP만 허용하도록 좁힙니다)

## 4. 연결 문자열(URI) 복사

1. **Database** → 내 클러스터의 **Connect** → **Drivers** 선택
2. 나오는 주소를 복사합니다. 이런 형태입니다:
   ```
   mongodb+srv://<사용자>:<비밀번호>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. `<비밀번호>` 부분을 2단계에서 정한 실제 비밀번호로 바꿉니다.
4. 주소 끝의 `/?` 앞에 DB 이름을 넣습니다(없으면 자동 생성됨). 예:
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/ideation?retryWrites=true&w=majority
   ```

## 5. `.env` 파일에 넣기

프로젝트 폴더 맨 위(루트)에 **`.env`** 라는 파일을 만들고 이렇게 적습니다:

```
MONGODB_URI=mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/ideation?retryWrites=true&w=majority
```

(참고용 예시는 `.env.example`에 있습니다. `.env`는 비밀이라 git에 안 올라갑니다.)

## 6. 연결이 되는지 확인

```bash
npm run db:ping
```

- **✅ 성공 메시지**가 나오면 끝! 이제 `npm run dev:all`로 실행하면 세션이 DB에 영구 저장됩니다.
- **❌ 실패하면** 대개 이 셋 중 하나입니다:
  - 비밀번호 오타 (4단계에서 `<비밀번호>`를 안 바꿨거나 틀림)
  - Network Access에 내 IP(또는 0.0.0.0/0)가 없음 (3단계)
  - URI 형식 오류 (앞뒤 공백, 특수문자 등)

---

## 어떻게 동작하나 (참고)

- `MONGODB_URI`가 **있으면** 서버가 자동으로 MongoDB에 저장합니다.
- **없으면** 예전처럼 임시 메모리로 동작합니다. (코드 수정 불필요 — `server/store.js`가 알아서 갈아끼움)
- 현재 상태는 서버 실행 로그나 `http://localhost:3001/api/health`의 `store` 값으로 확인할 수 있습니다
  (`"mongodb"` = 연결됨, `"memory"` = 임시).
