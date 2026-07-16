# Moyeo Frontend (모여)

## Project Overview

Turborepo 기반 모노레포. **Expo 네이티브 앱(셸) + Next.js 웹(WebView 화면)** 조합으로,
네이티브 앱이 웹 화면을 WebView로 렌더링한다 (`apps/web` = "모여 WebView", 저장소명 `next-webview-turbo`).

- **`web`** — 실제 서비스 UI. Next.js 16 App Router. 모바일(360×800) 폭 기준.
- **`native`** — Expo 앱 셸. `react-native-webview`로 web을 감싸고, 알림·시큐어스토리지 등 네이티브 기능 제공.
- **`docs`** — 사내 문서/디자인 시스템 뷰어용 Next.js 앱.

> 대부분의 기능 개발은 `apps/web`에서 이뤄진다. 이 문서도 web 중심으로 기술한다.
> `apps/native` 작업 시엔 `apps/native/AGENTS.md`(Expo v54 문서 우선)를 따른다.

## Current Truth (문서 사용 원칙)

이 문서는 **현재 레포에 실제 존재하는 것**만 "사용 가능"으로 기술한다.

- **Commands** 에는 실제로 실행되는 명령만 둔다.
- 아직 도입 안 된 도구는 **Follow-ups** 에 둔다 — 있는 것처럼 실행/전제하지 말 것.
- 문서와 설정이 다르면 **설정 파일이 우선**이다: `package.json` · `turbo.json` · `globals.css` · `steiger.config.js` 등.

## Monorepo Structure

```
root/
├── apps/
│   ├── web/      # Next.js 16 App Router — 서비스 WebView (port 3000)
│   ├── native/   # Expo 54 + expo-router + react-native-webview
│   └── docs/     # Next.js 16 문서 앱 (port 3001)
├── packages/
│   ├── ui/                 # @repo/ui — 공유 컴포넌트 (현재는 turborepo starter stub)
│   ├── types/              # @repo/types — 공유 타입
│   ├── eslint-config/      # base / next / expo / react-internal
│   ├── prettier-config/    # 공통 Prettier 설정
│   └── typescript-config/  # base / nextjs / expo tsconfig
├── docs/
│   ├── conventions/        # 개발 컨벤션 (레포 기준으로 정정한 팀 규칙)
│   └── design-system/      # 디자인 시스템 문서 (Figma + globals.css 기준)
├── turbo.json  ·  pnpm-workspace.yaml  ·  package.json
```

### apps/web 내부 (FSD)

```
apps/web/
├── app/            # Next.js App Router 라우트 (layout.tsx, page.tsx, ...) — 얇게 유지, src로 위임
└── src/
    ├── _app/       # FSD app 레이어 — providers, fonts(SUIT), globals.css  (Next 'app'과 충돌 회피용 '_' 접두)
    ├── _pages/     # FSD pages 레이어 — 화면 조립  (Next 'pages'와 충돌 회피용 '_' 접두)
    ├── widgets/    # 독립 UI 블록
    ├── features/   # 사용자 행동 단위
    ├── entities/   # 도메인 엔티티 (room 등)
    └── shared/     # 공용 기반: ui/primitives(shadcn), ui/layouts, lib(cn), api, model
```

## Commands

```bash
# 개발 (루트에서 turbo가 각 앱에 위임)
pnpm dev            # web(:3000) + docs(:3001) 동시 실행
pnpm dev:native     # Expo 앱 실행
pnpm dev:native:clear  # Expo 앱 실행 (Metro 캐시 초기화)
pnpm storybook      # web Storybook (:6006)

# 빌드 / 검증
pnpm build          # turbo run build (변경분만 캐시 활용)
pnpm lint           # turbo run lint (각 앱 eslint --max-warnings 0)
pnpm typecheck      # turbo run check-types (next typegen + tsc --noEmit)
pnpm format         # prettier . --write
pnpm format:check   # prettier . --check

# web 단독 (apps/web에서)
pnpm --filter @repo/web lint:steiger   # FSD 경계 검사 (steiger)

# ⚠️ 테스트 실행(pnpm test / test:watch)은 아직 미연결 — Follow-ups 참고

# shadcn/ui 컴포넌트 추가 (apps/web)
npx shadcn add <component>   # style: radix-nova, baseColor: neutral
                             # 추가물은 aliases에 따라 src/shared/ui/primitives 로 배치
```

## Tech Stack (web)

- **Framework**: Next.js 16 (App Router, `next typegen`)
- **UI**: React 19, shadcn/ui(style `radix-nova`) + Radix(`radix-ui`) + Tailwind CSS v4 (`tw-animate-css`)
- **컴포넌트 변형**: `class-variance-authority`(cva), `tailwind-merge` + `clsx` → `cn()` (`@/shared/lib/cn`)
- **State**: Zustand v5 (client) + TanStack Query v5 (server)
- **날짜/피커**: `date-fns`, `react-day-picker`, `@ncdai/react-wheel-picker`, `vaul`(drawer/bottom-sheet)
- **아이콘**: `lucide-react`
- **폰트**: SUIT Variable (`next/font/local`, `--font-suit`)
- **테스트**: Storybook 10 + Vitest 4 (browser mode, Playwright chromium)
- **FSD 린트**: `steiger` + `@feature-sliced/steiger-plugin`
- **Lint/Format**: ESLint 9 (flat config, `@repo/eslint-config`) + Prettier 3 (`prettier-plugin-tailwindcss`)
- **Package manager**: pnpm 9 (`packageManager: pnpm@9.0.0`), Node ≥ 18, `node-linker=hoisted`

> `native`는 Expo SDK 54 / expo-router / React Native 0.81 / react-native-webview 스택.

## FSD Architecture (web)

목표 아키텍처는 **정통 FSD**. 레이어 의존 방향은 하향만 허용한다:

```
_pages → widgets → features → entities → shared
(_app 은 최상위 조립 레이어)
```

- **Path alias**: `@/*` → `src/*` **하나뿐**. cross-layer 참조는 `@/<layer>/<slice>` 형태로 쓴다.
  같은 slice 내부는 상대 경로, 다른 레이어는 `@/...`, type-only는 `import type`.
- **`_app` / `_pages` 접두사**: Next.js 예약 폴더명(`app`/`pages`)과 충돌을 피하려 `_`를 붙였다.
  steiger가 이를 오타로 보지 않도록 `steiger.config.js`에서 예외 처리돼 있다.
- **경계 검사**: `steiger`가 FSD public-api·레이어 위반을 검사한다. `shared`는 public-api 강제 off.
  pre-commit 시 변경된 `apps/web/src`에 대해 `lint:steiger`가 자동 실행된다.
- 신규 코드는 정통 FSD 위치를 따르고, 예제/디버그 slice(`_pages/example`, `features/fsd-debug-mode`,
  `__steiger-delete-me__`)는 참고용 스캐폴드이므로 여기에 실제 기능을 얹지 않는다.

## Code Style & Conventions

- **Prettier**: printWidth 100 · 2 spaces · single quotes · semicolons · `trailingComma: es5` ·
  `arrowParens: always` · LF · Tailwind class sorting. (설정은 `@repo/prettier-config`)
- **파일명**:
  - **컴포넌트 파일 = kebab-case** (`button.tsx`, `input-field.tsx`, `create-room-page.tsx`) — shadcn/FSD 관례.
  - 폴더 = kebab-case, 유틸 = camelCase(내용) / kebab-case(파일).
  - 상세는 `docs/conventions/code-conventions.md` 참고.
- **Export**: 컴포넌트는 **named export** (`export { Button }`). default export 지양.
- **네이밍(코드 내부)**: 컴포넌트/타입 `PascalCase`, 변수/함수 `camelCase`, 상수 `SNAKE_CASE`,
  Props 인터페이스는 `{Component}Props`, boolean은 `is*` / `has*`.
- **TypeScript**: `interface` 기본(유니온/교차만 `type`), `any` 금지(불가피 시 `unknown`),
  간단한 화살표 함수 외 반환 타입 명시 권장.
- **컬러/타이포**: 하드코딩 금지, `@theme` 토큰 클래스(`bg-primary`, `text-neutral-900`, `text-bold-16`) 사용.
  자세한 규칙은 `docs/design-system/` 참고.

## Testing — 🔴 미연결 (Follow-ups 참고)

- Vitest 4 + Storybook 10 브라우저 테스트 **설정·의존성은 존재**한다 (`apps/web/vitest.config.ts`,
  `@storybook/addon-vitest` + `@vitest/browser-playwright`). 컴포넌트 `*.stories.tsx`가 테스트 대상.
- 다만 **`test` 실행 스크립트가 root/web/turbo 어디에도 연결돼 있지 않다.** `pnpm test`는 **아직 동작하지 않는다.**
- 테스트 방식(브라우저 vs jsdom)과 스크립트 연결은 하네스 후속 이슈에서 확정한다 → Follow-ups.

## Design System

- 진입점: **`docs/design-system/README.md`**. 색/타이포/그리드 토큰과 컴포넌트 명세가 여기 있다.
- **Source of Truth = Figma 시안 + `apps/web/src/_app/globals.css`.** 문서 값이 어긋나면 이 둘이 우선.
- 핵심: 폰트 SUIT, primary `#f43630`, atomic 컬러(neutral/accessible/common), 8개 텍스트 스타일.
  spacing·shadow 토큰은 **미확정**이라 Tailwind 기본 스케일을 쓰고 임의 px·box-shadow를 하드코딩하지 않는다.
- radius는 Tailwind 기본과 다르게 리매핑됨 (`rounded-lg`=10px 등) — `docs/design-system/foundations/radius.md` 확인.

## Git Conventions

- **커밋**: `type(scope): 내용` (Conventional Commits, commitlint + husky `commit-msg`로 강제).
  - type: `feat fix docs style design refactor test perf build ci chore rename remove init revert`
  - scope: `web native docs shared config repo storybook` (선택)
  - 예: `feat(web): 모임 생성 캘린더 추가`
- **브랜치**: `type/#이슈번호/설명` (예: `feat/#31/customize-calendar`)
- **머지 흐름**: `feat/*` → `develop`(Squash) → `release/x.y.z`(Merge) → `main`(Rebase) → tag `vX.Y.Z`.
  `hotfix/*`는 `main`에서 분기. `main` 직접 push 금지, `develop`도 PR로만.
- **pre-commit**(husky + lint-staged): 변경 파일에 eslint --fix + prettier, web `src`는 steiger 검사.

## Claude Workflow

- 프로젝트 스킬: `.claude/skills/<skill-name>/SKILL.md`
- AC 독립 검증 agent: `.claude/agents/ac-verifier.md`

## Important Notes

- **pnpm 전용**: `packageManager: pnpm@9.0.0`. `.npmrc`는 `node-linker=hoisted`.
- **생성물 편집 금지**: Next 타입(`.next/types`, `next-env.d.ts`)은 `next typegen`/build가 생성한다.
- **환경변수**: Next.js 규칙대로 클라이언트 노출 변수는 `NEXT_PUBLIC_*` 접두사. (현재 사용처 없음)
- **API 클라이언트**: 아직 미구현 (`src/shared/api/`에 README만). 공통 타입/유틸/API는 당분간
  web `src/shared`에 둔다. `packages/shared`는 존재하지 않으며 공유 타입은 `@repo/types` 사용.
- **`@repo/ui`**: 현재 turborepo starter의 stub(button/card/code). 실제 UI 프리미티브는
  web `src/shared/ui/primitives`에 있다.
- **배포**: web은 **Vercel** (`main` → 프로덕션, `develop` → preview). native 앱이 이 web을 WebView로 소비.

## Follow-ups (하네스 후속 — 아직 미도입)

아래는 **현재 레포에 없거나 미연결**이며, 에픽 **#33 "하네스 구축"** 의 서브이슈에서 도입 예정이다.
도입 전까지 "있는 것"처럼 실행/전제하지 말 것. (각 항목이 실제로 커밋되면 해당 내용을 위 본문으로 올린다.)

| 항목                                     | 현재 상태                                          | 도입 예정          |
| ---------------------------------------- | -------------------------------------------------- | ------------------ |
| 테스트 실행 연결 (`pnpm test`)           | 스크립트 없음 (Vitest/Storybook 설정만 존재)       | 테스트 하네스 이슈 |
| `.claude/skills/issue-creator/*` (TDD)   | 레포에 없음 (타 프로젝트서 가져와 moyeo 맞춤 검토) | 스킬 이슈          |
| `.claude/rules/{conventions,fsd}`        | 빈 디렉토리 (내용 없음)                            | rules 이슈         |
| `.claude/settings.json` + PostToolUse 훅 | 파일 없음 (design-check 훅 도입 여부 미정)         | rules/훅 이슈      |
| CI (`.github/workflows/`)                | 없음 (PR 검사 미자동화)                            | CI 이슈            |

> 참고: `docs/features/{기능}/` 에 기능별 기획 문서가 있다 (예: `CRT-02/F02`). TDD 스킬 도입 후 활성 워크플로우로 연결된다.
