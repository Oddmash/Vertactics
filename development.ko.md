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
