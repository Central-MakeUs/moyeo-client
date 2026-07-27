# Issue #4: CRT-04 마감 시간 설정

> ⚠️ **SUPERSEDED (2026-07-27)** — 이 이슈 분해는 이전 사이클(CRT-01~06 걸어서 도달, 제출 없음) 기준이며
> **더 이상 작업 기준이 아니다.** 현재 작업 기준은 GitHub epic **#99**와 서브 이슈 **#100~#109**다.
>
> 무효가 된 주요 전제: 모임 유형 선택이 위저드 페이지(`/meetings/new/type`)라는 것,
> CRT-01=기본정보 / CRT-02=모임유형이라는 번호 체계(2026-07-27에 **교체**됨),
> 진행률 분모에 유형 선택이 포함된다는 것.
>
> 살아 있는 문서: [`spec-fixed.md`](./spec-fixed.md)(공통 계층 SoT, 변경 반영본) ·
> `docs/fe-implement-spec/create/`(화면별 SoT).

> 입력: [`issues.md` Issue 4](./issues.md) · 화면 [`crt-04`](../../fe-implement-spec/create/crt-04/crt-04.md).
> 범위: 마감 기한(일·시간) 또는 "마감 없이" → deadlineMinutes 변환·저장 → `/cover` 이동.
> 일정 계열(CRT-03→)·위치 계열(CRT-02→) 둘 다에서 진입.

## 확정된 시그니처 (2026-07-25, 자율 진행)

### 타입 / 스토어 (마감 필드 추가)

```typescript
// model/create-meeting-draft.ts
deadlineMinutes: number | null; // 초기 null
noDeadline: boolean; // 초기 false
setDeadlineMinutes: (value: number | null) => void;
setNoDeadline: (value: boolean) => void;
```

### 순수 함수 + step-config

```typescript
// model/to-deadline-minutes.ts (신규)
export function toDeadlineMinutes(days: number, hours: number): number; // days*1440 + hours*60

// isStepComplete('deadline', draft):
//   noDeadline === true                              → true
//   deadlineMinutes !== null && deadlineMinutes >= 10 → true  (서버 최소 10분)
//   그 외                                            → false
```

### 컴포넌트 Props / 페이지

```typescript
// ui/deadline-step.tsx
export interface DeadlineStepProps {
  onNext: () => void;
}
export function DeadlineStep(props: DeadlineStepProps): JSX.Element;
// PageHeader "언제까지 답변받을까요?" / "정해진 시간이 지나면 자동으로 조율이 마감돼요"
// 빠른 선택: 6시간(0,6) / 1일(1,0) / 3일(3,0) / 7일(7,0) → toDeadlineMinutes로 변환해 setDeadlineMinutes
// 마감 기한 설정 InputButton → DurationPicker drawer (일 0~7, 시간 0~23)
// 리마인더 안내 문구, "마감 기한 없이 여유롭게 답변받을게요" 토글 → noDeadline
// noDeadline이면 빠른선택·피커 비활성. 다음: isStepComplete('deadline', draft) 일 때 활성

// app/(protected)/meetings/new/deadline/page.tsx
('use client');
export default function CreateMeetingDeadlinePage(): JSX.Element;
// useStepGuard('deadline') → TimeRange와 동일 패턴. onNext → push(stepToPath(nextStep('deadline', pt)!))
```

### 설계 결정

- **7일 프리셋 = 10080분**은 서버 상한(4320) 초과지만, 기획대로 UI에서 선택 가능하게 둔다(서버 상한 확장 요청은
  별도 트랙, crt-04 §10). isStepComplete는 로컬 유효성(≥10분)만 판정하고 상한은 강제하지 않는다.
- **마감 없이 = 토글**(noDeadline ↔). noDeadline true면 빠른선택·피커 비활성.
- **AC-7(뒤로가기)**: `router.back()`이 history로 진입 경로(위치=type, 일정=time-range)를 자동 복원. BackButton의
  `router.back()` 호출은 Issue 1에서 이미 검증됨 → 이 이슈에서 새 테스트 없이 커버리지 표에만 매핑.

---

## 테스트 시나리오

### 정상 (happy path)

- [x] [정상] toDeadlineMinutes — should return 1440 when called with (1, 0)
- [x] [정상] toDeadlineMinutes — should return 360 when called with (0, 6)
- [x] [정상] isStepComplete — should return true for 'deadline' when noDeadline is true
- [x] [정상] DeadlineStep — should set deadlineMinutes to 1440 when '1일' quick-select is clicked
- [x] [정상] DeadlineStep — should enable the 다음 button when '1일' is selected
- [x] [정상] CreateMeetingDeadlinePage — should push '/meetings/new/cover' when 다음 is clicked with a valid deadline

### 경계 (boundary)

- [x] [경계] toDeadlineMinutes — should return 4320 when called with (3, 0)
- [x] [경계] isStepComplete — should return false for 'deadline' when deadlineMinutes is 0 and noDeadline is false
- [x] [경계] DeadlineStep — should set noDeadline true when '마감 기한 없이 여유롭게 답변받을게요' is clicked
- [x] [경계] DeadlineStep — should disable the '1일' quick-select when '마감 기한 없이' is selected

### 예외 (exception)

- [x] [예외] DeadlineStep — should keep the 다음 button disabled when nothing is selected (deadlineMinutes null, noDeadline false)

## AC 커버리지

| AC (issues.md)         | 커버하는 시나리오                                                        |
| ---------------------- | ------------------------------------------------------------------------ |
| AC-1 (분 변환)         | [정상] (1,0)→1440, (0,6)→360                                             |
| AC-2 (0분 무효)        | [경계] isStepComplete deadlineMinutes 0 → false                          |
| AC-3 (noDeadline 완성) | [정상] isStepComplete noDeadline true → true                             |
| AC-4 (빠른 선택)       | [정상] DeadlineStep 1일 → 1440 + [정상] 다음 활성                        |
| AC-5 (마감 없이)       | [경계] noDeadline true + [경계] 1일 비활성                               |
| AC-6 (다음 이동)       | [정상] Page push '/meetings/new/cover'                                   |
| AC-7 (뒤로가기)        | BackButton `router.back()` (Issue 1) + 브라우저 history — 새 테스트 없음 |

```

```
