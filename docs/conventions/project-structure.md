# 프로젝트 구조

## 왜 모노레포인가

React Native(Expo) 앱과 Next.js 웹을 함께 관리하기 위해 모노레포를 택했다.

- 처음부터 `web`, `native` 두 앱이 분리되는 구조
- 공통 설정(eslint / prettier / typescript config)을 패키지로 분리해 중복 감소
- 코드 재사용·일관된 컨벤션·의존성 통합 관리

빌드 캐싱과 태스크 병렬 실행을 위해 **Turborepo** 를 얹었다 (변경된 패키지만 재빌드).
Nx도 후보였으나 러닝커브 대비 현 규모에 과하다고 판단했다.

## 전체 레이아웃

```
root/
├── apps/
│   ├── web/      # Next.js 16 App Router — 서비스 WebView (port 3000)
│   ├── native/   # Expo 54 + expo-router + react-native-webview
│   └── docs/     # Next.js 16 문서 앱 (port 3001)
├── packages/
│   ├── ui/                 # @repo/ui — 공유 컴포넌트 (현재 starter stub)
│   ├── types/              # @repo/types — 공유 타입
│   ├── eslint-config/      # base / next / expo / react-internal
│   ├── prettier-config/    # 공통 Prettier 설정
│   └── typescript-config/  # base / nextjs / expo tsconfig
├── docs/
│   ├── conventions/        # 이 문서들
│   └── design-system/      # 디자인 시스템 (Figma + globals.css 기준)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### apps

| 앱       | 설명                                                |
| -------- | --------------------------------------------------- |
| `web`    | Next.js 기반 서비스 화면. 네이티브가 WebView로 로드 |
| `native` | Expo + WebView 기반 앱 셸                           |
| `docs`   | 문서/디자인 시스템 뷰어용 Next.js 앱                |

### packages

| 패키지              | 설명                                                 |
| ------------------- | ---------------------------------------------------- |
| `ui`                | 공유 UI 컴포넌트 (현재 turborepo starter stub 상태)  |
| `types`             | 공유 타입 (`@repo/types`)                            |
| `eslint-config`     | 앱별 ESLint 설정 (`base.js` / `next.js` / `expo.js`) |
| `prettier-config`   | 공통 Prettier 설정                                   |
| `typescript-config` | 공통 tsconfig (`base` / `nextjs` / `expo`)           |

> 공통 타입/유틸/API 클라이언트는 당분간 web `src/shared` 에 둔다.
> 별도 `packages/shared` 는 아직 만들지 않았고, 공유 타입은 `@repo/types` 를 쓴다.

## web 내부 구조 (FSD)

`apps/web` 는 **Feature-Sliced Design(FSD)** 을 따른다. 라우트 껍데기(`app/`)는 얇게 두고
실제 코드는 `src/` 의 FSD 레이어에 둔다.

```
apps/web/
├── app/            # Next.js App Router 라우트 (layout / page). 얇게 유지, src로 위임
└── src/
    ├── _app/       # app 레이어 — providers, fonts(SUIT), globals.css
    ├── _pages/     # pages 레이어 — 화면 조립
    ├── widgets/    # 독립적으로 재사용되는 UI 블록
    ├── features/   # 사용자 행동 단위
    ├── entities/   # 도메인 엔티티 (room 등)
    └── shared/     # 공용 기반: ui/primitives(shadcn), ui/layouts, lib(cn), api, model
```

### 레이어 의존 방향

아래 방향(하향)으로만 의존한다. 위 레이어가 아래를 참조하며, 반대는 금지다.

```
_pages → widgets → features → entities → shared
```

### 핵심 규칙

- **Path alias 는 `@/*` → `src/*` 하나뿐.** 다른 레이어 참조는 `@/<layer>/<slice>` 형태.
  같은 slice 내부는 상대 경로, type-only 는 `import type`.
- **`_app` / `_pages` 의 `_` 접두사** 는 Next.js 예약 폴더명(`app`/`pages`)과의 충돌을 피하기 위한 것이다.
  `steiger.config.js` 에서 이를 오타가 아닌 정식 레이어로 인식하도록 예외 처리해 두었다.
- **경계 검사는 `steiger`** 가 한다. `shared` 는 public-api 강제를 끈다. 커밋 시 변경된 `src` 에 대해 자동 실행.
- 예제/디버그용 slice(`_pages/example`, `features/fsd-debug-mode`, `__steiger-delete-me__`)는
  스캐폴드이므로 실제 기능을 여기에 얹지 않는다.
