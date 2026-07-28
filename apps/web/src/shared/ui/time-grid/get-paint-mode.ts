import type { PaintMode } from './apply-cell-selection';

/**
 * 드래그 페인트 모드 결정. 앵커 셀이 이미 선택돼 있으면 해제 드래그다.
 * 제스처가 시작될 때 1회만 호출하고, 끝날 때까지 이 값을 유지한다.
 */
export function getPaintMode(anchorKey: string, selected: ReadonlySet<string>): PaintMode {
  return selected.has(anchorKey) ? 'deselect' : 'select';
}
