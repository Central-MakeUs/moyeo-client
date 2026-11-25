---
paths:
  - 'apps/web/src/features/**'
---

# features 레이어 (2)

**사용자가 하는 일** 하나 = slice 하나. entities가 명사라면 features는 동사다.

---

## 1. 무엇이 feature인가

**"사용자가 ~한다"로 문장이 되고, 그것만으로 완결된 가치가 있다.**

| 이름                                      | feature인가                    |
| ----------------------------------------- | ------------------------------ |
| `meeting-create` (모임을 만든다)          | ✅                             |
| `meeting-confirm-place` (장소를 확정한다) | ✅                             |
| `meeting-leave` (모임에서 나간다)         | ✅                             |
| `auth-social-login` (소셜 로그인한다)     | ✅                             |
| `button`                                  | ❌ UI 프리미티브 → `shared/ui` |
| `meeting`                                 | ❌ 명사 → `entities`           |
| `mypage`                                  | ❌ 화면 → `_pages` / `widgets` |

**슬라이스 이름은 `{대상}-{행동}`을 기본으로 한다.** 관련된 것끼리 사전순으로 모인다 —
그래서 그룹 폴더가 필요 없다.

### ⚠️ 기존 위반 — slice group `features/meeting/*` (v2에서 평평하게 이전 확정, 2026-11-25)

moyeo는 `features/meeting/{create-meeting, confirm-place, …}`처럼 **그룹 폴더 + `{행동}-{대상}`** 이름을 쓴다.
**slice group은 쓰지 않는다.** 레이어 바로 아래 폴더가 곧 slice다. 이전 매핑:

| 지금                            | v2                         |
| ------------------------------- | -------------------------- |
| `meeting/create-meeting`        | `meeting-create`           |
| `meeting/confirm-place`         | `meeting-confirm-place`    |
| `meeting/confirm-schedule`      | `meeting-confirm-schedule` |
| `meeting/delete-meeting`        | `meeting-delete`           |
| `meeting/leave-meeting`         | `meeting-leave`            |
| `meeting/edit-meeting-nickname` | `meeting-edit-nickname`    |
| `meeting/edit-response`         | `meeting-edit-response`    |
| `meeting/invite-share`          | `meeting-invite-share`     |
| `meeting/invite-join-entry`     | `meeting-invite-join`      |
| `meeting/invite-participation`  | `meeting-participate`      |

- **결정 근거** — "slice냐 그룹이냐" 판정이 사라져 사람도 도구도 헷갈리지 않는다 / 접두사가 사전순 묶음을 대신한다
- 이전 전까지 훅은 그룹을 인식한다(`index.ts` 없는 폴더 아래를 slice로, 그룹 안끼리도 cross-slice 차단). **이전이 끝나면 훅의 group 인식을 지운다**
- 새 feature는 그룹 폴더에 추가하지 않고 평평하게 `{대상}-{행동}`으로 만든다

## 2. 구조

```
features/{slice}/
├── model/     # 이 상호작용의 상태와 로직 (폼 상태, 검증, 단계 관리)
├── api/       # 이 행동이 부르는 mutation / query 훅
├── ui/        # 이 행동을 트리거하는 컴포넌트
├── lib/
└── index.ts
```

> ⚠️ 기존 위반 — `features/meeting/*/model/use-confirm-place.ts`, `use-leave-meeting.ts` 같은 mutation 훅은 `api/`로 옮길 대상이다.

## 3. features의 UI는 동작을 안다

entities UI와 정확히 반대다. **feature UI는 스스로 무엇을 할지 안다.**

```tsx
// ✅ 예시 — 실제 구현은 features/meeting/leave-meeting/{model/use-leave-meeting.ts, ui/leave-meeting-dialog.tsx}
export function LeaveMeetingButton({ inviteCode, onLeft }: LeaveMeetingButtonProps) {
  const { mutate, isPending } = useLeaveMeeting({ onSuccess: onLeft });
  return (
    <Button onClick={() => mutate(inviteCode)} disabled={isPending}>
      나가기
    </Button>
  );
}
```

표시용 조각(`shared/ui`)과 도메인 표현(`entities/*/ui`)을 **조합해서** 동작을 붙이는 게 이 레이어의 역할이다.

## 4. 무엇을 import 할 수 있나

| 대상                          | 가능                          |
| ----------------------------- | ----------------------------- |
| `shared/*`                    | ✅                            |
| `entities/*`                  | ✅                            |
| 다른 `features/*` (그룹 포함) | ❌ **cross-slice, 훅이 차단** |
| `widgets` / `_pages` / `_app` | ❌ 상향, 훅이 차단            |

**두 feature가 서로를 필요로 하면** 셋 중 하나다.

1. 사실 한 feature다 → 합친다
2. 공통 부분이 아래로 내려가야 한다 → `entities` 또는 `shared`로 추출
3. 조합이 필요한 것이다 → 둘 다 쓰는 `widgets`를 만든다

## 5. 크기 판단

아래면 쪼갠다.

- `ui/`에 서로 무관한 컴포넌트가 여러 개 (한 화면의 서로 다른 영역)
- 이름에 `and` / `-and-`가 들어감
- 이 feature의 절반만 쓰는 사용처가 생김

반대로 **feature 하나가 파일 두 개뿐이어도 괜찮다.** 억지로 합치지 않는다.

## 6. 금지

- ❌ cross-slice import (훅이 차단)
- ❌ 상향 import (훅이 차단)
- ❌ 라우팅 결정을 feature 안에 박기 — 이동 후 목적지는 화면마다 다르다.
  `onSuccess` 같은 콜백으로 받거나 상위(`widgets`/`_pages`)가 처리한다
- ❌ 서버 응답 타입을 다시 선언 — orval 생성 타입을 쓴다
