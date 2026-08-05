/**
 * 세션 저장소 — 토큰을 실제로 보관하는 유일한 파일.
 *
 * 저장 위치를 바꿀 때(예: 네이티브 SecureStore를 정본으로 전환) 이 파일만 교체한다.
 * 저장하는 것은 Access Token 한 줄뿐이며 사용자 정보는 저장하지 않는다.
 */

const STORAGE_KEY = 'moyeo.session';
const STORAGE_VERSION = 1; // localStorage에 넣는 JSON 구조의 버전 - localStorage에 저장한 데이터는 새 코드 배포 시 자동으로 없어지지 않기 때문에 추가했습니다.

interface StoredSession {
  version: number;
  accessToken: string;
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

export function readStoredToken(): string | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (parsed.version !== STORAGE_VERSION) return null;

    const accessToken = parsed.accessToken?.trim();
    return accessToken ? accessToken : null;
  } catch {
    return null;
  }
}

export function writeStoredToken(accessToken: string): void {
  const storage = getStorage();
  if (!storage) return;

  const stored: StoredSession = { version: STORAGE_VERSION, accessToken };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // 저장 실패해도 메모리 세션은 유지된다.
  }
}

export function clearStoredToken(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
