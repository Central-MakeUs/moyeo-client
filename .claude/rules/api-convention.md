---
paths:
  - 'apps/web/src/**/*.{ts,tsx}'
  - 'apps/web/orval.config.ts'
---

# API 규칙 (orval + TanStack Query + MSW)

API 클라이언트는 **손으로 쓰지 않는다.** 백엔드 OpenAPI 문서에서 orval이 생성한다.
설정은 `apps/web/orval.config.ts`.

---

## 1. 흐름

```
백엔드 OpenAPI (/v3/api-docs)
  → orval  (mode: tags-split, client: react-query, httpClient: axios)
  → src/shared/api/generated/          ← 절대 직접 수정하지 않는다 (훅이 차단)
       ├── {tag}/{tag}.ts              API 함수 · Query/Mutation 훅 · queryKey 팩토리
       ├── {tag}/{tag}.msw.ts          MSW 핸들러
       ├── schemas/                    요청·응답 타입 (+ faker)
       └── index.msw.ts · index.faker.ts
  → customInstance  (shared/api/axios-instance.ts — mutator)
       baseURL(NEXT_PUBLIC_API_BASE_URL / 프록시) · Authorization · 401 처리
  → shared/api/index.ts                ← 상위 레이어가 보는 유일한 입구
```

재생성: `pnpm --filter @repo/web orval`

> `clean: true`라 재생성 시 `generated/`가 **통째로 지워진다.** 그 안에 수동 파일을 두지 않는다.
> 손으로 쓴 API(`create-meeting.ts`의 multipart, `fetch-server-today.ts`)는 `shared/api/` 바로 아래에 둔다.

## 2. 상위 레이어는 `@/shared/api` 배럴만 본다

```ts
import { useGetMyMeetings, getGetMyMeetingsQueryKey, type Item } from '@/shared/api'; // ✅
import { useGetMyMeetings } from '@/shared/api/generated/meeting/meeting'; // ❌ 훅이 차단
```

- **새 orval 태그를 쓰게 되면 `shared/api/index.ts`에 re-export 한 줄을 추가한다.** 범위에서 빠진 태그는 주석으로 닫아 둔다(`my-place`)
- 생성물 이름이 겹치면 배럴에서 충돌한다. 재생성 후 `pnpm typecheck`로 확인한다

## 3. orval이 이미 만들어 주는 것 — 다시 만들지 않는다

| 생성물              | 예                                      | 손으로 쓰면 안 되는 이유          |
| ------------------- | --------------------------------------- | --------------------------------- |
| 요청 함수 / 훅      | `getMyMeetings()`, `useGetMyMeetings()` | 명세와 어긋난다                   |
| **queryKey 팩토리** | `getGetMyMeetingsQueryKey()`            | **키가 흩어지면 무효화가 깨진다** |
| 타입                | `Item`, `ErrorType<E>`                  | 응답 타입 재선언 금지             |

```ts
// ❌ 생성된 키와 달라서 invalidate 가 안 먹는다
queryClient.invalidateQueries({ queryKey: ['meetings'] });

// ✅ (features/meeting/confirm-place/model/use-confirm-place.ts)
void queryClient.invalidateQueries({ queryKey: getGetMyMeetingsQueryKey() });
```

`api/query-keys.ts` 같은 파일은 **만들지 않는다.** orval이 소유한다.

## 4. 생성 훅은 도메인 래퍼 뒤에서 쓴다

FSD 의존 방향상 상위 레이어가 `shared`를 import하는 것은 허용되지만, `_pages`와 `widgets`가 생성 훅에
직접 결합하면 orval의 파일명·함수명 변경이 화면 전체로 퍼진다. 생성물은 다음 도메인 경계 뒤에서 노출한다.

- **엔티티 데이터 조회** → `entities/{slice}/api/`
- **사용자 행동(mutation)** → `features/{slice}/api/`

**`@/shared/api`에서 생성 훅·함수를 import하는 곳은 이 두 `api/` segment뿐이다.** (타입 import는 어디서든 허용)

> ⚠️ **기존 위반** — 지금은 `entities/*/model/use-*-query.ts`, `features/meeting/*/model/use-*.ts`에서 생성 훅을 부른다.
> `api/`로 옮길 대상이다 (`docs/work/backlog.md`). 기준 위치의 실제 예는 `entities/meeting/api/use-invitation.ts`.

### 값이 있는 adapter는 훅으로 감싼다

응답을 도메인 모델로 변환하거나 Query 옵션·에러 정책을 통일한다면 adapter 훅을 만든다.

```ts
// entities/meeting/api/use-invitation.ts
export function useInvitation(inviteCode: string) {
  return useGetInvitation<MeetingInvitation | null>(inviteCode, {
    query: {
      enabled: inviteCode.length > 0,
      select: toMeetingInvitation, // model/ 의 순수 변환 함수
    },
  });
}
```

`customInstance`는 Axios 응답 객체가 아니라 응답 본문을 반환한다. 따라서 `select`에서
`response.data`를 다시 읽지 않는다.

### 추가 정책이 없다면 선택적으로 re-export한다

변환·옵션·에러 처리가 전혀 없다면 전달만 하는 함수를 만들지 않는다. 대신 slice의 `api/`와 루트
배럴에서 필요한 생성 API만 선택적으로 re-export한다. `export *`로 생성물 전체를 공개하지 않는다.

```ts
// entities/meeting/api/index.ts
export {
  getGetMyMeetingsQueryKey as getMyMeetingsQueryKey,
  useGetMyMeetings as useMyMeetings,
} from '@/shared/api';

// entities/meeting/index.ts
export { getMyMeetingsQueryKey, useMyMeetings } from './api';
```

이 경우에도 queryKey를 새로 만드는 것이 아니다. orval 팩토리를 도메인 이름으로 제한해 공개할 뿐이다.

### 조회와 표시는 분리한다

entity UI는 데이터를 props로 받아 표시한다. 같은 slice의 API를 import하는 것이 FSD 방향 위반은 아니지만,
조회까지 맡기면 재사용 가능한 표시 컴포넌트가 서버 상태와 결합한다. 조회 훅은 `features`·`widgets`·`_pages`처럼
조합을 담당하는 상위 레이어에서 호출한다.

`useFetchMeetingData`처럼 구현 방식(`Fetch`)과 포괄어(`Data`)를 이름에 넣지 않는다. 도메인 경계에서는
`useMeetings` 또는 구분이 필요할 때 `useMeetingsQuery`처럼 의미를 드러낸다.

## 5. mutation 후 무효화

성공 후 무엇을 무효화할지는 **feature가 결정**한다. orval 키는 URL 문자열 하나가 배열 요소 하나라 형태에 따라 묶을 수 있는 게 다르다.

| 종류          | 생성되는 키                                                             |
| ------------- | ----------------------------------------------------------------------- |
| 파라미터 없음 | `['/api/meetings/me']`                                                  |
| path param    | `['/api/meetings/invitations/abc123/view']` ← 코드가 문자열 안에 박힌다 |
| query param   | `['/api/departure-places/reverse-geocodes', { … }]`                     |

TanStack Query 매칭은 배열 요소 단위 prefix 비교이고, 문자열 요소는 **정확히 일치**해야 한다.

- **query param 계열** — 팩토리를 인자 없이 부르면 family key다
- **path param 형제** — prefix로 묶을 수 없다. 하나씩 지정한다
- **리소스 계열 전체** — `predicate`로 묶는다

```ts
/** 해당 리소스 경로와 그 하위 엔드포인트를 모두 무효화한다. */
function invalidateResource(queryClient: QueryClient, prefix: string) {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const url = String(query.queryKey[0]);
      // '/api/meetings' 가 '/api/meetings-archive' 를 잘못 잡지 않도록 경계를 확인한다
      return url === prefix || url.startsWith(`${prefix}/`);
    },
  });
}

invalidateResource(queryClient, '/api/meetings');
```

**무엇을 고를까**

- 무효화 대상이 **2~3개면 그냥 키를 나열한다.** 가장 정직하고 추적이 쉽다 (`use-confirm-place.ts`가 이 방식)
- 하위 엔드포인트가 많거나 앞으로 늘어날 리소스면 `predicate`
- **어느 경우에도 키를 손으로 만들지 않는다.** 생성 팩토리를 호출하거나 `predicate`로 거른다

> 계층형 키 팩토리(`['meeting', 'detail', id]`)를 직접 만들면 묶기는 쉬워지지만,
> **생성 키와 갈라져 개별 쿼리 무효화가 조용히 깨진다.** 그 위험이 더 크다.

## 6. Query 옵션

- 기본 `staleTime`은 60초(`query-provider.tsx`). 화면마다 바꾸지 않는다. 바꿔야 하면 래퍼에 근거와 함께 둔다
- **`enabled` 가드로 불필요한 요청을 막는다** — 파라미터가 아직 없을 때 (`enabled: Boolean(inviteCode)`)

## 7. 에러 처리

- **401은 인터셉터가 처리한다.** `axios-instance.ts`가 `notifyUnauthorized()`로 세션을 비우기만 하고,
  화면 이동은 가드가 판단한다(공개 화면에서 받은 401이 로그인으로 튕기지 않게). 화면마다 401을 다루지 않는다
- 로그인 관련 요청은 `isUnauthorizedExempt`로 예외 처리된다
- 그 외 에러는 화면에서 다룬다. **에러 문구를 지어내지 않는다.** 명세에 없으면 `확인 필요`로 남긴다

## 8. MSW

- 핸들러는 orval이 생성한다 (`generated/**/*.msw.ts`)
- 현재는 **테스트에서만** 쓴다 (`msw/node`의 `setupServer`). 브라우저 mock 워커는 없다
- 응답 본문보다 **요청 도달·중복 호출·성공/실패 흐름**을 검증한다 (`test-policy.md`)

## 9. 명세가 이상할 때

- `useExamples: false`는 **임시 조치**다 — 서버 example의 null이 스키마 타입과 안 맞아서. 서버가 고치면 되돌린다 (`orval.config.ts` 주석)
- 새 결함을 만나면 우회하기 전에 **서버에 스키마 수정을 요청**하고, 임시 조치는 제거 조건을 주석으로 남긴다

## 10. 재생성 후 검증

```bash
pnpm --filter @repo/web orval
pnpm typecheck
pnpm lint
```

생성물 diff가 크면 **명세가 바뀐 것**이다. 무엇이 바뀌었는지 확인하고 영향 범위를 보고한다.
