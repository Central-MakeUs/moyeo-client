/** 카카오 지도 SDK 중 우리가 쓰는 표면만 좁게 선언한다. */

/** 카카오 SDK가 사용하는 좌표 객체 */
export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

/** 카카오 지도 인스턴스 */
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
 * `autoload=false` 로 받은 로더가 노출하는 네임스페이스.
 *
 * `sdk.js` 는 실제 지도 번들을 담고 있지 않다. `load()` 를 불러야 CDN에서 번들을 받아오고,
 * 그 콜백이 온 뒤에야 `Map` 같은 생성자를 쓸 수 있다.
 */
interface KakaoMapsNamespace extends KakaoMaps {
  load: (callback: () => void) => void;
}

declare global {
  interface Window {
    kakao?: { maps?: KakaoMapsNamespace };
  }
}

const SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';

/**
 * `maps.load()`는 실제 지도 번들 로드 실패를 알리지 않을 수 있다.
 * Promise가 계속 pending으로 남지 않도록 제한 시간을 둔다.
 */
const SDK_TIMEOUT_MS = 10_000;

// picker가 다시 마운트되어도 SDK를 중복 주입하지 않도록 Promise를 캐시한다.
let sdkPromise: Promise<KakaoMaps> | null = null;

/** `sdk.js` 를 한 번만 주입하고 `kakao.maps` 를 돌려준다. */
export function loadKakaoMapSdk(): Promise<KakaoMaps> {
  // 이미 지도를 불러왔거나 불러오는 중이면, 기존 promise 반환
  if (sdkPromise !== null) return sdkPromise;

  sdkPromise = new Promise<KakaoMaps>((resolve, reject) => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? '';

    if (appKey.length === 0) {
      reject(new Error('NEXT_PUBLIC_KAKAO_JS_KEY가 비어 있어 지도를 불러올 수 없다'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error(`카카오 지도 SDK가 ${SDK_TIMEOUT_MS}ms 안에 준비되지 않았다`));
    }, SDK_TIMEOUT_MS);

    // sdk 로드 성공
    const succeed = (maps: KakaoMaps) => {
      clearTimeout(timer);
      resolve(maps);
    };

    // sdk 로드 실패
    const fail = (message: string) => {
      clearTimeout(timer);
      reject(new Error(message));
    };

    // 스크립트 주소 생성
    const params = new URLSearchParams({
      appkey: appKey,
      libraries: 'services',
      autoload: 'false',
    });

    // 카카오 스크립트 추가
    const script = document.createElement('script');
    script.src = `${SDK_URL}?${params.toString()}`; // 스크립트 주소 설정
    script.async = true; // sdk 다운로드를 비동기로 처리

    // sdk 다운에 성공했을 때 처리할 일 등록
    script.onload = () => {
      const maps = window.kakao?.maps;

      // 스크립트 로드 후에도 네임스페이스가 없으면 SDK 초기화 실패로 처리한다.
      if (maps === undefined) {
        fail('카카오 지도 SDK가 로드됐으나 kakao.maps가 없다 (도메인 미등록 의심)');
        return;
      }

      // 실제 지도 번들이 준비되지 않으면 제한 시간이 로딩을 종료한다.
      maps.load(() => succeed(maps));
    };

    // sdk 다운에 실패했을 때 처리할 일 등록
    script.onerror = () => {
      fail('카카오 지도 SDK를 불러오지 못했다');
    };

    // sdk 다운로드
    document.head.appendChild(script);
  });

  return sdkPromise;
}
