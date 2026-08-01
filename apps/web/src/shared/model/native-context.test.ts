import { afterEach, describe, expect, it, vi } from 'vitest';

import { isNativeContext } from './native-context';

afterEach(() => {
  delete window.ReactNativeWebView;
});

describe('isNativeContext', () => {
  it('ReactNativeWebView 브리지가 없으면 false를 반환한다', () => {
    expect(isNativeContext()).toBe(false);
  });

  it('ReactNativeWebView 브리지가 있으면 true를 반환한다', () => {
    window.ReactNativeWebView = { postMessage: vi.fn() };

    expect(isNativeContext()).toBe(true);
  });
});
