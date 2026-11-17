# Vertactics 개발 및 기여

[English](development.md)

## 시작하기

Node.js 24와 `package.json`에 지정된 pnpm을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Vite가 터미널에 출력한 로컬 주소를 엽니다. 지도 렌더링에는 WebGL 2를 지원하는 브라우저가 필요합니다.

## 검증하기

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright는 `dist`의 프로덕션 빌드를 프리뷰 서버로 실행합니다. 화면 파일은 `test-results` 아래에 저장되며, GitHub Actions 실행 페이지에서는 `editor-screenshots` 아티팩트로 받을 수 있습니다.

## 코드 둘러보기

| 경로 | 역할 |
| --- | --- |
| `src/domain` | 맵·전략 검증, 월드 좌표·지형 기하, 전략 히스토리 |
| `src/map` | 테스트 맵 JSON |
| `src/render` | 지형 장면, 카메라, 선택 판정 |
| `src/editor` | 편집기 UI와 상호작용 상태 |
| `src/theme` | JSON 디자인 토큰과 스타일 |
| `tests` | Chromium 사용 흐름 검증 |

지도 JSON을 가져올 때 유효성을 검사합니다. 편집기는 v1과 v2를 열 수 있으며 v2로 내보냅니다. 전략 문서 버전은 별도로 관리됩니다.

## 기여하기

1. [SPEC.md](SPEC.ko.md)에서 관련 요구사항과 검증 항목을 확인하고, 최신 `origin/main`에서 작업 브랜치를 만듭니다.
2. 커밋마다 하나의 변경을 담습니다. 독립적으로 검토할 수 있는 작업마다 PR을 열고 관련 SPEC 항목 ID, 검증 결과, 남은 항목을 기록합니다.
3. 지형이나 편집기 상호작용을 바꿨다면 브라우저에서 2D와 3D를 확인합니다. 화면 변경에는 캡처를 첨부합니다.
4. `verify` 통과와 리뷰를 확인한 뒤 병합합니다.

## GitHub Actions

| 실행 조건 | 검증 |
| --- | --- |
| 루트·`docs/`·`skills/`의 Markdown 또는 PR 템플릿만 변경한 PR | 변경분의 공백 오류 검사 |
| 그 외 파일을 변경한 PR | 공백 오류 검사, lockfile 기반 설치, 타입 검사, 린트, 단위 테스트, 프로덕션 빌드, Chromium 테스트 |
| `main` 푸시 또는 수동 실행 | 전체 앱 검증 |

모든 실행의 결과는 `verify`에 표시됩니다. 같은 PR이 갱신되면 이전 실행을 취소합니다.

## 릴리스

1. 릴리스 변경을 `main`에 반영하고 해당 커밋의 CI가 통과했는지 확인합니다.
2. 패키지 버전과 사용자 문서를 갱신합니다. 지도·전략 형식의 변경을 기록합니다.
3. 검증된 커밋에 `vMAJOR.MINOR.PATCH` 태그를 만들고 GitHub Releases에 호환성 변경과 검증 실행을 적습니다.

## 지도 참고 자료와 자산

소스 코드는 [MIT 라이선스](LICENSE)를 사용합니다. 앱은 직접 만든 단순 지형을 사용하며 Blizzard나 커뮤니티의 이미지, 텍스처, 아이콘, 모델을 포함하지 않습니다. Overwatch와 왕의 길은 Blizzard Entertainment의 표장입니다. 링크한 참고 자료에는 각각의 이용 조건이 적용됩니다.

왕의 길 A 거점은 [StatBanana 지도](https://overwatch.statbanana.com/images)의 진입로와 광장, [Overwatch Wiki](https://overwatch.fandom.com/wiki/King%27s_Row)의 동상과 호텔, [A 거점 해설](https://seesaawiki.jp/overwatchwiki/d/KING%27S%20ROW)의 아치·호텔 우회로·고지대를 대조해 단순화했습니다. 점령 구역과 엄폐물, 선택 가능한 상층을 포함합니다. 공개 인게임 화면에서 동상과 호텔이 같은 광장에 접한 배치를 확인했습니다. [인게임 화면](https://altertime.es/article/date-un-paseo-por-el-pasado-con-overwatch-clasico) 현재 게임 클라이언트에서 거리, 높이, 영웅 통과 폭을 실측하지 않았습니다.

지도 편집과 분석에는 검증된 JSON과 절차적 지형을 사용합니다. GLB·glTF는 시각 에셋이 필요해질 때 별도 렌더링 경계에서 검토합니다. 그때는 허용된 자체 포함 GLB에 파일 크기와 리소스 한도를 적용하고 외부 리소스 로딩을 막습니다. 편집·배치·분석 데이터는 JSON에서 관리합니다. [Khronos 명세](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)상 GLB도 외부 리소스를 참조할 수 있습니다.

### 게임에서 왕의 길 A 거점 확인

게임 빌드와 기본 맵 변형을 기록하고 Vertactics의 근사 지도와 비교합니다. Vertactics의 **거리 측정**으로 두 지점과 지도 단위 값을 기록합니다. 실게임 값은 측정 단위 또는 확인 방법과 함께 별도로 기록합니다.

- 진입로: 공격팀 기준 정면 아치와 호텔 우회로를 확인합니다.
- 고지대: 광장에서 두 고지대까지의 진입 경로와 상대 높이를 확인합니다.
- 통과 폭과 엄폐: 같은 영웅으로 아치와 호텔 입구의 통과 여부, 엄폐물 뒤에서 시야가 끊기는 지점을 확인합니다. 차이가 있으면 영웅 이름과 화면을 기록합니다.

이 대조 결과를 기록한 뒤 지도 검증 상태를 갱신합니다.

## 영웅 데이터

이전 전략의 배치를 찾을 수 있도록 영웅 ID는 유지합니다. 영웅을 추가하거나 밸런스 패치를 검토할 때 공식 영웅 페이지에서 역할과 기본 능력 이름을 확인하고 필요하면 출처 링크를 갱신합니다. 2026년 11월 17일 Blizzard 공식 목록의 영웅 54명을 제공합니다. 각 항목은 공식 역할과 출처 페이지의 기술 섹션에 표시된 능력을 기록합니다. 특전, 스타디움 파워, 능력 수치는 제외합니다. 편집기는 텍스트와 자체 제작한 팀 도형을 사용합니다. 타사 초상화와 능력 아이콘을 배포하려면 사용 허가를 확인해야 합니다. [공식 영웅 목록](https://overwatch.blizzard.com/ko-kr/heroes/) · [11월 라이브 패치 노트](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/11/)

## OWKR 카탈로그

영웅 ID, 한국어 이름, 역할과 기본 내전 전장 목록은 OWKR Match의 `owkr-custom-2026-10-20` 카탈로그를 바탕으로 관리합니다. 능력 이름은 Blizzard 공식 영웅 페이지를 참조합니다. 전장 목록에 내전 지도 31개를 표시하며 왕의 길 A 거점 근사 지도는 기존 저장 ID인 `kings-row-a`로 엽니다. 나머지 항목에는 지형 데이터가 준비 중이라고 표시합니다. [OWKR 카탈로그 출처](https://github.com/Overwatch-KR/owkr-balance/blob/91d786313399dad137b16efba21ad91c7388e05a/domains/draft/shared/default-catalog.ts)

### 왕의 길 A 거점 실측 데이터 대조

비공개 사용자 지정 게임에서 Workshop의 `Position Of (Event Player)` HUD로 좌표를 기록합니다. 서 있을 수 없는 표면은 광선이 처음 닿은 위치를 기록합니다. Y는 높이입니다. 게임 빌드, 전장 변형, 영웅, 통과 여부, 시야와 캡처 출처를 함께 기록합니다. [Workshop 좌표 기록](https://us.forums.blizzard.com/en/overwatch/t/how-can-i-record-my-spots-coordinates/614247)

`node scripts/check-map-survey.mjs src/map/kings-row-point-a.json <survey.json>`으로 게임 단위에서 수평 거리와 높이차를 비교합니다. 측정 JSON에는 `mapId`, `gameBuild`, `variant`, `scaleReference`, `gameUnitsPerEditorUnit`, `tolerance`, `segments`를 넣습니다. 각 구간은 `id`와 시작점·끝점 `[X, Y, Z]` 쌍을 담은 `editor`, `game` 필드로 구성합니다. 별도로 실측한 거리에서 축척을 구합니다. A 거점은 `main-arch-width`, `main-arch-height`, `hotel-entry-width`, `hotel-bypass-length`, `attack-balcony-rise`, `defense-balcony-rise`를 비교합니다. 누락과 오차 초과가 출력되며, 영웅별 통과 여부와 시야 차단은 별도로 실측 기록에 남깁니다.

OWLib 도구는 MIT 라이선스를 명시합니다. 공개 빌드에 지형이나 그림을 넣을 때는 해당 데이터의 사용 권한을 함께 확인합니다. [OWLib](https://github.com/overtools/OWLib) · [Blizzard 이용 약관](https://www.blizzard.com/en-us/legal/bfbbb648-bcc6-4b78-a5c7-e2fe20c135df/blizzard-end-user-license-agreement)
