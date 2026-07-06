# shadcn/ui 초기 세팅 작업 기록 (chore/#21/setup-ui-components)

이 브랜치 작업하면서 Claude Code랑 나눈 대화 중, 다른 디바이스로 넘어가도 잃으면 안 되는 맥락만 정리한 문서. 코드는 `git push`로 옮기면 되지만 "왜 이렇게 했는지"는 대화 기록에만 남아있어서 별도로 적어둠.

## 지금 브랜치 상태 (이 문서 작성 시점)

- 커밋 `chore(web): shadcn/ui 초기 설정 및 디자인 토큰 매핑` 까지만 되어 있음
  - shadcn init, FSD에 맞게 alias 조정, `cn()` clsx+tailwind-merge 교체, `globals.css` 정리/토큰 매핑
- **shadcn 컴포넌트(Button/Input/Progress/Calendar/Switch/Checkbox/Drawer) 설치는 한 번 했다가 다시 롤백함** — 다른 디바이스에서 이어서 하기로 함 (아래 "앞으로 할 일" 참고)

---

## 1. FSD 구조 관련 내용

### alias 문제

`shadcn init`을 처음 돌리면 `components.json`이 기본으로 `@/components/ui`, `@/lib/utils`, `@/hooks`를 alias로 잡는데, 이 프로젝트는 FSD라서 구조가 다름. 그래서 이렇게 바꿈:

```json
"aliases": {
  "components": "@/shared/ui",
  "utils": "@/shared/lib/cn",
  "ui": "@/shared/ui",
  "lib": "@/shared/lib",
  "hooks": "@/shared/lib/hooks"
}
```

이렇게 해두면 `shadcn add`가 알아서 `apps/web/src/shared/ui/` 밑으로 파일을 만들어줘서, 설치 후 수동으로 옮길 필요가 없음 (실제로 확인함).

### 컴포넌트별 폴더+index.ts로 감쌀지 말지

예전에 있던 커스텀 Button은 `shared/ui/buttons/button.tsx` + `shared/ui/buttons/index.ts` 구조였음. shadcn이 설치하는 건 `shared/ui/button.tsx` 하나로 flat하게 떨어짐. 이걸 예전처럼 폴더+배럴로 감싸야 하나 고민하다가 FSD 공식 문서(`https://feature-sliced.design/docs/reference/public-api`)를 직접 찾아봄.

**문서에서 확인한 것**:

- FSD의 public-api(index.ts 배럴 강제) 규칙은 **슬라이스 레벨**에서 적용되는 거고, `shared` 레이어는 슬라이스가 아니라 세그먼트(`ui`, `lib`, `api`, `model`, `config`)로만 나뉘어서 이 규칙이 원래 적용 안 됨
- `shared/ui`, `shared/lib` 안에서 컴포넌트별로 `index.ts`를 따로 두라는 권장이 있긴 한데, 이건 **"shared/ui 전체를 하나의 index.ts로 몰아서 export하고 있어서 번들 사이즈가 커질 때"** 쓰라는 최적화 팁이지 필수 규칙이 아님
- 이 프로젝트는 애초에 그런 통합 배럴이 없이 `@/shared/ui/button`처럼 각 컴포넌트를 직접 import하니까, 문서가 말하는 문제 상황 자체가 없음

**결론**: 폴더+index.ts로 감싸지 않고 shadcn이 설치해주는 flat 구조(`shared/ui/button.tsx`) 그대로 쓰기로 함. 이유:

1. FSD가 요구하는 것도 아니고
2. `shadcn add`/`diff`로 나중에 컴포넌트 업데이트할 때마다 매번 수동으로 폴더에 옮기는 반복 작업을 피할 수 있음
3. `steiger.config.js`에도 이미 `shared` 레이어는 `fsd/public-api` 규칙을 꺼놨음 (린트도 이 결론과 일치)

`shared/ui/layouts/global-layout.tsx`, `shared/ui/skeleton/skeleton.tsx`도 index.ts 없이 flat하게 있는 걸 보면, 예전 `buttons/index.ts`가 오히려 프로젝트 컨벤션에서 벗어난 예외였던 셈.

---

## 2. globals.css 작업 내용 (시간순)

`shadcn init`이 `globals.css`에 자동으로 넣어준 내용이 많았고, 하나씩 이유를 확인하면서 정리함.

1. **Geist 폰트 자동 추가됨** → 제거. init이 `app/layout.tsx`에 `next/font/google`의 Geist를 멋대로 추가했었음 (`const geist = Geist(...)`, `<html className={cn('font-sans', geist.variable)}>`). 이 프로젝트는 SUIT만 쓰기로 했으니 layout.tsx를 완전히 원상복구함.

2. **`--color-primary` 충돌 발견 및 해결** — shadcn이 `@theme inline`에 `--color-primary: var(--primary)` 매핑을 추가했는데, 이게 우리가 이미 갖고 있던 `--color-primary: #f43630`(브랜드 레드)를 shadcn 기본값(거의 검정에 가까운 `oklch(0.205 0 0)`)으로 덮어쓰고 있었음. Tailwind는 같은 이름의 `@theme` 변수가 여러 번 선언되면 나중 것이 이기기 때문. `--color-primary: var(--primary)` 매핑 라인과 `:root`/`.dark`의 `--primary` 원시 선언을 지워서 해결. 우리 브랜드 레드가 그대로 살아남게 됨.

3. **`html { @apply font-sans; }` + `--font-sans`/`--font-heading` 매핑 삭제** — Geist를 지운 뒤로 `--font-sans` CSS 변수를 실제로 채워주는 곳이 없어져서 죽은 코드가 됨. `body`에 이미 `font-family: var(--font-suit)`가 직접 박혀있어서 실제 화면엔 영향 없었지만(자식 요소가 상속받음), 헷갈리는 코드라 정리함.

4. **shadcn 시맨틱 토큰을 우리 디자인 토큰에 매핑** — 원래 `:root`에 `--background`, `--foreground`, `--border`, `--ring` 등이 shadcn 기본 회색조(oklch)로 원시값 채워져 있었음. 이걸 없애고, `@theme inline`에서 이 시맨틱 이름들이 우리 실제 토큰(neutral/accessible/primary 스케일)을 직접 참조하도록 바꿈. 예:

   ```css
   --color-background: var(--color-neutral-10);
   --color-foreground: var(--color-neutral-900);
   --color-border: var(--color-neutral-70);
   --color-ring: var(--color-accessible-400);
   --color-destructive: var(--color-accessible-500);
   ```

   `--chart-1`~`--chart-5`(차트 컴포넌트용)는 이 프로젝트에서 대시보드/차트 계획이 없어서 완전히 삭제. `--sidebar-*`는 나중에 쓸 수도 있다고 해서 삭제 안 하고 우리 토큰으로 매핑만 해둠.

5. **시안 색상 받아서 매핑값 여러 번 정정함** (중요 — 값이 왔다갔다 했던 부분):
   - 처음엔 스크린샷만 보고 대충 유추해서 값을 넣었다가, 실제 시안 스펙을 받으면서 계속 고쳤음
   - **`--color-ring`(포커스 표시)**: 처음엔 `neutral-300`(회색)으로 넣었는데, 인풋 포커스 상태가 실제로는 **빨간 테두리**라는 게 확인되어 `accessible-400`으로 정정
   - **`--color-destructive`**: 처음엔 "옅은 핑크 테두리 = 에러 색"이라고 착각해서 `accessible-200`, 그다음 `accessible-500`으로 넣었었는데, 나중에 시안 전체 스펙을 받아보니 그 옅은 핑크(`accessible-200`)는 에러가 아니라 **인풋 hover 테두리 색**이었음. **진짜 에러/destructive 색은 아직 안 받음** — 지금 값(`accessible-500`)은 확정 아니고 임시값.
   - **`--color-muted`**: `neutral-20` → 인풋 disabled 배경이 `neutral-50`이라는 걸 확인하고 `neutral-50`으로 정정
   - Button/Input 컴포넌트 자체의 상태별 색(hover/focus/pressed/disabled)은 이 전역 시맨틱 토큰으로 표현이 안 되는 값들이라(컴포넌트마다 disabled 색이 다 다름 — 버튼은 `neutral-70`, 아이콘버튼은 화이트, 인풋은 `neutral-50`), `@theme inline`에 안 넣고 나중에 각 컴포넌트 코드에 직접 넣기로 함. 받은 값은 아래 "앞으로 할 일"에 정리.

6. **`.dark {}` 블록 삭제** — 아래 4번 항목 참고

7. **`/* ---break--- */` 주석 2군데 삭제** — shadcn CLI가 여러 CSS 블록을 merge할 때 자동으로 넣는 구분용 주석, 기능 없음

8. **`--radius: 0.625rem`을 `@layer base` 안 `:root`로 이동** — 원래 파일 맨 아래 별도 `:root {}` 블록에 혼자 떨어져 있었는데, 다른 base 리셋들(`body`, `button`, `*`)이랑 같은 `@layer base` 블록 안으로 합침. `*`가 아니라 `:root`를 쓴 이유: `--radius`는 상속되는 커스텀 프로퍼티라 `:root`에 한 번만 선언하면 충분하고, `*`에 넣으면 모든 요소에 중복 선언하는 셈이라 의미 없음 (`* { border-border outline-ring/50 }`에서 `*`를 쓴 건 border/outline color가 지정 안 하면 요소마다 다른 `currentColor`를 쓰기 때문에 필요했던 것 — 이유가 다름).

9. **`@theme inline`에 그룹별 주석 추가** — `surface` / `form / interactive` / `sidebar` / `radius`로 나눠서 주석 달고, "Button/Input처럼 상태별 색을 자체 관리하는 커스텀 컴포넌트는 이 매핑과 무관하게 컴포넌트 코드에서 직접 관리한다"는 설명도 추가함 (처음 쓴 주석이 "색 바꿀 땐 이 매핑만 고치면 된다"고 과장돼 있어서 정정함).

---

## 3. `@custom-variant dark (&:is(.dark *));` 관련 내용

Tailwind v4 문법으로, `dark:` variant(`dark:bg-black` 같은 클래스)가 어떤 조건에서 활성화될지 재정의하는 것.

- `&:is(.dark *)` = "이 요소가 `.dark` 클래스를 가진 조상의 후손일 때"라는 뜻. 즉 `<html class="dark">`처럼 어딘가에 `.dark`가 붙어야 `dark:*` 클래스가 발동함.
- Tailwind v4 기본값은 `prefers-color-scheme` 미디어쿼리 기반인데, 이 줄이 그걸 **클래스 기반으로 오버라이드**한 것 (shadcn init이 다크모드 지원용으로 자동 추가함).
- **이 줄을 지우면 안 되는 이유**: 지우면 Tailwind 기본값(미디어쿼리 기반)으로 돌아가서, `.dark` 클래스를 아무도 안 붙여도 **OS가 다크모드면 `dark:*` 클래스가 멋대로 발동**함. 지금처럼 클래스 기반으로 남겨두면, `.dark` 클래스를 토글하는 코드가 없는 한 절대 발동 안 되니까 오히려 더 안전함. 그래서 이 줄은 그대로 유지하기로 결정함.
- shadcn 컴포넌트들(체크박스 등)엔 `dark:bg-input/30` 같은 클래스가 레지스트리 코드에 기본으로 박혀서 옴. 이걸 설치할 때마다 지워야 하나 고민했는데, 위 이유로 어차피 죽은 스타일이라 지울 필요 없다고 결론냄 (CLI 설정으로 아예 안 붙게 하는 옵션도 없음 — 레지스트리에 고정된 값이라).

---

## 4. `.dark {}` 블록 삭제한 내용

`shadcn init`이 `:root` 밑에 자동으로 만들어준 블록:

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ...등등 30줄 가까이 */
}
```

- 이건 실제 다크모드 디자인 토큰이 확정되기 전에 shadcn이 임의로 생성한 플레이스홀더 그레이스케일 값이었음
- `.dark` 클래스를 토글하는 코드가 프로젝트 어디에도 없어서 (`grep` 확인함) 100% 죽은 코드였음
- 나중에 실제로 다크모드 지원하기로 결정되면, 그때 진짜 디자인 토큰 기준으로 다시 채우는 게 맞다고 판단해서 지금은 통째로 삭제함
- `@custom-variant dark` 줄 자체는 위 3번 이유로 그대로 남겨둠 (구조는 남기고 값만 비운 상태)

---

## 5. 앞으로 이 브랜치에서 해야 할 작업 (이슈 #21 기준)

### 다른 디바이스에서 이어서 할 것

1. **shadcn 컴포넌트 설치** — Button, Input, Progress, Calendar, Switch, Checkbox, Drawer

   ```bash
   cd apps/web
   npx shadcn@latest add button input progress calendar switch checkbox drawer -y --overwrite
   ```

   - alias가 이미 `@/shared/ui`로 설정돼 있어서 별도로 파일 옮길 필요 없음 (자동으로 `src/shared/ui/*.tsx`에 생성됨)
   - 설치되면 의존성으로 `vaul`(drawer), `react-day-picker`, `date-fns`(calendar)가 추가됨
   - **기존 커스텀 Button 삭제 필요**: `src/shared/ui/buttons/` 폴더(`button.tsx`, `index.ts`) 통째로 삭제
   - **import 경로 수정 필요**: `src/features/room/create-room/ui/create-room-button.tsx`의 `import { Button } from '@/shared/ui/buttons'` → `import { Button } from '@/shared/ui/button'`
   - 설치된 컴포넌트는 폴더+index.ts로 감싸지 말고 flat 구조 그대로 둘 것 (위 1번 항목 참고)
   - Windows에서 `pnpm add`가 `EPERM: operation not permitted, rename ...` 에러로 실패할 수 있음 (파일 잠금 이슈) — 재시도하면 보통 됨. 2분 타임아웃보다 여유있게(5분 이상) 잡을 것.

2. **`cn.ts`에 `extendTailwindMerge` 설정 추가**
   - 지금 `cn.ts`는 그냥 `twMerge(clsx(inputs))`만 하는 기본 버전
   - 커스텀 텍스트 토큰(`text-extrabold-22`, `text-bold-16`, `text-bold-14`, `text-semibold-16`, `text-semibold-14`, `text-medium-16`, `text-medium-14`, `text-medium-12`)이 `text-` 프리픽스를 공유해서, `tailwind-merge`가 색상 유틸(`text-white`)과 같은 그룹으로 오인해 지워버리는 문제가 있었음 (예전 프로젝트에서 실제로 겪었던 버그)
   - `extendTailwindMerge`로 이 토큰들을 `font-size` 그룹으로 등록해야 함:
     ```ts
     extendTailwindMerge({
       extend: {
         classGroups: {
           'font-size': [
             { text: ['extrabold-22', 'bold-16', 'bold-14', 'semibold-16', 'semibold-14', 'medium-16', 'medium-14', 'medium-12'] },
           ],
         },
       },
     });
     ```

3. **`react-wheel-picker` 설치** — 타임 피커 시안이 휠 형태라 shadcn엔 없는 컴포넌트, 별도 라이브러리 필요

4. **Button/Input 등 커스텀 컴포넌트에 시안 색상 반영** (컴포넌트 코드 작업 단계에서, 지금 받은 값):

   **버튼**
   - disabled: `neutral-70`
   - enabled(default): `primary`
   - focused: `accessible-600`
   - pressed: `accessible-700`
   - hover: `accessible-400`

   **아이콘 버튼**
   - disabled: 배경 화이트, 텍스트 `neutral-100`
   - default: 배경 `neutral-20`, 텍스트 `neutral-100`

   **인풋 텍스트**
   - disable: 배경 `neutral-50`, placeholder `neutral-400`, 라벨 `neutral-500`/`neutral-400`
   - default: 배경 `neutral-10`, placeholder `neutral-400`, 라벨 `neutral-500`/`neutral-400`
   - focused: 배경 화이트, 인풋 텍스트 `neutral-950`, 라벨 `neutral-500`/`neutral-400`, 테두리 `accessible-400`
   - activated(값 입력됨): 배경 화이트, 인풋 텍스트 `neutral-950`, 라벨 `neutral-500`/`neutral-400`, 테두리 `neutral-20`
   - hover: 배경 화이트, placeholder `neutral-400`, 라벨 `neutral-500`/`neutral-400`, 테두리 `accessible-200`

   **인풋 셀렉트** (텍스트와 유사하지만 세부 값 다름)
   - disable: 배경 `neutral-20`, placeholder `neutral-400`, 라벨 `neutral-500`
   - default: 배경 화이트, placeholder `neutral-500`, 라벨 `neutral-500`
   - focused: 배경 화이트, 인풋 텍스트 `neutral-950`, 라벨 `neutral-500`, 테두리 `accessible-400`
   - activated: 배경 화이트, 인풋 텍스트 `neutral-950`, 라벨 `neutral-500`, 테두리 `neutral-20`
   - hover: 배경 화이트, placeholder `neutral-400`, 라벨 `neutral-500`, 테두리 `accessible-200`

### 아직 안 받은 정보 (나중에 물어봐야 함)

- 진짜 에러/destructive 색 (지금 `accessible-500`은 임시값, 확정 아님)
- 캘린더, 프로그레스바, 스위치, 체크박스, 드로어의 상세 색상 스펙
- Figma가 유료 플랜이 아니라서 MCP 연결은 보류 상태 — 색상 값은 계속 사람이 직접 전달하는 방식으로 진행

### 커밋 관련

- 이 문서 작성 시점 기준으로 브랜치엔 `chore(web): shadcn/ui 초기 설정 및 디자인 토큰 매핑` 커밋 하나만 있고, shadcn 컴포넌트 설치는 롤백해서 커밋 안 남아있음
- 이 문서(`apps/web/docs/shadcn-ui-setup-notes.md`)도 아직 커밋 전 — push 전에 커밋 필요
