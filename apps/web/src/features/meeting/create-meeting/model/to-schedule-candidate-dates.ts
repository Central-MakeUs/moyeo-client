import { format } from 'date-fns';

/**
 * Date[] → 오름차순 ISO 'yyyy-MM-dd' 문자열 배열.
 * 빈 배열이면 []. 같은 날짜(중복)는 ISO 기준으로 1개로 합친다(dedupe).
 */
export function toScheduleCandidateDates(dates: Date[]): string[] {
  const iso = dates.map((date) => format(date, 'yyyy-MM-dd'));

  return Array.from(new Set(iso)).sort();
}
