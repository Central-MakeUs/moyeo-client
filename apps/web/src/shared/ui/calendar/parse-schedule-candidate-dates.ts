/**
 * `yyyy-MM-dd` 형식의 날짜 문자열을 로컬 자정 기준의 `Date`로 변환한다.
 * 캘린더는 로컬 날짜를 기준으로 렌더링하므로 UTC로 해석하는 `new Date(isoDate)`를 사용하지 않는다.
 */
export function toLocalDate(isoDate: string): Date {
  const [year = 0, month = 1, day = 1] = isoDate.split('-').map(Number);

  return new Date(year, month - 1, day);
}

/**
 * `yyyy-MM-dd` 형식의 일정 후보 날짜들을 캘린더에서 사용하는 `Date` 배열로 변환한다.
 */
export function parseScheduleCandidateDates(isoDates: readonly string[]): Date[] {
  return isoDates.map(toLocalDate);
}
