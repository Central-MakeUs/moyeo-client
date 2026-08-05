# Issue #102: CRT-02 모임 기본 정보 입력

> 화면 SoT: [`crt-02.md`](../../fe-implement-spec/create/crt-02/crt-02.md) ·
> 에러 표시 정책: [`input.md` §2-1](../../design-system/components/input.md) ·
> 공통 계층: [`spec-fixed.md`](./spec-fixed.md)

## 확정된 시그니처

### 신규 — 이전 스텝 계산

```typescript
// apps/web/src/features/meeting/create-meeting/model/step-config.ts
/**
 * getSteps 순서에서 현재 스텝의 이전 스텝.
 * 첫 스텝이면 null(= 위저드 종료 지점, 뒤로가기가 HOME으로 나가야 함).
 * nextStep이 마지막 스텝에서 null(= 제출 지점)을 주는 것과 대칭이다.
 */
export function prevStep(step: StepKey, input: StepFlowInput): StepKey | null;
```

### 기존 — 그대로 확정

```typescript
// apps/web/src/shared/ui/input-button/input-button.tsx
interface InputButtonProps extends Omit<React.ComponentProps<'button'>, 'value'> {
  label: string;
  value?: string;
  placeholder?: string;
  trailingIcon?: IconName;
  rotateIconOnOpen?: boolean;
}

// apps/web/src/features/meeting/create-meeting/ui/basic-step.tsx
export interface BasicStepProps {
  onNext: () => void;
}
export function BasicStep({ onNext }: BasicStepProps): React.JSX.Element;
```

`BackButton`은 Props 없이 유지한다. `usePathname()` → `stepFromPath()` → `prevStep()`으로 스스로
현재 스텝을 판단한다(`WizardProgress`와 같은 패턴).

### public API

```typescript
// apps/web/src/features/meeting/create-meeting/index.ts
export { BasicStep, type BasicStepProps } from './ui/basic-step';
export { prevStep } from './model/step-config';

// apps/web/src/shared/ui/index.ts
export * from './input-button';
```

### 책임 배치

| 관심사               | 소유                              |
| -------------------- | --------------------------------- |
| 입력값 → draft 쓰기  | `BasicStep`                       |
| 다음 스텝 계산·이동  | `basic/page.tsx` (`nextStep`)     |
| 진입 가드            | `basic/page.tsx` (`useStepGuard`) |
| 뒤로가기 목적지 계산 | `BackButton` (`prevStep`)         |

### 뒤로가기 동작 (CRT-02-F06)

```
prevStep(현재 스텝) === null  → draft.reset() → router.replace('/home')   ← 위저드 종료
prevStep(현재 스텝) !== null  → router.push(stepToPath(prev))            ← 이전 스텝
```

`router.back()`은 쓰지 않는다. history에 의존하지 않는 명시적 종료 동작이어야 한다.

## 테스트 시나리오

> 이미 `basic-step.test.tsx`에 12개 케이스가 있다(입력·에러 문구·버튼 활성). 아래는 **비어 있던 부분**만
> 채운다 — 인원 피커, 라우팅·가드 배선, 뒤로가기 재설계.

### 정상

- [x] [정상] prevStep — should return 'basic' when step is 'time-range' and flow is SCHEDULE_ONLY + DATE_AND_TIME
- [x] [정상] prevStep — should return 'basic' when step is 'deadline' and flow is PLACE_ONLY (time-range를 건너뛴 흐름)
- [x] [정상] BasicStep — should open the participants picker drawer when the participants field is tapped
- [x] [정상] BasicStep — should show '6명' and set draft.maxParticipants to 6 when 6 is picked and 선택 is clicked
- [x] [정상] CreateMeetingBasicPage — should call router.push('/meetings/new/time-range') when 다음 is clicked with planningType 'SCHEDULE_ONLY'
- [x] [정상] CreateMeetingBasicPage — should call router.push('/meetings/new/deadline') when 다음 is clicked with planningType 'PLACE_ONLY'
- [x] [정상] BackButton — should reset the draft and call router.replace('/home') when the current step is 'basic'
- [x] [정상] BackButton — should call router.push('/meetings/new/time-range') when the current step is 'deadline' with SCHEDULE_ONLY

### 경계

- [x] [경계] prevStep — should return null when step is 'basic' (첫 스텝 = 위저드 종료 지점)
- [x] [경계] prevStep — should return null when step is not in the current flow (PLACE_ONLY + 'time-range')
- [x] [경계] BasicStep — should show the previously entered name '주말 등산' when the step is remounted
- [x] [경계] BackButton — should reset the draft and call router.replace('/home') when the pathname is not a wizard step

### 예외

- [x] [예외] CreateMeetingBasicPage — should call router.replace('/meetings/new') when planningType is null (가드)
- [x] [예외] BackButton — should not call router.back() when clicked (history 비의존)

## AC 커버리지

| AC   | 커버하는 시나리오                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------------------- |
| AC-1 | **기존** `should keep the 다음 button disabled when name is '' (empty)`                                                |
| AC-2 | **기존** `should enable the 다음 button when name is '주말 등산' and maxParticipants is set`                           |
| AC-3 | **기존** `should keep the 다음 button disabled when name exceeds 15 characters` + `should show '최대 15자까지…' error` |
| AC-4 | **기존** `should show '최대 100자까지 입력할 수 있어요' error`                                                         |
| AC-5 | [정상] should open the participants picker drawer                                                                      |
| AC-6 | [정상] should show '6명' and set draft.maxParticipants to 6                                                            |
| AC-7 | [정상] router.push('/meetings/new/time-range') with 'SCHEDULE_ONLY'                                                    |
| AC-8 | [정상] router.push('/meetings/new/deadline') with 'PLACE_ONLY'                                                         |
| AC-9 | [경계] should show the previously entered name when the step is remounted                                              |

> **AC 밖 시나리오**: `prevStep` 4개와 `BackButton` 4개는 이슈 AC가 아니라 **crt-02.md CRT-02-F06**
> (뒤로가기 = draft 초기화 + `/home`, history 비의존) 확정에서 나온다. #100에서 TODO로 남겼던 항목이다.

> **AC-5의 "2~20 범위만 선택"**: `NumberPicker`의 `min`/`max` prop 전달까지만 검증한다.
> 휠 피커의 스크롤 한계는 jsdom에서 재현이 어렵고, primitive 자체 책임이다.

## 폐기 대상 테스트

- `back-button.test.tsx`의 `should move back in browser history when clicked`
  → 구 동작(`router.back()`)을 검증하므로 [예외] 시나리오로 대체한다.
