import type { ScheduleCandidateResponse } from '@/shared/api';
import { buildTimeRows, toCellKey } from '@/shared/ui/time-grid';

export interface GuestScheduleTimeGrid {
  columns: string[];
  rows: string[];
  disabledKeys: ReadonlySet<string>;
}

const toHour = (time: string) => Number(time.slice(0, 2));

/**
 * 선택 가능한 시각들을 최소~최대 시(hour)까지 빈 곳 없이 채운 행 목록으로 만든다.
 *
 * 모임장이 하루 안에서 떨어진 범위를 고를 수 있어(10-12시 + 19-21시), 선택 가능한 시각만
 * 행으로 두면 사이 시간이 통째로 사라져 10·11·19·20시가 붙어 보인다. 모임장이 위저드에서 본
 * 시간 흐름을 그대로 두고, 고를 수 없는 칸은 `disabledKeys`로 막는다.
 */
function buildContinuousRows(times: readonly string[]): string[] {
  if (times.length === 0) return [];

  const hours = times.map(toHour);
  const startHour = Math.min(...hours);
  const endHour = Math.max(...hours);

  return Array.from(
    { length: endHour - startHour + 1 },
    (_, index) => `${String(startHour + index).padStart(2, '0')}:00`
  );
}

/**
 * 날짜별 선택 가능 범위를 시간표의 열·행·비활성 셀로 변환한다.
 *
 * 서버는 모임장이 실제로 고른 시간 범위만 날짜별로 내려주며, 한 날짜에 범위가 여러 개 올 수
 * 있다. 행은 모든 후보를 아우르는 연속 시간 축으로 만들고, 각 날짜의 범위에 포함되지 않는
 * 셀은 비활성화한다. 날짜나 시간 범위가 불완전한 후보는 선택 가능한 셀을 만들지 않는다.
 */
export function buildGuestScheduleTimeGrid(
  candidates: readonly ScheduleCandidateResponse[]
): GuestScheduleTimeGrid {
  const timesByDate = new Map<string, Set<string>>();

  for (const candidate of candidates) {
    const date = candidate.candidateDate;
    if (!date) continue;

    const selectableTimes = timesByDate.get(date) ?? new Set<string>();
    for (const range of candidate.availableTimeRanges ?? []) {
      buildTimeRows(range.startTime ?? '', range.endTime ?? '').forEach((time) =>
        selectableTimes.add(time)
      );
    }
    timesByDate.set(date, selectableTimes);
  }

  const columns = [...timesByDate.keys()];
  const rows = buildContinuousRows([...timesByDate.values()].flatMap((times) => [...times]));
  const disabledKeys = new Set(
    columns.flatMap((date) =>
      rows.filter((time) => !timesByDate.get(date)?.has(time)).map((time) => toCellKey(date, time))
    )
  );

  return { columns, rows, disabledKeys };
}
