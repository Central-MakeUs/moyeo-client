import { toCellKey } from './cell-key';

/**
 * serverToday 이전 날짜 열의 모든 셀 키. 그리드의 disabledKeys로 넘긴다.
 * 날짜가 'yyyy-MM-dd'라 사전순 비교가 곧 날짜 비교다.
 *
 * ⚠️ 현재는 **날짜 단위로만** 판정한다. 오늘 열은 통째로 열려 있어서,
 * 지금이 20시여도 오늘의 18:00 셀이 선택 가능하다.
 * 현재 시각과 조정 리드타임을 반영한 당일 처리는 #120에서 다룬다
 * (시그니처에 서버 시각이 추가되어야 한다).
 *
 * #120 1차 결정으로 **모임장이 오늘을 후보 날짜로 고를 수 없게** 막았으므로
 * (`isDisabledCandidateDate`), 새로 만든 모임에는 오늘 열이 아예 생기지 않는다.
 * 위 구멍은 그 결정 이전에 만들어진 모임에서만 드러난다.
 */
export function buildCellKeysBeforeDate(
  columns: string[],
  rows: string[],
  cutoffDate: string
): ReadonlySet<string> {
  const keys = new Set<string>();

  for (const date of columns) {
    if (date >= cutoffDate) continue;

    for (const time of rows) keys.add(toCellKey(date, time));
  }

  return keys;
}
