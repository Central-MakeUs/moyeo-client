import { describe, expect, it } from 'vitest';

import { buildGuestScheduleTimeGrid } from './build-guest-schedule-time-grid';

describe('buildGuestScheduleTimeGrid', () => {
  it('날짜별 시간 범위의 합집합으로 행을 만들고 범위 밖 셀을 비활성화한다', () => {
    expect(
      buildGuestScheduleTimeGrid([
        {
          candidateDate: '2026-08-15',
          availableTimeRanges: [{ startTime: '10:00:00', endTime: '12:00:00' }],
        },
        {
          candidateDate: '2026-08-20',
          availableTimeRanges: [{ startTime: '11:00:00', endTime: '14:00:00' }],
        },
      ])
    ).toEqual({
      columns: ['2026-08-15', '2026-08-20'],
      rows: ['10:00', '11:00', '12:00', '13:00'],
      disabledKeys: new Set(['2026-08-15 12:00', '2026-08-15 13:00', '2026-08-20 10:00']),
    });
  });

  it('한 날짜에 떨어진 범위가 여러 개면 사이 시간도 행으로 두고 비활성화한다', () => {
    expect(
      buildGuestScheduleTimeGrid([
        {
          candidateDate: '2026-08-15',
          availableTimeRanges: [
            { startTime: '10:00:00', endTime: '12:00:00' },
            { startTime: '19:00:00', endTime: '21:00:00' },
          ],
        },
      ])
    ).toEqual({
      columns: ['2026-08-15'],
      rows: [
        '10:00',
        '11:00',
        '12:00',
        '13:00',
        '14:00',
        '15:00',
        '16:00',
        '17:00',
        '18:00',
        '19:00',
        '20:00',
      ],
      disabledKeys: new Set([
        '2026-08-15 12:00',
        '2026-08-15 13:00',
        '2026-08-15 14:00',
        '2026-08-15 15:00',
        '2026-08-15 16:00',
        '2026-08-15 17:00',
        '2026-08-15 18:00',
      ]),
    });
  });

  it('날짜가 없는 후보는 제외하고 시간 범위가 없는 날짜는 열만 유지한다', () => {
    expect(
      buildGuestScheduleTimeGrid([
        { availableTimeRanges: [{ startTime: '10:00:00', endTime: '12:00:00' }] },
        { candidateDate: '2026-08-15', availableTimeRanges: [] },
      ])
    ).toEqual({ columns: ['2026-08-15'], rows: [], disabledKeys: new Set() });
  });
});
