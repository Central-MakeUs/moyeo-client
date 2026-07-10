# Layout & Feedback — 🎨 시안만 (미구현)

> Source: Figma `header`, `status-bar`, `cta-section`, `progress-bar`, `indicator`
> 화면 골격·진행 표시 요소. **아직 컴포넌트로 구현되지 않았다.**

## Status Bar

- OS 상태 바 영역(시각 `9:41`, 신호/배터리). 실제 디바이스가 그리는 영역으로,
  앱은 이 높이만큼 safe-area 여백을 확보한다.

## Header

- 화면 상단 타이틀 바 (시안 예: `모임 생성 step1 플로우`).
- 좌측 back(‹), 중앙 타이틀, 우측 액션 슬롯 구성으로 확장 예상.

## CTA Section

- 화면 하단 고정 액션 영역. 풀폭 **`다음`** 버튼(`Button default / fullWidth`, `primary`).
- 하단 safe-area 여백 포함.

## Progress Bar

- 다단계 플로우 진행률. 여러 개의 트랙(`neutral-50`) 위에 빨강(`primary`/`accessible`) 채움.
- 시안은 단계별로 채움 길이가 늘어나는 형태.

## Indicator

- 캐러셀/스텝 점 표시. 활성 = 빨강 알약(길쭉), 비활성 = 회색 점(`neutral-50`).

## 원칙

- 진행/활성 강조는 `primary`·`accessible`, 비활성 트랙은 `neutral-50`으로 통일한다.
- 하단 고정 CTA·헤더는 status-bar / home-indicator safe-area를 고려한다.
