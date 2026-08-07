import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openAppLink } from './open-app-link';

/** 앱이 열려 페이지가 백그라운드로 내려간 상황을 흉내낸다. */
function hidePage() {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('openAppLink', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: 'https://moyeo-web.vercel.app/i/ABC123' },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  it('커스텀 스킴 URL로 이동한다', () => {
    openAppLink('/i/ABC123', { onUnavailable: vi.fn() });

    expect(window.location.href).toBe('moyeo://i/ABC123');
  });

  it('앱이 열리지 않으면 onUnavailable을 호출한다', () => {
    const onUnavailable = vi.fn();

    openAppLink('/i/ABC123', { onUnavailable });
    expect(onUnavailable).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);

    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it('앱이 열려 페이지가 백그라운드로 내려가면 onUnavailable을 호출하지 않는다', () => {
    const onUnavailable = vi.fn();

    openAppLink('/i/ABC123', { onUnavailable });
    hidePage();

    vi.advanceTimersByTime(5000);

    expect(onUnavailable).not.toHaveBeenCalled();
  });

  // iOS는 앱 전환 시 visibilitychange가 오지 않을 수 있어 pagehide도 함께 듣는다.
  // 이 테스트가 없으면 pagehide 리스너를 지워도 아무 테스트가 깨지지 않는다.
  it('pagehide로 페이지가 사라지면 onUnavailable을 호출하지 않는다', () => {
    const onUnavailable = vi.fn();

    openAppLink('/i/ABC123', { onUnavailable });
    window.dispatchEvent(new Event('pagehide'));

    vi.advanceTimersByTime(5000);

    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it('폴백은 한 번만 실행된다', () => {
    const onUnavailable = vi.fn();

    openAppLink('/i/ABC123', { onUnavailable });

    vi.advanceTimersByTime(1500);
    vi.advanceTimersByTime(1500);

    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it('폴백 후에는 visibilitychange 리스너가 남지 않는다', () => {
    const onUnavailable = vi.fn();
    const removeEventListener = vi.spyOn(document, 'removeEventListener');

    openAppLink('/i/ABC123', { onUnavailable });
    vi.advanceTimersByTime(1500);

    expect(removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    removeEventListener.mockRestore();
  });
});
