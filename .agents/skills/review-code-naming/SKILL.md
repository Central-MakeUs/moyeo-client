---
name: review-code-naming
description: TypeScript·React 코드의 변수, boolean, 상태, 함수, 훅, 이벤트 Props, 타입, 컴포넌트와 파일 이름을 문맥과 책임에 따라 검토하고 후보를 비교한다. 사용자가 네이밍 검토·추천·영어 표현 평가, is/has/can/should 구분, onX/handleX 구분, status와 boolean 상태 모델 선택, 추상화 수준이나 이름 변경 파급 범위 확인을 요청할 때 사용한다. 커밋 전 staged 변경의 네이밍 일괄 검토에도 사용한다.
---

# Code Naming Review

이름의 문법보다 의미·책임·사용처 일관성을 먼저 검토한다. 저장소 기준은
[`docs/conventions/code-naming.md`](../../../docs/conventions/code-naming.md)를 따른다.

## 검토 절차

1. 저장소 지침과 네이밍 가이드를 읽는다.
2. 선언부만 보지 말고 타입, 구현, 모든 사용처, 테스트, 공개 문서를 함께 찾는다.
3. 대상이 값·상태·능력·정책·명령·이벤트·변환·도메인 개념 중 무엇인지 한 문장으로 정의한다.
4. 이름이 실제 의미, 시간축, 대상, 부작용과 일치하는지 판단한다.
5. 표기법 오류와 의미 문제를 구분한다. 린트로 잡을 수 있는 casing보다 코드 리뷰가 필요한 의미 문제를 우선한다.
6. 후보를 최대 3개 비교하고 하나를 추천한다. 차이가 없으면 변경하지 않는다.
7. 변경 시 선언, import/export, 사용처, 테스트, 문서 시그니처의 파급 범위를 보고한다.

## 필요한 reference 선택

- boolean, status, 여러 상태를 합칠지 판단할 때 [`references/boolean-and-state.md`](references/boolean-and-state.md)를 읽는다.
- 함수, 훅, 비동기 작업, React 이벤트 이름을 판단할 때 [`references/functions-and-events.md`](references/functions-and-events.md)를 읽는다.
- place, departure, picker 등 Moyeo 도메인 용어를 판단할 때 [`references/domain-vocabulary.md`](references/domain-vocabulary.md)를 읽는다.

## 핵심 판정 기준

- 이름은 타입이 이미 말하는 정보를 반복하지 않고 역할과 의미를 보충해야 한다.
- 짧음보다 정확성을 우선하되, 가까운 문맥이 대상을 이미 말하면 반복하지 않는다.
- public API와 cross-layer 이름은 지역 변수보다 구체적으로 짓는다.
- 긍정형 boolean을 우선하고, `true`의 의미가 한 문장으로 읽혀야 한다.
- 하나의 생명주기는 status union을 우선하고 독립된 상태 축은 별도로 둔다.
- 새 훅이나 generic 이름은 예상 재사용이 아니라 현재 책임으로 정당화한다.
- 테스트 편의만으로 production 추상화를 만들지 않는다.
- API 응답 필드, 표준 프로토콜, 생성 코드는 외부 이름을 보존할 수 있다.

## 심각도

- **필수 수정**: 의미가 틀림, 공개 계약 불일치, 반대 의미, 충돌, 상태 모델이 불가능한 조합을 허용함.
- **변경 권장**: 대상·시간축·부작용이 모호하거나 호출부 문장이 부자연스러움.
- **유지 가능**: 다른 후보가 취향 차이뿐이고 현재 이름이 문맥에서 정확함.

## 출력 형식

```md
## 판정

- 현재 이름: `isConfirmable`
- 결과: 변경 권장
- 실제 의미: 현재 핀 위치를 출발지로 확정할 수 있음

## 후보 비교

1. `canConfirmLocation` — 추천. 능력과 대상을 모두 표현한다.
2. `isResultCurrent` — 데이터 신선성을 강조할 때 적합하다.
3. `canSubmit` — 폼 UI에 지나치게 결합한다.

## 파급 범위

- 선언과 반환 타입
- 소비 컴포넌트
- 테스트 mock과 단언
- issue 문서의 확정 시그니처
```

여러 이름을 검토할 때는 `현재 이름 / 판정 / 추천 / 근거` 표를 먼저 제시하고, 필수 수정만 상세히 설명한다.

## 경계

- 영어 취향을 객관적 오류처럼 말하지 않는다.
- 유명 회사의 스타일을 보편 표준처럼 강제하지 않는다.
- 기존 프로젝트 용어를 확인하지 않고 동의어로 바꾸지 않는다.
- 이름 변경 요청이 아닌 리뷰 요청에서는 파일을 수정하지 않는다.
- 이름 변경을 수행할 때 동작, 테스트 의도, public API를 함께 바꾸지 않는다.
