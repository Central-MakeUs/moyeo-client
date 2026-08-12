# Moyeo Domain Vocabulary

도메인 문서와 기존 public API의 용어를 우선한다. 새 동의어를 만들기 전에 `prd.md`, `spec-fixed.md`, issue 문서와 코드 사용처를 검색한다.

## 장소와 출발지

| 용어              | 의미                                            | 사용 예              |
| ----------------- | ----------------------------------------------- | -------------------- |
| `place`           | 검색 API가 반환하거나 사용자가 고르는 장소 후보 | `selectPlace`        |
| `coords`          | 위도·경도로 이루어진 SDK 비종속 좌표            | `Coords`             |
| `address`         | 화면 표시 또는 서버 전송에 사용하는 주소 문자열 | `resolveAddress`     |
| `departure`       | 모임 참가자가 확정할 출발지 도메인              | `DepartureDraft`     |
| `draft`           | 아직 최종 제출되지 않은 편집·선택 값            | `toDepartureDraft`   |
| `picker`          | 지도에서 좌표를 고르는 위치 확인 화면           | `MapLocationPicker`  |
| `currentLocation` | 기기 위치 API로 얻은 현재 위치                  | `useCurrentLocation` |
| `reverseGeocode`  | 좌표를 주소 문서로 변환하는 작업                | `useReverseGeocode`  |

## 동작 동사

| 동사          | 이 저장소에서의 의미                                       |
| ------------- | ---------------------------------------------------------- |
| `select`      | 후보 중 하나를 선택해 상위 흐름에 전달                     |
| `confirm`     | 현재 값이 유효함을 확인하고 최종 선택으로 채택             |
| `resolve`     | 좌표 등 입력을 주소 같은 다른 표현으로 해석                |
| `open`        | picker, drawer, dialog 같은 UI 계층을 연다                 |
| `close`       | 선택 반영 없이 또는 별도 완료 흐름을 거쳐 UI 계층을 닫는다 |
| `retry`       | 실패하거나 마지막으로 시도한 동일 작업을 다시 수행         |
| `startMoving` | 지도 이동 중으로 상태를 전환해 직전 주소 확정을 막는다     |

## 구분 원칙

- `place`와 `departure`를 혼용하지 않는다. 장소 후보가 사용자 선택을 거쳐 출발지 draft가 된다.
- `coords`와 `currentLocation`을 혼용하지 않는다. 핀 좌표는 현재 GPS 좌표와 다를 수 있다.
- `address`는 문자열이고 카카오 원본 응답은 `document` 또는 구체 타입명으로 구분한다.
- `result`는 성공·실패를 포함하는 연산 결과 또는 마지막 성공 묶음에만 쓰고, 무엇의 결과인지 가까운 문맥이 없으면 구체화한다.
- `picker`는 좌표 선택 UI, `search`는 장소 검색 UI다. 닫힘과 최종 선택의 history 책임을 구분한다.

## 확장 방법

새 기능에서 용어가 반복될 때만 이 표에 추가한다. 한 번 쓰는 구현 세부나 일반 영어 단어는 넣지 않는다. 기존 용어의 의미가 바뀌면 코드보다 먼저 PRD·확정 스펙과 이 문서를 함께 갱신한다.
