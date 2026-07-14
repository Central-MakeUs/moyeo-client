import { parse } from 'date-fns';

/**
 * 화면 좌표(x, y) 아래의 달력 날짜 셀을 찾아 Date를 반환. 셀이 아니면 null.
 * document.elementFromPoint로 hit-test → 셀의 data-date(ISO)를 파싱한다.
 * (터치 드래그에서 pointerenter가 뜨지 않는 것을 좌표 매핑으로 보완)
 */
export function dateFromPoint(x: number, y: number): Date | null {
  // jsdom 등 elementFromPoint 미지원 환경에선 조용히 null(레이아웃 없음).
  if (typeof document.elementFromPoint !== 'function') return null;
  const iso = document.elementFromPoint(x, y)?.closest('[data-date]')?.getAttribute('data-date');
  return iso ? parse(iso, 'yyyy-MM-dd', new Date()) : null;
}
