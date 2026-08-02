/** 초 단위 이동시간을 "N분" 또는 "H시간 N분" 표시용 라벨로 변환한다. */
export function formatTravelTime(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;

  return `${hours}시간 ${minutes}분`;
}
