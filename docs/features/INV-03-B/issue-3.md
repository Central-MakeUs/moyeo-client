# Issue #241 · 슬라이스 3: [feat] 지도와 중앙 고정 핀

> GitHub 이슈: [#241](https://github.com/Central-MakeUs/moyeo-client/issues/241) (기능 전체가 이슈 하나)
> 작업 단위는 슬라이스 1~6이며 이 문서는 **슬라이스 3**이다. 슬라이스 1·2는 완료·커밋됨.
>
> AC 원본: `docs/fe-implement-spec/invite/inv-03/search-current-address/issues.md` — 슬라이스 3
> 확정 스펙: 같은 폴더 `spec-fixed.md` §6-1 · §6-4, F03
> FSD 배치: 같은 폴더 `prd.md` ADR-1
> 스파이크 관측: 같은 폴더 `spike-result.md` §2 특이사항
> 참고 구현 사본: `.local-docs/spike-inv-03-map-slot/map/page.tsx`

## 확정된 시그니처

### SDK 로더

```typescript
// apps/web/src/shared/lib/kakao-map-sdk.ts

/** 카카오 지도 SDK 중 우리가 쓰는 표면만 좁게 선언한다. */
export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoMap {
  getCenter: () => KakaoLatLng;
  setCenter: (latlng: KakaoLatLng) => void;
  /** 컨테이너 크기가 바뀐 뒤 타일을 다시 배치한다. */
  relayout: () => void;
}

export interface KakaoMaps {
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  event: {
    addListener: (target: KakaoMap, type: string, handler: () => void) => void;
  };
}

/**
 * `sdk.js` 를 한 번만 주입하고 `kakao.maps` 를 돌려준다.
 * 여러 번 불러도 같은 Promise를 재사용한다.
 */
export function loadKakaoMapSdk(): Promise<KakaoMaps>;
```

`services` 라이브러리는 URL에 함께 싣지만(`libraries=services`) 타입은 슬라이스 4에서 넓힌다.

### 컴포넌트

```typescript
// apps/web/src/shared/ui/map-location-picker/

/** 지도가 아는 것은 좌표뿐이다. 주소도, 출발지도, 모임도 모른다 (ADR-1). */
export interface Coords {
  latitude: number;
  longitude: number;
}

export interface MapLocationPickerProps {
  /** 지도 최초 중심. */
  center: Coords;
}

export function MapLocationPicker(props: MapLocationPickerProps): React.JSX.Element;
```

`onIdle` 은 **슬라이스 4에서 추가한다.** ADR-1에는 있으나 이번 AC가 검증하지 않으므로
지금 넣으면 테스트 없는 코드가 된다.

### 계약 (에러/엣지)

| 지점            | 계약                                                                                                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 지도 컨테이너   | `aria-label="지도"`. 슬라이스 2의 `current-location-picker.test.tsx` 가 이미 이 이름으로 부재를 단언한다                                                                                                        |
| 핀 겹침         | 컨테이너에 `isolation: isolate`, 핀에 양의 `z-index`. 없으면 카카오 내부 레이어에 가린다 (스파이크에서 실제로 겪음)                                                                                             |
| 크기 변경       | `ResizeObserver` 로 감지해 `map.relayout()`. 오버레이라 애니메이션 중 마운트될 수 있다                                                                                                                          |
| SDK 로드 실패   | 지도 대신 `role="alert"` 안내. 지도 컨테이너는 렌더하지 않는다                                                                                                                                                  |
| 지도 레벨       | `level: 3` (스파이크 값). 디자인 확정 전까지 모듈 상수                                                                                                                                                          |
| 중복 로드       | `loadKakaoMapSdk()` 는 스크립트를 한 번만 주입하고 이후 같은 Promise를 돌려준다                                                                                                                                 |
| 언마운트 경합   | SDK Promise가 언마운트 뒤 resolve되면 `Map` 을 생성하지 않는다                                                                                                                                                  |
| 키 부재         | `NEXT_PUBLIC_KAKAO_JS_KEY` 가 비어 있으면 주입하지 않고 reject한다                                                                                                                                              |
| 2단계 로드 정지 | `sdk.js` 는 로더일 뿐이고 `maps.load()` 가 실제 번들을 CDN에서 받는다. 그 체인 스크립트에는 `onerror` 가 없어 **실패해도 조용히 멈춘다** — 스파이크에서 하루를 태운 증상이다. 제한 시간(10초)을 두고 reject한다 |

## 테스트 시나리오

### 정상 (happy path)

- [ ] [정상] loadKakaoMapSdk — 처음 호출하면 `dapi.kakao.com/v2/maps/sdk.js` 스크립트가 문서에 1개 주입된다
- [ ] [정상] MapLocationPicker — `center: { latitude: 37.5666805, longitude: 126.9784147 }` 를 넘기면 `LatLng` 이 그 좌표로 생성되고 `Map` 이 그것을 `center` 로 1회 생성된다
- [ ] [정상] MapLocationPicker — SDK가 준비되면 `aria-label="지도"` 컨테이너와 중앙 핀이 렌더된다
- [ ] [정상] MapLocationPicker — 컨테이너 크기가 바뀌면 `map.relayout()` 이 1회 호출된다

### 경계 (boundary)

- [ ] [경계] loadKakaoMapSdk — 두 번 호출해도 스크립트를 다시 주입하지 않고 같은 Promise를 돌려준다
- [ ] [경계] MapLocationPicker — `center` 가 바뀌어 리렌더돼도 `Map` 을 다시 생성하지 않는다
- [ ] [경계] MapLocationPicker — SDK Promise가 언마운트 뒤에 resolve되면 `Map` 을 생성하지 않는다

### 예외 (exception)

- [ ] [예외] loadKakaoMapSdk — 스크립트 로드가 실패하면 reject된다
- [ ] [예외] loadKakaoMapSdk — `NEXT_PUBLIC_KAKAO_JS_KEY` 가 비어 있으면 스크립트를 주입하지 않고 reject된다
- [ ] [예외] loadKakaoMapSdk — `maps.load()` 콜백이 오지 않으면 제한 시간 뒤 reject된다
- [ ] [예외] MapLocationPicker — SDK 로드가 실패하면 `role="alert"` 이 렌더되고 `aria-label="지도"` 는 렌더되지 않는다

## AC 커버리지

| AC   | 범위 | 커버하는 시나리오                                                                          |
| ---- | ---- | ------------------------------------------------------------------------------------------ |
| AC-1 | 통합 | [정상] MapLocationPicker — `LatLng`·`Map` 생성 인자<br>[경계] `center` 변경 시 재생성 없음 |
| AC-2 | 통합 | [정상] MapLocationPicker — `aria-label="지도"` + 중앙 핀 렌더                              |
| AC-3 | 통합 | [예외] MapLocationPicker — SDK 실패 시 `role="alert"`, 지도 미렌더                         |
| AC-4 | 단위 | [정상] MapLocationPicker — 크기 변경 시 `relayout()` 1회                                   |

시나리오 10개 = 로더 4 + 컴포넌트 6.

> **AC-2의 "핀이 지도보다 위에 그려진다"는 테스트로 강제하지 않는다.** jsdom이 레이아웃을
> 계산하지 않아 클래스 존재로 대신할 수밖에 없는데, 그건 구현 세부를 박제하는 약한 테스트다.
> `isolation: isolate` 와 핀의 양수 `z-index` 는 **계약 표에 남기고 구현에는 넣되**, 검증은
> 실기기·브라우저 눈으로 한다. 스파이크에서 이미 한 번 겪은 버그이므로 구현 시 잊지 말 것.

## 테스트 환경 메모

- **카카오 SDK는 모듈째 목킹한다.** jsdom에서 실제 SDK를 띄울 수 없다. 검증하는 것은
  "우리 코드가 SDK를 올바른 인자로 호출하는가"이지 지도가 실제로 그려지는가가 아니다.
  후자는 스파이크가 Android에서 확인했고 iOS는 https 재확인 항목으로 남아 있다
  (`spike-result.md` §0 · §5).
- **`ResizeObserver` 는 jsdom에 없다.** 테스트에서 직접 심고 콜백을 수동으로 발화시킨다.
