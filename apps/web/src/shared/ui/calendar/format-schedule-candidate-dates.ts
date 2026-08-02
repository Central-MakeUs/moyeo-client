import { format } from 'date-fns';

/** `Date`를 로컬 날짜 기준의 `yyyy-MM-dd` 문자열로 변환한다. */
export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * 일정 후보 날짜들을 `yyyy-MM-dd` 형식의 문자열 배열로 변환한다.
 * 반환값은 중복 날짜를 제거하고 오름차순으로 정렬한다.
 */
export function formatScheduleCandidateDates(dates: readonly Date[]): string[] {
  return Array.from(new Set(dates.map(toIsoDate))).sort();
}
