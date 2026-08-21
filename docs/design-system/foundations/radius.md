# Radius & Elevation

> Source: Figma `Radius` + `globals.css`

## Radius — ✅ 확정

시안이 **값 자체를 토큰명으로** 쓴다. `rounded-8` = 8px 이라 시안에서 본 값을 그대로 옮기면 된다.

| 클래스         | px   |
| -------------- | ---- |
| `rounded-2`    | 2    |
| `rounded-4`    | 4    |
| `rounded-6`    | 6    |
| `rounded-8`    | 8    |
| `rounded-10`   | 10   |
| `rounded-12`   | 12   |
| `rounded-14`   | 14   |
| `rounded-16`   | 16   |
| `rounded-20`   | 20   |
| `rounded-24`   | 24   |
| `rounded-full` | pill |

`rounded-full`은 `@theme`이 아니라 Tailwind 정적 유틸(`calc(infinity * 1px)`)이다.
시안의 `999px`과 결과가 같아(app-shell 최대 폭 480px) 별도 토큰으로 두지 않는다.

### Tailwind 기본 스케일은 제거돼 있다

`globals.css`의 `@theme`에서 `--radius-*: initial`로 t-shirt 스케일(`rounded-sm`/`md`/`lg`/`xl`/`2xl`/`3xl`/`4xl`/`xs`)을 통째로 지웠다.

- 표에 없는 값(`rounded-13`)이나 t-shirt 이름(`rounded-lg`)은 **CSS가 생성되지 않는다.** 빌드 에러는 아니고 모서리가 각지게 나온다.
- 예전엔 `rounded-lg`가 Tailwind 기본 8px이 아니라 10px로 리매핑돼 있어서, 8px인 줄 알고 쓴 Button radius가 시안과 어긋나 있었다. t-shirt 이름을 없앤 이유다.
- **`--radius-*: initial`을 지우면 t-shirt 스케일이 되살아나 두 체계가 섞인다.**

### shadcn 컴포넌트 주의

`npx shadcn add`로 받은 컴포넌트는 `rounded-md`·`rounded-lg`를 쓰므로 **설치 직후 모서리가 각져 보인다.** 시안 값을 확인해 위 토큰으로 바꾼 뒤 쓴다.

### 사용 현황 (디자인 스펙 ↔ 코드)

| 컴포넌트                  | 디자인 스펙 | 현재 코드         | 상태                       |
| ------------------------- | ----------- | ----------------- | -------------------------- |
| Button 기본               | 8px         | `rounded-8`       | ✅                         |
| Button icon               | 6px         | `rounded-6`       | ✅                         |
| InputField                | 12px        | `rounded-12`      | ✅                         |
| Progress · Switch         | pill        | `rounded-full`    | ✅                         |
| Checkbox                  | (미확인)    | `rounded-[4px]`   | 🚧 토큰화 필요             |
| Drawer · Calendar         | (미확인)    | t-shirt 이름 잔존 | 🚧 각짐 — 커스텀할 때 반영 |
| `input.tsx` (원시 shadcn) | —           | `rounded-lg`      | 🚧 미사용·미커스텀         |

### 지침

- radius는 위 토큰 클래스만 쓴다. 임의값(`rounded-[13px]`)이 필요하면 스케일에 없는 값이라는 뜻이니 디자이너에게 확인한다.
- 컴포넌트가 가진 radius는 `className`으로 덮을 수 있다. tailwind-merge는 기본적으로 radius를 t-shirt 사이즈로만 인정해서 숫자 토큰을 못 알아보는데, `cn()`이 이를 등록해뒀다 (`shared/lib/cn.ts`). 등록이 풀리면 두 클래스가 모두 살아남아 **CSS 생성 순서**가 승패를 정하고 `className`이 지는 경우가 생긴다 — `cn.test.ts`가 이를 막는다.
- `p-4`(16px)와 `rounded-16`(16px)은 숫자가 다르다. Tailwind의 "1 unit = 4px"은 **spacing 계열 전용**이고 radius에는 적용되지 않는다.

---

## Elevation / Shadow — 🔴 미확정

현재 Figma 시안과 `@theme` 어디에도 **shadow / elevation 토큰이 정의되어 있지 않다.**
깊이 표현이 필요한 경우:

- 임의 `box-shadow` 하드코딩을 **바로 추가하지 말 것.**
- 우선 배경 색 레이어 차이(`neutral-10` / `neutral-20`)로 표현을 시도한다.
- 그림자가 꼭 필요하면 디자이너에게 elevation 토큰 정의를 요청한 뒤 토큰으로 추가한다.
