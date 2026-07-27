# 모임 생성 위저드 — 이슈 분해 (이번 사이클: CRT-01~06)

> ⚠️ **SUPERSEDED (2026-07-27)** — 이 이슈 분해는 이전 사이클(CRT-01~06 걸어서 도달, 제출 없음) 기준이며
> **더 이상 작업 기준이 아니다.** 현재 작업 기준은 GitHub epic **#99**와 서브 이슈 **#100~#109**다.
>
> 무효가 된 주요 전제: 모임 유형 선택이 위저드 페이지(`/meetings/new/type`)라는 것,
> CRT-01=기본정보 / CRT-02=모임유형이라는 번호 체계(2026-07-27에 **교체**됨),
> 진행률 분모에 유형 선택이 포함된다는 것.
>
> 살아 있는 문서: [`spec-fixed.md`](./spec-fixed.md)(공통 계층 SoT, 변경 반영본) ·
> `docs/fe-implement-spec/create/`(화면별 SoT).

> 기준: [`spec-fixed.md`](./spec-fixed.md) · [`prd.md`](./prd.md). 범위 = CRT-01~06 걸어서 도달, **제출 없음**.
> 아키텍처 = 안2(페이지별 `'use client'` + `useStepGuard`), 공통 부품 = `create-meeting/model`의 step-config.
> 각 이슈는 **수직 슬라이스**: 완료하면 "걸어서 한 화면 더" 나아간다.
>
> 화면 세부 UI(인원 피커 세밀 UX, 글자수 에러 문구, 애니메이션 등)는 Out of Scope(prd §4). 이 이슈들은 **연결
> 계층**(입력→draft 저장→다음 활성/이동→가드/진행률)만 다룬다. 각 화면 상세는 `docs/fe-implement-spec/create/`.

## 의존성 시퀀스

```
Issue 1 (draft store 탄생 · CRT-01)
   └→ Issue 2 (step-config·useStepGuard·resolver 탄생 · CRT-02 분기)
         └→ Issue 3 (CRT-03) ─ 일정 유형 경로
         └→ Issue 4 (CRT-04) ─ Issue 2(위치)·Issue 3(일정) 둘 다에서 도달
               └→ Issue 5 (CRT-05 커버 스텁)
                     └→ Issue 6 (CRT-06 Bridge 도달)
```

각 이슈는 앞 이슈가 draft에 쌓은 값을 선행 조건으로 쓴다. 역방향 개발 금지.

---

## Issue 1: [feat] CRT-01 기본 정보 입력 + CreateMeetingDraft 스토어

### 설명

모임장이 이름·설명·인원을 입력하면 클라이언트 draft에 저장되고, 이름이 있으면 다음 단계로 갈 수 있다.
이 이슈에서 위저드의 심장인 `CreateMeetingDraft`(zustand + persist)가 최초로 태어난다.

### 구현 범위

- `features/meeting/create-meeting/model/create-meeting-draft.ts` — zustand store(신규). 이번 이슈 필드:
  `name` · `description` · `maxParticipants` + setter + `reset`. `persist`(sessionStorage), `coverImage`는
  이후 이슈에서 추가하되 partialize 제외 규칙을 미리 마련.
- `app/(protected)/meetings/new/basic/page.tsx` — `'use client'`, feature UI 조립.
- `features/meeting/create-meeting/ui/basic-step.tsx` — 이름/설명/인원 입력 + 다음 버튼(신규).
- `features/meeting/create-meeting/ui/back-button.tsx` — **버그 수정**: `next/router` → `next/navigation`.
- `index.ts` public API 갱신.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (단위: draft store setter): Given 초기 draft `{ name: '', description: '', maxParticipants: null }`,
When `setName('주말 등산')` 호출, Then `store.getState().name === '주말 등산'`이고 나머지 필드는 불변.

☐ AC-2 (단위: persist sessionStorage): Given `setName('주말 등산')` 실행 후, When 스토어를 새로 생성(재마운트),
Then 복원된 `name === '주말 등산'` (sessionStorage에서 rehydrate).

☐ AC-3 (단위: reset): Given `name='주말 등산'`, `maxParticipants=6`인 draft, When `reset()` 호출,
Then 모든 필드가 초기값(`name===''`, `maxParticipants===null`)으로 돌아간다.

☐ AC-4 (통합: 다음 버튼 비활성): Given `/meetings/new/basic` 렌더 + 이름 미입력, When 화면 확인,
Then "다음" 버튼이 `disabled` 상태다.

☐ AC-5 (통합: 이름 입력 시 활성): Given basic 화면, When 이름 입력란에 `'주말 등산'` 입력,
Then "다음" 버튼이 활성화되고 `draft.name === '주말 등산'`.

☐ AC-6 (통합: 다음 이동): Given 이름이 입력돼 활성화된 상태, When "다음" 버튼 클릭,
Then `router.push('/meetings/new/type')`가 호출된다.

☐ AC-7 (단위: BackButton import): Given `back-button.tsx`, When 모듈을 import,
Then `next/navigation`의 `useRouter`를 사용한다(`next/router` 아님). 클릭 시 `router.back()` 호출.

---

## Issue 2: [feat] CRT-02 모임 유형 선택 + 분기 이동 + step-config/가드 탄생

### 설명

모임장이 세 유형(일정/위치/일정&위치) 중 하나를 고르면 draft에 저장되고, 유형에 따라 다음 화면이 갈린다
(일정 계열→CRT-03, 위치→CRT-04). 이 이슈에서 스텝 파생·가드·resolver 공통 부품이 태어난다.

### 구현 범위

- `model/step-config.ts`(신규) — `getSteps(planningType)` · `requiredKeys(step)` · `isStepComplete(step, draft)`.
  (spec-fixed §5-1/5-2 기준. PLACE_ONLY는 `time-range` 제외.)
- `model/use-step-guard.ts`(신규) — `useStepGuard(requiredKeys)`: 선행 draft 없으면 resolver로 `replace`.
- `app/(protected)/meetings/new/page.tsx` — resolver: draft 완성도 계산해 첫 미완성 스텝으로 `replace`.
- `model/create-meeting-draft.ts` — `planningType` 필드 + setter 추가.
- `app/(protected)/meetings/new/type/page.tsx` + `ui/type-step.tsx`(신규).
- `shared/ui/progress` 연동 — Progress 분모 = `getSteps(planningType).length`.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (단위: getSteps 분기): Given `getSteps`,
When `'SCHEDULE_ONLY'` 호출, Then `['basic','type','time-range','deadline','cover','created','schedule-dates','schedule-times']`;
When `'PLACE_ONLY'` 호출, Then `['basic','type','deadline','cover','created','departure']` (time-range 없음);
When `'SCHEDULE_AND_PLACE'` 호출, Then time-range 포함 + departure 포함.

☐ AC-2 (단위: isStepComplete): Given draft `{ name:'주말 등산', planningType:null }`,
When `isStepComplete('basic', draft)`, Then `true`; When `isStepComplete('type', draft)`, Then `false`.

☐ AC-3 (통합: 유형 선택 저장): Given `/meetings/new/type` 렌더, When "일정 정하기" 카드 클릭,
Then `draft.planningType === 'SCHEDULE_ONLY'`이고 카드가 선택 강조되며 "다음" 버튼 활성화.

☐ AC-4 (통합: 일정 계열 분기 이동): Given `planningType='SCHEDULE_ONLY'` 선택됨, When "다음" 클릭,
Then `router.push('/meetings/new/time-range')`.

☐ AC-5 (통합: 위치 분기 이동): Given `planningType='PLACE_ONLY'` 선택됨, When "다음" 클릭,
Then `router.push('/meetings/new/deadline')` (CRT-03 건너뜀).

☐ AC-6 (통합: 가드 — 선행 없음): Given draft `name===''`(비어있음), When `/meetings/new/type` 직접 진입,
Then 화면을 렌더하지 않고 `router.replace('/meetings/new')`(resolver)로 튕긴다.

☐ AC-7 (통합: resolver 라우팅): Given draft가 비어 있음(name 없음), When `/meetings/new` 진입,
Then `router.replace('/meetings/new/basic')`. Given `name` 채워지고 `planningType` 없음, Then `.../type`로 replace.

☐ AC-8 (단위: Progress 분모): Given `planningType='PLACE_ONLY'`, When Progress 분모 계산,
Then `getSteps('PLACE_ONLY').length === 6`.

---

## Issue 3: [feat] CRT-03 시간 범위 / 날짜만 선택 (일정 계열)

### 설명

일정 계열 모임에서 모임장이 시작·종료 시간을 정하거나 "날짜만 정하기"를 선택하면 draft에 저장되고 마감
단계로 넘어간다.

### 구현 범위

- `model/create-meeting-draft.ts` — `scheduleInputType` · `availableStartTime` · `availableEndTime` 추가.
- `model/step-config.ts` — `time-range` 완성 조건 추가.
- `app/(protected)/meetings/new/time-range/page.tsx` + `ui/time-range-step.tsx`(신규).

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (통합: 가드 — planningType 필요): Given draft `planningType===null`, When `/meetings/new/time-range` 직접 진입,
Then resolver로 `replace`.

☐ AC-2 (통합: 시간 범위 저장): Given time-range 화면(`planningType='SCHEDULE_ONLY'`), When 시작 `09:00`·종료 `18:00` 선택,
Then `draft.scheduleInputType==='DATE_AND_TIME'`, `availableStartTime==='09:00'`, `availableEndTime==='18:00'`, 다음 활성.

☐ AC-3 (단위: 종료≤시작 무효): Given `isStepComplete('time-range', draft)` with `availableStartTime='18:00'`,
`availableEndTime='09:00'`, `scheduleInputType='DATE_AND_TIME'`, Then `false`.

☐ AC-4 (통합: 날짜만 정하기): Given time-range 화면, When "날짜만 정하고 싶어요" 선택,
Then `draft.scheduleInputType==='DATE_ONLY'`, 시간 피커 비활성화, 다음 버튼 활성화.

☐ AC-5 (통합: 다음 이동): Given 유효한 시간 범위 또는 날짜만 선택됨, When "다음" 클릭,
Then `router.push('/meetings/new/deadline')`.

---

## Issue 4: [feat] CRT-04 마감 시간 설정

### 설명

모임장이 마감 기한(일·시간)을 정하거나 "마감 기한 없이"를 선택하면 분(deadlineMinutes)으로 변환돼 draft에
저장되고 커버 단계로 넘어간다. 위치 계열(CRT-02→CRT-04)과 일정 계열(CRT-03→CRT-04) 둘 다에서 도달한다.

### 구현 범위

- `model/create-meeting-draft.ts` — `deadlineMinutes` · `noDeadline` 추가.
- `model/to-deadline-minutes.ts`(신규 순수함수) — `(days, hours) => minutes`.
- `model/step-config.ts` — `deadline` 완성 조건 + requiredKeys(planningType 필요).
- `app/(protected)/meetings/new/deadline/page.tsx` + `ui/deadline-step.tsx`(신규).

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (단위: 분 변환): Given `toDeadlineMinutes`, When `(1, 0)` 호출, Then `1440`; When `(0, 6)` 호출, Then `360`;
When `(3, 0)` 호출, Then `4320`.

☐ AC-2 (단위: 0분 무효): Given `isStepComplete('deadline', draft)` with `deadlineMinutes===0`, `noDeadline===false`,
Then `false` (서버 최소 10분 위반).

☐ AC-3 (단위: noDeadline 완성): Given draft `noDeadline===true`, When `isStepComplete('deadline', draft)`, Then `true`.

☐ AC-4 (통합: 빠른 선택 반영): Given deadline 화면, When "1일" 빠른 선택 클릭,
Then `draft.deadlineMinutes===1440`, 다음 버튼 활성화.

☐ AC-5 (통합: 마감 없이): Given deadline 화면, When "마감 기한 없이" 선택,
Then `draft.noDeadline===true`, 피커/빠른선택 비활성화, 다음 버튼 활성화.

☐ AC-6 (통합: 다음 이동): Given 유효 마감 또는 noDeadline 선택됨, When "다음" 클릭,
Then `router.push('/meetings/new/cover')`.

☐ AC-7 (통합: 위치 계열 뒤로가기): Given `planningType='PLACE_ONLY'`로 type→deadline 진입(push),
When 뒤로가기 클릭, Then `router.back()`으로 `/meetings/new/type`(CRT-02)로 복귀(history 기반).

---

## Issue 5: [feat] CRT-05 커버 스텁 ("사진 없이 다음")

### 설명

이번 사이클은 사진 앨범 UI를 만들지 않는다(Out of Scope). 커버 화면은 "사진 없이 다음" 경로만 제공하며,
다음 버튼은 항상 활성이고 서버 요청 없이 완료 화면으로 이동한다.

### 구현 범위

- `model/create-meeting-draft.ts` — `coverImage: File | null`(기본 null) 추가 + **persist partialize에서 제외**.
- `model/step-config.ts` — `cover` 완성 조건 = 항상 true.
- `app/(protected)/meetings/new/cover/page.tsx` + `ui/cover-step.tsx`(신규, 스텁).

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (단위: coverImage persist 제외): Given `coverImage`가 File인 draft, When persist 직렬화(partialize),
Then 저장 대상에 `coverImage`가 포함되지 않는다.

☐ AC-2 (통합: 다음 항상 활성): Given `/meetings/new/cover` 렌더(사진 미선택), When 화면 확인,
Then "다음" 버튼이 활성 상태다.

☐ AC-3 (통합: 서버 요청 없이 이동): Given cover 화면, When "다음" 클릭,
Then 어떤 네트워크 요청도 발생하지 않고 `router.push('/meetings/new/created')`.

☐ AC-4 (통합: 가드): Given `deadline` 미완성 draft(`deadlineMinutes===null && noDeadline===false`),
When `/meetings/new/cover` 직접 진입, Then resolver로 `replace`.

---

## Issue 6: [feat] CRT-06 완료(Bridge) 화면 도달

### 설명

모임장이 기본 정보 입력을 마치면 "모임을 만들었어요!" Bridge 화면에 도달한다. 이 화면이 이번 사이클의
종점이다. host 입력·제출은 다음 사이클이므로 "내 정보 입력하기" 버튼은 이번 사이클엔 동작하지 않는다.

### 구현 범위

- `app/(protected)/meetings/new/created/page.tsx` + `ui/created-bridge.tsx`(신규).
- `model/step-config.ts` — `created` 완성 조건(도달 전 스텝 모두 완성).

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (통합: 완료 메시지 도달): Given 앞 스텝(basic~cover) 완성된 draft, When `/meetings/new/created` 진입,
Then "모임을 만들었어요!" 문구가 렌더된다.

☐ AC-2 (통합: 서버 미생성): Given created 화면 렌더, When 화면 확인,
Then 어떤 네트워크 요청도 발생하지 않는다(meetingId 없음).

☐ AC-3 (통합: 내 정보 입력 버튼 — 이번 사이클 비활성): Given created 화면, When "내 정보 입력하기" 버튼 확인,
Then 버튼이 `disabled`이다(다음 사이클 host flow 미구현). _(비활성 vs "준비중" 표기는 구현 시 확정 — 기본: disabled)_

☐ AC-4 (통합: 가드): Given `cover` 미완성 상태로 `/meetings/new/created` 직접 진입,
Then resolver로 `replace`.

---

## 수직 슬라이스 자체 점검

| 이슈 | 완료 시 사용자에게 보이는 동작           | 신규 공통 부품                    |
| ---- | ---------------------------------------- | --------------------------------- |
| 1    | 이름 넣고 다음 → type 도달               | CreateMeetingDraft store          |
| 2    | 유형 고르고 분기 이동, 앞 안 채우면 튕김 | step-config·useStepGuard·resolver |
| 3    | 시간/날짜 정하고 마감으로                | — (draft 필드 추가)               |
| 4    | 마감 정하고 커버로                       | toDeadlineMinutes                 |
| 5    | 사진 없이 다음 → 완료로                  | —                                 |
| 6    | "모임 만들었어요" 도달                   | —                                 |

각 행이 독립적으로 Red→Green→Refactor 가능. 앞 이슈 산출물이 다음 이슈 입력.

```
[GATE] 사용자가 이슈 목록을 읽고 수직 슬라이스·AC 구체성·의존성 순서를 확인할 때까지 대기.
```
