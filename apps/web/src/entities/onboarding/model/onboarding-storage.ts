/**
 * 온보딩 열람 여부 저장소 — 최초 진입 판정을 실제로 보관하는 유일한 파일.
 *
 * **네이티브 SecureStore를 쓰지 않는다.** WebView의 localStorage는 앱 샌드박스에 저장돼
 * 앱을 지우면 함께 사라지므로, "재설치하면 온보딩을 다시 본다"가 별도 처리 없이 성립한다.
 * SecureStore는 iOS 키체인이 앱 삭제 후에도 남아 재설치해도 온보딩이 뜨지 않는다.
 */

const STORAGE_KEY = 'moyeo.onboarding';
/**
 * 저장 구조의 버전.
 *
 * 슬라이드를 새로 만들어 기존 사용자에게도 다시 보여주고 싶으면 이 값을 올린다.
 * 버전이 다른 기록은 미열람으로 읽힌다.
 */
const STORAGE_VERSION = 1;

interface StoredOnboarding {
  version: number;
  seen: boolean;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    // Safari private mode 등 localStorage 접근 자체가 throw 하는 환경
    return null;
  }
}

/**
 * 온보딩을 이미 봤는지 확인한다.
 *
 * 판단할 수 없는 경우(SSR·저장소 접근 불가·깨진 값)는 모두 `false`다.
 * 온보딩을 한 번 더 보는 쪽이, 봐야 할 사람이 못 보는 것보다 낫다.
 */
export function hasSeenOnboarding(): boolean {
  const storage = getStorage();
  if (!storage) return false;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as Partial<StoredOnboarding>;
    if (parsed.version !== STORAGE_VERSION) return false;

    return parsed.seen === true;
  } catch {
    return false;
  }
}

/** 온보딩을 끝까지 본 것으로 기록한다. */
export function markOnboardingSeen(): void {
  const storage = getStorage();
  if (!storage) return;

  const stored: StoredOnboarding = { version: STORAGE_VERSION, seen: true };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // 저장에 실패하면 다음 실행에 온보딩을 한 번 더 볼 뿐이라 흐름을 막지 않는다.
  }
}
