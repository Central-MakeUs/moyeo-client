/**
 * 24시간 표기의 'HH:mm'과 'HH:mm:ss'를 모두 받는다.
 *
 * 모임장 위저드는 초안에서 'HH:mm'을 넘기지만, 서버는 초대 조회 응답의
 * availableStartTime·availableEndTime을 'HH:mm:ss'로 내려준다(OpenAPI 예시는 'HH:mm'이라
 * 계약과 실제가 다르다). 게스트 화면은 서버 값을 그대로 받으므로 둘 다 받아야 한다.
 */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const toHour = (time: string) => Number(time.slice(0, 2));

/**
 * 공통 시간 범위 → 1시간 블록 행 목록. 종료 시각은 포함하지 않는다(반개구간).
 * 범위가 비었거나(start >= end) 시각 형식이 아니면 [].
 *
 * 블록이 1시간 단위라 분·초는 보지 않는다(CRT-03이 정시만 넘긴다).
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
