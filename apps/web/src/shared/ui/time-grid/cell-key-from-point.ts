/**
 * 화면 좌표(x, y) 아래의 시간표 셀 키를 찾는다. 셀이 아니면 null.
 * document.elementFromPoint로 hit-test → 셀의 data-cell-key를 읽는다.
 * (터치 드래그에서 pointerenter가 뜨지 않는 것을 좌표 매핑으로 보완 — date-from-point와 같은 방식)
 */
export function cellKeyFromPoint(x: number, y: number): string | null {
  // jsdom 등 elementFromPoint 미지원 환경에선 조용히 null(레이아웃 없음).
  if (typeof document.elementFromPoint !== 'function') return null;

  return (
    document.elementFromPoint(x, y)?.closest('[data-cell-key]')?.getAttribute('data-cell-key') ??
    null
  );
}
