/** 서비스 기준 시간대 (spec-fixed §7). */
const SERVICE_TIME_ZONE = 'Asia/Seoul';

// 'en-CA' 로케일은 YYYY-MM-DD 형식을 그대로 반환한다(의존성 없이 ISO 날짜 확보).
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SERVICE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * 서버 UTC ISO-8601 시각 → 서비스 기준 시간대의 'yyyy-MM-dd'.
 * 값이 없거나 파싱 불가면 null (로컬 시각으로 대체하지 않는다).
 */
export function toServerToday(serverTime: string | null | undefined): string | null {
  if (!serverTime) return null;

  const parsed = new Date(serverTime);
  if (Number.isNaN(parsed.getTime())) return null;

  return dateFormatter.format(parsed);
}
