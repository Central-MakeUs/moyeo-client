# Pickers — 🎨 시안만 (미구현)

> Source: Figma `number-picker`, `time-picker`, `modal`
> 휠(wheel) 방식의 값 선택 UI. **아직 컴포넌트로 구현되지 않았다.**

공통 패턴: **가운데 선택 항목을 강조(`neutral-20` 배경 + 진한 텍스트)** 하고,
위아래 항목은 거리에 따라 점점 흐려진다(`neutral-500` → `neutral-300`).

## Number Picker

- 세로 스크롤 숫자 휠. 가운데 값이 `neutral-20` 배경 pill로 강조.
- 위: 진한 값 → 아래로 갈수록 흐림. (시안 예: `2`(선택) / `20` / `19`)

## Time Picker

- 2열(오전·오후 / 시) 휠. 가운데 행 강조 (시안 예: `오후 6시` 선택).
- 텍스트 위계는 Number Picker와 동일.

## Modal Picker (참여 인원 선택 등)

- `modal` 시안: 타이틀(`참여 인원 선택`) + 숫자 휠 + 하단 풀폭 **`다음` 버튼**(CTA).
- 휠 가운데 선택값 강조, 하단 CTA는 `Button default / fullWidth`.

## 원칙

- 선택 강조는 `neutral-20` 배경으로, 거리 페이드는 `neutral` 텍스트 명도로만 표현한다.
- 구현 시 접근성(키보드 ↑↓, `role`/`aria`)을 반드시 포함한다. (시안엔 없음 → 구현 단계에서 정의)
