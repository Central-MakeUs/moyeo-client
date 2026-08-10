import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const KAKAO_JS_KEY = '0123456789abcdef0123456789abcdef';
const SDK_SELECTOR = 'script[src*="dapi.kakao.com/v2/maps/sdk.js"]';

/** 모듈 스코프에 캐시된 Promise 때문에 테스트마다 모듈을 새로 읽어야 한다. */
const importLoader = async () => import('./kakao-map-sdk');

const sdkScripts = () => document.querySelectorAll<HTMLScriptElement>(SDK_SELECTOR);

/** `autoload=false` 로더가 심어두는 네임스페이스를 흉내낸다. */
const stubKakaoNamespace = (load: (callback: () => void) => void) => {
  window.kakao = {
    maps: {
      load,
      LatLng: vi.fn(),
      Map: vi.fn(),
      event: { addListener: vi.fn() },
    },
  } as unknown as Window['kakao'];
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_KAKAO_JS_KEY', KAKAO_JS_KEY);
  document.head.innerHTML = '';
  delete window.kakao;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  delete window.kakao;
});

describe('loadKakaoMapSdk', () => {
  it('처음 호출하면 dapi.kakao.com/v2/maps/sdk.js 스크립트가 문서에 1개 주입된다', async () => {
    const { loadKakaoMapSdk } = await importLoader();

    loadKakaoMapSdk().catch(() => {});

    expect(sdkScripts()).toHaveLength(1);
    expect(sdkScripts()[0]?.src).toContain(`appkey=${KAKAO_JS_KEY}`);
  });

  it('두 번 호출해도 스크립트를 다시 주입하지 않고 같은 Promise를 돌려준다', async () => {
    const { loadKakaoMapSdk } = await importLoader();

    const first = loadKakaoMapSdk();
    const second = loadKakaoMapSdk();
    first.catch(() => {});
    second.catch(() => {});

    expect(sdkScripts()).toHaveLength(1);
    expect(first).toBe(second);
  });

  it('스크립트 로드가 실패하면 reject된다', async () => {
    const { loadKakaoMapSdk } = await importLoader();
    const promise = loadKakaoMapSdk();

    sdkScripts()[0]?.dispatchEvent(new Event('error'));

    await expect(promise).rejects.toThrow();
  });

  it('NEXT_PUBLIC_KAKAO_JS_KEY가 비어 있으면 스크립트를 주입하지 않고 reject된다', async () => {
    vi.stubEnv('NEXT_PUBLIC_KAKAO_JS_KEY', '');
    const { loadKakaoMapSdk } = await importLoader();

    await expect(loadKakaoMapSdk()).rejects.toThrow();
    expect(sdkScripts()).toHaveLength(0);
  });

  it('maps.load 콜백이 오지 않으면 제한 시간 뒤 reject된다', async () => {
    vi.useFakeTimers();
    const { loadKakaoMapSdk } = await importLoader();
    const promise = loadKakaoMapSdk();

    // 스크립트도 내려왔고 네임스페이스도 있지만, 번들을 받아오는 체인이 조용히 멈춘 상황.
    // 카카오 로더의 체인 스크립트에는 onerror가 없어 실패해도 콜백이 오지 않는다.
    stubKakaoNamespace(vi.fn());
    sdkScripts()[0]?.dispatchEvent(new Event('load'));

    await vi.advanceTimersByTimeAsync(10_000);

    await expect(promise).rejects.toThrow();
  });
});
