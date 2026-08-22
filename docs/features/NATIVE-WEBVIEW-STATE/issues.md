# Native WebView 연결 상태 처리 — 이슈

## Issue 1: [feat] WebView 로딩·오프라인·로드 실패 상태를 안내한다

### 설명

네이티브 앱의 WebView가 준비되지 않았을 때 빈 화면 대신 현재 상태를 안내한다. 네트워크 단절과
일반 로드 실패를 구분하고, 온라인 상태의 일시적인 실패는 앱을 종료하지 않고 다시 시도할 수 있게 한다.

### 구현 범위

- `apps/native/app/index.tsx`
  - NetInfo 연결 상태 구독
  - WebView 로딩·완료·실패 상태 관리
  - 상태 우선순위에 따른 네이티브 오버레이
  - 온라인 로드 실패 후 `reload()` 재시도
- Figma MCP `get_design_context`로 오류 화면 대상 노드를 확인하고 디자인을 네이티브 UI로 적용
- `stash@{2}`에서 연결 상태 관련 hunk만 선택 복원
- `apps/native` lint와 typecheck
- iOS·Android 수동 검증

### 완료 조건 (Acceptance Criteria)

- [ ] AC-1 (통합: 최초 로딩 안내)
  - Given 앱이 WebView 문서 로드를 시작했고 네트워크가 온라인일 때
  - When WebView의 `onLoad`가 아직 호출되지 않았으면
  - Then 진행 표시와 `모여를 불러오고 있어요.`가 WebView 위에 표시된다.
  - And `onLoad`가 호출되면 오버레이가 사라지고 웹 화면이 표시된다.

- [ ] AC-2 (통합: 네트워크 단절 안내)
  - Given WebView가 로딩 중이거나 이미 로드된 상태일 때
  - When NetInfo의 `isConnected` 또는 `isInternetReachable`이 `false`가 되면
  - Then `네트워크 연결이 끊겼어요.`와 `연결을 복구한 뒤 다시 시도해 주세요.`가 표시된다.
  - And 버튼은 비활성 상태로 `연결을 기다리는 중`을 표시한다.

- [ ] AC-3 (경계: 미확정 네트워크 상태)
  - Given NetInfo가 초기 상태를 아직 판정하지 못했을 때
  - When `isConnected` 또는 `isInternetReachable`이 `null`이면
  - Then 이를 오프라인으로 취급하지 않아 오프라인 안내가 깜빡이지 않는다.

- [ ] AC-4 (통합: 온라인 로드 실패 안내)
  - Given 네트워크가 온라인일 때
  - When WebView의 `onError`가 호출되면
  - Then `화면을 불러오지 못했어요.`와 `네트워크 연결을 확인하고 다시 시도해 주세요.`가 표시된다.
  - And 활성화된 `다시 시도` 버튼이 표시된다.

- [ ] AC-5 (통합: 수동 재시도 성공)
  - Given 온라인 로드 실패 안내가 표시된 상태일 때
  - When 사용자가 `다시 시도`를 누르면
  - Then 상태가 로딩으로 바뀌고 WebView의 `reload()`가 한 번 호출된다.
  - And 재로드 후 `onLoad`가 호출되면 오버레이가 사라진다.

- [ ] AC-6 (정적 검증)
  - Given 구현이 완료됐을 때
  - When `apps/native`의 lint와 typecheck를 실행하면
  - Then 오류 없이 통과한다.

- [ ] AC-7 (실기기 검증)
  - Given 동일한 변경이 포함된 iOS·Android 빌드가 설치됐을 때
  - When 최초 로딩, 네트워크 단절, 온라인 복구, 접근 불가능한 웹 주소, 재시도 성공을 각각 재현하면
  - Then 각 플랫폼에서 AC-1부터 AC-5까지 동일하게 관찰된다.

- [ ] AC-8 (통합: Figma 디자인 정합성)
  - Given 오류·오프라인 화면의 대상 Figma 프레임이 제공됐을 때
  - When 네이티브 오버레이가 표시되면
  - Then 레이아웃, 이미지, 색상, 타이포그래피가 Figma 디자인과 일치한다.

### 의존성

없음. `@react-native-community/netinfo`는 `main`에 이미 설치돼 있다.

### 제외 범위

- 웹 내부 API·SDK·이미지 오류
- 네트워크 복구 시 자동 재로드
- 오프라인 캐시
- 공용 연결 상태 컴포넌트 추출
- 네이티브 테스트 러너 도입
