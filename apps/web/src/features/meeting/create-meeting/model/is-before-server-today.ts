import { format } from 'date-fns';

/**
 * 캘린더 비활성 판정. date가 serverToday보다 이전이면 true. 같은 날은 false(선택 가능).
 * 둘 다 'yyyy-MM-dd'로 맞춰 비교하므로 사전순 비교가 곧 날짜 비교다.
 */
export function isBeforeServerToday(date: Date, serverToday: string): boolean {
  return format(date, 'yyyy-MM-dd') < serverToday;
}
