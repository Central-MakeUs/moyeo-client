---
paths:
  - 'apps/web/src/**/*.{ts,tsx}'
  - 'apps/web/app/**/*.{ts,tsx}'
---

# 상태 규칙 (Zustand v5 + TanStack Query v5)

---

## 1. 먼저 — 이게 정말 클라이언트 상태인가

가장 흔한 실수는 **서버 데이터를 스토어에 복사하는 것**이다.

| 성격                                          | 도구                                    |
| --------------------------------------------- | --------------------------------------- |
| 서버에서 온 데이터 (모임, 참여자, 장소)       | **TanStack Query**                      |
| URL로 표현되는 것 (초대 코드, 탭, 필터)       | **`useSearchParams` / 라우트 `params`** |
| 한 컴포넌트 안에서만 쓰는 것                  | `useState`                              |
| 폼 입력값                                     | `useState` / 폼 상태                    |
| **여러 화면이 공유하는 순수 클라이언트 상태** | **Zustand**                             |

Zustand는 다음을 모두 만족할 때 선택한다.

- 서로 떨어진 여러 컴포넌트나 라우트가 같은 상태를 읽고 바꾼다
- URL·서버 캐시·폼 상태 중 어느 것도 진실의 원천이 아니다
- 상태의 수명과 초기화 시점을 설명할 수 있다

예를 들어 저장 전 초안을 여러 라우트에서 이어서 편집해야 하고 URL이나 서버에 둘 수 없다면
feature store가 후보가 된다 — moyeo의 모임 생성 위저드가 정확히 이 경우다. 한 화면 안에서 끝나는 입력에는 해당하지 않는다.

중첩 객체 갱신이 번거롭다는 이유만으로 미들웨어(immer 등)를 추가하지 않는다. 상태 구조를 평탄하게 만들 수
있는지 먼저 보고, 반복되는 복잡한 갱신이 실제로 확인될 때 도입을 결정한다.

## 2. 위치와 이름

| 범위                 | 위치                                                   |
| -------------------- | ------------------------------------------------------ |
| 도메인에 속함        | `entities/{slice}/model/{slice}-store.ts`              |
| 한 상호작용 안에서만 | `features/{slice}/model/{slice}-store.ts`              |
| 위젯 내부 UI 상태    | `widgets/{slice}/model/`                               |
| 도메인 무관 전역     | `shared/model/`을 만들지 말고 `_app/`에서 프로바이더로 |

| 항목       | 규칙                                         | 예                               |
| ---------- | -------------------------------------------- | -------------------------------- |
| 파일명     | kebab-case                                   | `draft-store.ts`                 |
| 스토어 훅  | `use{Slice}Store`                            | `useDraftStore`                  |
| State 타입 | `{Slice}State`                               | `DraftState`                     |
| 액션       | `set{속성}` · `reset{속성}` · `{동사}{대상}` | `setTitle` · `reset` · `addStep` |

- 스토어 하나는 응집된 상태 전이 책임 하나만 갖는다. 같은 slice라도 책임이 독립적이면 분리할 수 있다
- **스토어 파일에 React 컴포넌트를 쓰지 않는다**
- **`any` state 금지.** 모든 state에 명시적 인터페이스를 붙인다

```ts
// features/meeting-create/model/meeting-create-store.ts (기준 형태)
import { create } from 'zustand';

interface MeetingCreateState {
  step: number;
  title: string;
  setTitle: (value: string) => void;
  next: () => void;
  reset: () => void;
}

export const useMeetingCreateStore = create<MeetingCreateState>((set) => ({
  step: 0,
  title: '',
  setTitle: (title) => set({ title }),
  next: () => set((s) => ({ step: s.step + 1 })),
  reset: () => set({ step: 0, title: '' }),
}));
```

> ⚠️ **기존 위반**
>
> - `features/meeting/create-meeting/model/create-meeting-draft.ts`(`useCreateMeetingDraft`), `edit-departure-draft.ts`,
>   `participation-draft.ts` — 파일명·훅 이름이 `{slice}-store` / `use{Slice}Store` 규칙과 다르다
> - `shared/model/submission-lock.ts`(`useSubmissionLock`) — shared에 store가 있다. `_app` 프로바이더 또는 사용하는 slice로 옮길 대상
>
> 새 store는 위 규칙대로 만든다 (`docs/work/backlog.md`).

### persist를 쓸 때

- 위저드 draft는 `sessionStorage`(탭 단위·새로고침 복원). 기기에 오래 남길 이유가 없으면 `localStorage`를 쓰지 않는다
- `File`·`Blob`은 JSON 직렬화가 안 된다. data URL 등 직렬화 가능한 형태로 둔다 (`create-meeting-draft.ts` 주석 참고)
- **초기화 시점을 정해 둔다.** 플로우의 끝 화면에서 `reset()`한다. 제출 직후 비우면 아직 살아 있는 위저드 가드가 빈 draft를 보고 되돌린다

## 3. ⚠️ selector 없이 구독하지 않는다

**이 문서에서 가장 중요한 규칙이다.**

```ts
// ❌ 스토어의 어떤 값이 바뀌어도 이 컴포넌트가 리렌더된다
const store = useMeetingCreateStore();

// ✅ 쓰는 값만 구독한다
const step = useMeetingCreateStore((s) => s.step);
const next = useMeetingCreateStore((s) => s.next);
```

전체 구독은 에러가 안 나고 **성능만 조용히 나빠진다.** 리뷰에서도 잘 안 보인다.

여러 값이 필요하면 **각각 따로 구독**한다. 객체를 만들어 반환하면 매번 새 참조라
같은 문제가 생긴다(`useShallow` 없이는).

```ts
// ❌ 매 렌더 새 객체 → 항상 리렌더
const { step, title } = useMeetingCreateStore((s) => ({ step: s.step, title: s.title }));

// ✅ 따로 구독
const step = useMeetingCreateStore((s) => s.step);
const title = useMeetingCreateStore((s) => s.title);

// ✅ 여러 개를 꼭 묶어야 하면 useShallow 로 얕은 비교
import { useShallow } from 'zustand/react/shallow';

const { step, title } = useMeetingCreateStore(
  useShallow((s) => ({ step: s.step, title: s.title }))
);
```

**기본은 따로 구독**이다. 여러 값을 하나의 선택 결과로 다뤄야 할 때만 `useShallow`를 쓴다.

> ⚠️ **기존 위반** — `create-meeting` 스텝 컴포넌트 7곳이 `const draft = useCreateMeetingDraft()` 전체 구독이다 (`docs/work/backlog.md`).

## 4. 액션은 스토어 안에 둔다

상태를 바깥에서 조립하지 말고 **의미 있는 액션**으로 노출한다.

```ts
// ❌ 호출부가 상태 전이 규칙을 안다
setStep(step + 1);

// ✅ 규칙은 스토어가 안다
next();
```

액션은 함수 참조가 안정적이라 selector로 꺼내도 리렌더를 유발하지 않는다.

## 5. React 밖에서는 `getState()` / `setState()`

인터셉터·유틸처럼 컴포넌트가 아닌 곳에서는 훅을 부를 수 없다.

```ts
const token = useSessionStore.getState().accessToken;
useSessionStore.setState({ accessToken: null });
```

> ⚠️ **`shared/`에서는 이 방법도 쓰지 않는다.** `shared`가 `entities`의 스토어를 참조하면
> 상향 import이고 훅이 차단한다. `shared`는 `configureAuth` 같은 **주입**으로 받는다
> (`fsd-shared.md` §3). `getState()`는 **같은 레이어이거나 위 레이어**에서 쓰는 방법이다.

## 6. `api/`에서 store를 import하지 않는다

```
❌ entities/meeting/api/use-meetings.ts  →  entities/meeting/model/meeting-store.ts
```

데이터 흐름이 순환하고, API 훅을 테스트할 때 스토어까지 끌려온다.
**필요한 값은 인자로 받는다.** 스토어와 API를 잇는 건 컴포넌트나 상위 훅의 일이다.

## 7. 서버 상태(TanStack Query)

- `QueryClient`는 `_app/providers/query-provider.tsx`의 `getQueryClient()` 하나. 컴포넌트에서 새로 만들지 않는다
  (서버는 요청마다 새로, 브라우저는 싱글턴. 기본 `staleTime` 60초)
- **queryKey는 orval 생성 팩토리를 쓴다** (`api-convention.md`)
- 생성 훅을 화면에서 직접 부르지 않고 `entities`/`features`의 `api/` 래퍼에서 감싼다
- `staleTime` 같은 옵션은 그 래퍼에 둔다. 화면마다 다르게 주지 않는다
- `@tanstack/eslint-plugin-query`가 lint에서 일부 규칙(의존성 누락 queryKey 등)을 강제한다

## 8. 금지 요약

- ❌ 서버 데이터를 Zustand에 복사
- ❌ selector 없는 전체 구독 / 매번 새 객체를 반환하는 selector
- ❌ `api/`에서 store import
- ❌ `shared/model/` 생성 — shared에는 slice가 없다 (`fsd-shared.md`)
- ❌ 한 스토어에 서로 독립적인 상태 전이 책임을 혼합
