# 현재 위치로 출발지 찾기 — 초기 스펙

> 상태: 아이디어 및 공식 문서 조사 초안. 요구사항과 기술 방식은 아직 확정되지 않았다.

## 1. 배경

출발지 검색 화면에는 `현재 위치로 찾기` 버튼이 있지만, 버튼을 누른 뒤의 제품 화면은 디자인되지 않았다. 웹 브라우저뿐 아니라 iOS·Android 앱의 WebView에서도 같은 기능을 제공해야 한다.

텍스트 검색이 어려운 사용자가 기기의 현재 좌표를 출발지 후보로 불러오고, 지도와 주소를 직접 확인·조정한 뒤 기존 출발지 입력 흐름으로 돌아갈 수 있게 한다.

## 2. 현재 아이디어

`현재 위치로 찾기`를 누르면 기존 출발지 검색 화면 위에 위치 확인 화면을 한 단계 더 연다.

- 위치 확인 화면은 전체 화면에 가까운 modal route로 표시한다.
- 최초 진입 시 사용자에게 foreground 위치 권한을 요청한다.
- 현재 좌표를 지도 중심으로 이동시키고 지도 중앙에 고정 핀을 표시한다.
- 핀에 해당하는 도로명·지번 주소를 화면 하단에 표시한다.
- 사용자가 지도를 움직이면 핀은 중앙에 남고, 이동이 끝난 중심 좌표의 주소를 다시 조회한다.
- 현재 위치 버튼을 제공해 지도를 기기의 현재 좌표로 되돌릴 수 있게 한다.
- 사용자가 주소를 확인하고 CTA를 누르면 `{ name, address, latitude, longitude }` 형태의 출발지로 선택한다.
- 위치 확인 화면의 뒤로가기는 선택 내용을 반영하지 않고 기존 출발지 검색 화면으로 돌아간다.
- 위치 확인 CTA는 검색 화면을 다시 거치지 않고 INV-03 출발지 화면으로 돌아가며, 출발지 입력값이 채워진 상태를 보여준다. 이 흐름은 요구사항 인터뷰에서 확정했다.

## 3. 레퍼런스에서 관찰한 흐름

같은 디렉터리의 `search-reference-01~04` 이미지는 제품 디자인이나 여백 수치의 기준이 아니라, 지도에서 위치를 확인·조정하는 상호작용과 정보 배치의 참고 자료로만 사용한다.

1. `지도에서 위치 확인` 상단바 아래 지도가 화면 대부분을 차지한다.
2. 핀은 지도 중앙에 고정되고 사용자가 핀 대신 지도를 움직인다.
3. 하단 카드에 도로명 주소와 지번 주소가 함께 표시된다.
4. 지도 이동 중에는 주소와 CTA가 비활성 또는 로딩 상태가 된다.
5. 지도 이동이 끝나면 새 중심 좌표를 주소로 변환하고 사용자가 주소를 확인한다.
6. 우측 하단 현재 위치 버튼으로 최초 위치에 다시 맞춘다.
7. 잘못된 주소 등록을 줄이기 위한 안내 문구 또는 일시적인 툴팁이 있다.

실제 화면은 모여에 이미 구현된 상단바, 버튼, CTA 영역, 로딩·오류 UI와 디자인 토큰을 우선 재사용한다. 기본 레이아웃의 좌우 패딩, 간격, radius와 typography도 기존 출발지 화면 및 공용 레이아웃을 기준으로 한다. 레퍼런스 이미지의 패딩·마진·색상·컴포넌트 모양을 그대로 복제하지 않는다.

모여의 정확한 카피, 지도 높이, 핀 그래픽과 지도 위 보조 안내 표현은 추가 디자인 확정이 필요하다.

## 4. 대상 사용자와 최소 시나리오

### Primary user

장소 조율 모임에 참여하며 주소를 직접 검색하는 대신 지금 있는 곳을 출발지로 선택하려는 사용자.

### 최소 시나리오

1. 사용자가 권한을 허용하면 현재 좌표의 지도와 주소를 확인하고 출발지로 선택한다.
2. 사용자가 지도를 움직이면 중앙 핀의 새 주소를 확인하고 조정된 위치를 선택한다.
3. 사용자가 권한을 거부하거나 위치·주소 조회에 실패하면 이유와 재시도 방법을 확인하고 검색 화면으로 돌아갈 수 있다.

## 5. 플랫폼별 위치 획득 조사

### 웹 브라우저

브라우저에서는 `navigator.geolocation.getCurrentPosition()`으로 한 번의 현재 좌표를 요청할 수 있다. 이 API는 HTTPS secure context와 사용자의 명시적 권한이 필요하며, `Permissions-Policy`에 의해 차단될 수도 있다. `timeout`, `maximumAge`, `enableHighAccuracy`가 응답 시간·최신성·정확도와 배터리 사용량에 영향을 준다.

- 공식 문서: [MDN — Geolocation.getCurrentPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition)
- 초기 가설: 연속 추적이 아니라 버튼을 누른 시점의 1회 좌표만 요청한다.
- 미결정: 허용할 위치 정확도, timeout, 캐시 좌표의 최대 나이.

### iOS·Android 앱

현재 앱은 Expo SDK 54의 React Native 셸이 Next.js 웹을 `react-native-webview`로 표시한다. 앱에는 위치 라이브러리와 권한 문구가 아직 설정되지 않았다.

Expo Location은 foreground 권한 요청과 `getCurrentPositionAsync()`를 제공한다. 마지막 좌표를 빠르게 반환하는 `getLastKnownPositionAsync()`도 있지만 최신 위치가 아닐 수 있다. 이 기능은 사용자가 보고 있는 화면에서 한 번만 위치를 얻으면 되므로 background 권한은 필요하지 않다는 것이 현재 가설이다.

- 공식 문서: [Expo SDK 54 — Location](https://docs.expo.dev/versions/v54.0.0/sdk/location/)
- 앱 설정에는 iOS의 `NSLocationWhenInUseUsageDescription`과 Android foreground location 권한 구성이 필요하다.
- 권한 설정 변경은 새 네이티브 빌드가 필요할 수 있다.

React Native WebView에서 웹 Geolocation을 직접 쓰는 대안도 있다. 다만 공식 WebView 문서상 Android의 `geolocationEnabled` 기본값은 `false`이며, 웹 권한과 네이티브 권한을 함께 다뤄야 한다.

- 공식 문서: [React Native WebView API Reference](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#geolocationenabled)

### 우선 검토할 통합 가설

아직 확정하지 않지만 현재 저장소 구조에는 다음 방식이 가장 잘 맞을 가능성이 높다.

```text
웹 브라우저
  Place location request → navigator.geolocation → 좌표

iOS·Android WebView
  Web GET_CURRENT_LOCATION
    → 기존 Web↔Native requestId 브리지
    → Expo Location foreground permission + 1회 좌표
    → Native CURRENT_LOCATION_RESULT
    → Web 좌표 수신

공통 Web UI
  좌표 → 지도 중심/고정 핀 → 역지오코딩 → 주소 확인 → DepartureDraft 선택
```

앱에서 권한과 좌표 획득만 네이티브가 담당하고 지도·주소 확인 화면은 웹에 두면, 현재 서비스 구조와 기존 사진 선택 브리지 패턴을 재사용하면서 웹·앱의 사용자 화면을 동일하게 유지할 수 있다.

## 6. 지도와 주소 변환 조사

위치 좌표만으로는 기존 `DepartureDraft.address`를 채울 수 없다. 다음 두 기능의 제공자를 정해야 한다.

1. 지도 표시 및 카메라 이동 이벤트
2. 위도·경도를 도로명·지번 주소로 바꾸는 reverse geocoding

Expo Maps는 SDK 54에서 iOS의 Apple Maps와 Android의 Google Maps를 제공하지만 alpha 상태이고 웹을 지원하지 않는다. 네이티브 지도를 선택하면 현재 WebView 위에 별도 React Native 화면을 만들고 결과를 다시 웹으로 전달해야 한다.

- 공식 문서: [Expo SDK 54 — Maps](https://docs.expo.dev/versions/v54.0.0/sdk/maps/)

현재 지도 제공자의 우선 후보는 **카카오 지도 Web API**다. 공식 문서상 모바일 웹을 지원하며, `services` 라이브러리의 `Geocoder.coord2Address(longitude, latitude)`로 WGS84 좌표에 해당하는 지번 주소와 가능한 경우 도로명 주소를 얻을 수 있다. 지도 `idle` 이벤트를 사용하면 사용자가 지도 이동을 끝낸 시점의 중심 좌표를 주소로 변환하는 레퍼런스 흐름도 구현할 수 있다.

- 공식 문서: [카카오 지도 Web API 가이드](https://apis.map.kakao.com/web/guide/)
- 공식 문서: [카카오 지도 Web API — Geocoder.coord2Address](https://apis.map.kakao.com/web/documentation/#services_Geocoder_coord2Address)
- 공식 예제: [지도 중심 좌표로 주소 표시하기](https://apis.map.kakao.com/web/sample/coord2addr/)

카카오 JavaScript 키에는 실행 도메인 등록이 필요하므로 production·preview·local 개발 주소 구성을 확인해야 한다. WebView도 서비스 웹 URL을 표시하므로 동일한 웹 SDK를 사용하는 안을 우선 검토하되, 실제 iOS·Android WebView 빌드에서 지도 렌더링, 터치 이동과 도메인 인증을 검증해야 한다.

Expo Location의 `reverseGeocodeAsync()`를 앱에서 사용할 수도 있지만 웹 브라우저와 결과 형식을 같게 만들기 어렵고, 지도 제공자와 주소 제공자가 달라질 수 있으므로 현재 단계에서는 확정하지 않는다.

## 7. 예상 화면 상태

| 상태                   | 예상 동작                                                    |
| ---------------------- | ------------------------------------------------------------ |
| 진입·권한 확인         | 지도 영역 skeleton 또는 진행 표시, CTA 비활성                |
| 권한 허용·좌표 조회 중 | 현재 위치를 찾는 중임을 알림                                 |
| 주소 조회 중           | 중앙 핀은 표시하되 기존 주소의 확정 CTA 비활성               |
| 주소 조회 성공         | 도로명·지번 주소와 활성 CTA 표시                             |
| 권한 거부              | 권한이 필요한 이유, 검색으로 돌아가기, 가능한 경우 설정 안내 |
| 위치 서비스 꺼짐       | 기기 위치 서비스를 켜야 한다는 안내                          |
| 좌표 timeout           | 재시도와 검색으로 돌아가기 제공                              |
| 역지오코딩 실패        | 주소를 확인할 수 없음을 표시하고 등록 차단·재시도 제공       |
| 지원 지역 밖           | 현재 서비스 범위가 서울·경기라면 등록 차단 및 범위 안내      |

권한을 한 번 거절한 상태와 OS에서 다시 묻지 않도록 차단한 상태를 UI에서 구분할지는 확인이 필요하다.

## 8. 데이터와 개인정보 원칙 초안

- background 위치 권한과 지속적인 위치 추적은 요구하지 않는다.
- 사용자가 버튼을 누른 뒤 foreground에서 필요한 1회 좌표만 요청한다.
- 사용자가 최종 CTA를 누르기 전에는 현재 좌표를 모임 출발지로 저장하지 않는다.
- 지도 이동 중 reverse geocoding 요청은 debounce하거나 카메라 이동 종료 시점에만 호출한다.
- 서버 또는 외부 지도 제공자에 좌표를 전송한다면 개인정보 처리방침과 외부 제공 범위를 검토한다.
- 현재 개인정보 처리방침에는 기기 위치를 자동 수집하지 않는다고 적혀 있으므로 출시 전 문구 변경 필요 여부를 반드시 확인한다.

## 9. 범위 초안

### 포함 후보

- `현재 위치로 찾기` 버튼과 위치 확인 화면 연결
- 웹·iOS·Android foreground 위치 권한과 1회 좌표 획득
- 지도 중앙 고정 핀과 현재 위치 재정렬
- 지도 중심 좌표의 주소 표시
- 확인한 위치를 기존 출발지 선택 결과로 전달
- 권한 거부, 위치 실패, 주소 실패와 지원 지역 밖 처리

### 제외 후보

- background 위치 추적
- 이동 경로 기록
- 실시간 위치 공유
- 사용자의 현재 위치 자동 저장
- 저장된 출발지 관리
- 장소 추천 또는 경로 탐색

## 10. 확인이 필요한 질문

1. 지도와 reverse geocoding 제공자를 카카오 지도 Web API로 확정할 것인가? 기존 백엔드 출발지 검색 제공자와 달라도 되는가?
2. [확정] 위치 확인 CTA는 INV-03으로 바로 돌아가 출발지가 채워진 상태를 보여주고, 뒤로가기만 검색 modal로 돌아간다.
3. 최초 좌표의 정확도가 낮아도 지도를 보여줄지, 특정 정확도 이내에서만 허용할지?
4. 위치 권한 거부 시 앱 설정으로 이동하는 CTA를 제공할지?
5. 서울·경기 밖 현재 위치는 지도를 보여주되 등록만 막을지, 진입 즉시 안내할지?
6. 지도 이동 중 핀 애니메이션과 주소 조회 debounce는 어떤 UX로 할지?
7. `name`에는 도로명 주소, 건물명, `현재 위치` 중 무엇을 저장할지?
8. 도로명 주소가 없는 위치에서는 지번 주소 등록을 허용할지?
9. 웹 브라우저와 앱에서 같은 지도 제공자를 반드시 사용해야 하는가?
10. 위치 좌표·주소 처리에 맞춰 개인정보 처리방침을 어느 범위까지 수정할지?

## 11. 현재 저장소에서 예상되는 변경 지점

확정 구현 목록이 아니라 조사 대상이다.

- `apps/web`: 현재 위치 route·화면, 지도 UI, 위치 요청 adapter, 주소 변환 query
- `apps/native`: `expo-location` 설치·설정, foreground 권한·좌표 요청 처리
- `packages/types`: 위치 요청/응답 WebView bridge message
- API: reverse geocoding endpoint 사용 또는 신규 필요 여부
- 법적 문서: 위치정보 관련 개인정보 처리방침 문구 검토

## 12. 공식 자료

- [Expo SDK 54 Location](https://docs.expo.dev/versions/v54.0.0/sdk/location/)
- [Expo SDK 54 Maps](https://docs.expo.dev/versions/v54.0.0/sdk/maps/)
- [카카오 지도 Web API 가이드](https://apis.map.kakao.com/web/guide/)
- [카카오 지도 Web API 문서](https://apis.map.kakao.com/web/documentation/)
- [MDN Geolocation.getCurrentPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition)
- [MDN Permissions-Policy: geolocation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/geolocation)
- [React Native WebView API Reference](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md)
