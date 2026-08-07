/**
 * 네이티브 앱의 커스텀 스킴
 * - `apps/native/app.json`의 `scheme`과 동일
 */
const APP_SCHEME = 'moyeo';

/**
 * 커스텀 스킴 실행 후 fallback 여부를 결정하기까지 기다리는 시간.
 *
 * 웹에서는 앱 실행 성공 여부를 직접 확인할 수 없으므로,
 * 이 시간 안에 페이지가 hidden/pagehide 상태가 되는지를
 * 앱 실행의 간접 신호로 사용한다.
 */
const APP_LAUNCH_TIMEOUT_MS = 1500;

export interface OpenAppLinkOptions {
  /** 앱이 열리지 않았을 때(미설치 등) 실행할 폴백. */
  onUnavailable: () => void;
}

/**
 * 커스텀 스킴으로 네이티브 앱의 특정 경로를 여는 함수
 *
 * 앱 설치 여부를 미리 알 수 있는 방법이 없어, 일단 스킴으로 이동해 보고 정해진 시간 안에
 * 페이지가 백그라운드로 내려가지 않으면 앱이 없는 것으로 보고 `onUnavailable`을 부른다.
 *
 * 앱이 설치돼 있지 않으면 iOS에서 "주소가 유효하지 않습니다" 류의 시스템 경고가 뜰 수 있다.
 * 커스텀 스킴 이동의 알려진 한계이며, 경고를 닫으면 `onUnavailable` 경로로 이어진다.
 */
export function openAppLink(path: string, { onUnavailable }: OpenAppLinkOptions): void {
  // 앱 실행 시도 결과가 확인됐는지 저장하는 변수
  let settled = false;

  // 앱이 열려 페이지가 백그라운드로 내려갔는지 감지하는 코드
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') settle(false);
  };
  const handlePageHide = () => settle(false);

  function settle(shouldFallback: boolean): void {
    // 이미 결과가 정해진 경우 return
    if (settled) return;
    settled = true;

    clearTimeout(timer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handlePageHide);

    if (shouldFallback) onUnavailable();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);

  // `settle`은 이 타이머가 만들어진 뒤에만 호출됨(비동기)
  // setTimeout에서 settle이 호출되면 앱 실행 실패로 간주하고 fallback 실행
  const timer = setTimeout(() => settle(true), APP_LAUNCH_TIMEOUT_MS);

  window.location.href = `${APP_SCHEME}://${path.replace(/^\//, '')}`;
}
