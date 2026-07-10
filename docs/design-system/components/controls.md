# Form Controls — 🎨 시안만 (미구현)

> Source: Figma `switch`, `ic-checkbox`, `check`
> **아직 컴포넌트로 구현되지 않았다.** (Calendar의 `기간` 토글이 Switch 시안을 따른다.)

## Switch

- 알약형 토글. on/off 두 상태.
- **on**: 트랙 진한 회색(`neutral-700~800`) + 흰 손잡이(왼→오).
- **off**: 트랙 연한 회색(`neutral-50~70`) + 흰 손잡이.

> ⚠️ Figma 시안의 on 상태가 회색 계열이다. 브랜드 강조가 필요한지(primary on-state)
> 여부는 디자이너 확정 필요.

## Checkbox

- `ic-checkbox` 시안: **off** = 빈 사각(회색 보더), **on** = 빨강 배경 사각 + 흰 체크(✓).
- 체크 아이콘은 `check` 시안(빨강 ✓)을 사용.

## 원칙

- on/off·checked 상태는 색 토큰으로만 구분하고 크기 점프를 만들지 않는다.
- 구현 시 `role="switch"` / `type="checkbox"` + 키보드 토글을 포함한다.
