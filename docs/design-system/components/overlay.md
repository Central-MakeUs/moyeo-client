# Overlay — 🎨 시안만 (미구현)

> Source: Figma `modal`, `dim`
> **아직 컴포넌트로 구현되지 않았다.**

## Dim (배경 오버레이)

- 모달/바텀시트 뒤를 덮는 반투명 레이어.
- 색: **`opacity-40` 토큰 (`#00000066`, 검정 40%)**.

## Modal / Bottom Sheet

- `modal` 시안: 상단 그랩 핸들(작은 바) + 타이틀 + 콘텐츠 + 하단 풀폭 CTA(`다음`).
- 하단에서 올라오는 바텀시트 형태. 콘텐츠 배경 `white`, 뒤는 Dim.
- CTA는 `Button default / fullWidth`, 상단 라운드 처리.

## 원칙

- 오버레이 배경은 반드시 `opacity-40` 토큰을 쓴다 (임의 rgba 금지).
- 모달 열림 시 배경 스크롤 잠금·포커스 트랩·`Esc`/Dim 클릭 닫기를 구현 단계에서 포함한다.
