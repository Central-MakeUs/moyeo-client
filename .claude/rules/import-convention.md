---
paths:
  - 'apps/web/src/**'
  - 'apps/web/app/**'
---

# import 규칙

훅(`fsd-layer-check.mjs`)이 강제하는 것과, 훅이 안 보지만 지켜야 하는 것을 함께 다룬다.

---

## 1. 별칭은 `@/*` 하나뿐

`apps/web/tsconfig.json`의 `paths`는 `@/*` → `./src/*` 하나다(`~storybook/*`은 스토리 전용).
레이어별 별칭은 없다. `vitest.config.ts`의 unit 프로젝트에도 같은 alias가 들어 있다.

## 2. 언제 별칭, 언제 상대 경로

| 대상              | 형태                                     |
| ----------------- | ---------------------------------------- |
| **다른 레이어**   | `@/<layer>/<slice>` — 배럴까지만         |
| **같은 slice 안** | 상대 경로 (`./`, `../`)                  |
| `apps/web/app/`   | 항상 `@/...` (src 밖이라 상대 경로 금지) |
| 외부 패키지       | 패키지명                                 |

```ts
// ✅ 다른 레이어 — 별칭 + 배럴
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';

// ✅ 같은 slice 안 — 상대 경로
import type { MeetingSummary } from './meeting-summary';

// ❌ 레이어를 넘는 상대 경로 — 훅이 차단한다
import { cn } from '../../../shared/lib/cn';
```

**왜** — `../../../`는 파일이 이동하면 조용히 깨지고, 어느 레이어를 참조하는지 안 보인다.

## 3. 배럴까지만 참조한다

```ts
import { Button } from '@/shared/ui/button'; // ✅
import { Button } from '@/shared/ui/button/button'; // ❌
import { useGetMyMeetings } from '@/shared/api'; // ✅
import { useGetMyMeetings } from '@/shared/api/generated/meeting/meeting'; // ❌ 훅이 차단
```

- steiger는 `shared`에서 `fsd/public-api`를 꺼놔서 `shared/ui/*` 내부 경로는 **도구가 안 잡는다.** 사람이 지킨다
- `shared/api/generated/`는 **`shared/api/index.ts`만** 참조한다. 새 orval 태그를 쓰게 되면 그 배럴에 re-export를 추가한다

## 4. type-only는 `import type`

```ts
import type { MeetingSummary } from './meeting-summary';
import { toApiAssetUrl, useGetMyMeetings, type Item } from '@/shared/api'; // 값과 섞이면 인라인 type
```

배럴에서 타입을 re-export할 때도 마찬가지다.

```ts
export { Spinner, type SpinnerProps } from './spinner'; // ✅
export { Spinner, SpinnerProps } from './spinner'; // ❌
```

**기준은 `verbatimModuleSyntax: true`로 컴파일러가 강제하는 것이다.** 타입을 `type` 없이 import하면 타입 검사가 실패한다.

```
error TS1484: 'ReactNode' is a type and must be imported using
a type-only import when 'verbatimModuleSyntax' is enabled.
```

**왜** — "쓴 대로 내보낸다"는 뜻이다. 타입만 쓰는 import가 런타임 import로 남지 않아 번들이 정확해지고,
무엇보다 규칙이 **문서가 아니라 컴파일러로** 지켜진다.

> ⚠️ **기존 위반** — moyeo는 아직 `verbatimModuleSyntax`가 꺼져 있다(`packages/typescript-config`).
> 켜는 작업은 기존 위반 import를 함께 고쳐야 해서 별도 `INFRA` 작업이다 (`docs/work/backlog.md`).
> 그 전까지는 **사람이 지킨다.**

## 5. 정렬

Prettier는 import 순서를 건드리지 않고, ESLint에도 정렬 규칙이 없다. **사람이 지킨다.** 그룹 사이는 빈 줄.

```ts
import * as React from 'react'; // 1. react

import { useRouter } from 'next/navigation'; // 2. next / 외부 패키지
import { useQueryClient } from '@tanstack/react-query';

import { cn } from '@/shared/lib/cn'; // 3. 별칭 (@/) — 아래 레이어부터
import { useMeetingsQuery } from '@/entities/meeting';

import { toMeetingSummary } from './to-meeting-summary'; // 4. 상대 경로
```

3번 그룹 안에서는 `shared → entities → features → widgets → _pages → _app` 순으로 둔다.

## 6. 훅이 차단하는 것

`.claude/hooks/fsd-layer-check.mjs`가 Edit/Write 직전에 `apps/web/src`의 ts/tsx를 검사한다.

1. **상향 import** — 아래 레이어가 위 레이어를 참조
2. **cross-slice import** — 같은 레이어의 다른 slice 직접 참조 (`features/meeting/*` 그룹 안 포함)
3. **레이어를 넘는 상대 경로**
4. **`@/shared/api/generated/...` 직접 참조** (`shared/api` 밖에서)

정적 import뿐 아니라 동적 `import()`와 `require()`도 잡는다.
차단되면 **우회하지 말고 사유대로 고친다.** 정말 필요하다면 구조가 잘못된 것이다.

> 훅은 **새로 쓰는 내용만** 본다. 기존 위반은 `pnpm lint`의 steiger가 사후에 잡는다
> (`pnpm verify`·PR CI에서 돈다. pre-commit에서는 돌지 않는다). `*.test.ts(x)`·`*.stories.tsx`는 훅 검사 대상이 아니다.
