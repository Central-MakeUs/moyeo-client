# Issue #3: CRT-03 시간 범위 / 날짜만 선택 (일정 계열)

> ⚠️ **SUPERSEDED (2026-07-27)** — 이 이슈 분해는 이전 사이클(CRT-01~06 걸어서 도달, 제출 없음) 기준이며
> **더 이상 작업 기준이 아니다.** 현재 작업 기준은 GitHub epic **#99**와 서브 이슈 **#100~#109**다.
>
> 무효가 된 주요 전제: 모임 유형 선택이 위저드 페이지(`/meetings/new/type`)라는 것,
> CRT-01=기본정보 / CRT-02=모임유형이라는 번호 체계(2026-07-27에 **교체**됨),
> 진행률 분모에 유형 선택이 포함된다는 것.
>
> 살아 있는 문서: [`spec-fixed.md`](./spec-fixed.md)(공통 계층 SoT, 변경 반영본) ·
> `docs/fe-implement-spec/create/`(화면별 SoT).

> 입력: [`issues.md` Issue 3](./issues.md) · 기준: [`spec-fixed.md`](./spec-fixed.md), 화면 [`crt-03`](../../fe-implement-spec/create/crt-03/crt-03.md).
> 범위: 시작·종료 시간 또는 "날짜만" 선택 → draft 저장 → `/deadline` 이동. 일정 계열(SCHEDULE_ONLY/AND_PLACE)만 진입.

## 확정된 시그니처 (2026-07-25, 자율 진행)

### 타입 / 스토어 (시간 필드 추가)

```typescript
// model/create-meeting-draft.ts
export type ScheduleInputType = 'DATE_ONLY' | 'DATE_AND_TIME';

// State 추가
scheduleInputType: ScheduleInputType | null; // 초기 null
availableStartTime: string | null; // 'HH:mm' 24h, 초기 null
availableEndTime: string | null; // 'HH:mm' 24h, 초기 null

// Actions 추가
setScheduleInputType: (value: ScheduleInputType | null) => void;
setAvailableStartTime: (value: string) => void;
setAvailableEndTime: (value: string) => void;
```

### step-config (time-range 완성 조건 추가)

```typescript
// isStepComplete('time-range', draft):
//   DATE_ONLY            → true
//   DATE_AND_TIME        → start·end 모두 존재 && end > start (문자열 'HH:mm' 사전순 비교)
//   그 외(null)          → false
```

### useStepGuard (분기 스텝 대응)

```typescript
// getSteps(planningType)에 step이 없으면(예: PLACE_ONLY/null에서 'time-range') 진입 불가 → replace.
// 기존: index<=0 ? true. 변경: index===-1 → false, index===0 → true, index>0 → 선행 전부 완성.
```

### 컴포넌트 Props / 페이지

```typescript
// ui/time-range-step.tsx
export interface TimeRangeStepProps {
  onNext: () => void;
}
export function TimeRangeStep(props: TimeRangeStepProps): JSX.Element;
// PageHeader "어느 시간대에 만날 예정인가요?" / "해당 시간대 내에서 일정을 정할 수 있어요"
// 빠른 선택: 아침 06:00~12:00 / 점심 12:00~18:00 / 저녁 18:00~23:00 / 하루종일 09:00~18:00
//   → 클릭 시 scheduleInputType='DATE_AND_TIME' + start/end 설정
// 시작/종료 InputButton → TimePicker drawer (HH:mm ↔ 오전/오후+시 변환)
// "날짜만 정하고 싶어요" 토글 → DATE_ONLY (재클릭 시 해제). DATE_ONLY면 빠른선택·시간 비활성
// 다음: isStepComplete('time-range', draft) 일 때만 활성

// app/(protected)/meetings/new/time-range/page.tsx
('use client');
export default function CreateMeetingTimeRangePage(): JSX.Element;
// const allowed = useStepGuard('time-range'); if (!allowed) return null;
// <TimeRangeStep onNext={() => router.push(stepToPath(nextStep('time-range', pt)!))} />
```

### 설계 결정

- **AC-2 "시작 09:00·종료 18:00"은 빠른 선택 "하루종일"과 동일** → 휠 피커를 jsdom에서 구동하는 대신 하루종일
  버튼 클릭으로 검증(테스트 가능·실제 기능). 수동 시간 피커(drawer)는 실제 화면에 넣되 단위 테스트 대상 아님.
- **날짜만 = 토글**(DATE_ONLY ↔ null) — DATE_ONLY일 때 빠른선택·시간 비활성. 재클릭으로 시간 모드 복귀(막다른 UX 회피).
- 시간 비교는 'HH:mm' 사전순으로 충분(동일 포맷·2자리 0패딩).

---

## 테스트 시나리오

### 정상 (happy path)

- [x] [정상] isStepComplete — should return true for 'time-range' when scheduleInputType DATE_AND_TIME and start '09:00' end '18:00'
- [x] [정상] isStepComplete — should return true for 'time-range' when scheduleInputType DATE_ONLY
- [x] [정상] TimeRangeStep — should set start '09:00' end '18:00' and scheduleInputType DATE_AND_TIME when '하루종일' is clicked
- [x] [정상] TimeRangeStep — should enable the 다음 button when '하루종일' is selected
- [x] [정상] CreateMeetingTimeRangePage — should push '/meetings/new/deadline' when 다음 is clicked with a valid time range

### 경계 (boundary)

- [x] [경계] isStepComplete — should return false for 'time-range' when scheduleInputType DATE_AND_TIME and end '09:00' is not after start '18:00'
- [x] [경계] isStepComplete — should return false for 'time-range' when scheduleInputType is null
- [x] [경계] TimeRangeStep — should set scheduleInputType DATE_ONLY when '날짜만 정하고 싶어요' is clicked
- [x] [경계] TimeRangeStep — should disable the '하루종일' quick-select when '날짜만 정하고 싶어요' is selected

### 예외 (exception)

- [x] [예외] TimeRangeStep — should keep the 다음 button disabled when nothing is selected (scheduleInputType null)
- [x] [예외] CreateMeetingTimeRangePage — should replace '/meetings/new' when planningType is null (guard)

## AC 커버리지

| AC (issues.md)           | 커버하는 시나리오                                     |
| ------------------------ | ----------------------------------------------------- |
| AC-1 (가드 planningType) | [예외] Page replace when planningType null            |
| AC-2 (시간 범위 저장)    | [정상] TimeRangeStep 하루종일 sets + [정상] 다음 활성 |
| AC-3 (종료≤시작 무효)    | [경계] isStepComplete end not after start → false     |
| AC-4 (날짜만)            | [경계] DATE_ONLY 저장 + [경계] 하루종일 비활성        |
| AC-5 (다음 이동)         | [정상] Page push '/meetings/new/deadline'             |

```

```
