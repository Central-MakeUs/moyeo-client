# Calendar — 🚧 구현 중

> Source: Figma `calender`, `date-item` / `shared/ui/primitives/calendar/`
> `react-day-picker` 기반, 한국어 로케일(`date-fns/locale` `ko`).
> **디자인 요구사항은 반영됐고, 드래그(기간 선택) 동작 요구사항이 구현 중이다.**

## 레이아웃 (Figma `calender`)

- 헤더: `‹  2026년 6월  ›` 캡션(`text-bold-16 neutral-950`) + 좌우 chevron(`neutral-300`),
  우측에 **`기간` 토글 스위치** (기간 선택 모드 on/off).
- 요일 행: 일~토, `text-bold-14 neutral-500`.
- 날짜 그리드: 셀 `w-[49px] h-[44px]`. 이전/다음 달 날짜(outside)는 흐리게 표시.

## Date Item 상태 (Figma `date-item`)

| 상태           | 표현                                                 |
| -------------- | ---------------------------------------------------- |
| 기본           | `neutral` 텍스트                                     |
| outside(타 월) | 흐린 회색                                            |
| 오늘/강조      | 빨강 텍스트                                          |
| 선택(single)   | `primary`/`accessible` 채운 원형 배경 + 흰 텍스트    |
| range-middle   | `bg-accessible-50` (옅은 빨강 배경 띠)               |
| range 양 끝    | 셀 모서리 `rounded-l-lg` / `rounded-r-lg` 로 캡 처리 |

> range 관련 modifier: `range_start` / `range_end` / `range_middle` (`calendar/type.ts`).

## 컴포넌트 구조

- `calendar.tsx` — DayPicker 래퍼, `classNames`/`components`/`formatters` 커스터마이즈.
- `calendar-button.tsx` — `CalendarDayButton`, 개별 날짜 셀 버튼.
- `type.ts` — `DayButton` / `CalendarDayButtonProps` 타입.
- chevron 아이콘은 `lucide-react` (`ChevronLeft/Right/Down`).

## 진행 상태 / TODO

- ✅ 월 네비게이션, 한국어 캡션·요일, 셀 레이아웃, range 시각 표현(`accessible-50` 띠).
- 🚧 **드래그로 기간 선택**하는 인터랙션 (메모: `crt02-f01-draggable-calendar`, 브랜치 `feat/#31/customize-calendar`).
- ⬜ `기간` 토글과 single/range 모드 전환 연결.

> 상세 기획/이슈: `docs/features/CRT-02/F01/`.
