/**
 * ISO 'yyyy-MM-dd' → 로컬 자정 Date.
 * 캘린더 셀은 로컬 날짜 기준으로 렌더되므로 UTC 파싱(new Date(iso))을 쓰지 않는다.
 */
export function toLocalDate(iso: string): Date {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);

  return new Date(year, month - 1, day);
}

/** draft의 ISO 문자열 배열 → 캘린더가 쓰는 Date[]. toScheduleCandidateDates의 역변환. */
export function fromScheduleCandidateDates(dates: string[]): Date[] {
  return dates.map(toLocalDate);
}
