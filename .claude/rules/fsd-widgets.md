---
paths:
  - 'apps/web/src/widgets/**'
---

# widgets 레이어 (3)

화면의 **독립적인 한 덩어리**. entities와 features를 조합해 "그 자리에 놓으면 동작하는" 블록을 만든다.

---

## 1. 무엇이 widget인가

**화면에서 잘라내도 의미가 유지되고, 다른 화면에 그대로 붙일 수 있는 덩어리.**

현재 slice: `home` · `login-drawer` · `meeting-coordination` · `meeting-overview-top-bar` · `mypage`

| 판단                                   | widget인가                          |
| -------------------------------------- | ----------------------------------- |
| 여러 화면에 같은 모양으로 등장한다     | ✅                                  |
| entities와 features를 여러 개 조합한다 | ✅                                  |
| 한 화면에서만 쓰이고 조합도 없다       | ❌ 그냥 `_pages/{slice}/ui/`에 둔다 |
| 동작 하나만 한다                       | ❌ → `features`                     |

**판단 기준은 재사용 횟수가 아니라 독립성이다** — 그 덩어리가 페이지의 나머지를 몰라도 되는가.

## 2. 이름에 `-widget`을 붙이지 않는다

```
widgets/login-drawer/         ✅
widgets/login-drawer-widget/  ❌ 폴더가 이미 widgets/ 안이다
```

## 3. 구조

```
widgets/{slice}/
├── ui/        # 조합된 블록. 이 레이어의 핵심
├── model/     # 이 블록 안에서만 쓰는 상태 (열림/닫힘, 탭 선택 등)
├── lib/
└── index.ts
```

대부분의 widget은 **`ui/`와 `index.ts`만** 있으면 된다.

## 4. 비즈니스 로직을 직접 갖지 않는다

widget은 **조립공**이지 로직의 주인이 아니다.

### 기준 형태 — widget은 배치하고, 선택은 위로 알린다

```tsx
// widgets/home/ui/confirmed-meeting-section.tsx (기준 형태)
export function ConfirmedMeetingSection({ confirmed, onSelect }: ConfirmedMeetingSectionProps) {
  return confirmed.map((meeting) => (
    <ConfirmedMeetingListItem // entities/meeting/ui — 표시만 한다
      key={meeting.meetingId}
      title={meeting.name}
      confirmedDate={meeting.confirmedScheduleDate}
      place={meeting.confirmedPlaceName}
      onClick={() => onSelect(meeting.inviteCode)} // 어디로 갈지는 페이지가 정한다
    />
  ));
}

// _pages/home/ui/home-page.tsx
<ConfirmedMeetingSection
  confirmed={data.confirmed}
  onSelect={(code) => router.push(overviewPath(code))}
/>;
```

> ⚠️ **기존 위반** — 지금 `ConfirmedMeetingSection`은 안에서 `useRouter().push`를 한다. 위 형태로 옮길 대상이다 (`docs/work/backlog.md`).

```tsx
// entity: 동작을 모른다. "어디로 갈지는 호출부가 정한다"가 props 주석에 박혀 있다 — 이쪽은 이미 기준대로다
export interface ConfirmedMeetingListItemProps {
  title: string;
  /** 탭 시 확정된 모임을 연다. 어디로 갈지는 호출부가 정한다. */
  onClick?: () => void;
}
```

### 행동까지 붙일 때 — entity 카드 + feature 버튼 조합

행동 버튼이 카드 안에 들어가야 하면 entity가 `children`(또는 slot prop)을 열어 두고, widget이 feature를 끼운다.
entity는 feature를 import할 수 없으므로(상향) **조합은 widget에서만 일어난다.**

```tsx
// widgets/{slice}/ui/… (예시)
export function MeetingList() {
  const { data } = useMeetingsQuery(); // entities/meeting
  return data.inProgress.map((meeting) => (
    <MeetingCardView key={meeting.meetingId} meeting={meeting}>
      {/* entities/meeting/ui */}
      <LeaveMeetingButton inviteCode={meeting.inviteCode} /> {/* features/meeting/leave-meeting */}
    </MeetingCardView>
  ));
}
```

```tsx
// ❌ 도메인 판단을 위젯이 직접 한다
const isFullyConfirmed =
  meeting.confirmedScheduleDate != null && meeting.confirmedPlaceName != null;
const label = isFullyConfirmed ? '확정' : '조율 중';
```

판단은 `entities/*/model/`로(`meeting-confirmation.ts`의 `toConfirmationOutcome` 같은 순수 함수),
행동은 `features/*`로 내려간다. **위젯 안의 `if`가 도메인 판단을 하고 있으면 잘못된 위치다.**

## 5. 무엇을 import 할 수 있나

| 대상                                     | 가능                      |
| ---------------------------------------- | ------------------------- |
| `shared/*` · `entities/*` · `features/*` | ✅                        |
| 다른 `widgets/*`                         | ❌ cross-slice, 훅이 차단 |
| `_pages` / `_app`                        | ❌ 상향, 훅이 차단        |

**위젯 안에 위젯이 필요하면** 보통 페이지가 두 위젯을 나란히 놓아야 한다는 뜻이다.
정말 중첩이 필요하면 안쪽을 `entities`/`features`로 내리거나 `children`으로 주입받는다.

## 6. 페이지와의 경계

- **위젯은 자기 데이터를 스스로 가져와도 된다.** 그래야 페이지가 얇아진다
- **위젯은 자기 위치를 모른다.** 바깥 여백·배치는 페이지가 정한다
  (`className`으로 레이아웃만 받는 건 허용, `className-convention.md` 참고)
- **라우팅 결정은 페이지가 한다.** 위젯은 `onSelect` 같은 콜백으로 알린다
