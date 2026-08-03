# Issue #171: [feat] 날짜·시간 조율 모임의 게스트 일정 입력

> **선행 문서**: [`prd.md`](./prd.md) ADR-3~5 · [`issues.md`](./issues.md) (Issue 3, SoT) ·
> [`issue-170.md`](./issue-170.md) (제출 파이프라인)
>
> `#170`이 만든 제출 흐름 위에 입력 종류를 하나 넓힌다. 캘린더 대신 시간표를 쓴다.

## 확정된 시그니처

### 시간표 화면

```typescript
// _pages/invite-guest/ui/guest-schedule-times-page.tsx
export interface GuestScheduleTimesPageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
  /** 서버가 준 후보 날짜. 시간표의 열이 된다. 'yyyy-MM-dd' */
  candidateDates: string[];
  /** 모임장이 정한 가능 시간 시작. 'HH:mm' */
  availableStartTime: string;
  /** 모임장이 정한 가능 시간 종료. 'HH:mm' */
  availableEndTime: string;
}
```

`shared/ui/time-grid`의 `AvailabilityTimeGrid`를 쓴다. 열은 후보 날짜, 행은
`buildTimeRows(availableStartTime, availableEndTime)` 결과다. 제출·초안 가드는 `#170`이 만든
`useSubmitGuestJoin`·`isDraftUsableFor`를 그대로 재사용한다.

### 변환 함수 이동 (ADR-5)

```
features/meeting/create-meeting/model/to-availability-time-ranges.ts    → shared/ui/time-grid/
features/meeting/create-meeting/model/from-availability-time-ranges.ts  → shared/ui/time-grid/
```

셀 키 ↔ `ScheduleAvailabilityRequest` 변환이라 **서버 계약과 직결**된다. 두 벌이면 반드시
어긋난다. `#170`에서 날짜 변환기를 `shared/ui/calendar`로 옮긴 것과 같은 기준이다.

`build-past-cell-keys.ts`는 **옮기지 않는다.** 게스트는 지난 시간 비활성화를 쓰지 않아
(아래 참고) 소비처가 하나뿐이다. 필요해지면 그때 옮긴다.

### `pruneScheduleResponse` 확장

```typescript
export function pruneScheduleResponse(
  response: ScheduleResponseRequest | null,
  candidateDates: string[]
): ScheduleResponseRequest | null;
```

시그니처는 그대로고 **동작만 넓어진다.**

- `availableDates`가 있으면 후보 밖 날짜를 걷어낸다 (기존)
- `availableTimeRanges`가 있으면 `candidateDate`가 후보 밖인 항목을 걷어낸다 (추가)
- **없는 키는 만들지 않는다.** 지금은 입력에 `availableTimeRanges`만 있어도 결과에
  `availableDates: []`가 붙는데, 그대로 두면 서버에 두 형식을 함께 보내게 된다.

### 라우트

`app/i/[inviteToken]/(participant)/respond/schedule/page.tsx`의 `DATE_AND_TIME` placeholder를
실제 화면으로 바꾼다. 초대 조회와 서버 오늘 날짜를 `Promise.all`로 함께 받아 내린다.

서버가 `scheduleCandidateDates`를 `ScheduleCandidateResponse[]`(날짜별 시간 범위)로 바꾸면서
top-level `availableStartTime`·`availableEndTime`은 사라졌다. 시간표는
`buildGuestScheduleTimeGrid`가 후보 목록을 열·행·비활성 셀로 변환한다.

### 지난 날짜 비활성화 — 이 이슈에서 함께 넣는다

당초 AC 밖이라 미뤘으나, 게스트 쪽이 모임장 쪽보다 더 급했다. 모임장은 방금 고른 날짜를 바로
쓰지만 **게스트는 며칠 전 만들어진 링크를 나중에 연다** — 후보 날짜가 통째로 과거인 상황이
정상적으로 발생한다. 캘린더 화면도 같은 구멍이라 함께 막았다.

기준 날짜는 클라이언트 훅(`useServerToday`)이 아니라 **라우트가 SSR로 받아 prop으로 내린다.**
화면이 뜬 뒤 조회를 기다리면 그 사이에 지난 칸을 고를 수 있고, 게스트 화면에 로딩·에러 분기를
새로 만들 필요도 없다. 조회에 실패하면 초대 화면으로 되돌린다 — 로컬 시각으로 대신하지 않는다
(spec-fixed §7).

이동한 것:

```
features/meeting/create-meeting/model/build-past-cell-keys.ts → shared/ui/time-grid/
features/meeting/create-meeting/model/to-server-today.ts      → shared/lib/
                                                        신규    shared/api/fetch-server-today.ts
```

`useServerToday`(클라이언트 훅)는 모임장 위저드에만 필요해 옮기지 않았다.

⚠️ `buildPastCellKeys`는 **날짜 단위로만** 판정한다. 오늘 열은 통째로 열려 있어 지금이 20시여도
오늘 18:00 칸을 고를 수 있다. 당일 시각 처리는 `#120`이 다룬다 — 게스트도 같은 구멍을 공유한다.

### 이 이슈에서 다루지 않는 것

- **롱프레스 햅틱** — 모임장 화면은 `postMessageToNative`로 알린다. AC에 없다.
- `departure` 조립 — #172
- 진행 표시 — #173

### 결정 — 라우트 분기는 테스트하지 않는다

AC-3·4는 "일정 화면을 렌더하면 시간표/캘린더가 보인다"인데, 분기는 `page.tsx`(async 서버
컴포넌트) 안에 있어 RTL로 직접 렌더할 수 없다(`issue-146.md`에 같은 제약을 적어뒀다).

**각 화면이 자기 입력 UI를 그리는 것으로 대신한다.** 시간표 화면은 이번 이슈가, 캘린더 화면은
`#170`의 기존 테스트가 덮는다. 라우트의 3줄 분기는 수동 확인 영역으로 남는다.

---

## 테스트 시나리오

파일 위치:

- `features/meeting/invite-participation/model/prune-schedule-response.test.ts` (기존에 추가)
- `features/meeting/invite-participation/model/to-guest-join-request.test.ts` (기존에 추가)
- `_pages/invite-guest/ui/guest-schedule-times-page.test.tsx` (신규)

### 정상

- [x] [정상] pruneScheduleResponse — `availableTimeRanges`에 `2026-08-01`과 `2026-08-25` 항목이 있고 후보가 `['2026-08-01','2026-08-02','2026-08-03']`이면 `2026-08-01` 항목만 남는다
- [x] [정상] GuestScheduleTimesPage — 후보 날짜 `['2026-08-15','2026-08-20']`, 가능 시간 `10:00`~`14:00`이면 두 날짜 열과 시간 행이 보인다
- [x] [정상] GuestScheduleTimesPage — `2026-08-15`의 `10:00` 칸을 고르고 참여하기를 탭하면 요청의 `availableTimeRanges`가 `[{ candidateDate: '2026-08-15', startTime: '10:00', endTime: '11:00' }]`이다

### 경계

- [x] [경계] pruneScheduleResponse — 입력에 `availableTimeRanges`만 있으면 결과에 `availableDates` 키가 생기지 않는다
- [x] [경계] pruneScheduleResponse — 입력에 `availableDates`만 있으면 결과에 `availableTimeRanges` 키가 생기지 않는다
- [x] [경계] toGuestJoinRequest — `syncCandidateDates`로 후보가 바뀐 뒤 호출하면 후보 밖 날짜의 시간 범위가 요청에 실리지 않는다
- [x] [경계] GuestScheduleTimesPage — 아무 칸도 고르지 않으면 참여하기 버튼이 `disabled`다
- [x] [경계] GuestScheduleTimesPage — 날짜별 선택 가능 범위 밖의 시간 칸은 비활성화한다
- [x] [경계] GuestScheduleTimesPage — `serverToday`가 `2026-08-20`이면 `2026-08-15` 열은 전부 비활성화되고 `2026-08-20` 열은 열려 있다
- [x] [경계] GuestSchedulePage — 후보 날짜라도 `serverToday`보다 이전이면 고를 수 없다
- [x] [경계] buildTimeRows — `'10:00:00'`~`'13:00:00'`처럼 서버가 주는 `HH:mm:ss`도 3개 행을 만든다

### 예외

- [x] [예외] GuestScheduleTimesPage — 초안이 없으면 `/i/ABC123/guest`로 돌려보낸다
- [x] [예외] GuestScheduleTimesPage — 가능 시간이 유효하지 않아 행이 없으면 참여하기 버튼이 `disabled`다
- [x] [예외] buildTimeRows — 초가 범위를 벗어난 `'10:00:60'`은 행을 만들지 않는다

## AC 커버리지

| AC   | 커버하는 시나리오                                     |
| ---- | ----------------------------------------------------- |
| AC-1 | [정상] `availableTimeRanges` 후보 밖 제거             |
| AC-2 | [경계] `syncCandidateDates` 후 요청에 안 실린다       |
| AC-3 | [정상] 시간표가 보인다 (라우트 분기는 위 "결정" 참고) |
| AC-4 | `#170`의 기존 캘린더 테스트가 덮는다                  |
| AC-5 | [정상] 고른 칸이 요청의 `availableTimeRanges`가 된다  |
| AC-6 | 모임장 시간 화면 기존 테스트 (함수 이동 후 회귀 확인) |

AC 밖에서 추가한 시나리오는 4건이다.

- [경계] `pruneScheduleResponse`의 키 생성 2건 — 이번에 고치는 동작이라 못박는다. 없는 키를
  만들면 서버에 두 형식을 함께 보내게 된다.
- [경계] 미선택 `disabled` · [예외] 초안 없음 — `#170` 캘린더 화면과 같은 규칙이 시간표에도
  적용되는지 확인한다. 두 화면이 같은 훅을 쓰지만 배선을 빠뜨릴 수 있다.
