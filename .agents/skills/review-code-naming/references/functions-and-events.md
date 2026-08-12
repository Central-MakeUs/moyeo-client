# Functions and Events

## 함수는 동사로 시작한다

| 목적           | 권장 동사                       | 예시                         |
| -------------- | ------------------------------- | ---------------------------- |
| 조회           | `get`, `find`, `load`, `fetch`  | `getCenter`, `fetchMeetings` |
| 변환           | `to`, `from`, `parse`, `format` | `toDepartureDraft`           |
| 판정           | `is`, `has`, `can`, `should`    | `isWithinRange`              |
| 명령·상태 전이 | 구체적 행위 동사                | `startMoving`, `closePicker` |
| 해결·확정      | `resolve`, `confirm`, `select`  | `resolveAddress`             |
| 재시도         | `retry` + 필요 시 대상          | `retryAddress`               |

- `process`, `handle`, `manage`, `data`, `util`은 책임을 숨기므로 public API에서 피한다.
- 비동기라는 이유만으로 `Async`를 붙이지 않는다. 반환 타입과 동사가 충분히 말하면 생략한다.
- `get`은 보통 즉시 반환, `fetch`는 외부 I/O, `load`는 준비·캐시를 포함할 수 있다. 프로젝트 의미를 일관되게 유지한다.
- 변환 함수는 입력과 출력 관계가 핵심이면 `toX`를 우선한다.

## React 이벤트 3단계

```tsx
function handleMoveStart() {
  setIsMoving(true);
  onMoveStart?.();
}

<MapLocationPicker onMoveStart={startMoving} />;
```

| 위치                  | 형태        | 의미                               |
| --------------------- | ----------- | ---------------------------------- |
| 컴포넌트 이벤트 Prop  | `onX`       | X 사건이 발생하면 호출             |
| 지역 이벤트 처리 함수 | `handleX`   | 이 컴포넌트가 X 사건을 처리        |
| 도메인·상태 명령      | 구체적 동사 | 상태를 실제로 전환하거나 작업 수행 |

`handleX`를 훅의 public API로 내보내면 UI 이벤트에 결합되기 쉽다. 훅은 `startMoving`, `confirmSelection`처럼 실제 효과를 이름에 담는다.

커스텀 이벤트 Prop은 React 공식 문서의 관례대로 `on`으로 시작하고, 컴포넌트가 제공하는 사용자 개념에 맞게 이름을 정한다.

## 훅과 추상화

- 훅 이름은 `use`로 시작하고 소유하는 상태나 capability를 말한다.
- 한 소비자만 있다는 이유만으로 분리를 금지하지 않지만, 테스트 편의만으로 production 훅을 만들지 않는다.
- 분리 근거는 상태 소유권, 생명주기, 외부 시스템 연결, 재사용되는 정책이어야 한다.
- generic을 예상해서 `useManager`, `useController`, `usePendingValue`로 넓히지 않는다. 현재 유스케이스를 정확히 표현한다.

## 문맥과 별칭

충돌이나 의미 보강이 있을 때만 destructuring 별칭을 쓴다.

```ts
const { retry } = useCurrentLocation();
const { resolve: resolveAddress, retry: retryAddress } = useReverseGeocode();
```

이미 명확한 이름을 짧게 만들기 위한 별칭은 피한다.

```ts
const { startMoving } = useReverseGeocode(); // 권장
const { startMoving: startMove } = useReverseGeocode(); // 이점 없음
```

## 빠른 점검

- 호출부가 자연스러운 명령문이나 질문처럼 읽히는가?
- 함수명에서 부작용과 대상이 드러나는가?
- 이벤트 Prop, 지역 handler, 상태 명령을 구분했는가?
- `get/fetch/load`, `select/confirm/resolve`를 같은 의미로 혼용하지 않는가?
- 별칭이 충돌을 해결하거나 의미를 보강하는가?
