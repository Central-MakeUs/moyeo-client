# Input — ✅ 구현 (일부 시안)

> Source: Figma `input-text`, `input-select` / `shared/ui/primitives/input/`
> 세 가지가 있다: **Input**(기본, ✅), **InputField**(라벨 포함, ✅), **Input Select**(🎨 시안만).

## 1. Input — ✅ 구현

기본 텍스트 입력. shadcn semantic 토큰(`border-input` = `neutral-70`)을 사용한다.

| 항목        | 규칙                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| 높이/모서리 | `h-8`, `rounded-lg` (이 프로젝트 기준 10px — [radius](../foundations/radius.md) 참고) |
| 배경        | `bg-transparent`                                                                      |
| 보더 기본   | `border-input` (`neutral-70`)                                                         |
| Focus       | `border-ring` + `ring-3 ring-ring/50` (`accessible-400`)                              |
| Error       | `aria-invalid` → `border-destructive` + ring                                          |
| Disabled    | `bg-input/50`, `opacity-50`, `cursor-not-allowed`                                     |
| Placeholder | `text-muted-foreground` (`neutral-500`)                                               |

## 2. InputField — ✅ 구현 (라벨 포함)

`<label>`로 감싼 라벨 + 힌트 + 입력값 묶음. **상태를 보더+배경 조합으로 표현**한다.
(Figma `input-text`의 상태 스택에 대응)

| 상태                             | 보더             | 배경         |
| -------------------------------- | ---------------- | ------------ |
| default(빈값)                    | `transparent`    | `neutral-10` |
| activated(입력값 있음, 비포커스) | `neutral-20`     | `white`      |
| hover                            | `accessible-200` | `white`      |
| focus-within                     | `accessible-400` | `white`      |
| disabled                         | `transparent`    | `neutral-50` |

- 컨테이너: `rounded-[12px]`, `px-4 py-3`, `gap-0.5`.
- 라벨: `text-medium-12 text-neutral-500` (+ `hint`는 `neutral-400`).
- 입력값: `text-medium-16`, placeholder `neutral-400`.
- **error 상태 = `errorMessage` prop**: 보더 `accessible-600`, 필드 아래 메시지 `text-medium-12 text-accessible-600`.
  `errorMessage`가 `description`보다 우선한다. (`InputField`에 구현 완료 — `data-invalid`)

## 2-1. 글자수 · 필수 에러 처리 정책 (공통)

텍스트 입력(`InputField`) 검증은 아래 정책을 따른다. **표시 방식은 공통, 문구·제한값은 각 화면 스펙이 지정**한다.

| 트리거                         | 표시                                       | 메시지                                                    |
| ------------------------------ | ------------------------------------------ | --------------------------------------------------------- |
| 필수 필드에 공백만 입력        | 테두리 `accessible-600` + 필드 아래 메시지 | 화면이 지정 (예: `모임 이름을 입력해주세요`)              |
| 최대 글자수 초과 (`maxLength`) | 테두리 `accessible-600` + 필드 아래 메시지 | `최대 N자까지 입력할 수 있어요` (N = 해당 필드 maxLength) |

- 표시는 `InputField`의 `errorMessage` prop으로 구현한다(별도 컴포넌트 불필요).
- 필수 여부·제한값(N)·필수 메시지 문구는 **화면 스펙**(예: `docs/fe-implement-spec/create/crt-01/crt-01.md`)이 소유한다.
- 공백만 입력 여부는 **`value.trim()` 기준**으로 판정한다.

## 3. Input Select — 🎨 시안만

`title` + 값 + 우측 caret(▾) 형태의 선택 필드. 상태 스택은 InputField와 동일한 리듬
(default / activated / focus(빨강 보더) / filled)로 보인다. **아직 컴포넌트 미구현.**

## 원칙

- 라벨은 placeholder로 대체하지 않는다. 값의 의미가 필요하면 `InputField`(라벨 포함)를 쓴다.
- Focus/에러 강조는 `accessible-*` 토큰으로만 표현한다.
- error 상태는 `errorMessage` prop으로 트리거한다(§2-1 정책). 보더 `accessible-600` + 하단 메시지.
