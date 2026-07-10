# 코드 컨벤션

## 네이밍

### 코드 내부

| 대상              | 규칙               | 예시                 |
| ----------------- | ------------------ | -------------------- |
| 컴포넌트          | `PascalCase`       | `InputField`         |
| 타입 / 인터페이스 | `PascalCase`       | `RoomSummary`        |
| 변수 / 함수       | `camelCase`        | `formatDate`         |
| 상수              | `SNAKE_CASE`       | `MAX_PARTICIPANTS`   |
| Props 인터페이스  | `{Component}Props` | `ButtonProps`        |
| boolean           | `is*` / `has*`     | `isOpen`, `hasError` |

### 경로 및 파일명

| 대상            | 규칙         | 예시                                     |
| --------------- | ------------ | ---------------------------------------- |
| 폴더            | `kebab-case` | `create-room-page/`                      |
| 컴포넌트 파일   | `kebab-case` | `input-field.tsx`, `calendar-button.tsx` |
| 유틸 파일       | `kebab-case` | `format-date.ts`                         |
| 페이지/API 파일 | `kebab-case` | `create-room.tsx`                        |
| 이미지 파일     | `snake_case` | `hero_banner.png`                        |

> 컴포넌트 **파일명은 kebab-case** 다 (shadcn/FSD 관례). 파일 안의 컴포넌트 **이름은 PascalCase**.
> 예: `input-field.tsx` 안에 `export function InputField`.

## Export

- 컴포넌트는 **named export** 를 쓴다. `export default` 는 지양한다.
  ```ts
  export { Button, buttonVariants }; // O
  export default Button; // 지양
  ```
- 단, Next.js `app/` 의 `page.tsx` / `layout.tsx` 등 프레임워크가 default export를 요구하는 파일은 예외.

## TypeScript

- `type` vs `interface`: **`interface` 기본**, 유니온/교차 타입이 필요할 때만 `type`.
- `any` **금지**. 불가피하면 `unknown` 으로 받고 좁혀 쓴다.
- 함수 반환 타입: 명시 권장. 단 간단한 화살표 함수는 추론에 맡긴다.

## 코드 작성 원칙

- 복잡한 조건식은 의미 있는 변수로 분리한다.
- 중복 로직은 공통 함수나 훅으로 분리한다.
- 색·타이포는 하드코딩하지 않고 토큰 클래스를 쓴다 (`bg-primary`, `text-neutral-900`, `text-bold-16`).
  자세한 내용은 `docs/design-system/` 참고.

## ESLint

린트 설정은 공유 flat config `@repo/eslint-config` 에서 관리한다.

- **base**: JS recommended + `typescript-eslint` recommended + `turbo` + `eslint-config-prettier`
- **next** (web/docs): 위 + React / React Hooks / Next.js `core-web-vitals`
- **expo** (native): Expo 전용 규칙

실행 시 각 앱은 `eslint --max-warnings 0` 을 쓰므로 **경고도 통과 실패로 취급**된다.
`typescript-eslint` recommended에 포함된 규칙(예: `no-explicit-any`)은 실제로 걸린다.

> `interface` 우선·반환 타입 명시 같은 위 컨벤션 중 일부는 **팀 지향**이며 아직 별도 룰로 강제하진 않는다.
> 규칙을 강제하고 싶으면 `packages/eslint-config` 에 추가한다.

web은 추가로 `steiger` 로 FSD 경계를 검사한다 ([project-structure.md](./project-structure.md) 참고).

## Prettier

설정은 `@repo/prettier-config`. 값:

| 옵션             | 값                                                  |
| ---------------- | --------------------------------------------------- |
| `printWidth`     | `100`                                               |
| `tabWidth`       | `2`                                                 |
| `semi`           | `true`                                              |
| `singleQuote`    | `true`                                              |
| `trailingComma`  | `es5`                                               |
| `bracketSpacing` | `true`                                              |
| `arrowParens`    | `always`                                            |
| `endOfLine`      | `lf`                                                |
| plugins          | `prettier-plugin-tailwindcss` (Tailwind class 정렬) |
