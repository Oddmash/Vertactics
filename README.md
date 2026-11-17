# Vertactics

하나의 지도에서 2D 평면과 3D 고저차를 탐색하는 오버워치 전술 지도 프로젝트입니다. 현재는 바닥, 엄폐벽, 고지대, 계단이 있는 가상 테스트 맵을 탐색할 수 있습니다.

| 보기 | 조작 |
| --- | --- |
| 2D 탑다운 | 드래그로 평면 이동 |
| 3D 원근 | 드래그로 회전, 우클릭 드래그로 이동 |
| 공통 | 휠 또는 핀치로 확대·축소, 시점 초기화, 지형 선택으로 좌표와 높이 확인 |

지도와 지형 목록에서 선택한 블록은 보기 모드를 바꿔도 유지됩니다. 지도 표시에는 WebGL 2가 필요합니다.

## 시작하기

Node.js 24와 pnpm 10을 사용합니다.

```sh
pnpm install
pnpm dev
```

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

## 구조

| 경로 | 역할 |
| --- | --- |
| `src/domain` | 맵 파싱, 좌표, 지형 기하 계산 |
| `src/map` | 버전이 지정된 JSON 테스트 맵 |
| `src/render` | Three.js 장면, 지형 표시, 투영 및 카메라 조작 |
| `src/editor` | 보기 전환, 지형 선택 상태, 지형 목록과 속성 |
| `src/theme` | JSON 디자인 토큰과 편집기 스타일 |
| `tests` | 프로덕션 빌드에서 동작하는 Chromium 검증 |

[아키텍처](architecture.md) · [유사 서비스 조사](docs/research/competitors.md) · [전체 로드맵](PROMPT.md)

Vertactics는 Blizzard Entertainment와 제휴하지 않은 팬 프로젝트입니다. 현재 테스트 맵은 직접 만든 블록 지형을 사용합니다.
