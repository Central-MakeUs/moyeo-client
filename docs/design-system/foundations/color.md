# 컬러 토큰

> Source: Figma `color 토큰` / `컬러 정의`, `globals.css @theme`
> 네이밍 규칙: Figma는 `color-atomic-{category}-{step}`, 코드(Tailwind)는 `{category}-{step}`.
> 예) Figma `color-atomic-neutral-900` → Tailwind `text-neutral-900` / `bg-neutral-900`.

컬러는 **의미 없는 원자 값(atomic)** 을 먼저 정의하고, shadcn 등이 참조하는
**semantic 이름**을 그 위에 매핑하는 2계층 구조다.

---

## 1. Atomic — Common

| 토큰             | Tailwind  | HEX       | 용도             |
| ---------------- | --------- | --------- | ---------------- |
| `common-primary` | `primary` | `#f43630` | 브랜드 메인 컬러 |
| `common-white`   | `white`   | `#ffffff` | 순수 흰색        |
| `common-black`   | `black`   | `#000000` | 순수 검정        |

---

## 2. Atomic — Neutral

무채색 스케일. 배경·텍스트·보더 대부분이 여기서 나온다.

| 토큰          | HEX       | 대표 용도                              |
| ------------- | --------- | -------------------------------------- |
| `neutral-10`  | `#f9f9f9` | 앱 기본 배경(`background`)             |
| `neutral-20`  | `#f7f7f7` | secondary/accent 배경, 피커 하이라이트 |
| `neutral-50`  | `#e7e7e7` | muted 배경                             |
| `neutral-70`  | `#d0d0d0` | **border / input 기본선**              |
| `neutral-100` | `#c4c4c4` | 아이콘 버튼 기본 아이콘색              |
| `neutral-200` | `#b0b0b0` | ghost disabled 텍스트                  |
| `neutral-300` | `#9b9b9b` | 비활성 텍스트                          |
| `neutral-400` | `#8a8a8a` |                                        |
| `neutral-500` | `#737373` | muted-foreground(보조 텍스트)          |
| `neutral-600` | `#5c5c5c` |                                        |
| `neutral-700` | `#474747` |                                        |
| `neutral-800` | `#2a2a2a` |                                        |
| `neutral-850` | `#1c1c1c` |                                        |
| `neutral-900` | `#171717` | 기본 본문/전경(`foreground`)           |
| `neutral-950` | `#0f0f0f` | 최심도 텍스트                          |

> Figma `Definition`에는 `neutral-0`, `neutral-1000`도 스케일 라벨로 보이지만
> `globals.css`에는 `10`~`950`만 토큰화되어 있다. **코드 기준은 10~950.**

---

## 3. Atomic — Accessible

Primary(빨강)의 명도 스케일. 상태(hover/active/focus)·에러 표현에 사용한다.

| 토큰             | HEX       | 대표 용도                  |
| ---------------- | --------- | -------------------------- |
| `accessible-50`  | `#fef2f2` | date-item 선택 배경(옅음)  |
| `accessible-100` | `#ffe2e1` |                            |
| `accessible-200` | `#ffcac8` |                            |
| `accessible-300` | `#ffa5a2` |                            |
| `accessible-400` | `#fd716c` | **버튼 hover**, focus ring |
| `accessible-500` | `#f43730` | destructive(에러)          |
| `accessible-600` | `#e22720` | **버튼 focus-visible**     |
| `accessible-700` | `#be1d17` | **버튼 active(press)**     |
| `accessible-800` | `#9d1c17` |                            |
| `accessible-900` | `#821e1a` |                            |
| `accessible-950` | `#470a08` |                            |

> `common-primary(#f43630)`와 `accessible-500(#f43730)`은 1비트 차이의 사실상 동일 색이다.
> **면(fill) 기본색은 `primary`, 상호작용 상태 단계는 `accessible-*`** 로 쓰는 것이 현재 코드 컨벤션.

---

## 4. Atomic — Opacity

| 토큰         | 값          | 용도                    |
| ------------ | ----------- | ----------------------- |
| `opacity-40` | `#00000066` | Dim/오버레이 (검정 40%) |

---

## 5. Semantic 매핑 (shadcn)

shadcn 컴포넌트가 참조하는 의미론적 이름을 위 atomic 값에 연결한다(`@theme inline`).
**Button/Input처럼 상태색을 자체 지정하는 커스텀 컴포넌트는 이 매핑과 무관하게 컴포넌트 코드에서 직접 관리한다.**

| Semantic               | → Atomic         |
| ---------------------- | ---------------- |
| `background`           | `neutral-10`     |
| `foreground`           | `neutral-900`    |
| `card` / `popover`     | `neutral-10`     |
| `secondary` / `accent` | `neutral-20`     |
| `muted`                | `neutral-50`     |
| `muted-foreground`     | `neutral-500`    |
| `primary-foreground`   | `neutral-10`     |
| `border` / `input`     | `neutral-70`     |
| `ring`                 | `accessible-400` |
| `destructive`          | `accessible-500` |

---

## 원칙

- 색은 반드시 토큰(Tailwind class)으로 지정한다. `#000`, `gray`, `rgb(...)` 등 하드코딩 금지.
- 면 기본색은 `primary`, 상호작용 단계는 `accessible-*`를 사용한다.
- 텍스트 위계: 본문 `neutral-900` → 보조 `neutral-500` → 비활성 `neutral-300/200`.
