---
name: tdd-green
description: TDD의 Green 단계를 수행한다. `tdd-red` 가 만든 실패(Red) 테스트를, **하나씩 통과시키는 최소한의 구현 코드**만 작성하여 초록(Green)으로 바꾼다. 입력은 GitHub 이슈 번호이며 `docs/features/{feature}/issue-{N}.md` 의 시그니처·시나리오·AC를 기준으로 삼는다. 실행 순서는 (1) `pnpm test` 로 실패 목록 확인 → (2) collect 실패면 시그니처만 있는 stub 생성 → (3) `docs/design-system/` 디자인 컨텍스트 로드 → (4) 첫 실패 테스트를 통과시키는 최소 코드 작성 → (5) 재실행·회귀 확인(최대 5회 피드백 루프) → (6) issue 체크박스 `[x]` → (7) 다음 실패로 반복 → (8) 전체 통과 후 커버리지 측정(참고용) → (9) 요약. **테스트 파일은 절대 수정하지 않고, 테스트에 없는 기능·불필요한 추상화·디자인 문서에 없는 시각 요소는 만들지 않는다.** Use when (1) 사용자가 `/tdd-green <이슈번호>` 명령을 쓸 때, (2) "Green 단계", "테스트 통과시켜줘", "최소 구현", "Red 끝났으니 구현해줘", "실패 테스트 초록으로" 등을 언급할 때, (3) `tdd-red` 로 모든 시나리오가 Red 가 된 직후 구현을 시작하는 단계에서. 사용자가 스킬 이름을 직접 말하지 않아도, 실패하는 테스트를 통과시키는 구현 맥락이 감지되면 적극적으로 사용한다.
---

# TDD Green

`tdd-red` 가 만들어 둔 **실패하는 테스트**를 입력으로 받아, 그 테스트를 통과시키는 **가장 작은 구현**을 작성한다. 테스트가 요구하지 않는 것은 만들지 않는다 — Green 단계의 목표는 "완성도 높은 코드"가 아니라 "빨간 막대를 초록으로 바꾸는 최소 변화"다.

이 스킬은 **구현 코드(`src/` 의 실제 동작)** 만 작성/수정한다.
**테스트 파일(`*.test.ts(x)`)은 한 줄도 고치지 않는다** — 테스트가 사양(spec)이고, 구현이 거기에 맞춰지는 것이지 그 반대가 아니다. 테스트가 틀렸다고 판단되면 코드를 비틀어 맞추지 말고 멈추고 사용자에게 보고한다.

# 입력

- `$ARGUMENTS` — GitHub 이슈 번호 (예: `6`)
- 슬래시 호출: `/tdd-green 6`
- 전제: `tdd-red` 가 끝나 해당 이슈의 모든 시나리오가 Red(실패) 상태이고, `docs/features/{feature}/issue-{N}.md` 가 존재한다.

# 핵심 원칙

1. **최소 구현 (Minimal change to green)**
   - 지금 빨간 테스트 **하나**를 통과시키는 데 필요한 코드만 쓴다.
   - "이왕 만드는 김에" 다음 시나리오까지 미리 구현하지 않는다. 그 동작은 그 테스트를 작성할(이미 작성된) 차례에 검증된다.
   - 테스트가 강제하지 않는 분기·옵션·헬퍼는 만들지 않는다 (`## 제약` 참고).

2. **한 번에 하나씩 (Red → Green, 반복)**
   - 실패 테스트 1개 선택 → 통과 코드 작성 → 재실행 → 초록 확인 + 회귀 확인 → 다음.
   - 여러 테스트를 한꺼번에 통과시키려고 큰 덩어리를 쓰면, 무엇이 무엇을 초록으로 만들었는지 추적이 끊긴다.

3. **회귀 금지 (Don't break green)**
   - 새 코드가 이미 통과하던 테스트를 깨면 안 된다. 매 단계 `pnpm test` 전체를 돌려 초록이 유지되는지 본다.

4. **테스트는 불가침, 시그니처는 issue-{N}.md 기준**
   - 통과시키려고 테스트의 단언이나 셀렉터를 바꾸지 않는다.
   - 구현의 이름·타입은 `issue-{N}.md` 의 `## 확정된 시그니처` 를 따른다. stub(`tdd-red` 가 만든 껍데기)의 시그니처를 살로 채우는 것이지, 시그니처 자체를 바꾸는 게 아니다.

5. **디자인은 적용하되 발명하지 않는다**
   - UI 컴포넌트는 테스트가 요구하는 **동작**을 충족하면서, `docs/design-system/` 의 **시각 스펙**(색/간격/레이아웃/상태별 표현)을 함께 입힌다.
   - 디자인 문서에 없는 시각 요소(테두리, 그림자, 새 색)는 임의로 추가하지 않는다.

# 파이프라인

```
tdd-red 완료 (해당 이슈 전 시나리오 Red)
        │
        ▼ 1. pnpm test — 실패 목록 + 개수 파악
        ▼ 2. collect 실패 감지 — 시나리오 수 vs Tests 수 비교 → 불일치면 stub 생성
        ▼ 3. 디자인 컨텍스트 로드 (docs/design-system/, issue "디자인 참고", CLAUDE.md)
        │
        ├─▶ 4. 첫 실패 테스트 통과시키는 최소 코드 작성 ◀─┐
        │   5. pnpm test — 통과 + 회귀 확인 (최대 5회 루프) │
        │   6. issue-{N}.md 해당 항목 [x] 체크            │
        │   7. 다음 실패 테스트 ───────────────────────────┘
        │
        ▼ 8. 전체 통과 → pnpm --filter @repo/web exec vitest run --coverage (참고용, 테스트 추가 금지)
        ▼ 9. 결과 요약
```

---

## 단계 1: 실패 목록 파악

```bash
pnpm test
```

- 출력의 `Tests N failed | M passed (T)` 줄에서 **전체 테스트 수 `T`** 와 실패 수를 확인한다.
- 어떤 파일의 어떤 `it(...)` 이 왜 실패하는지(대부분 `not implemented`) 목록화한다.
- 이 목록이 이번 Green 작업의 todo다. 하나씩 지워 나간다.

## 단계 2: collect 실패 감지 (stub 보강)

vitest는 **collect**(테스트 파일 import → 테스트 목록 수집) → **run**(본문 실행) 2단계로 동작한다. import 대상 모듈이 없으면 collect가 깨져 그 파일의 시나리오가 **집계되지 않는다**. 그러면 "전부 Red"가 아니라 "일부는 보이지도 않는" 상태다.

**판정 방법** — 두 수를 비교한다.

- (A) `issue-{N}.md` 의 `## 테스트 시나리오` 아래 `### 정상 / ### 경계 / ### 예외` 에 적힌 **시나리오 줄 수** (각 `- ...` 한 줄이 시나리오 하나. `## AC 커버리지` 표의 행은 세지 않는다).
- (B) `pnpm test` 가 보고한 **Tests 총수 `T`**.

`B < A` 이면 import 대상 모듈이 없어 collect가 누락된 것이다. 빠진 모듈에 **시그니처만 있는 stub**을 만들어 전체 테스트가 인식되게 한다.

```ts
// apps/web/src/shared/ui/primitives/calendar/use-calendar-range.ts — stub
export function useCalendarRange(): {
  selectedRange: { from?: Date; to?: Date };
  selectDay: (day: Date) => void;
} {
  throw new Error('not implemented');
}
```

stub의 이름·파라미터·반환 타입은 `issue-{N}.md` 시그니처와 정확히 일치해야 한다. 본문은 `throw new Error('not implemented')` 한 줄뿐이다 — 이건 단계 4에서 바로 살로 채울 자리다.

> 보통 `tdd-red` 가 stub을 이미 만들어 두므로 `A === B` 라 이 단계는 건너뛴다. `B < A` 일 때만 보강한다.

## 단계 3: 디자인 컨텍스트 로드

구현 대상에 **UI 컴포넌트가 포함될 때만** 수행한다 (순수 훅·API·타입만 건드리는 이슈는 건너뛴다).

1. **디자인 시스템** — `docs/design-system/` 디렉터리를 기준으로 한다.
   - 진입점 `docs/design-system/README.md` 를 먼저 읽는다.
   - 만들 컴포넌트와 비슷한 게 `docs/design-system/components/` 에 있으면 그 스펙(클래스·구조·상태별 표현)을 그대로 따른다.
   - 색/타이포가 필요하면 `foundations/color.md`(atomic: common/neutral/accessible + semantic 매핑) · `foundations/typography.md`(SUIT 8스타일) 토큰을 쓴다.
   - 레이아웃/간격은 `foundations/grid.md`(그리드·spacing), 모서리는 `foundations/radius.md` 를 참고한다. **spacing·shadow 토큰은 미확정**이므로 Tailwind 기본 스케일을 쓰고 임의 px·`box-shadow` 를 하드코딩하지 않는다.
   - 하지 말아야 할 것은 `guidelines.md`(DO/DON'T)에서 확인한다 (핵심: **색은 반드시 토큰 class로 — 하드코딩 금지**, 면=`primary`·상호작용 단계=`accessible-*`, **미확정(spacing/shadow/error)은 임의로 발명하지 않고 TODO로 남김**).
2. **이슈의 디자인 참고** — `issue-{N}.md` 에 `## 디자인 참고`(또는 "디자인 참고") 섹션이 있으면 함께 본다.
3. **CLAUDE.md 컨벤션** — named export, `<ComponentName>Props` 인터페이스 + 구조분해, early return 분기, Tailwind v4 등 코드 스타일을 따른다.
4. **문서가 없으면** — `docs/design-system/` 도 이슈의 디자인 섹션도 없으면 이 단계를 건너뛰고 **CLAUDE.md 컨벤션만** 따른다. 없는 디자인을 지어내지 않는다.

## 단계 4: 최소 구현 작성

실패 목록에서 **맨 위 하나**를 고른다. 그 테스트가 단언하는 것만 충족하도록 stub의 본문을 구현으로 바꾼다.

- 에러 메시지와 단언(`expect(...)`)을 읽고, "이 줄을 통과시키려면 코드가 무엇을 반환/렌더/호출해야 하는가"만 생각한다.
- UI 컴포넌트면 단계 3에서 읽은 **디자인 스펙의 Tailwind 클래스·레이아웃·상태별 표현을 그대로** 적용한다. 동작(테스트가 보는 것)과 외형(디자인 문서가 정하는 것)을 같이 만든다.
- 테스트가 보지 않는 동작은 넣지 않는다. (예: 캘린더 이슈가 "시작일 클릭 후 종료일 클릭 시 range가 채워진다"만 요구하면, 드래그 프리뷰·비활성 날짜 정책은 별도 시나리오가 있을 때 구현한다.)

## 단계 5: 재실행 + 회귀 확인 (피드백 루프, 최대 5회)

```bash
pnpm test
```

- **목표 테스트가 초록 + 기존 초록이 유지** → 단계 6으로.
- **아직 실패** → 에러 메시지를 읽고 원인을 분석해 코드를 고친 뒤 이 단계를 **다시** 실행한다.
  - 이 수정→재실행을 **최대 5회** 반복한다.
  - 5회 후에도 실패하면 멈추고, **무엇이 왜 실패하는지(에러 메시지·시도한 수정·막힌 지점)** 를 사용자에게 보고한다. 테스트를 고쳐서 억지로 통과시키지 않는다.
- **새로 깨진 기존 테스트(회귀)** 가 있으면 그것도 같은 루프로 즉시 처리한다 — 회귀를 남긴 채 다음으로 넘어가지 않는다.

> 빠르게 좁혀 돌리려면 `pnpm --filter @repo/web test -- <파일경로>` 또는 `pnpm --filter @repo/web exec vitest run -t "should ... when ..."` 로 단건 확인 후, 마지막에 `pnpm test` 전체로 회귀를 본다.

## 단계 6: issue-{N}.md 체크

방금 초록이 된 시나리오 줄을 `issue-{N}.md` 에서 체크 완료로 표시한다.

- **진행 추적은 `- [ ]` / `- [x]` 마크다운 체크박스로 한다.**
- 현재 시나리오 줄이 `- [정상] Calendar — should ...` 처럼 체크박스 없이 카테고리 태그만 있으면, **처음 만질 때 `- [ ]` 를 앞에 붙여 정규화**한다: `- [ ] [정상] Calendar — should ...`.
- 통과한 줄은 `- [x] [정상] Calendar — should ...` 로 바꾼다.
- 한 번에 한 줄만, 방금 통과시킨 시나리오에 대해서만 체크한다.

> 참고: 이상적으로는 `test-scenarios`/`tdd-red` 가 처음부터 `- [ ]` 체크박스로 시나리오를 내보내면 정규화 단계가 사라진다. Green 은 두 형식(`- [정상]...` / `- [ ] [정상]...`) 모두를 받아 동작하도록 만든다.

## 단계 7: 다음 실패로 반복

남은 실패 테스트가 있으면 단계 4로 돌아간다. 실패 목록이 빌 때까지 4→5→6→7 을 반복한다.

## 단계 8: 전체 통과 후 커버리지 (참고용)

모든 테스트가 초록이 되면 커버리지를 **측정만** 한다.

```bash
pnpm --filter @repo/web exec vitest run --coverage
```

- 미커버 라인(Uncovered Line)을 확인한다.
- 미커버가 **시나리오에서 빠진 케이스로 의심**되면 → **사용자에게 보고**한다 ("이 분기는 어떤 시나리오도 안 건드립니다, 누락 아닐까요?").
- **커버리지를 올리려고 테스트를 추가하지 않는다.** 커버리지는 누락 시나리오를 발견하는 참고 지표일 뿐, Green 단계의 산출물이 아니다. 시나리오 보강이 필요하면 `test-scenarios` 단계로 되돌리는 게 맞다.

## 단계 9: 결과 요약

마지막에 한 번에 보고한다.

- 통과시킨 시나리오 수 / 전체 (`it` 개수 기준, `issue-{N}.md` AC 커버리지와 1:1 대조).
- 새로 만들거나 수정한 `src/` 파일 목록.
- 커버리지 측정 결과와, 미커버로 인해 **보고한 누락 의심 케이스**(있다면).
- 5회 루프로도 못 푼 테스트(있다면)와 그 사유.

---

## 제약 (반드시 지킬 것)

- **테스트에 없는 기능 구현 금지** — 테스트가 검증하지 않는 동작·옵션·엣지 처리는 만들지 않는다. "있으면 좋을 것 같아서"는 Green 의 일이 아니다.
- **테스트 파일 수정 금지** — `*.test.ts(x)` 는 사양이다. 통과시키려고 단언/셀렉터/모킹을 바꾸지 않는다. 테스트가 틀렸다고 판단되면 멈추고 보고한다.
- **불필요한 추상화 금지** — 한 곳에서만 쓰는 헬퍼·제네릭·추상 레이어를 미리 만들지 않는다. 중복이 실제로 생기고 테스트가 그걸 강제할 때 비로소 추출한다.
- **디자인 발명 금지** — `docs/design-system/` 의 스펙은 적용하되, 문서에 없는 시각 요소(테두리·그림자·새 색·임의 간격)를 더하지 않는다. 문서가 없으면 CLAUDE.md 컨벤션만 따른다.

---

## 구현 예시

### 훅 구현 — `useCalendarRange.ts`

stub 을 테스트가 요구하는 최소 동작으로 채운다. (예: 이번 범위가 시작일/종료일 저장뿐이면 드래그 프리뷰나 disabled 정책은 넣지 않는다.)

```ts
import { useState } from 'react';

export function useCalendarRange() {
  const [selectedRange, setSelectedRange] = useState<{ from?: Date; to?: Date }>({});

  const selectDay = (day: Date) => {
    setSelectedRange((current) => {
      if (!current.from || current.to) return { from: day };
      return day < current.from ? { from: day, to: current.from } : { from: current.from, to: day };
    });
  };

  return { selectedRange, selectDay };
}
```

### 컴포넌트 구현 — `Calendar.tsx`

동작(날짜 선택 → `onSelect`, 선택 구간 표시)은 테스트가 정하고, 클래스·레이아웃은 디자인 시스템에서 가져온다. 실제 구현은 `apps/web/src/shared/ui/primitives/calendar/` 의 기존 `react-day-picker` 래퍼와 `docs/design-system/components/calendar.md` 스펙을 따른다.

```tsx
interface CalendarRangeLabelProps {
  from?: Date;
  to?: Date;
}

export function CalendarRangeLabel({ from, to }: CalendarRangeLabelProps) {
  if (!from) return <p className="text-regular-14 text-neutral-500">날짜를 선택하세요</p>;
  if (!to) return <p className="text-regular-14 text-neutral-700">종료일을 선택하세요</p>;
  return (
    <p className="text-medium-14 text-neutral-900">{`${from.toLocaleDateString()} - ${to.toLocaleDateString()}`}</p>
  );
}
```

---

## 자주 하는 실수 (피할 것)

- **테스트를 고쳐서 통과시키기**
  - 빨간 막대를 보고 테스트의 단언을 느슨하게 바꾸면 그건 Green 이 아니라 **사양 훼손**이다. 구현을 고친다. 정말 테스트가 틀렸다면 멈추고 보고한다.

- **한 테스트에 다음 시나리오까지 미리 구현**
  - "어차피 다음에 필요하니까" hover preview·disabled 정책·월 이동 정책을 미리 넣는 식. 지금 빨간 테스트가 강제하지 않는 코드는 검증되지 않은 코드이고, 다음 시나리오의 Red→Green 신호를 흐린다.

- **회귀 무시하고 전진**
  - 새 코드가 기존 초록을 깼는데 "내 시나리오는 통과했으니" 넘어가면 안 된다. `pnpm test` 전체가 초록이어야 다음으로 간다.

- **디자인 문서를 안 읽고 외형 지어내기**
  - 테스트는 텍스트·역할만 보므로 클래스가 틀려도 통과한다. 그러나 디자인 시스템을 무시하면 `guidelines.md`(DON'T) 위반(색 하드코딩·임의 spacing·미확정 요소 발명)이 쌓인다. UI 작업이면 `docs/design-system/` 을 먼저 읽는다.

- **커버리지를 올리려고 테스트 추가**
  - 미커버 라인은 **누락 시나리오를 의심할 단서**일 뿐이다. Green 단계에서 테스트를 새로 쓰면 Red 없이 Green 을 만든 셈 — TDD 사이클을 건너뛴 것이다. 보고만 하고, 보강은 `test-scenarios`/`tdd-red` 로 되돌린다.

- **5회 루프를 무한히 늘리기**
  - 같은 테스트를 6번, 10번 고쳐 돌리는 건 대개 사양 이해가 틀렸거나 시그니처가 안 맞는다는 신호다. 5회에서 멈추고 사람에게 상황을 넘긴다.

- **불필요한 추상화 선반영**
  - 한 번만 쓰는 유틸을 새 공용 폴더로 빼거나, 안 쓰는 제네릭 타입을 만들기. 테스트가 요구하지 않으면 해당 FSD slice 안에 둔다.
