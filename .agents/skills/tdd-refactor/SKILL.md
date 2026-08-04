---
name: tdd-refactor
description: TDD Refactor 단계를 수행한다. 모든 관련 테스트가 Green인 상태를 유지하면서 현재 이슈가 변경한 apps/web/src 비테스트 코드의 중복·네이밍·단일 책임·복잡도·FSD 구조를 개선한다. 사용자가 tdd-refactor, Refactor 단계, Green 이후 구조 개선, 동작을 유지한 코드 정리 등을 요청할 때 사용한다.
---

# TDD Refactor

관찰 가능한 동작을 바꾸지 않고 이번 이슈의 구현 구조만 개선한다. 테스트를 안전망으로 삼아 작은 변경마다 Green을 재확인한다.

## 필수 원칙

- 시작 전에 관련 테스트가 모두 Green이어야 한다. Red가 있으면 Green 단계로 돌려보낸다.
- 테스트 파일, 공개 export·Props·role·텍스트를 바꾸지 않는다.
- 새 기능·분기·옵션·검증을 추가하지 않는다.
- 이번 이슈가 변경한 `apps/web/src`의 비테스트 파일만 수정한다.
- 후보를 먼저 보고하고 사용자 승인을 받은 뒤 변경한다.
- 한 번에 한 후보만 변경하고 관련 테스트를 실행한다.
- 실패하면 방금 변경한 부분만 역패치한다. `git checkout`이나 `git reset`으로 사용자 변경을 지우지 않는다.
- 커밋하지 않는다.
- 저장소 `AGENTS.md`와 사용자 지침이 이 스킬보다 우선한다.

## 워크플로

### 1. Green 기준선 확인

`CLAUDE.md`, `AGENTS.md`, issue 문서를 읽고 관련 테스트를 실행한다. 하나라도 실패하면 리팩토링하지 않는다.

### 2. 대상 식별

실제 base를 확인하고, 기본적으로 다음 두 범위에서 현재 이슈의 변경을 찾는다.

```bash
git diff origin/develop...HEAD --name-only -- apps/web/src/
git diff --name-only -- apps/web/src/
```

테스트 파일을 제외하고 중복, 내부 네이밍, 단일 책임, 불필요한 복잡도, FSD와 컨벤션 위반만 후보로 삼는다.

### 3. 승인 게이트

각 후보를 `대상 / 문제 / 제안 / 행동 보존 근거`로 보고한다. 공개 표면에 닿는 후보는 제외하거나 별도 표시한다. 사용자 승인 전에는 수정하지 않는다.

### 4. 작은 변경 루프

승인된 후보마다 논리적 변경 하나만 적용하고 가장 가까운 테스트를 실행한다. 공유 코드면 관련 slice와 전체 unit 테스트로 확장한다. Red가 되면 방금 변경만 되돌린다.

### 5. 최종 검증

```bash
pnpm --filter @repo/web check-types
pnpm --filter @repo/web lint
pnpm --filter @repo/web lint:steiger
pnpm --filter @repo/web test
```

타입 검사와 관련 테스트는 생략하지 않는다.

## 결과 보고

- 적용한 리팩토링과 전후 차이
- 보류하거나 되돌린 후보와 이유
- 테스트·타입·lint·Steiger 결과
- 범위 밖 후속 개선점

## 금지 사항

- 승인 전 수정
- 테스트 수정
- 동작 변경 또는 새 기능 추가
- 이슈 범위 밖 정리
- 여러 변경을 묶은 뒤 한 번만 검증
- 워킹 트리 전체를 되돌리는 Git 명령
