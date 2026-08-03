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

/** "14:00~18:00 (4시간)". 후보 상세 부제목에 쓴다. */
export function formatCandidateTimeRange(startTime: string, endTime: string): string {
  const range = `${startTime.slice(0, 5)}~${endTime.slice(0, 5)}`;
  const duration = formatCandidateDuration(startTime, endTime);

  return duration ? `${range} (${duration})` : range;
}
