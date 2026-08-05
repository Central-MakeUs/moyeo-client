/**
 * 게스트 세션 저장소 — 게스트 참여자의 모임 내 닉네임을 보관하는 유일한 파일.
 *
 * 게스트에게는 액세스 토큰이 없다. 참여 직후 화면을 새로고침하면 "내가 이 모임의 게스트"라는
 * 사실을 다시 알아낼 방법이 없으므로, 참여에 성공한 시점의 닉네임만 여기에 남긴다.
 *
 * 비밀번호는 저장하지 않는다. 게스트 API가 `inviteCode` + `nickname`만 받기 때문에
 * 닉네임만으로 충분하고, 비밀번호를 디스크에 남기지 않는다는 기존 방침(`useGuestJoinDraft`의
 * prd.md ADR-1)과도 어긋나지 않는다.
 */

const STORAGE_KEY = 'moyeo.guest-sessions';
const STORAGE_VERSION = 1; // 저장 구조의 버전 - 배포로 자동 정리되지 않으므로 버전이 다르면 버린다.

interface StoredGuestSessions {
  version: number;
  /** 초대 코드 → 그 모임에서 쓰는 게스트 닉네임 */
  byInviteCode: Record<string, string>;
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

function readAll(): Record<string, string> {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Partial<StoredGuestSessions>;
    if (parsed.version !== STORAGE_VERSION) return {};

    return parsed.byInviteCode ?? {};
  } catch {
    return {};
  }
}

function writeAll(byInviteCode: Record<string, string>): void {
  const storage = getStorage();
  if (!storage) return;

  const stored: StoredGuestSessions = { version: STORAGE_VERSION, byInviteCode };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // 저장 실패해도 이번 세션의 화면 동작은 그대로 이어진다.
  }
}

/** 저장된 게스트 닉네임. 이 모임의 게스트가 아니면 `null`. */
export function readGuestSession(inviteCode: string): string | null {
  if (!inviteCode) return null;

  const nickname = readAll()[inviteCode]?.trim();
  return nickname ? nickname : null;
}

/** 게스트 참여에 성공한 시점에 호출한다. */
export function writeGuestSession(inviteCode: string, nickname: string): void {
  if (!inviteCode || !nickname) return;

  writeAll({ ...readAll(), [inviteCode]: nickname });
}

/** 모임 나가기 등으로 더 이상 게스트가 아닐 때 호출한다. */
export function clearGuestSession(inviteCode: string): void {
  if (!inviteCode) return;

  const all = readAll();
  if (!(inviteCode in all)) return;

  delete all[inviteCode];
  writeAll(all);
}
