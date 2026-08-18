# Boolean and State

## Boolean 접두사

| 형태            | 의미                    | 좋은 예                          | 주의할 예                      |
| --------------- | ----------------------- | -------------------------------- | ------------------------------ |
| `is + 상태`     | 현재 상태·분류          | `isOpen`, `isMoving`             | `isError`—상태인지 값인지 모호 |
| `has + 명사`    | 보유·존재·발생 결과     | `hasError`, `hasPermission`      | 문맥 없는 `hasLoadFailed`      |
| `can + 동사`    | 능력·허용·전제 충족     | `canRetry`, `canConfirmLocation` | 대상 없는 `isConfirmable`      |
| `should + 동사` | 정책·파생된 결정        | `shouldRefetch`                  | 사용자의 능력 상태에 사용      |
| `did + 동사`    | 완료된 과거 사건의 결과 | `didLastRequestFail`             | 현재 상태에 습관적으로 사용    |
| `will + 동사`   | 예정된 동작·예측        | `willRedirect`                   | 단순 설정값에 사용             |

- `is` 뒤에는 보통 형용사·현재분사·상태 명사를 둔다: `isReady`, `isLoading`, `isOpen`.
- `has`는 존재 여부를 말한다: `hasSelection`, `hasLoadFailed`.
- 부정형은 이중 부정을 만들기 쉽다. `isEnabled`를 `isNotDisabled`보다 우선한다.
- `flag`, `value`, `boolean` 같은 타입 설명을 suffix로 붙이지 않는다.

## Status와 boolean 선택

하나의 생명주기에서 동시에 하나만 가능한 단계는 status union으로 표현한다.

```ts
type RequestStatus = 'idle' | 'resolving' | 'resolved' | 'failed';
```

필요한 boolean은 원본 status에서 파생한다.

```ts
const isResolving = requestStatus === 'resolving';
const hasFailed = requestStatus === 'failed';
```

서로 독립된 상태 축은 합치지 않는다.

```ts
const [hasLoadFailed, setHasLoadFailed] = useState(false);
const [isMoving, setIsMoving] = useState(false);
```

SDK 로드 결과와 카메라 이동은 같은 생명주기의 단계가 아니므로 하나의 `MapStatus`로 합치면 의미가 흐려진다.

## 파생값

여러 원본 상태의 정책적 결론은 호출부가 이해할 수 있는 capability로 노출한다.

```ts
const canConfirmLocation = lastResult !== null && !isMoving && requestStatus === 'resolved';
```

파생값과 원본 상태가 독립적으로 변경되지 않게 한다. 둘 다 state로 저장하면 불일치할 수 있다.

## 빠른 점검

- `true`가 무엇을 의미하는지 긍정문 한 문장으로 설명되는가?
- 접두사 뒤에 대상이 빠져 있지 않은가?
- 여러 boolean이 불가능한 조합을 허용하지 않는가?
- status와 boolean이 같은 사실을 중복 저장하지 않는가?
- 시간축이 현재, 과거 결과, 예정 중 무엇인지 이름에 맞는가?
