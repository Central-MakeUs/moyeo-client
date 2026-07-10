# Moyeo Design System

> UI·CSS·컴포넌트 작업 시 이 문서를 진입점으로 삼는다.
> **Source of Truth = Figma 시안 + `apps/web/src/_app/globals.css`.**
> 이 문서는 두 소스를 사람이 읽기 쉽게 정리한 것이며, 값이 어긋나면 Figma/`globals.css`가 우선한다.

---

## 한눈에 보는 기준

| 항목      | 값                                                                         |
| --------- | -------------------------------------------------------------------------- |
| 폰트      | **SUIT** (`--font-suit`)                                                   |
| 메인 컬러 | **Primary `#f43630`**                                                      |
| 컬러 체계 | atomic: `common` · `neutral(10~950)` · `accessible(50~950)` · `opacity`    |
| 타이포    | 8종 (extrabold-22 / bold-16·14 / semibold-16·14 / medium-16·14·12)         |
| 기준 화면 | 360 × 800 (모바일), app-shell `max-width: 480px`                           |
| 그리드    | Margin 20 · Gutter 16 · Columns 4                                          |
| Radius    | `--radius: 0.625rem` 파생. **⚠️ Tailwind 기본과 다름** (`rounded-lg`=10px) |
| Spacing   | **미확정** — Tailwind 기본 스케일 사용                                     |
| Shadow    | **미확정** — 현재 시안에 elevation 정의 없음                               |

---

## 토큰 확정 상태

`globals.css` 주석 기준으로, **color / typography 토큰만 `@theme`에 확정**되어 있고
**spacing · radius · shadow는 별도 디자인 토큰이 확정되기 전까지 Tailwind 기본 scale을 사용**한다.
컴포넌트에서는 하드코딩 대신 `bg-primary`, `text-neutral-900`, `text-bold-16`처럼
`@theme` 기반 Tailwind class를 우선 사용한다.

| 토큰 그룹        | 상태      | 근거                                 |
| ---------------- | --------- | ------------------------------------ |
| Color            | ✅ 확정   | Figma `Token`·`Definition`, `@theme` |
| Typography       | ✅ 확정   | Figma `Typography`, `@theme`         |
| Grid             | ✅ 확정   | Figma `그리드 시스템`                |
| Radius           | 🟡 파생   | `globals.css` `--radius` 스케일      |
| Spacing          | 🔴 미확정 | Tailwind 기본(1 unit = 0.25rem) 사용 |
| Shadow/Elevation | 🔴 미확정 | 시안·`@theme`에 정의 없음            |

---

## 문서 구조

```
design-system/
├── README.md              # 이 문서 (진입점)
├── foundations/           # 토큰 (색·타이포·그리드·radius)
├── components/            # 컴포넌트별 명세 (구현/시안 구분)
├── guidelines.md          # DO / DON'T (팀 컨벤션)
└── assets/                # 디자인 시안 이미지 (Figma 내보내기)
```

### foundations/

| 파일                                           | 내용                                                           |
| ---------------------------------------------- | -------------------------------------------------------------- |
| [`color.md`](./foundations/color.md)           | atomic 컬러(common/neutral/accessible/opacity) + semantic 매핑 |
| [`typography.md`](./foundations/typography.md) | SUIT 폰트, 8개 텍스트 스타일                                   |
| [`grid.md`](./foundations/grid.md)             | 그리드(360×800·Margin·Gutter·Columns)·spacing 상태             |
| [`radius.md`](./foundations/radius.md)         | radius 스케일(⚠️ Tailwind와 다름)·elevation 상태               |

### components/

구현된 것(`button` · `input` · `calendar`)과 시안만 있는 것(`controls` · `icons` · `layout` · `overlay` · `pickers`)으로 나뉜다. 각 문서 제목에 `✅ 구현 / 🚧 구현 중 / 🎨 시안만` 표기.

### guidelines.md

[`guidelines.md`](./guidelines.md) — DO / DON'T.

> ⚠️ 디자이너가 명시한 규칙이 아니라, 코드·Figma 시안에서 도출한 **팀 컨벤션**이다.

---

## 디자인 소스(이미지) 두는 곳

| 종류                                 | 위치                           |
| ------------------------------------ | ------------------------------ |
| **시스템 전역** (토큰·공통 컴포넌트) | `design-system/assets/`        |
| **특정 페이지·기능**                 | `docs/features/{기능}/assets/` |

즉 재사용되는 디자인 시스템 시안은 여기 `assets/`에, 개별 화면 시안은 그 기능 폴더에 co-locate 한다.

---

## 컴포넌트 구현 현황

| 컴포넌트                       | 상태       | 위치                             |
| ------------------------------ | ---------- | -------------------------------- |
| Button                         | ✅ 구현    | `shared/ui/primitives/button/`   |
| Input / InputField             | ✅ 구현    | `shared/ui/primitives/input/`    |
| Calendar                       | 🚧 구현 중 | `shared/ui/primitives/calendar/` |
| Input Select · Picker · Switch | 🎨 시안만  | `assets/common-components`       |
| Modal · Dim · Header · CTA 등  | 🎨 시안만  | `assets/common-components`       |
| Icon Set                       | 🎨 시안만  | `assets/common-components`       |
