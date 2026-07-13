# 기술 스택

## 기본 환경

| 항목          | 값                                           |
| ------------- | -------------------------------------------- |
| 언어          | TypeScript 5.9                               |
| UI 라이브러리 | React 19                                     |
| 웹 프레임워크 | Next.js 16 (App Router)                      |
| 모바일        | Expo 54 (expo-router) + react-native-webview |
| 모노레포      | Turborepo + pnpm 9 workspace                 |
| Node          | ≥ 18                                         |

구조는 **Expo 네이티브 앱(셸)** 이 **Next.js 웹 화면** 을 WebView로 감싸는 형태다.
자세한 레이아웃은 [project-structure.md](./project-structure.md) 참고.

## web 스택

| 분류            | 사용 기술                                                             |
| --------------- | --------------------------------------------------------------------- |
| UI 컴포넌트     | shadcn/ui (style `radix-nova`) + Radix (`radix-ui`)                   |
| 스타일링        | Tailwind CSS v4, `tw-animate-css`, `tailwind-merge` + `clsx` → `cn()` |
| 컴포넌트 변형   | `class-variance-authority` (cva)                                      |
| 서버 상태       | TanStack Query v5                                                     |
| 클라이언트 상태 | Zustand v5                                                            |
| 날짜/피커       | `date-fns`, `react-day-picker`, `@ncdai/react-wheel-picker`, `vaul`   |
| 아이콘          | `lucide-react`                                                        |
| 폰트            | SUIT Variable (`next/font/local`)                                     |
| 테스트          | Storybook 10 + Vitest 4 (browser mode, Playwright)                    |
| 아키텍처 검사   | `steiger` (FSD 경계 린트)                                             |

## native 스택

Expo SDK 54 / expo-router / React Native 0.81 / `react-native-webview`.
알림(`expo-notifications`), 시큐어 스토리지(`expo-secure-store`) 등 네이티브 기능을 담당한다.

> native 작업 시엔 `apps/native/AGENTS.md` (해당 Expo 버전 공식 문서 우선)를 따른다.

## 공통 도구

| 분류      | 사용 기술                                     |
| --------- | --------------------------------------------- |
| 코드 품질 | ESLint 9 (flat config, `@repo/eslint-config`) |
| 포매터    | Prettier 3 (`prettier-plugin-tailwindcss`)    |
| 커밋 검사 | commitlint + husky + lint-staged              |
| 빌드 캐시 | Turborepo                                     |

상세 규칙은 [code-conventions.md](./code-conventions.md), 훅 동작은 [git-workflow.md](./git-workflow.md) 참고.

## 배포

- 플랫폼: **Vercel**
- `main` → 프로덕션
- `develop` → preview

네이티브 앱은 배포된 web을 WebView로 로드한다.
