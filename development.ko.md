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

1. [SPEC.md](SPEC.ko.md)에서 변경 범위와 검증 항목을 확인합니다.
2. [AGENTS.md](AGENTS.md)의 개발 규칙에 따라 변경하고 관련 테스트를 실행합니다.
3. 지형과 편집기 상호작용을 바꿨다면 브라우저에서 2D와 3D를 확인합니다.
4. 변경과 검증 결과를 설명하는 PR을 엽니다. UI 변경에는 해당 화면을 첨부합니다.


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

이전 전략의 배치를 찾을 수 있도록 영웅 ID는 유지합니다. 영웅을 추가하거나 밸런스 패치를 검토할 때 공식 영웅 페이지에서 역할과 기본 능력 이름을 확인하고 필요하면 출처 링크를 갱신합니다. 초기 목록은 트레이서, 라인하르트, 아나입니다. 특전과 능력 수치는 이 목록의 범위 밖이며, 지도 마커는 자체 제작한 도형을 사용합니다.
