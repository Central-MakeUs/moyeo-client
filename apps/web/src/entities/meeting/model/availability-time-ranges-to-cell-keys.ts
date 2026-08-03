import type { ScheduleAvailabilityRequest } from '@/shared/api';

import { toCellKey } from '@/shared/ui/time-grid';

const toHour = (time: string) => Number(time.slice(0, 2));
const toTime = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/**
 * 서버 구간 → 셀 키 목록. 종료 시각은 포함하지 않는다(반개구간).
 * cellKeysToAvailabilityTimeRanges의 역변환.
 */
export function availabilityTimeRangesToCellKeys(ranges: ScheduleAvailabilityRequest[]): string[] {
  return ranges.flatMap(({ candidateDate, startTime, endTime }) => {
    const start = toHour(startTime);
    const end = toHour(endTime);

    // 끝이 시작보다 뒤가 아니면 만들 셀이 없다.
    if (!(end > start)) return [];

    return Array.from({ length: end - start }, (_, index) =>
      toCellKey(candidateDate, toTime(start + index))
    );
  });
}
