# 가이드라인 (DO / DON'T)

> ⚠️ 디자이너가 명시한 규칙이 아니라, 현재 코드(`globals.css`·컴포넌트)와 Figma 시안에서
> 도출한 **팀 컨벤션**이다. 디자이너 확정 시 갱신한다.

## DO

### 토큰

- 색·타이포는 반드시 `@theme` 기반 Tailwind class로 지정한다 (`bg-primary`, `text-neutral-900`, `text-bold-16`).
- 면(fill) 기본색은 `primary`, 상호작용 단계(hover/focus/active)는 `accessible-400/600/700`을 순서대로 쓴다.
- 텍스트 위계는 `neutral-900`(본문) → `neutral-500`(보조) → `neutral-300/200`(비활성)로 표현한다.
- 오버레이/Dim은 `opacity-40` 토큰을 쓴다.

### 레이아웃

- 화면 좌우 여백은 Margin **20px(`px-5`)**, 요소 간 리듬은 Gutter **16px(`gap-4`)** 기준.
- 모바일 셸은 `.app-shell`(max-width 480px, 중앙 정렬)로 감싼다.
- spacing은 Tailwind 스케일 클래스(`p-*`, `gap-*`)로만 쓴다.

### 컴포넌트

- Primary 액션은 `Button` `default` variant로 통일한다.
- 라벨이 필요한 입력은 `InputField`(라벨 포함)를 쓴다. placeholder로 라벨을 대체하지 않는다.
- 신규 스타일이 필요하면 임의 클래스 대신 cva `variants` / `@theme` 토큰에 정식 추가한다.
- 미구현 시안 컴포넌트를 만들 땐 접근성(키보드·`aria`·포커스)을 구현 단계에서 포함한다.
- `radius`는 클래스 이름만 믿지 말고 [radius 대조표](./foundations/radius.md)로 실제 px를 확인한다 (Tailwind 기본과 다름).

### 미확정 다루기

- spacing·shadow·error 상태 등 **미확정 항목은 임의 하드코딩 대신** 문서에 TODO로 남기고 디자이너 확정 후 토큰화한다.

## DON'T

### 토큰

- 색을 하드코딩하지 않는다 (`#000`, `#f43630`, `gray`, `rgb(...)` 등 → 토큰 class 사용).
- 임의 `font-size`/`font-weight` 조합을 만들지 않는다 (8개 텍스트 스타일 안에서만 선택).
- `primary`와 `accessible-500`이 사실상 같다고 상태 단계를 뒤섞지 않는다 (면=`primary`, 상태=`accessible-*`).
- `rounded-lg`를 Tailwind 기본(8px)이라 여기고 쓰지 않는다 — 이 프로젝트에선 10px다. **8px는 `rounded-md`.**

### 미확정 항목

- **spacing 토큰이 확정된 것처럼 임의 px를 하드코딩하지 않는다** (Tailwind 스케일 사용).
- **`box-shadow`를 임의로 추가하지 않는다** — elevation 토큰 미확정. 배경 레이어 차이를 먼저 시도.
- error/에러 상태 색을 임의로 지정하지 않는다 (InputField 등 미확정 → 디자이너 확정 후 활성화).

### 컴포넌트

- Button 상태색을 컴포넌트 밖에서 임의 override 하지 않는다 (cva variant로 관리).
- 라벨을 placeholder로만 대체하지 않는다.
- 미구현 시안 컴포넌트를 접근성 없이(마우스 전용) 구현하지 않는다.

### 문서

- 이 문서를 Source of Truth로 착각하지 않는다. 값이 어긋나면 **Figma / `globals.css`가 우선**이다.
