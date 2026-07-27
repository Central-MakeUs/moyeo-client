const MINUTES_PER_DAY = 1440;
const MINUTES_PER_HOUR = 60;

/** 일 + 시간 → 분. */
export function toDeadlineMinutes(days: number, hours: number): number {
  return days * MINUTES_PER_DAY + hours * MINUTES_PER_HOUR;
}
