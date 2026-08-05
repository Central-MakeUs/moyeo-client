import { describe, expect, it } from 'vitest';

import { pruneHostScheduleResponse, type HostScheduleBounds } from './prune-host-schedule-response';

/** 후보 4일 · 09:00~18:00. 각 시나리오는 여기서 한 축만 좁힌다. */
const BOUNDS: HostScheduleBounds = {
  candidateDates: ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13'],
  availableStartTime: '09:00',
  availableEndTime: '18:00',
};

describe('pruneHostScheduleResponse', () => {
  it('response가 null이면 null을 돌려준다', () => {
    expect(pruneHostScheduleResponse(null, BOUNDS)).toBeNull();
  });

  it('후보에서 빠진 날짜의 구간을 걷어낸다', () => {
    const pruned = pruneHostScheduleResponse(
      {
        availableTimeRanges: [
          { candidateDate: '2026-08-10', startTime: '10:00', endTime: '12:00' },
          { candidateDate: '2026-08-13', startTime: '10:00', endTime: '12:00' },
        ],
      },
      { ...BOUNDS, candidateDates: ['2026-08-10', '2026-08-11', '2026-08-12'] }
    );

    expect(pruned).toEqual({
      availableTimeRanges: [{ candidateDate: '2026-08-10', startTime: '10:00', endTime: '12:00' }],
    });
  });

  it('범위 밖으로 나간 게 없으면 구간을 그대로 둔다', () => {
    const response = {
      availableTimeRanges: [
        { candidateDate: '2026-08-10', startTime: '09:00', endTime: '18:00' },
        { candidateDate: '2026-08-11', startTime: '13:00', endTime: '15:00' },
      ],
    };

    expect(pruneHostScheduleResponse(response, BOUNDS)).toEqual(response);
  });

  it('시작 시간이 늦어지면 구간의 앞을 잘라낸다', () => {
    const pruned = pruneHostScheduleResponse(
      {
        availableTimeRanges: [
          { candidateDate: '2026-08-10', startTime: '09:00', endTime: '15:00' },
        ],
      },
      { ...BOUNDS, availableStartTime: '12:00' }
    );

    expect(pruned).toEqual({
      availableTimeRanges: [{ candidateDate: '2026-08-10', startTime: '12:00', endTime: '15:00' }],
    });
  });

  it('종료 시간이 앞당겨지면 구간의 뒤를 잘라낸다', () => {
    const pruned = pruneHostScheduleResponse(
      {
        availableTimeRanges: [
          { candidateDate: '2026-08-10', startTime: '10:00', endTime: '18:00' },
        ],
      },
      { ...BOUNDS, availableEndTime: '15:00' }
    );

    expect(pruned).toEqual({
      availableTimeRanges: [{ candidateDate: '2026-08-10', startTime: '10:00', endTime: '15:00' }],
    });
  });

  it('새 시간 범위 밖으로 완전히 벗어난 구간은 걷어낸다', () => {
    const pruned = pruneHostScheduleResponse(
      {
        availableTimeRanges: [
          { candidateDate: '2026-08-10', startTime: '09:00', endTime: '11:00' },
          { candidateDate: '2026-08-11', startTime: '13:00', endTime: '14:00' },
        ],
      },
      { ...BOUNDS, availableStartTime: '12:00' }
    );

    expect(pruned).toEqual({
      availableTimeRanges: [{ candidateDate: '2026-08-11', startTime: '13:00', endTime: '14:00' }],
    });
  });

  it('새 경계에 닿기만 하는 구간은 남는 블록이 없어 걷어낸다', () => {
    // 반개구간이라 09:00~12:00은 12:00을 포함하지 않는다. 경계가 12:00이면 남는 블록이 없다.
    const pruned = pruneHostScheduleResponse(
      {
        availableTimeRanges: [
          { candidateDate: '2026-08-10', startTime: '09:00', endTime: '12:00' },
        ],
      },
      { ...BOUNDS, availableStartTime: '12:00' }
    );

    expect(pruned).toEqual({ availableTimeRanges: [] });
  });

  it('시간 범위 자체가 사라지면 availableTimeRanges를 비운다', () => {
    // `날짜만 정하고 싶어요`가 두 시각을 null로 되돌린 상태. 남겨두면 시간을 다시 고를 때 되살아난다.
    const pruned = pruneHostScheduleResponse(
      {
        availableTimeRanges: [
          { candidateDate: '2026-08-10', startTime: '10:00', endTime: '12:00' },
        ],
      },
      { ...BOUNDS, availableStartTime: null, availableEndTime: null }
    );

    expect(pruned).toEqual({ availableTimeRanges: [] });
  });

  it('입력에 availableDates만 있으면 결과에 availableTimeRanges 키를 만들지 않는다', () => {
    const pruned = pruneHostScheduleResponse({ availableDates: ['2026-08-10'] }, BOUNDS);

    expect(pruned).not.toHaveProperty('availableTimeRanges');
  });

  it('availableDates에서 후보에 없는 날짜를 걷어낸다', () => {
    const pruned = pruneHostScheduleResponse(
      { availableDates: ['2026-08-10', '2026-08-13'] },
      { ...BOUNDS, candidateDates: ['2026-08-10', '2026-08-11', '2026-08-12'] }
    );

    expect(pruned).toEqual({ availableDates: ['2026-08-10'] });
  });
});
