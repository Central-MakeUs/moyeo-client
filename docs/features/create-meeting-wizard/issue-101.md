# Issue #101: HOME FAB → 모임 유형 선택 Drawer (CRT-01)

> 화면 SoT: [`crt-01.md`](../../fe-implement-spec/create/crt-01/crt-01.md) ·
> 진입점: [`home-01.md`](../../fe-implement-spec/home/home-01.md) FAB Open ·
> 공통 계층: [`spec-fixed.md`](./spec-fixed.md)

## 확정된 시그니처

### 컴포넌트 Props

```typescript
// apps/web/src/features/meeting/create-meeting/ui/planning-type-drawer.tsx
'use client';

export interface PlanningTypeDrawerProps {
  /** Drawer를 여는 트리거. HOME의 모임 생성 FAB(HOME-01-F06)이 들어온다. */
  trigger: React.ReactNode;
}

export function PlanningTypeDrawer({ trigger }: PlanningTypeDrawerProps): React.JSX.Element;
```

### 모듈 내부 상수 (export 하지 않음)

```typescript
const TYPE_OPTIONS: {
  value: PlanningType; // 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE'
  title: string; // 일정 정하기 / 위치 정하기 / 일정 & 위치 정하기
  description: string;
  selectedIcon: IconName; // 'calendar-primary' | 'pinned-primary' | 'note-primary'
  unselectedIcon: IconName; // 'calendar' | 'pinned' | 'note'
}[];
```

### public API

```typescript
// apps/web/src/features/meeting/create-meeting/index.ts
export { PlanningTypeDrawer, type PlanningTypeDrawerProps } from './ui/planning-type-drawer';
```

### 상태 소유

| 상태                | 소유                    | 근거                                              |
| ------------------- | ----------------------- | ------------------------------------------------- |
| 열림/닫힘           | Drawer 내부 `useState`  | 여닫힘은 Drawer의 관심사. HOME은 배치만 한다      |
| 카드 선택(후보값)   | Drawer 내부 `useState`  | 확정 전에 draft에 쓰면 AC-6(닫아도 불변)이 깨진다 |
| 확정 `planningType` | `useCreateMeetingDraft` | 위저드 전 구간이 공유하는 값                      |

### 확정 동작 순서 (CRT-01-F03)

```
카드 탭        → 로컬 state만 변경 (draft 손대지 않음)
선택 탭        → reset() → setPlanningType(선택값) → router.push('/meetings/new/basic') → close
닫기(배경/Esc) → 로컬 state 초기화, draft 변경 없음, 이동 없음
```

`reset()`이 `setPlanningType()`보다 **먼저**다. reset이 `planningType`까지 초기화하기 때문이다.

### 변경/삭제 파일 (시그니처 없음)

- `app/(protected)/home/page.tsx` — 기존 FAB을 `<PlanningTypeDrawer trigger={...} />`로 감싼다
- `app/(protected)/meetings/new/type/page.tsx` — **삭제** (라우트 제거)

## 테스트 시나리오

> 대상 파일: `planning-type-drawer.test.tsx` (컴포넌트와 colocate)
> `next/navigation`은 mock, draft store는 `useCreateMeetingDraft.setState`/`reset()`으로 준비한다.

### 정상

- [x] [정상] PlanningTypeDrawer — should open the drawer with 3 type cards when trigger is clicked
- [x] [정상] PlanningTypeDrawer — should enable the 선택 button when '일정 정하기' card is selected
- [x] [정상] PlanningTypeDrawer — should set draft.planningType to 'SCHEDULE_ONLY' when 선택 is clicked after choosing '일정 정하기'
- [x] [정상] PlanningTypeDrawer — should call router.push('/meetings/new/basic') when 선택 is clicked
- [x] [정상] PlanningTypeDrawer — should close the drawer when 선택 is clicked
- [x] [정상] PlanningTypeDrawer — should set draft.planningType to 'PLACE_ONLY' when '위치 정하기' is chosen and 선택 is clicked
- [x] [정상] PlanningTypeDrawer — should set draft.planningType to 'SCHEDULE_AND_PLACE' when '일정 & 위치 정하기' is chosen and 선택 is clicked
- [x] [정상] PlanningTypeDrawer — should clear the previous draft (name '이전 모임' → '') before saving when 선택 is clicked

### 경계

- [x] [경계] PlanningTypeDrawer — should render the CTA label as '선택' (not '다음')
- [x] [경계] PlanningTypeDrawer — should disable the 선택 button when no card is selected right after opening
- [x] [경계] PlanningTypeDrawer — should keep only '위치 정하기' selected when it is tapped after '일정 정하기'
- [x] [경계] PlanningTypeDrawer — should show no selected card when the drawer is reopened after closing without 선택
- [x] [경계] PlanningTypeDrawer — should not render a progressbar (위저드 스텝이 아니다)

### 예외

- [x] [예외] PlanningTypeDrawer — should keep draft.planningType null when the drawer is closed with Esc after selecting a card
- [x] [예외] PlanningTypeDrawer — should not call router.push when the drawer is closed without pressing 선택

## AC 커버리지

| AC   | 커버하는 시나리오                                                                                |
| ---- | ------------------------------------------------------------------------------------------------ |
| AC-1 | [정상] should open the drawer with 3 type cards when trigger is clicked                          |
| AC-2 | [경계] CTA label '선택' · [경계] disable when no card is selected                                |
| AC-3 | [정상] set 'SCHEDULE_ONLY' · [정상] router.push · [정상] close                                   |
| AC-4 | [정상] set 'PLACE_ONLY' (이후 흐름 분기는 #100 `getSteps` 단위 테스트가 이미 커버)               |
| AC-5 | [정상] clear the previous draft before saving                                                    |
| AC-6 | [예외] keep planningType null on Esc close · [예외] no router.push on close                      |
| AC-7 | [경계] no progressbar (분모 계산은 #100 `progressPercent` 테스트가 커버)                         |
| AC-8 | 테스트 대상 아님 — `type/page.tsx` 파일 삭제로 확인 (`stepFromPath` null 반환은 #100에서 검증됨) |

> **AC-6 닫기 방법**: 시나리오는 jsdom에서 안정적인 **Esc 키**로 검증한다.
> 오버레이 탭도 vaul 내부에서 동일한 `onOpenChange(false)` 경로를 타므로 같은 동작이다.
