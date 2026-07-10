# Radius & Elevation

> Source: `globals.css`

## Radius — 🟡 파생 스케일 (⚠️ Tailwind 기본과 다름)

별도 radius 디자인 토큰(Figma)은 없고, `globals.css`가 기준값 하나에서 스케일을 파생시킨다.
기준은 `--radius: 0.625rem`(10px).

> **⚠️ 주의: 이 프로젝트의 `rounded-*` 는 Tailwind 기본값과 다르게 리매핑돼 있다.**
> Tailwind에 익숙해서 `rounded-lg`를 8px로 알고 쓰면 **실제로는 10px**가 나온다. 아래 대조표를 꼭 확인한다.

| 클래스        | 이 프로젝트 | (Tailwind 기본) | 계산식           |
| ------------- | ----------- | --------------- | ---------------- |
| `rounded-sm`  | 6px         | 2px             | `--radius × 0.6` |
| `rounded-md`  | **8px**     | 6px             | `--radius × 0.8` |
| `rounded-lg`  | **10px**    | 8px             | `--radius × 1.0` |
| `rounded-xl`  | 14px        | 12px            | `--radius × 1.4` |
| `rounded-2xl` | 18px        | 16px            | `--radius × 1.8` |
| `rounded-3xl` | 22px        | 24px            | `--radius × 2.2` |
| `rounded-4xl` | 26px        | —               | `--radius × 2.6` |

> 특히 자주 쓰는 `rounded-md`(8px)·`rounded-lg`(10px)가 헷갈린다. **8px가 필요하면 `rounded-md`를 쓴다.**

### 사용 현황 (디자인 스펙 ↔ 코드)

| 컴포넌트    | 디자인 스펙 | 현재 코드           | 상태                                 |
| ----------- | ----------- | ------------------- | ------------------------------------ |
| Button 기본 | **8px**     | `rounded-lg` (10px) | ⚠️ 불일치 — `rounded-md`로 수정 필요 |
| Button icon | 6px         | `rounded-[6px]`     | ✓                                    |
| Input 기본  | (미확정)    | `rounded-lg` (10px) | 디자인 값 확인 필요                  |
| InputField  | **12px**    | `rounded-[12px]`    | ✓                                    |

> **Button 기본 radius 버그**: 디자인은 8px인데 코드가 `rounded-lg`(10px)로 지정돼 있다.
> Tailwind 기본 `rounded-lg`=8px인 줄 알고 쓴 **리매핑 함정**으로 보인다. `rounded-md`(=8px)로 고쳐야 한다. (코드 수정은 별도 이슈)

### 지침

- radius는 `rounded-sm ~ rounded-4xl` 토큰 클래스를 우선 쓰되, **위 대조표로 실제 px를 확인**한다.
- 토큰으로 표현 안 되는 예외에만 임의값(`rounded-[6px]`, `rounded-[12px]`)을 쓰고, 반복되면 토큰화를 검토한다.

---

## Elevation / Shadow — 🔴 미확정

현재 Figma 시안과 `@theme` 어디에도 **shadow / elevation 토큰이 정의되어 있지 않다.**
깊이 표현이 필요한 경우:

- 임의 `box-shadow` 하드코딩을 **바로 추가하지 말 것.**
- 우선 배경 색 레이어 차이(`neutral-10` / `neutral-20`)로 표현을 시도한다.
- 그림자가 꼭 필요하면 디자이너에게 elevation 토큰 정의를 요청한 뒤 토큰으로 추가한다.
