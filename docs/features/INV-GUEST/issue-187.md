# Issue #187: [feat] 게스트 세션 기록

> **선행 문서**: [`prd.md`](./prd.md) · [`issues.md`](./issues.md) · #183(게스트 세션 저장소) ·
> #185(진입 분기)
>
> `entities/guest-session`에 **쓰는 쪽**을 붙인다. 지금은 읽는 곳만 3군데 있고 `writeGuestSession`
> 호출처가 없어 게스트 세션이 항상 `null`이다.

## 확정된 시그니처

**새로 만드는 함수·타입이 없다.** 기존 훅 두 곳에 `writeGuestSession` 호출을 더하는 작업이라
`test-scenarios` 단계를 건너뛰었다. 쓰는 함수는 `#183`이 이미 확정했다.

```typescript
// entities/guest-session (이미 존재)
export function writeGuestSession(inviteCode: string, nickname: string): void;
```

호출 지점 두 곳:

```
features/meeting/invite-participation/model/use-guest-entry.ts
  └─ EXISTING_GUEST 분기            writeGuestSession(inviteToken, request.nickname)

features/meeting/invite-participation/model/use-submit-guest-join.ts
  └─ joinGuest 성공 직후            writeGuestSession(inviteCode, identity.nickname)
```

두 지점 모두 "서버가 이 모임의 게스트임을 확인해준 순간"이라는 같은 의미를 가진다.
`features → entities` 방향이라 FSD 경계는 문제없다.

## 테스트 시나리오

> 훅은 화면을 통해 통합 테스트한다(레포 관례). 진입 분기는 `guest-entry-page.test.tsx`,
> 참여 제출은 `guest-schedule-page.test.tsx`에서 검증한다.

### 정상

- [x] [정상] GuestEntryPage — `EXISTING_GUEST` 응답이면 `writeGuestSession`이 `'ABC123'`·`'소미'`로 호출된다
- [x] [정상] GuestSchedulePage — 참여 제출이 성공하면 `writeGuestSession`이 `'ABC123'`·`'소미'`로 호출된다

### 경계

- [x] [경계] GuestEntryPage — `NEW_GUEST` 응답이면 `writeGuestSession`이 호출되지 않는다 (아직 참여 전)

### 예외

- [x] [예외] GuestSchedulePage — 참여 제출이 실패하면 `writeGuestSession`이 호출되지 않는다

## AC 커버리지

| AC   | 커버하는 시나리오                              |
| ---- | ---------------------------------------------- |
| AC-1 | [정상] GuestEntryPage — `EXISTING_GUEST` 저장  |
| AC-2 | [경계] GuestEntryPage — `NEW_GUEST` 미저장     |
| AC-3 | [정상] GuestSchedulePage — 제출 성공 시 저장   |
| AC-4 | [예외] GuestSchedulePage — 제출 실패 시 미저장 |
