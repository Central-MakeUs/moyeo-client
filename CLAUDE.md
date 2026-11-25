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
    └── shared/     # 공용 기반: ui(shadcn 포함), ui/layouts, lib(cn), api(orval), model(네이티브 브릿지), assets
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
pnpm verify         # format:check → lint(eslint+steiger) → typecheck → test → build. PR CI(verify.yml)와 같은 진입점. 사용자가 직접 실행

# 테스트 (⚠️ 실행은 사용자가 직접 한다 — .claude/rules/test-policy.md)
pnpm test           # turbo run test → web: vitest run --project unit (jsdom)
pnpm --filter @repo/web test:storybook   # 스토리 렌더 확인 (브라우저, Playwright)

# 생성
pnpm --filter @repo/web orval   # OpenAPI → src/shared/api/generated (clean 재생성)
pnpm generate:icons             # src/shared/assets/icons/*.svg → shared/ui/icon/icons.generated.ts

# web 단독
pnpm --filter @repo/web lint:steiger   # FSD 경계 검사 (steiger)

# shadcn/ui 컴포넌트 추가 (apps/web)
npx shadcn add <component>   # style: radix-nova, baseColor: neutral
                             # 추가물은 aliases에 따라 src/shared/ui 로 배치
```

## Tech Stack (web)

- **Framework**: Next.js 16 (App Router, `next typegen`)
- **UI**: React 19, shadcn/ui(style `radix-nova`) + Radix(`radix-ui`) + Tailwind CSS v4 (`tw-animate-css`)
- **컴포넌트 변형**: `class-variance-authority`(cva), `tailwind-merge` + `clsx` → `cn()` (`@/shared/lib/cn`)
- **State**: Zustand v5 (client) + TanStack Query v5 (server)
- **날짜/피커**: `date-fns`, `react-day-picker`, `@ncdai/react-wheel-picker`, `vaul`(drawer/bottom-sheet)
- **아이콘**: `lucide-react`
- **폰트**: SUIT Variable (`next/font/local`, `--font-suit`)
- **API**: orval(OpenAPI → TanStack Query 훅 + MSW 핸들러) + axios `customInstance`
- **테스트**: Vitest 4 unit(jsdom + RTL + MSW) · Storybook 10(상태 문서, 브라우저 렌더 확인)
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
  `pnpm lint`(eslint + steiger)에 포함돼 `pnpm verify`와 PR CI에서 돈다. pre-commit에서는 돌지 않는다(느림).
- **편집 시 훅**: `.claude/hooks/fsd-layer-check.mjs`가 Edit/Write 직전에 상향·cross-slice·레이어 넘는
  상대경로·`@/shared/api/generated` 직접 참조와 생성물 편집을 차단한다.
- **slice group**: `features/meeting/*`처럼 `index.ts` 없는 그룹 폴더 아래가 slice다. 그룹 안끼리도 cross-slice.
- 레이어별 상세 규칙은 `.claude/rules/fsd-*.md` (해당 경로 파일을 열 때 자동 로드).

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

## Testing

- `pnpm test` = Vitest **unit** 프로젝트(jsdom + RTL + MSW). 대상은 `src/**`·`app/**`의 `*.test.ts(x)`, 대상과 같은 폴더에 둔다.
- Storybook(`*.stories.tsx`)은 **컴포넌트 상태 문서**다. 테스트 대용이 아니다.
- **실행은 사용자가 직접 한다.** 무엇을 테스트하는지·작성 규칙은 `.claude/rules/test-policy.md`.

## Design System

- 진입점: **`docs/design-system/README.md`**. 색/타이포/그리드 토큰과 컴포넌트 명세가 여기 있다.
- **Source of Truth = Figma 시안 + `apps/web/src/_app/globals.css`.** 문서 값이 어긋나면 이 둘이 우선.
- 핵심: 폰트 SUIT, primary `#f43630`, atomic 컬러(neutral/accessible/common), 16개 텍스트 스타일.
  spacing·shadow 토큰은 **미확정**이라 Tailwind 기본 스케일을 쓰고 임의 px·box-shadow를 하드코딩하지 않는다.
- radius는 값이 곧 토큰명 (`rounded-8`=8px). Tailwind t-shirt 스케일(`rounded-lg` 등)은 제거돼 있어, 사용하면 각지게 나온다 — `docs/design-system/foundations/radius.md` 확인.

## Git Conventions

- **커밋**: `type(scope): 내용` (Conventional Commits, commitlint + husky `commit-msg`로 강제).
  - type: `feat fix docs style design refactor test perf build ci chore rename remove init revert`
  - scope: `web native docs shared config repo storybook` (선택)
  - 예: `feat(web): 모임 생성 캘린더 추가`
- **브랜치**: `type/#이슈번호/설명` (예: `feat/#31/customize-calendar`)
- **머지 흐름**: `feat/*` → `develop`(Squash) → `release/x.y.z`(Merge) → `main`(Rebase) → tag `vX.Y.Z`.
  `hotfix/*`는 `main`에서 분기. `main` 직접 push 금지, `develop`도 PR로만.
- **pre-commit**(husky + lint-staged): 변경 파일에 `eslint --fix --max-warnings=0` + prettier. 경고가 남으면 커밋 중단. steiger는 CI(`pnpm lint`).

## Claude Workflow

**룰** — `.claude/rules/*.md`. `paths` frontmatter가 있는 룰은 해당 경로 파일을 다룰 때만 로드된다.

| 룰                                                                                       | 다루는 것                         |
| ---------------------------------------------------------------------------------------- | --------------------------------- |
| `fsd-{shared,entities,features,widgets,pages}`                                           | 레이어별 배치·import 범위         |
| `import-convention` · `component-convention` · `className-convention`                    | import·컴포넌트·Tailwind 함정     |
| `state-convention` · `api-convention` · `constants-convention`                           | Zustand/Query · orval · 상수 추출 |
| `test-policy` · `image-convention`                                                       | 테스트 대상 판정 · 이미지         |
| `code-quality` · `design-source-policy` · `i18n-policy` · `git-workflow` · `work-record` | 항상 적용                         |

- **훅**: `.claude/settings.json`에 PreToolUse `fsd-layer-check` 등록.
- **스킬**: `.claude/skills/<skill-name>/SKILL.md`
  - 기능: `feature-planner` → `issue-reviewer` → `test-scenarios` → `tdd-red` → `tdd-green` → `tdd-refactor` → `security-review` → `pr-writer`
  - 기능이 아닌 무거운 작업(하네스·업그레이드·리팩터·네이티브): `ai-plan`
- **작업 기록**: 기능은 `docs/features/{ID}/`, 그 외는 `docs/work/{TYPE}-{이슈}-{설명}/plan.md`.
  범위 밖 발견은 `docs/work/backlog.md`에 한 줄 (`work-record.md`).
- AC 독립 검증 agent: `.claude/agents/ac-verifier.md`
- **커밋·push·PR은 사용자가 한다.** AI는 스테이징까지.
- **Codex**: `AGENTS.md`가 이 문서를 가리키는 포인터다. `.claude/`를 공용으로 읽고(복사본 없음), `.codex/hooks.json`이 같은 FSD 훅을 연결한다. `.agents/`·`.codex/agents/`는 개인 로컬용이라 커밋하지 않는다.

## Important Notes

- **pnpm 전용**: `packageManager: pnpm@9.0.0`. `.npmrc`는 `node-linker=hoisted`.
- **생성물 편집 금지**: Next 타입(`.next/types`, `next-env.d.ts`), orval `src/shared/api/generated/`,
  `shared/ui/icon/icons.generated.ts`. 훅이 차단한다.
- **환경변수**: 클라이언트 노출 변수는 `NEXT_PUBLIC_*` (API base URL·프록시 경로, OAuth client id·redirect 등).
- **API 클라이언트**: orval 생성물 + `customInstance`. 상위 레이어는 **`@/shared/api` 배럴만** 본다 (`api-convention.md`).
  `packages/shared`는 존재하지 않으며 공유 타입은 `@repo/types` 사용.
- **`@repo/ui`**: 현재 turborepo starter의 stub(button/card/code). 실제 UI 프리미티브는
  web `src/shared/ui/`에 있다.
- **배포**: web은 **Vercel** (`main` → 프로덕션, `develop` → preview). native 앱이 이 web을 WebView로 소비.

## Follow-ups (하네스 후속 — 아직 미도입)

아래는 **현재 레포에 없거나 미연결**이며, 에픽 **#33 "하네스 구축"** 의 서브이슈에서 도입 예정이다.
도입 전까지 "있는 것"처럼 실행/전제하지 말 것. (각 항목이 실제로 커밋되면 해당 내용을 위 본문으로 올린다.)

| 항목                                 | 현재 상태                                           | 도입 예정     |
| ------------------------------------ | --------------------------------------------------- | ------------- |
| `.claude/skills/issue-creator/*`     | 레포에 없음 (타 프로젝트서 가져와 moyeo 맞춤 검토)  | 스킬 이슈     |
| design-check 훅 (토큰 하드코딩 검사) | 도입 여부 미정 (지금은 `className-convention` 룰만) | rules/훅 이슈 |
