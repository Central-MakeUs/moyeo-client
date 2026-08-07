import { afterEach, describe, expect, it } from 'vitest';

import { isKakaoInAppBrowser } from './in-app-browser';

const originalUserAgent = navigator.userAgent;

function setUserAgent(value: string) {
  Object.defineProperty(navigator, 'userAgent', { configurable: true, value });
}

afterEach(() => {
  setUserAgent(originalUserAgent);
});

describe('isKakaoInAppBrowser', () => {
  it('카카오톡 인앱 브라우저 UA면 true를 반환한다', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 ' +
        '(KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.5.0'
    );

    expect(isKakaoInAppBrowser()).toBe(true);
  });

  it('Android 카카오톡 인앱 브라우저 UA도 인식한다', () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 KAKAOTALK/10.5.0'
    );

    expect(isKakaoInAppBrowser()).toBe(true);
  });

  it('일반 모바일 브라우저 UA면 false를 반환한다', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 ' +
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    );

    expect(isKakaoInAppBrowser()).toBe(false);
  });
});
