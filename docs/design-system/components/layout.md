# Layout & Feedback

> Source: Figma `header`, `status-bar`, `cta-section`, `progress-bar`, `indicator`
> 화면 골격·진행 표시 요소. 항목별 구현 상태는 각 섹션을 따른다.

## Status Bar

- OS 상태 바 영역(시각 `9:41`, 신호/배터리). 실제 디바이스가 그리는 영역으로,
  앱은 이 높이만큼 safe-area 여백을 확보한다.

## Header

- ✅ `TopAppBar` 구현 — `shared/ui/top-app-bar`
- `leading`, `title`, `trailing` slot으로 좌측 액션·중앙 제목·우측 액션을 조합한다.
- 액션 수나 너비가 달라도 제목은 중앙을 유지하며, 긴 제목은 한 줄로 말줄임한다.
- 뒤로가기·닫기·공유 등은 기존 `IconButton`을 사용하고 접근 가능한 이름을 제공한다.
- 라우팅과 실제 액션은 컴포넌트가 수행하지 않고 사용하는 화면에서 callback으로 주입한다.

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
