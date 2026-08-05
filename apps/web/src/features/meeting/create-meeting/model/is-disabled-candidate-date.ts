import { format } from 'date-fns';

/**
 * 캘린더 비활성 판정. date가 serverToday 이하면 true — **당일도 고를 수 없다**(#120).
 * 둘 다 'yyyy-MM-dd'로 맞춰 비교하므로 사전순 비교가 곧 날짜 비교다.
 *
 * 당일을 막는 이유: 시간표는 오늘 열을 날짜 단위로만 보고 통째로 열어둔다. 오늘을 후보로
 * 허용하면 지금이 20시여도 오늘 09:00을 고를 수 있고, 그렇게 만들어진 모임은 아무도 유효하게
 * 답할 수 없다. 현재 시각·리드타임까지 반영한 시각 단위 판정은 #120에서 이어간다.
 */
export function isDisabledCandidateDate(date: Date, serverToday: string): boolean {
  return format(date, 'yyyy-MM-dd') <= serverToday;
}
