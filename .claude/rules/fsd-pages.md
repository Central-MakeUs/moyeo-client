---
paths:
  - 'apps/web/src/_pages/**'
  - 'apps/web/src/_app/**'
  - 'apps/web/app/**'
---

# \_pages 레이어 (4) + \_app 레이어 (5) + Next 라우트 (`apps/web/app/`)

화면 하나 = `_pages`의 slice 하나. 그리고 **URL은 `_pages`가 아니라 Next App Router의 `apps/web/app/`이 정한다.**
세 곳의 역할이 헷갈리기 쉬워 한 문서로 다룬다.

| 위치                  | 무엇                                       | FSD 레이어인가                          |
| --------------------- | ------------------------------------------ | --------------------------------------- |
| `apps/web/app/`       | Next 라우트 (`page.tsx`, `layout.tsx` …)   | ❌ `src/` 밖. 훅·steiger 검사 대상 아님 |
| `apps/web/src/_pages` | 화면 조립                                  | ✅ pages (4)                            |
| `apps/web/src/_app`   | 전역 provider·가드·폰트·`globals.css`·분석 | ✅ app (5)                              |

> `_` 접두사는 Next 예약 폴더명(`app`/`pages`)과의 충돌 회피용이다. steiger는 `steiger.config.js`에서
> 이를 오타로 보지 않게 예외 처리돼 있다.

---

## 1. 라우트 파일은 얇게 — 화면은 `_pages`로 위임

```tsx
// app/(protected)/home/page.tsx — 이게 기본형이다
export { HomePage as default } from '@/_pages/home';
```

- Next는 `page.tsx`의 **default export**를 요구한다. `_pages`는 named export, 라우트에서 `as default`로 잇는다
- 라우트 파일에 들어가도 되는 것: `metadata`/`generateMetadata`, `params`/`searchParams` 해석,
  `Suspense` 경계, 라우트 전용 가드 연결 같은 **라우팅 설정**
- 들어가면 안 되는 것: 화면 JSX 구현, 도메인 로직

> ⚠️ 일부 기존 라우트(`app/(protected)/meetings/[meetingId]/invite/page.tsx` 등)는 화면 조립까지
> 라우트 파일에 들어 있다. **새 화면은 이 형태를 따르지 않는다.** 기존 라우트를 고칠 일이 생기면
> 그 작업 범위 안에서만 `_pages`로 옮길지 판단하고, 범위 밖이면 새 항목으로 뽑는다 (`work-record.md`).

## 2. 라우트 값은 라우트 파일에서 페이지로 넘긴다

`useParams`/`useSearchParams`로 읽은 값을 페이지 props로 넘기면 `_pages`가 URL 구조를 몰라도 된다.

```tsx
// app/(protected)/meetings/[meetingId]/page.tsx (예시)
import { MeetingPage } from '@/_pages/meeting';

export default async function Page({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params; // Next 16: params 는 Promise
  return <MeetingPage meetingId={Number(meetingId)} />;
}
```

`useSearchParams`를 쓰는 클라이언트 컴포넌트는 **`Suspense` 경계 안**에 둔다. 빠뜨리면 빌드가 실패한다.

## 3. 라우트 그룹 — 인증 여부는 위치로 정한다

```
app/
├── (public)/            # 비로그인 접근 가능 (login, onboarding, auth, legal)
├── (protected)/         # layout.tsx 가 ProtectedGuard 로 감싼다 → 비로그인 시 /login?next=…
├── i/[inviteToken]/     # 초대 링크 진입 — (landing) · (participant: guest/nickname/respond/complete)
└── meetings/            # 모임 현황(VIEW-01). 로그인 여부와 무관하게 공개 열람, 가드 없음
```

**새 페이지 추가 판단 순서**

1. 로그인 필요 → `(protected)/` 안
2. 공개 → `(public)/` 안
3. 초대 링크로 들어오는 참여자 화면 → `i/[inviteToken]/` 아래 기존 그룹
4. 모임 현황 계열(로그인 무관 열람) → `meetings/`

가드는 **클라이언트 가드**다 (`_app/guards/protected-guard.tsx`). 네이티브의 토큰이 로드 후 도착하므로
서버 가드로 바꾸지 않는다.

병렬·가로채기 라우트(`@modal/(.)search`)를 이미 쓴다. 새로 만들 때는 기존 `departure` 구조를 참고한다.

## 3-1. 라우트를 세 축으로 분류한다 — 축 크기에 수단을 맞춘다

굵은 구분은 **폴더 위치**, 가는 구분은 **props/데이터**로 표현한다. 셋을 한 수단으로 섞지 않는다.

| 축              | 무엇                                        | 수단                                                        | 예                                                                 |
| --------------- | ------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| ① 인증 여부     | 로그인 필요 / 공개 / 초대 토큰              | **라우트 그룹 폴더** (`(protected)` · `(public)` · `i/[…]`) | `(protected)/layout.tsx` = `ProtectedGuard`                        |
| ② 크롬(셸) 종류 | 상단 바+진행률 / 상단 바만 / 없음(전체화면) | **그 구간의 `layout.tsx`**                                  | `(protected)/meetings/new/layout.tsx` = TopAppBar + WizardProgress |
| ③ 상단 바 표면  | 뒤로가기·타이틀·우측 액션의 내용            | **페이지가 `TopAppBar`에 넘기는 props**                     | `leading={<BackButton />}`                                         |

**새 페이지 추가 판단 순서**

1. ①로 그룹을 고른다 (위 §3)
2. 같은 크롬을 쓰는 형제 화면들이 있으면 **그 구간 `layout.tsx`에 크롬을 둔다** — 위저드 스텝들이 한 layout을 공유하는 것처럼.
   layout은 형제 화면 간 이동 시 **리마운트되지 않아** 진행률·상단 바가 깜빡이지 않는다
3. 그 구간에서 한 화면만 크롬이 다르면 플래그로 분기하지 말고 **별도 라우트 그룹 폴더**(`(focus)/` 등)로 형제 분리한다 — URL은 그룹 폴더가 바꾸지 않는다
4. 상단 바 내용만 다르면 ③ props로 끝낸다. layout을 새로 만들지 않는다

**반응형·노출 여부는 CSS 우선.** 같은 요소가 보이고 숨는 수준은 클래스로. 트리 자체가 다를 때만 JS 분기.
앱 전체 폭 제한(`max-width: 480px`)은 루트 `AppLayout`(`app-viewport`/`app-shell`)이 한 번만 한다. 화면에서 다시 감싸지 않는다.

## 4. \_pages 구조

```
_pages/{slice}/
├── ui/{slice}-page.tsx   # 화면. 위젯과 피처를 배치한다
├── model/                # 이 화면에서만 쓰는 상태 (거의 필요 없다)
└── index.ts              # export { XxxPage } from './ui/xxx-page'
```

페이지는 **배치와 결정**만 한다.

- 위젯·피처를 어떤 순서로 놓을지, 화면 여백
- 어디로 이동시킬지 (라우팅 결정은 페이지의 몫. `next/navigation`의 `useRouter`)
- 이 화면에서만 필요한 데이터 조회

페이지에 도메인 로직이나 긴 JSX가 쌓이면 **덩어리를 `widgets/`로 뽑는다.**

## 5. \_app 레이어

`_app/`은 앱 셸이다. **모든 하위 레이어를 참조할 수 있는 유일한 레이어**다. slice 없이 segment만 둔다.

```
_app/
├── providers/   # QueryProvider, NativeBackProvider
├── guards/      # ProtectedGuard, SessionFallback
├── analytics/   # Clarity
├── dev-tools/   # DevAuthPanel 마운트 (개발 전용)
├── fonts/       # SUIT (next/font/local)
├── globals.css  # @theme 토큰 — 디자인 토큰의 코드 원천
└── index.ts
```

- 전역 1회 초기화는 여기서 한다. 루트 `app/layout.tsx`가 `@/_app`에서 가져와 조립한다
- **화면 구현은 두지 않는다.** `_app`에 JSX가 쌓이면 `_pages`로 내린다
- 서버 컴포넌트에서 쓰일 수 있으므로 클라이언트 전용 provider 파일에는 `'use client'`를 붙인다

## 6. 데이터는 아래에서 위로만 흐른다

앱 전역에서 채워야 하는 값(세션, 네이티브 컨텍스트)은 **provider가 부트스트랩 시점에 채우고 페이지는 읽기만 한다.**

실제 흐름 — 세션:

```tsx
// entities/session/model/session-contract.ts — 모듈 로드 시 1회, shared 에 구현을 주입
configureAuth({ readAuthToken: getSessionToken, onUnauthorized: clearSession });

// entities/session/ui/session-provider.tsx — 채우는 쪽 (루트 layout 에서 감싼다)
// 저장소 토큰 → 없으면 네이티브에 READY 를 보내고 AUTH_TOKEN / AUTH_NONE 을 기다린다 → 타임아웃이면 비로그인 확정
useNativeMessageListener(handleNativeMessage);

// _pages/invite/ui/invite-finish-page.tsx — 읽는 쪽
const session = useSession();
if (session.status === 'authenticated') { ... }
```

- 페이지는 세션을 **복원하지 않는다.** 읽기만 한다. `useSession()`은 `loading | anonymous | error | authenticated` 유니온이다. 복원 중(`loading`) 상태를 화면이 다뤄야 하면 `SessionFallback`/가드에 맡긴다
- **양방향 동기화를 만들지 않는다.** 페이지가 URL 값을 스토어에 반영하는 건 괜찮지만, 스토어가 다시 URL·페이지 상태를 되쓰면 어느 쪽이 진실인지 알 수 없다

## 7. 금지

- ❌ 라우트 파일에 화면 구현 (새 화면 기준)
- ❌ `_pages`에서 `apps/web/app/` 파일 import
- ❌ cross-slice import — `_pages/home`이 `_pages/login`을 직접 참조 (훅이 차단)
- ❌ 상향 import — `_pages`가 `_app`을 참조 (훅이 차단)
- ❌ `.next/types`, `next-env.d.ts` 편집 — `next typegen`/build 생성물
