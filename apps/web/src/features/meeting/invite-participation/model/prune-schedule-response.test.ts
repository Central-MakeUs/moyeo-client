import { describe, it, expect } from 'vitest';

import { pruneScheduleResponse } from './prune-schedule-response';

const CANDIDATE_DATES = ['2026-08-01', '2026-08-02', '2026-08-03'];

describe('pruneScheduleResponse', () => {
  it('availableDates에서 후보에 없는 날짜를 걷어낸다', () => {
    const pruned = pruneScheduleResponse(
      { availableDates: ['2026-08-01', '2026-08-04'] },
      CANDIDATE_DATES
    );

    expect(pruned).toEqual({ availableDates: ['2026-08-01'] });
  });

  it('response가 null이면 null을 돌려준다', () => {
    expect(pruneScheduleResponse(null, CANDIDATE_DATES)).toBeNull();
  });

  it('고른 날짜가 모두 후보 밖이면 availableDates가 빈 배열이 된다', () => {
    const pruned = pruneScheduleResponse(
      { availableDates: ['2026-08-04', '2026-08-05'] },
      CANDIDATE_DATES
    );

    expect(pruned).toEqual({ availableDates: [] });
  });

  it('availableTimeRanges에서 후보에 없는 날짜의 항목을 걷어낸다', () => {
    const pruned = pruneScheduleResponse(
      {
        availableTimeRanges: [
          { candidateDate: '2026-08-01', startTime: '10:00', endTime: '12:00' },
          { candidateDate: '2026-08-25', startTime: '14:00', endTime: '16:00' },
        ],
      },
      CANDIDATE_DATES
    );

    expect(pruned).toEqual({
      availableTimeRanges: [{ candidateDate: '2026-08-01', startTime: '10:00', endTime: '12:00' }],
    });
  });

  it('입력에 availableTimeRanges만 있으면 결과에 availableDates 키를 만들지 않는다', () => {
    const pruned = pruneScheduleResponse(
      {
        availableTimeRanges: [
          { candidateDate: '2026-08-01', startTime: '10:00', endTime: '11:00' },
        ],
      },
      CANDIDATE_DATES
    );

    expect(pruned).not.toHaveProperty('availableDates');
  });

  it('입력에 availableDates만 있으면 결과에 availableTimeRanges 키를 만들지 않는다', () => {
    const pruned = pruneScheduleResponse({ availableDates: ['2026-08-01'] }, CANDIDATE_DATES);

    expect(pruned).not.toHaveProperty('availableTimeRanges');
  });
});
