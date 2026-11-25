---
paths:
  - 'apps/web/src/**/*.tsx'
  - 'apps/web/app/**/*.tsx'
---

# 이미지 규칙

배경 · 장식 · 일러스트 이미지를 넣거나 바꿀 때 형식 · 크기 · 로딩 방식을 정한다.
아이콘(`shared/ui/icon`)과 로고 SVG 컴포넌트는 대상이 아니다.

> 이미지 변환은 **Next.js `next/image`** 가 맡는다. 별도 빌드 플러그인을 두지 않는다.

---

## 1. 변환은 빌드가 한다 — `next/image`

변환본을 저장소에 따로 두지 않는다. 원본 하나에서 `next/image`가 크기 · 형식(webp/avif)을 만든다.

```tsx
import Image from 'next/image';

import logo from './assets/moyeo-logo-text.png'; // static import → width/height 자동, 레이아웃 이동 없음

<Image src={logo} alt="모여" priority />;
```

| 이미지                                  | 수단                                                 |
| --------------------------------------- | ---------------------------------------------------- |
| 저장소에 있는 정적 이미지               | `next/image` + static import                         |
| 서버가 준 URL (모임 커버 등)            | `next/image` + `remotePatterns` 등록 후 최적화       |
| 사용자가 방금 고른 파일 (data URL·blob) | `<img>` — 최적화 대상이 아니다. 이유를 주석으로 남김 |

- **원본보다 크게 만들지 않는다.** `sizes`·`width`는 원본 폭 이하로만 준다
- 서버 이미지 URL은 `toApiAssetUrl()`로 baseURL을 붙인다 (`<img src>`는 axios를 타지 않는다)

> ⚠️ **기존 위반** — `shared/ui/thumbnail`은 원격 이미지를 `unoptimized`로 그린다. `next.config.js`에
> `images.remotePatterns`를 등록하고 최적화를 켜는 게 기준이다 (`docs/work/backlog.md`).
> 정적 이미지 원본이 `shared/assets/images/`에 있는 것도 위반이다 — 쓰는 곳 옆에 둔다 (`fsd-shared.md`).

## 2. 형식

| 이미지                                        | 형식                                           | 이유                                               |
| --------------------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| 화면을 덮는 큰 배경                           | avif(품질 75) → webp (`next.config` `formats`) | webp의 절반 안팎. 기본 품질은 입자 무늬가 뭉개진다 |
| 수십 KB 이하 일러스트                         | webp                                           | avif를 더해도 줄어드는 양이 작다                   |
| 글자 · 선이 또렷한 그림(로고 · 캐릭터 외곽선) | 무손실 webp 또는 svg                           | 손실 압축은 외곽선이 번진다                        |
| 애니메이션 webp                               | **다시 인코딩하지 않는다** (`unoptimized`)     | 프레임 차이만 저장된 파일이라 다시 만들면 커진다   |
| SVG 일러스트                                  | svgo로 한 번 최적화해 커밋(소수 2자리)         | 런타임 변환 대상이 아니다                          |

PNG를 새로 그대로 들이지 않는다. 원본이 PNG여도 `next/image`가 webp/avif로 내보내게 한다.

## 3. 해상도 — `sizes` 전에 cover 기준 축부터 본다

원본은 **표시 크기의 2배**를 기준으로 고른다. 그런데 `object-cover`는 상자 비율에 따라
**폭이 아니라 높이에 맞춰** 커질 수 있다.

- 상자가 이미지보다 덜 납작하면(세로로 길면) 높이 기준이다. 좁은 화면에서도 크게 그려지므로
  폭만 보고 작은 `sizes`를 주면 **더 흐려진다**
- 높이까지 반영할 수 있으면 `sizes`에 넣는다 — 예: `sizes="max(100vw, 142vh)"`(원본 비율 1.42)
- 콘텐츠 길이에 따라 상자 높이가 달라지는 배경은 `sizes`로 알려 줄 수 없다 → 원본 유지

## 4. 로딩

| 이미지                        | 속성                                        |
| ----------------------------- | ------------------------------------------- |
| 첫 화면 안 (LCP 후보 포함)    | `priority` (eager + `fetchPriority="high"`) |
| 첫 화면 밖 목록 · 카드        | 기본 lazy (`next/image` 기본값)             |
| 장식 · 목록 이미지            | `decoding="async"`                          |
| 디코딩 뒤 페이드인하는 이미지 | lazy를 걸지 않는다 — 준비 신호가 늦어진다   |

- 「첫 화면」 개수는 **가장 좁은 화면(360×800)에서** 센다
- 목록 컴포넌트는 로딩 방식을 prop으로 받고 기본은 lazy로 둔다. 몇 개를 즉시 받을지는 목록을
  배치하는 쪽이 정한다 (예: 첫 카드 2장만 `priority`)
- CSS `background-image`는 늦게 발견되고 우선순위 · lazy · `srcset`을 쓸 수 없다. 첫 화면의 큰
  이미지는 `<Image>`로 그린다

### 배경을 이미지로 깔 때

```tsx
<div className="relative isolate">
  <Image src={bg} alt="" fill sizes="100vw" priority className="-z-10 object-cover" />
  {children}
</div>
```

`isolate`가 없으면 `-z-10` 이미지가 상자 바깥 바탕 뒤로 숨는다. `fill`은 부모가 `relative`여야 한다.

### 상단 이미지가 status bar 영역까지 이어질 때

WebView에서 상단 이미지가 status bar까지 채워야 하는 화면은 **safe-area inset**(`env(safe-area-inset-top)`)을
기준으로 그린다. 여백을 px로 박지 않는다. 구현 방식이 정해지면 이 절을 갱신한다.

## 5. 접근성

장식 이미지는 `alt=""`. 정보가 있는 이미지(로고 등)만 대체 텍스트를 쓴다.

## 6. 바꿨으면 확인한다

- 빌드 결과물(`.next/static/media`, 실제 응답 `Content-Type`)에서 파일 크기 · 형식
- 모양이 같아야 하는 변경은 픽셀 비교. 기준은 **「8/255 넘게 다른 픽셀 0.1% 이하」** 로 잡는다.
  「최대 차이 n/255」는 압축 · 경로 재작성으로 테두리 몇 픽셀만 달라져도 깨진다
- 로딩 방식을 바꿨으면 대상 화면 LCP를 변경 전 빌드와 번갈아 잰다
