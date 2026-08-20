# 목업 → Figma 가져오기 (디자이너용 안내)

이 폴더의 HTML 목업을 **Figma에서 편집 가능한 레이어로 가져와** 원하는 대로 수정하는 방법입니다.
목업은 전부 **단독 실행 HTML**(브라우저로 바로 열림)로 저장돼 있습니다.

## 파일
| 파일 | 내용 |
|------|------|
| `concept-phase-mockup.html` | **핵심** — "컨셉 선택 단계" 앱 UI (컨셉 카드·투표·이견 보존·피치, 실제 생성 데이터) |
| `research-report.html` | 리서치 리포트(참고용 문서 스타일) |

## 받는 법 (둘 다 같은 repo)
```bash
git fetch origin
git checkout ROH        # 이 작업 브랜치
git pull
# 파일 위치: docs/mockups/
```
브라우저로 열어보려면 파일을 더블클릭하면 됩니다.

## Figma로 가져오기 — html.to.design 플러그인 (추천)
1. **Figma → 좌상단 메뉴 → Plugins → Manage plugins → Community**에서 **`html.to.design`** 검색 → 설치 (제작: ‹div›RIOTS).
2. 새 Figma 파일에서 플러그인 실행 → **"HTML" (Code) 탭** 선택.
3. 아래 중 하나로 가져오기:
   - `concept-phase-mockup.html`을 편집기로 열어 **전체 복사 → 플러그인에 붙여넣기**, 또는
   - **`.html` 파일을 플러그인에 드래그&드롭** (단독 .html / .zip 지원, 한 번에 최대 3개), 또는
   - 브라우저로 파일을 열고 **동봉 Chrome 확장**으로 페이지 캡처.
4. 변환하면 **편집 가능한 Figma 레이어**(프레임·텍스트·오토레이아웃·색/스타일)로 들어옵니다. 이후 자유롭게 수정.

## 가져온 뒤 점검할 것
- **폰트**: 목업은 `system-ui / 맑은 고딕(Malgun Gothic)` 스택이라, Figma에선 원하는 한글 폰트로 지정해 주세요.
- **그림자·둥근 모서리·배지 색**: 대체로 보존되나 미세 조정 필요할 수 있음.
- **반응형/다크모드**: 데스크톱·라이트 테마 기준으로 저장했습니다(임포트 깔끔하게).
- **인터랙션**(투표 버튼·카드/비교 토글): 정적 레이어로만 들어옵니다(정상).

## 대안 플러그인
- **Builder.io** — "Convert HTML to Design in Figma"
- **Codia AI** — HTML → Figma (CSS 레이아웃·이미지·반응형 구조 보존)
- **HTML.to.Editable.Design** — HTML/CSS/URL → 편집 가능 Figma

## 출처
- html.to.design 문서: https://html.to.design/docs/code-tab/
- Figma Community 플러그인: https://www.figma.com/community/plugin/1159123024924461424/
- Builder.io: https://www.builder.io/blog/html-to-design
