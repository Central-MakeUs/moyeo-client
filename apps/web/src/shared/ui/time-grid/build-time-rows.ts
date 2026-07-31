/** 'HH:mm' 24시간 표기만 유효한 시각으로 본다. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const toHour = (time: string) => Number(time.slice(0, 2));

/**
 * 공통 시간 범위 → 1시간 블록 행 목록. 종료 시각은 포함하지 않는다(반개구간).
 * 범위가 비었거나(start >= end) 'HH:mm' 형식이 아니면 [].
 *
 * 블록이 1시간 단위라 분은 보지 않는다(CRT-03이 정시만 넘긴다).
 */
export function buildTimeRows(start: string, end: string): string[] {
  if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) return [];

  const startHour = toHour(start);
  const endHour = toHour(end);
  if (endHour <= startHour) return [];

  return Array.from(
    { length: endHour - startHour },
    (_, index) => `${String(startHour + index).padStart(2, '0')}:00`
  );
}
