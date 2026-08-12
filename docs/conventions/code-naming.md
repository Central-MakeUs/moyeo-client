# 코드 네이밍 가이드

이 문서는 TypeScript와 React 코드에서 이름의 **표기법**뿐 아니라 **의미, 책임, 상태 모델과 추상화 수준**을 결정하는 팀 기준이다. 이름은 타입을 반복하는 장식이 아니라 호출부에서 코드의 의도를 설명해야 한다.

## 기준의 성격

- `camelCase`, `PascalCase` 같은 표기법은 저장소 규칙이다.
- `is/has/can`, `onX/handleX` 같은 선택은 널리 쓰이는 관습을 바탕으로 한 팀 지침이다.
- 영어에는 유일한 정답이 없는 경우가 많다. 의미가 정확하고 저장소 용어와 일관되면 취향만으로 바꾸지 않는다.
- 린트는 표기법 일부만 검사한다. 책임, 시간축, 상태의 모순 가능성은 코드 리뷰에서 판단한다.

참고한 공개 기준:

- [Google TypeScript Style Guide — Naming](https://google.github.io/styleguide/tsguide.html#naming): 타입에 이미 포함된 정보를 이름에 반복하지 않고 식별자 종류별 casing을 구분한다.
- [React — Responding to Events](https://react.dev/learn/responding-to-events#naming-event-handler-props): 커스텀 이벤트 handler Prop은 `on`으로 시작하는 관례를 사용한다.
- [typescript-eslint naming-convention](https://typescript-eslint.io/rules/naming-convention/): boolean 접두사와 casing을 자동화할 수 있지만, 규칙 복잡도 때문에 의미 품질은 문서와 리뷰가 필요하다.

## 1. 먼저 개념을 한 문장으로 정의한다

이름 후보를 만들기 전에 대상이 무엇인지 설명한다.

```text
현재 카메라가 이동 중인가                          → isMoving
마지막 SDK 로드가 실패했는가                       → hasLoadFailed
현재 핀을 출발지로 확정할 수 있는가                → canConfirmLocation
핀 좌표를 주소로 변환한다                           → resolveAddress
지도 이동 시작 사건을 부모에게 알린다              → onMoveStart
```

설명할 수 없으면 이름보다 책임이 불명확한 상태일 수 있다.

## 2. 문맥에 따라 구체성 수준을 정한다

- 한 함수 안에서 대상이 분명하면 짧게 쓴다: `result`, `status`, `retry`.
- 여러 작업이 함께 있으면 대상을 붙인다: `locationResult`, `requestStatus`, `retryAddress`.
- public API, cross-layer export, Props는 지역 변수보다 구체적으로 쓴다.
- 타입 이름을 그대로 suffix로 반복하지 않는다: `userString`, `itemsArray`, `errorBoolean`은 피한다.
- 미래 재사용을 예상해 `manager`, `controller`, `data`, `value`, `process`처럼 넓히지 않는다.

```ts
// 두 retry가 있어 별칭이 의미를 보강한다.
const { retry } = useCurrentLocation();
const { retry: retryAddress } = useReverseGeocode();

// 이미 명확한 이름을 줄이는 별칭은 검색성과 일관성만 낮춘다.
const { startMoving } = useReverseGeocode();
```

## 3. Boolean은 true의 의미를 이름에 담는다

| 접두사   | 사용 목적           | 예시                             |
| -------- | ------------------- | -------------------------------- |
| `is`     | 현재 상태·분류      | `isOpen`, `isMoving`             |
| `has`    | 보유·존재·발생 결과 | `hasError`, `hasLoadFailed`      |
| `can`    | 능력·허용 조건 충족 | `canRetry`, `canConfirmLocation` |
| `should` | 정책에 따른 결정    | `shouldRefetch`                  |
| `did`    | 과거 사건의 결과    | `didLastRequestFail`             |
| `will`   | 예정된 동작·예측    | `willRedirect`                   |

- 긍정형을 우선한다: `isEnabled`가 `isNotDisabled`보다 읽기 쉽다.
- 대상이 빠진 `isValid`, `isFailed`, `isConfirmable`은 가까운 문맥이 없으면 구체화한다.
- `is + 명사`를 기계적으로 금지하지 않는다. `isAdmin`, `isError`처럼 분류를 나타낼 수 있지만 의미가 즉시 이해되는지 확인한다.

## 4. 하나의 생명주기는 status, 독립된 축은 별도 상태

동시에 하나만 가능한 요청 단계는 union으로 표현한다.

```ts
type RequestStatus = 'idle' | 'resolving' | 'resolved' | 'failed';
```

```ts
const isResolving = requestStatus === 'resolving';
const canConfirmLocation = lastResult !== null && !isMoving && requestStatus === 'resolved';
```

여러 boolean으로 동일 생명주기를 표현하면 `isResolving && isFailed` 같은 모순 조합을 허용할 수 있다.

반대로 SDK 로드 실패와 지도 이동처럼 서로 다른 상태 축은 억지로 하나의 enum에 합치지 않는다.

```ts
const [hasLoadFailed, setHasLoadFailed] = useState(false);
const [isMoving, setIsMoving] = useState(false);
```

파생값은 원본 state와 별도로 저장하지 않는다. 원본에서 계산해 불일치를 막는다.

## 5. 함수는 결과와 부작용을 말하는 동사로 시작한다

| 목적           | 권장 형태                       | 예시                         |
| -------------- | ------------------------------- | ---------------------------- |
| 조회           | `get`, `find`, `fetch`, `load`  | `getCenter`, `fetchMeetings` |
| 변환           | `to`, `from`, `parse`, `format` | `toDepartureDraft`           |
| 판정           | `is`, `has`, `can`, `should`    | `isWithinRange`              |
| 명령·상태 전이 | 구체적 행위 동사                | `startMoving`, `closePicker` |
| 확정·선택      | `confirm`, `select`, `resolve`  | `confirmSelection`           |

- `get`은 보통 즉시 반환, `fetch`는 외부 I/O, `load`는 준비나 캐시를 포함할 수 있다.
- Promise 반환만을 이유로 `Async`를 붙이지 않는다.
- `process`, `handle`, `manage`를 public API의 만능 동사로 사용하지 않는다.
- 변환 함수는 출력이 핵심이면 `toX` 형태를 우선한다.

## 6. React 이벤트는 역할별로 구분한다

```tsx
function handleMoveStart() {
  setIsMoving(true);
  onMoveStart?.();
}

<MapLocationPicker onMoveStart={startMoving} />;
```

- `onMoveStart`: 자식 컴포넌트가 노출하는 사건 Prop.
- `handleMoveStart`: 사건을 처리하는 컴포넌트 내부 함수.
- `startMoving`: 상태나 도메인을 실제로 변경하는 명령.

훅의 public API를 `handleX`로 내보내면 특정 UI 이벤트에 결합되기 쉽다. 훅은 효과를 말하고 컴포넌트가 이벤트와 연결한다.

## 7. 타입, 컴포넌트와 컬렉션

- 컴포넌트·타입·인터페이스는 `PascalCase`, 값·함수는 `camelCase`를 쓴다.
- Props는 `{Component}Props`를 쓴다.
- 인터페이스에 `I`를 붙이거나 타입에 `Type`을 붙이지 않는다.
- 컬렉션은 복수형을 쓴다: `meeting`, `meetings`를 구분한다.
- 개수는 `meetingCount`, 인덱스는 `meetingIndex`처럼 단위를 드러낸다.
- 약어도 단어처럼 casing한다: `apiUrl`, `userId`, `loadHttpUrl`.
- 외부 API의 `road_address`처럼 계약이 정한 이름은 경계 타입에서 보존할 수 있다.

## 8. 훅과 추상화 이름

- 훅은 `use`로 시작하고 소유하는 상태나 capability를 말한다.
- 테스트하기 쉽다는 이유만으로 production 훅을 만들지 않는다.
- 상태 소유권, 생명주기, 외부 시스템 연결, 반복되는 정책이 분리 근거가 된다.
- 현재 유스케이스가 구체적인데 예상 재사용을 위해 generic 이름을 만들지 않는다.

```text
usePickerRoute              URL과 history를 소유
useDeferredPickerSelection picker가 닫힐 때까지 선택 전달을 보류
```

두 훅이 함께 쓰이더라도 서로 다른 상태 소유권이면 분리할 수 있다.

## 9. 이름 변경 체크리스트

- [ ] 선언부와 모든 import/export를 찾았는가?
- [ ] 구조 분해 별칭과 mock 반환값을 확인했는가?
- [ ] 테스트 이름과 단언이 옛 계약을 말하지 않는가?
- [ ] issue 문서의 확정 시그니처와 예제를 갱신했는가?
- [ ] 같은 도메인 개념에 동의어를 새로 만들지 않았는가?
- [ ] 이름 변경에 동작 변경이나 리팩터링을 섞지 않았는가?

## 10. 코드 리뷰 표현

네이밍 피드백은 다음 세 단계로 구분한다.

- **필수 수정**: 의미 오류, 공개 계약 불일치, 반대 의미, 충돌.
- **변경 권장**: 문맥 없이는 대상·시간축·부작용이 불명확함.
- **유지 가능**: 다른 후보와의 차이가 취향 수준임.

후보는 최대 세 개만 제시하고 추천 이유와 버린 후보의 trade-off를 함께 적는다.
