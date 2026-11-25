# 코드 품질 — 네이밍 · 표현 · 주석 · 함수

**모든 코드에 적용된다.** 리팩터 때만이 아니라 새로 쓸 때도 같다.
컴포넌트 고유 규칙은 `component-convention.md`, 파일 배치는 `fsd-*.md`, 팀 합의 원문은 `docs/conventions/code-conventions.md`.

---

## 1. 네이밍

아래는 **단독으로 쓰지 않는다.** 무엇에 대한 것인지가 빠져 있다.

```
data · temp · info · item · value · result · handle · get
```

```ts
const data = await getMeeting(); // ❌
const meeting = await getMeeting(); // ✅
```

| 대상          | 규칙                            | 예                                     |
| ------------- | ------------------------------- | -------------------------------------- |
| Boolean       | `is` · `has` · `should` · `can` | `isLoading` · `hasError` · `canSubmit` |
| 이벤트 핸들러 | `handle` + 대상 + 동작          | `handleDrawerClose`                    |
| 이벤트 prop   | `on` + 동작                     | `onSelect` · `onDismiss`               |
| 커스텀 훅     | `use`                           | `useMeetingsQuery`                     |

- 약어보다 명시: `btn` ❌ → `button` ✅. 관례가 굳은 것(`id`, `url`, `api`)은 예외
- **파일명은 kebab-case** — 컴포넌트·훅·유틸·스토어 전부. 코드 안은 컴포넌트·타입 PascalCase, 변수·함수 camelCase, 상수 SCREAMING_SNAKE_CASE

## 2. 표현

- **중첩 삼항 금지** — 변수로 분해하거나 early return
- **3단 넘는 중첩 회피** — guard clause로 평탄화
- **`else` 회피** — `if`가 항상 return하면 `else`를 쓰지 않는다
- **항상 중괄호** — 한 줄 `if`도 `{ }`

```tsx
// ❌ else 체인 + 중괄호 없음
if (session.status === 'loading') return <SessionFallback />;
else if (session.status === 'anonymous') return <LoginPrompt />;
else return <Home viewer={session.viewer} />;

// ✅ guard clause — 각 분기가 return 하므로 else 가 필요 없다
if (session.status === 'loading') {
  return <SessionFallback />;
}
if (session.status === 'anonymous') {
  return <LoginPrompt />;
}
return <Home viewer={session.viewer} />;
```

```tsx
// ❌ 중첩 삼항
const label = isConfirmed ? (hasPlace ? '확정' : '일정만 확정') : isExpired ? '마감' : '조율 중';

// ✅ 판단을 함수로 뽑고 early return — 도메인 판단이면 entities/*/model 로
function toMeetingStatusLabel(meeting: MeetingSummary): string {
  if (meeting.isExpired) {
    return '마감';
  }
  if (!meeting.confirmedScheduleDate) {
    return '조율 중';
  }
  return meeting.confirmedPlaceName ? '확정' : '일정만 확정';
}
```

레이아웃 수치는 매직 넘버가 아니다 (`constants-convention.md`).

## 3. 주석

주석은 코드를 번역하지 않고, **코드만으로 알 수 없는 판단 근거와 제약**을 보존한다.

- 인라인 주석은 WHY·외부 제약·트레이드오프를 1~2줄로
- JSDoc은 공개 API나 호출 순서·부작용 같은 계약이 중요한 함수에만. 타입과 이름을 `@param`으로 반복하지 않는다
- 긴 배경은 `docs/`로 옮기고 코드에는 핵심 이유와 링크만 남긴다 (예: `crt-07.md §9-4`)
- 임시 조치는 작업 일지 대신 **제거 조건**을 적는다
- 삭제한 코드의 흔적은 남기지 않는다. 이력은 Git이 갖는다

```ts
// ❌ 코드가 이미 말하고 있다
// 초대 코드를 가져온다
const inviteCode = searchParams.get(INVITE_CODE_PARAM);
```

**moyeo에 있는 좋은 주석** — 전부 "왜"를 말하고, 지우면 누군가 같은 함정에 다시 빠진다.

```ts
// shared/lib/cn.ts — 외부 라이브러리의 동작 제약
// tailwind-merge 는 숫자 radius 를 모른다(기본 스케일이 t-shirt 사이즈). 등록하지 않으면
// 베이스와 className 의 radius 가 둘 다 남아 className 이 지는 경우가 생긴다.

// entities/meeting/ui/confirmed-meeting-list-item.tsx — 데이터의 예외 케이스
// 확정 일정이 없는 모임이 있다. 장소만 조율하면 날짜가 아예 없고, 그때 parseISO('')가
// Invalid Date가 되어 format이 던진다. 값이 있을 때만 만든다.

// entities/session/model/session-contract.ts — 레이어 규칙 때문에 생긴 구조
// HTTP client에 세션 구현을 주입한다. shared는 session entity를 import할 수 없다. (의존성 주입)
```

```ts
// app/(protected)/meetings/[meetingId]/invite/page.tsx — "왜 여기서" 를 남긴 effect
/**
 * 생성 플로우의 끝이라 여기서 draft를 비운다. 제출 훅에서 비우면 `router.replace` 직후
 * 아직 살아 있는 위저드 페이지가 리렌더되고, 가드가 빈 draft를 보고 홈으로 되돌려
 * 이 화면으로의 이동을 덮어쓴다(spec-fixed §7).
 */
React.useEffect(() => {
  reset();
}, [reset]);
```

JSDoc은 타입을 되풀이하지 않고 **호출자가 알아야 할 계약**을 쓴다.

```ts
// ✅ 언제 쓰고 언제 쓰지 말지까지 — entities/meeting/api/use-invitation.ts
/**
 * 초대 코드로 모임 정보를 조회한다.
 * 서버에서 이미 같은 초대를 조회하는 화면이라면 이 훅 대신 서버가 받은 값을 props로
 * 내리는 편이 낫다. 같은 데이터를 두 번 가져오지 않기 위함이다.
 */

// ❌ 이름과 타입을 그대로 반복한다
/**
 * @param nickname 닉네임
 * @returns 정리된 닉네임
 */
function formatNickname(nickname: string): string { ... }
```

임시 조치는 이슈 번호보다 **제거 조건**이 중요하다.

```ts
// ❌ TODO: 나중에 수정
// ✅ API 가 nickname 을 non-null 로 보장하면 이 fallback 을 제거한다.
const nickname = response.nickname ?? '';
```

## 4. 함수

| 항목            | 기준                                                                  |
| --------------- | --------------------------------------------------------------------- |
| **단일 책임**   | 두 가지를 동시에 하면 분리한다 (데이터 변환 + 사이드이펙트 → 두 함수) |
| **길이**        | 줄 수보다 책임 수. 여러 추상화 수준이 섞이면 분해                     |
| **인자 수**     | 의미를 읽기 어려우면 이름 있는 옵션 객체로                            |
| **반환 타입**   | 공개 API·복잡한 함수는 명시, 자명한 지역 함수는 추론 허용             |
| **side effect** | `useEffect` · mutation · 로깅은 순수 함수와 섞지 않는다               |
| **예외**        | 에러를 삼키지 않는다. `catch`가 있으면 처리하거나 re-throw            |

```ts
// ❌ 에러를 조용히 삼킨다 — 사용자는 아무 일도 안 일어난 줄 안다
try {
  await copyLink();
} catch {}

// ✅ 처리하거나(알림) 다시 던진다
try {
  await copyLink();
} catch (error) {
  toast.add({ description: '링크를 복사하지 못했어요' }); // 문구는 기획 확인 대상
  throw error;
}
```

```ts
// ❌ 변환과 사이드이펙트가 한 함수에
function submitMeeting(draft: CreateMeetingDraft) {
  const body = { name: draft.title.trim(), deadlineMinutes: draft.deadlineHours * 60 };
  return createMeeting(body);
}

// ✅ 변환은 순수 함수로 — 테스트가 네트워크 없이 끝난다 (features/meeting/create-meeting/model/to-create-meeting-request.ts)
const body = toCreateMeetingRequest(draft);
return createMeeting(body);
```

## 5. React 컴포넌트

- **한 컴포넌트 = 한 책임.** JSX가 200줄을 넘으면 서브컴포넌트로 분리
- 핸들러는 `handle*`로 분리한다. JSX 안 인라인 람다는 한 줄일 때만
- **`useEffect`는 도메인 로직 둥지가 아니다.** 판단은 `model/`의 순수 함수로, 컴포넌트는 표시와 연결만

```tsx
// ❌ effect 안에서 도메인 판단까지 한다
useEffect(() => {
  if (response.status === 'CONFIRMED') router.replace('/meetings/confirmed');
}, [response]);

// ✅ 판단은 entity model, 컴포넌트는 결과에 따라 연결만
const outcome = toConfirmationOutcome(response); // entities/meeting/model
if (outcome === 'final') {
  router.replace(CONFIRMED_PATH);
}
```

- `useEffect`가 꼭 필요한 건 **외부 시스템과의 동기화**(브릿지 리스너, `window` 읽기, SDK 초기화)다.
  props·state로 계산할 수 있는 값을 effect로 state에 옮겨 담지 않는다 — 렌더 중에 계산한다

## 6. 요청받지 않은 변경을 하지 않는다

- **화면 문구·CSS 클래스·콘텐츠는 요청 없이 바꾸지 않는다.** 이상해 보이면 지적만 한다
- 작업 범위 밖의 문제는 그 자리에서 고치지 않고 기록한다 (`work-record.md`)
