import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/** "HH:mm:ss" 또는 "HH:mm"을 자정 기준 분으로 바꾼다. */
function toMinutes(time: string): number {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

/** ISO 날짜(YYYY-MM-DD) → "7월 18일 토요일". 후보 상세 제목에 쓴다. */
export function formatCandidateDate(candidateDate: string): string {
  return format(parseISO(candidateDate), 'M월 d일 EEEE', { locale: ko });
}

/**
 * 만나는 길이 → "4시간" / "1시간 30분" / "30분".
 *
 * 길이를 계산할 수 없으면(끝이 시작보다 앞) 빈 문자열이다 — 호출부는 시간 범위만 보여준다.
 */
export function formatCandidateDuration(startTime: string, endTime: string): string {
  const total = toMinutes(endTime) - toMinutes(startTime);
  if (total <= 0) return '';

  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

/**
 * "7/18 (토) 14:00~18:00". 확정 확인 팝업과 확정 카드에 쓴다.
 *
 * 후보 상세의 "7월 18일 토요일"보다 짧다 — 확정 문구는 한 줄에 날짜와 시간을 함께 담는다.
 * DATE_ONLY 모임은 시간이 없어 날짜까지만 나온다.
 */
export function formatConfirmedSchedule(
  scheduleDate: string,
  startTime?: string,
  endTime?: string
): string {
  const date = format(parseISO(scheduleDate), 'M/d (E)', { locale: ko });
  if (!startTime || !endTime) return date;

  return `${date} ${startTime.slice(0, 5)}~${endTime.slice(0, 5)}`;
}

/**
 * "2026년 7월 18일 14시". 모임 확정 화면의 카드에 쓴다.
 *
 * 후보 상세·확인 팝업보다 길게 적는다 — 확정된 약속이라 연도까지 밝힌다.
 * DATE_ONLY 모임은 시간이 없어 날짜까지만 나온다.
 */
export function formatConfirmedMeetingDate(scheduleDate: string, startTime?: string): string {
  const date = format(parseISO(scheduleDate), 'yyyy년 M월 d일', { locale: ko });
  if (!startTime) return date;

  // "14:00:00" → 14. 분은 시안에 없다.
  const hour = Number(startTime.slice(0, 2));
  return `${date} ${hour}시`;
}

/** "14:00~18:00 (4시간)". 후보 상세 부제목에 쓴다. */
export function formatCandidateTimeRange(startTime: string, endTime: string): string {
  const range = `${startTime.slice(0, 5)}~${endTime.slice(0, 5)}`;
  const duration = formatCandidateDuration(startTime, endTime);

  return duration ? `${range} (${duration})` : range;
}
