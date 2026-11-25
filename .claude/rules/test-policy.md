---
paths:
  - 'apps/web/**/*.test.{ts,tsx}'
  - 'apps/web/**/*.stories.tsx'
  - 'apps/web/vitest.config.ts'
  - 'apps/web/src/test-setup.ts'
---

# 테스트 정책

**무엇에 테스트를 쓰고 무엇에 안 쓰는가.** 테스트를 안 쓰는 이유가 더 중요한 규칙이다.

| 실행                 | 명령                                                                      |
| -------------------- | ------------------------------------------------------------------------- |
| 전체 (unit)          | `pnpm test` (turbo → `@repo/web`의 `vitest run --project unit`)           |
| 단건                 | `pnpm --filter @repo/web exec vitest run --project unit -t "테스트 이름"` |
| 파일                 | `pnpm --filter @repo/web exec vitest run --project unit <경로>`           |
| Red 테스트           | `pnpm --filter @repo/web test:red` — 의도적으로 실패하는 테스트만 실행    |
| Storybook (브라우저) | `pnpm --filter @repo/web test:storybook` — 스토리가 렌더되는지만 본다     |

도구: Vitest 4 + jsdom + React Testing Library + jest-dom + user-event + MSW(`msw/node`)

> **테스트는 사용자가 직접 실행한다.** 스킬·작업 중 테스트 단계에서는 실행할 명령만 주고 결과를 기다린다.
> Windows에서 `Timeout waiting for worker to respond`는 테스트 실패가 아니다(콜드 스타트). 다시 실행한다.

---

## 1. 대상별 판정

| 대상                                           | 테스트  | 이유                                                 |
| ---------------------------------------------- | :-----: | ---------------------------------------------------- |
| 순수 함수 / 커스텀 훅 (계산·변환·상태 전이)    | ✅ 우선 | 가장 싸게 분기·경계·회귀를 검증한다                  |
| 확정된 명세의 분기 조건 (빈 값·경계·중복·권한) |   ✅    | 명세를 코드로 고정하는 유일한 수단                   |
| API 흐름 (요청 도달·중복 호출·성공/실패)       | ✅ MSW  | 응답 본문보다 **흐름**을 검증한다                    |
| 라우트 배선 (`app/**/page.test.tsx`)           | ⚠️ 선별 | 가드·리다이렉트·파라미터 해석이 있을 때만            |
| 컴포넌트 렌더링                                | ⚠️ 선별 | 사용자 인터랙션이 있는 것만                          |
| 시각 스타일 · 레이아웃 · 간격                  |   ❌    | Storybook + Figma 대조의 영역                        |
| 네이티브 브릿지 실기기 동작                    |   ❌    | jsdom으로 재현 불가. 브릿지 **메시지 계약**만 테스트 |

**로직을 먼저 순수 함수/훅으로 추출**하면 대부분의 검증이 가벼워진다.
다만 테스트를 위해 제품 코드를 불필요하게 추상화하지 않는다.

## 2. Storybook은 테스트가 아니다

`*.stories.tsx`는 **PM·디자이너가 열어보는 컴포넌트 상태 문서**다. 컴포넌트당 대표 상태만 둔다.
테스트 시나리오를 story로 1:1 옮기지 않는다. 동작 검증은 `*.test.ts(x)`.

## 3. 작성 규칙

**위치** — 대상과 같은 폴더에 co-locate. `button.tsx` → `button.test.tsx`. `app/` 라우트도 같다

**이름** — 한국어 BDD. `[조건]일 때 [동작]하면 [기대 결과]한다`. 값·식별자는 원문 그대로 둔다

```ts
it('isLoading 이면 클릭해도 onClick 이 호출되지 않는다', ...)
```

**import** — `globals`를 켜지 않았으므로 명시적으로 가져온다.

```ts
import { describe, it, expect, vi } from 'vitest';
```

**격리** — 전역 모킹이 다른 테스트로 새지 않게 한다. 기준은 `src/test-setup.ts`가 `afterEach`에서
`cleanup()` + `vi.restoreAllMocks()`를 처리하는 것이다.

> ⚠️ **기존 위반** — 지금 `test-setup.ts`는 `cleanup()`만 한다. `vi.restoreAllMocks()` 추가는 기존 테스트가
> 서로의 mock에 기대고 있지 않은지 확인하며 별도로 한다 (`docs/work/backlog.md`). 그 전까지는 `vi.spyOn`·`vi.stubGlobal`을 쓴 파일에서 직접 되돌린다.
> MSW `setupServer`는 파일마다 `listen` / `resetHandlers` / `close`를 짝지어 둔다.

**jsdom에 없는 API** — `matchMedia`, Pointer Capture, `IntersectionObserver`, `ResizeObserver`, canvas 2D는
`test-setup.ts`가 채워 둔다. 새 라이브러리가 다른 API를 요구하면 **거기에 최소 no-op만** 추가하고 이유를 주석으로 남긴다.

**svg** — unit 프로젝트에 svgr 플러그인이 있어 `Icon`을 렌더할 수 있다. 빼면 `InvalidCharacterError`가 난다.

**쿼리 훅** — `shared/lib/render-with-query.tsx`(기준 위치는 `shared/lib/testing/`)로 QueryClient를 감싼다. 테스트마다 새 client(재시도 off).

## 4. 금지

- ❌ **스냅샷 테스트 남발** — 무엇이 왜 바뀌었는지 못 알려주고, 깨지면 그냥 갱신하게 된다
- ❌ **테스트를 통과시키려고 구현을 비틀기** — 테스트가 틀렸다고 판단되면 멈추고 보고한다
- ❌ **화면 스타일을 CSS 클래스 문자열로 단언** — 단 `cn()`·variant처럼 클래스 조합이 공개 계약인 경우는 예외
- ❌ **테스트를 지우거나 이유 없이 `skip`해서 초록 만들기**

## 5. 알려진 실패를 숨기지 않는다

아직 지원하지 않는 동작은 테스트와 구현 범위에서 함께 제외하고 작업 기록에 남긴다.
이미 보장하기로 한 동작이 깨졌다면 고치거나, 명세 변경 승인을 받은 뒤 테스트를 함께 수정한다.

## 6. Red 테스트 — CI 밖에서 의도를 보존한다

"이 동작이 맞다"고 판단했지만 지금 구현하지 않기로 한 것은 `*.red.test.tsx`로 미리 박아 둘 수 있다.

- `pnpm test`·`pnpm verify`·CI에서는 제외된다(`vitest.config.ts`의 `red` 프로젝트로 분리). `pnpm --filter @repo/web test:red`로만 실행한다
- 파일 첫머리 주석에 **무엇이 왜 아직 실패하는지**를 적는다. 구현하면 초록이 된다
- 구현해서 초록이 되면 파일명에서 `.red`를 지워 일반 테스트로 승격한다. 안 하기로 했으면 파일째 지운다
- CI를 초록으로 만들려고 일반 테스트를 `.red`로 바꾸지 않는다 — 이미 보장하기로 한 동작이 깨진 것이면 §5를 따른다
