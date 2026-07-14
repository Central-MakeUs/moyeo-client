import { differenceInCalendarDays, isSameDay } from 'date-fns';

export interface RunSegments {
  /** 길이 ≥2 런의 첫날들 */
  runStart: Date[];
  /** 런 사이(중간)날들 */
  runMiddle: Date[];
  /** 길이 ≥2 런의 마지막날들 */
  runEnd: Date[];
  /** 길이 1 런(단독 선택일)들 */
  runSingle: Date[];
}

/**
 * 선택 날짜 집합에서 "연속으로 붙은 달력 날짜 묶음(run)"을 계산해 세그먼트별 날짜 배열로 반환.
 * 입력 순서 무관(내부 정렬). 사이에 미선택 날이 있으면 런이 끊긴다.
 * 반환형 = RDP `modifiers` prop에 변환 없이 그대로 주입 가능한 형태.
 */
export function computeRuns(dates: Date[]): RunSegments {
  const runStart: Date[] = [];
  const runMiddle: Date[] = [];
  const runEnd: Date[] = [];
  const runSingle: Date[] = [];

  // 오름차순 정렬 + 중복(같은 날) 제거 — 집합으로 취급.
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const unique: Date[] = [];
  for (const day of sorted) {
    const last = unique[unique.length - 1];
    if (!last || !isSameDay(last, day)) unique.push(day);
  }

  // 연속(하루 차) 날짜끼리 묶는다.
  const groups: Date[][] = [];
  for (const day of unique) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && differenceInCalendarDays(day, lastGroup[lastGroup.length - 1]!) === 1) {
      lastGroup.push(day);
    } else {
      groups.push([day]);
    }
  }

  for (const group of groups) {
    if (group.length === 1) {
      runSingle.push(group[0]!);
    } else {
      runStart.push(group[0]!);
      runEnd.push(group[group.length - 1]!);
      runMiddle.push(...group.slice(1, -1));
    }
  }

  return { runStart, runMiddle, runEnd, runSingle };
}
