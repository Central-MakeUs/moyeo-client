/** dates의 개수가 maxCount 이하인지. */
export function isWithinMaxCount(dates: Date[], maxCount: number): boolean {
  return dates.length <= maxCount;
}
