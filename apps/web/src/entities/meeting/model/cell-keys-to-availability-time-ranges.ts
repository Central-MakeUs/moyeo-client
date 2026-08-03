import type { ScheduleAvailabilityRequest } from '@/shared/api';

import { parseCellKey } from '@/shared/ui/time-grid';

/** 'HH:mm' → 시(hour). 블록이 1시간 단위라 분은 항상 00이다. */
const toHour = (time: string) => Number(time.slice(0, 2));
const toTime = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/** 오름차순 시(hour) 배열 → 연속 구간 [시작, 끝(미포함)] 목록. */
function toHourRuns(hours: number[]): Array<[number, number]> {
  const runs: Array<[number, number]> = [];

  for (const hour of hours) {
    const last = runs.at(-1);

    // 직전 구간과 이어지면 끝을 늘리고, 끊겼으면 새 구간을 연다.
    if (last && hour === last[1]) last[1] = hour + 1;
    else runs.push([hour, hour + 1]);
  }

  return runs;
}

/**
 * 셀 키 목록 → 서버 전송용 가능 구간.
 * 같은 날짜의 연속된 1시간 블록을 반개구간 [startTime, endTime)으로 병합한다.
 * 결과는 candidateDate 오름차순, 같은 날짜 안에서는 startTime 오름차순.
 */
export function cellKeysToAvailabilityTimeRanges(
  cellKeys: string[]
): ScheduleAvailabilityRequest[] {
  // 날짜별로 시(hour)를 모은다. 형식이 어긋난 키는 버린다.
  const hoursByDate = new Map<string, number[]>();

  for (const key of cellKeys) {
    const parts = parseCellKey(key);
    if (!parts) continue;

    const hours = hoursByDate.get(parts.date) ?? [];
    hours.push(toHour(parts.time));
    hoursByDate.set(parts.date, hours);
  }

  return [...hoursByDate.keys()].sort().flatMap((candidateDate) => {
    const hours = [...(hoursByDate.get(candidateDate) ?? [])].sort((a, b) => a - b);

    return toHourRuns(hours).map(([start, end]) => ({
      candidateDate,
      startTime: toTime(start),
      endTime: toTime(end),
    }));
  });
}
