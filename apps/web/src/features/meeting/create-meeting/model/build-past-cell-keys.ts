import { toCellKey } from '@/shared/ui/time-grid';

/**
 * serverToday 이전 날짜 열의 모든 셀 키. 그리드의 disabledKeys로 넘긴다.
 * 날짜가 'yyyy-MM-dd'라 사전순 비교가 곧 날짜 비교다.
 *
 * ⚠️ 현재는 **날짜 단위로만** 판정한다. 오늘 열은 통째로 열려 있어서,
 * 지금이 20시여도 오늘의 18:00 셀이 선택 가능하다.
 * 현재 시각과 조정 리드타임을 반영한 당일 처리는 #120에서 다룬다
 * (시그니처에 서버 시각이 추가되어야 한다).
 */
export function buildPastCellKeys(
  columns: string[],
  rows: string[],
  serverToday: string
): ReadonlySet<string> {
  const keys = new Set<string>();

  for (const date of columns) {
    if (date >= serverToday) continue;

    for (const time of rows) keys.add(toCellKey(date, time));
  }

  return keys;
}
