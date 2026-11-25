---
paths:
  - 'apps/web/src/entities/**'
---

# entities 레이어 (1)

도메인 개념 하나 = slice 하나. "이 서비스에 무엇이 존재하는가"를 담는다.

---

## 1. 무엇이 entity인가

**명사이고, 서버 데이터 모델과 대응되며, 여러 기능에서 함께 쓰인다.**

현재 slice: `auth` · `guest-session` · `meeting` · `nickname` · `onboarding` · `participant` · `place` · `schedule` · `session`

| 판단                                               | entity인가       |
| -------------------------------------------------- | ---------------- |
| "모임", "참여자", "장소" 처럼 서비스가 다루는 대상 | ✅               |
| "모임 만들기", "일정 확정하기" 처럼 **행동**       | ❌ → `features`  |
| "홈 상단 바", "로그인 드로어" 처럼 **화면 조각**   | ❌ → `widgets`   |
| "버튼", "스피너" 처럼 도메인 무관 UI               | ❌ → `shared/ui` |

## 2. 구조

```
entities/{slice}/
├── model/     # 타입, 도메인 로직, 상태(store)
├── api/       # 이 엔티티의 서버 통신 — 생성 API를 감싸는 훅
├── ui/        # 이 엔티티를 표시하는 컴포넌트
├── lib/       # 이 엔티티에만 쓰이는 유틸
└── index.ts   # 배럴 — 외부는 이것만 본다
```

네 segment 전부를 만들 필요는 없다. **필요한 것만 만든다.**

**Query/Mutation 래퍼 훅은 `api/`에 둔다.** `model/`은 서버를 모르는 타입·순수 로직·store 자리다.

> ⚠️ **기존 위반** — `entities/meeting/model/use-meetings-query.ts`, `use-meeting-detail-query.ts`, 다른 entity의
> `model/use-*-query.ts`는 `api/`로 옮길 대상이다 (`entities/meeting/api/use-invitation.ts`가 기준 위치). 새 훅은 `api/`에 만든다.

## 3. `ui/`는 표시 전용이다

entity의 UI는 **받은 데이터를 그리기만 한다.** 무엇을 할지는 모른다.

```tsx
// ✅ entities/meeting/ui/meeting-card.tsx — 표시만 하고, 동작은 prop 으로 받는다
interface MeetingCardViewProps {
  meeting: MeetingSummary;
  onSelect?: (meetingId: number) => void;
}

// ❌ 엔티티 UI 가 스스로 라우팅까지 결정한다
function MeetingCard({ id }: { id: number }) {
  const router = useRouter();
  return <div onClick={() => router.push(`/meetings/${id}`)}>…</div>;
}
```

**왜** — 같은 카드가 홈과 다른 목록에서 다르게 동작해야 한다.
동작을 안에 박으면 두 번째 사용처에서 복제하게 된다. "클릭하면 무엇을 한다"는 `features`의 일이다.

**좋은 실제 예** — `entities/meeting/ui/confirmed-meeting-list-item.tsx`. props 주석에 "어디로 갈지는 호출부가 정한다"가
박혀 있고, 목적지는 `widgets/home`의 `ConfirmedMeetingSection`이 정한다.

> ⚠️ **기존 위반** — `entities/meeting/ui/meeting-card.tsx`의 `MeetingCard`는 안에서 `useRouter().push('/meetings?code=…')`를 한다.
> 표시 전용 `MeetingCardView`가 따로 있으니, 이동은 위젯이 `MeetingCardView` + `onClick`으로 붙이는 게 맞다.
> 새 코드는 `MeetingCard` 형태를 따르지 않는다 (`docs/work/backlog.md`).

## 4. `model/`

- **타입** — 서버 응답 타입은 orval이 만들어 두므로 **다시 정의하지 않는다.**
  `@/shared/api`의 타입을 재사용하고, 화면용 파생 타입(`MeetingSummary` 등)만 여기에 둔다
- **도메인 로직** — 순수 함수. "확정됐는가", "차단 사유가 설명 가능한가" 같은 판단. 테스트를 붙이기 가장 싸다
- **상태** — Zustand store는 `model/{slice}-store.ts`. 상세는 `state-convention.md`

도메인 판단의 실제 예 — 판단 근거까지 주석에 남긴다:

```ts
// entities/meeting/model/meeting-confirmation.ts
/**
 * 확정 응답에서 다음 행선지를 정한다.
 * 남은 항목이 있는지는 서버가 `status`로 알려주므로 프론트가 다시 세지 않는다.
 */
export function toConfirmationOutcome(response: MeetingConfirmationResponse): ConfirmationOutcome {
  return response.status === 'CONFIRMED' ? 'final' : 'partial';
}
```

이 판단을 widget·page의 `if`로 흩어 두면 두 번째 화면에서 조건이 갈라진다. **entity model에 한 번** 둔다.

## 5. 서버 통신

생성 API는 slice의 래퍼와 루트 배럴 뒤에서 필요한 것만 노출한다. 래퍼가 하는 일은 **변환·옵션·enabled 가드**다.

```ts
// entities/meeting/api/use-invitation.ts — 응답을 화면 모델로 정규화 + 빈 코드면 요청하지 않음
export function useInvitation(inviteCode: string) {
  return useGetInvitation<MeetingInvitation | null>(inviteCode, {
    query: {
      enabled: inviteCode.length > 0,
      select: toMeetingInvitation, // 화면은 optional 필드를 다시 풀어보지 않는다
    },
  });
}
```

- 변환·옵션이 전혀 없으면 전달만 하는 래퍼를 만들지 말고 **배럴에서 필요한 생성 훅만 이름을 붙여 re-export**한다. `export *`로 생성물 전체를 공개하지 않는다
- **queryKey 파일을 만들지 않는다.** orval이 `getGetMyMeetingsQueryKey()` 같은 팩토리를 이미 생성한다
- 상세는 `api-convention.md`

## 6. 금지

- ❌ **cross-slice import** — `entities/meeting`이 `entities/participant`를 직접 참조 (훅이 차단)
  공통이 필요하면 `shared`로 내리거나, 조합은 `widgets`/`features`에서 한다
- ❌ **상향 import** — `features`/`widgets`/`_pages`/`_app` 참조 (훅이 차단)
- ❌ API 래퍼에서 store를 import — 데이터 흐름이 순환한다 (`state-convention.md`)
- ❌ 한 slice에 두 도메인을 섞기 — `entities/meeting-and-place` 같은 이름이 나오면 쪼갠다

## 7. 배럴

외부에서 쓸 것만 내보낸다. 내부 구현을 전부 re-export 하지 않는다. 값과 타입을 함께 내보낼 땐 인라인 `type`.

```ts
// entities/meeting/index.ts (발췌)
export { useMeetingsQuery } from './model/use-meetings-query';
export type { UseMeetingsQueryResult } from './model/use-meetings-query';
export { toMeetingInvitation, type MeetingInvitation } from './model/to-meeting-invitation';
export { ConfirmedMeetingListItem } from './ui/confirmed-meeting-list-item';
export type { ConfirmedMeetingListItemProps } from './ui/confirmed-meeting-list-item';
```

- `availability-time-ranges-to-cell-keys.ts` 같은 내부 변환 함수는 **다른 slice가 실제로 쓸 때만** 배럴에 올린다
- 배럴이 길어지면 "이 slice가 너무 많은 걸 공개하고 있다"는 신호다. 쪼갤지 먼저 본다
