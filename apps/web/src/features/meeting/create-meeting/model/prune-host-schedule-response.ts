import type { ScheduleAvailabilityRequest, ScheduleResponseRequest } from '@/shared/api';

/** 모임장이 정한 조율 범위. 이 밖으로 나간 응답은 남겨둘 수 없다. */
export interface HostScheduleBounds {
  /** 후보 날짜. 'yyyy-MM-dd' */
  candidateDates: string[];
  /** 공통 시간 범위 시작. 'HH:mm'. 시간 조율을 하지 않으면 null. */
  availableStartTime: string | null;
  /** 공통 시간 범위 종료. 'HH:mm'. 시간 조율을 하지 않으면 null. */
  availableEndTime: string | null;
}

/** 'HH:mm' → 시(hour). 블록이 1시간 단위라 분은 항상 00이다. */
const toHour = (time: string) => Number(time.slice(0, 2));
const toTime = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/**
 * 후보 밖 날짜의 구간은 버리고, 남은 구간은 새 시간 경계로 자른다.
 * 잘라낸 뒤 남는 블록이 없으면 그 구간도 버린다.
 */
function clipToTimeBounds(
  ranges: ScheduleAvailabilityRequest[],
  isCandidate: (date: string) => boolean,
  boundStartTime: string,
  boundEndTime: string
): ScheduleAvailabilityRequest[] {
  return ranges.flatMap((range) => {
    if (!isCandidate(range.candidateDate)) return [];

    const startHour = Math.max(toHour(range.startTime), toHour(boundStartTime));
    const endHour = Math.min(toHour(range.endTime), toHour(boundEndTime));

    if (startHour >= endHour) return [];

    return [
      {
        candidateDate: range.candidateDate,
        startTime: toTime(startHour),
        endTime: toTime(endHour),
      },
    ];
  });
}

/**
 * 조율 범위 밖으로 나간 모임장 본인의 응답을 걷어낸다.
 *
 * 참여자 쪽 `pruneScheduleResponse`와 달리 **시간 경계까지 본다.** 참여자에게 후보 날짜와
 * 시간 범위는 서버가 준 불변값이지만, 모임장은 위저드를 되돌아가 둘 다 바꿀 수 있다.
 */
export function pruneHostScheduleResponse(
  response: ScheduleResponseRequest | null,
  { candidateDates, availableStartTime, availableEndTime }: HostScheduleBounds
): ScheduleResponseRequest | null {
  if (response === null) return null;

  const isCandidate = (date: string) => candidateDates.includes(date);
  const pruned: ScheduleResponseRequest = {};

  // 없는 키는 만들지 않는다. 두 형식을 함께 보내면 서버가 무엇을 기준으로 볼지 모호해진다.
  if (response.availableDates !== undefined) {
    pruned.availableDates = response.availableDates.filter(isCandidate);
  }

  if (response.availableTimeRanges !== undefined) {
    // 시간 범위 자체가 없으면(= 날짜만 조율) 시간 응답이 설 자리가 없다. 남겨두면 나중에
    // 시간 범위를 다시 고를 때 예전 선택이 되살아난다.
    pruned.availableTimeRanges =
      availableStartTime === null || availableEndTime === null
        ? []
        : clipToTimeBounds(
            response.availableTimeRanges,
            isCandidate,
            availableStartTime,
            availableEndTime
          );
  }

  return pruned;
}
