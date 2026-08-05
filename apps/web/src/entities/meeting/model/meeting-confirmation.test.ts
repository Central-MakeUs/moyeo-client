import { describe, expect, it } from 'vitest';

import { applyConfirmationToMeetingView, toConfirmationOutcome } from './meeting-confirmation';

describe('applyConfirmationToMeetingView', () => {
  const previous = { meetingId: 7, name: '데모데이에 모여' };

  it('확정된 일정과 장소를 캐시에 얹는다', () => {
    expect(
      applyConfirmationToMeetingView(previous, {
        status: 'CONFIRMED',
        scheduleDate: '2026-07-18',
        startTime: '14:00:00',
        endTime: '18:00:00',
        placeName: '부산역',
      })
    ).toEqual({
      meetingId: 7,
      name: '데모데이에 모여',
      meetingConfirmed: true,
      confirmedScheduleDate: '2026-07-18',
      confirmedStartTime: '14:00:00',
      confirmedEndTime: '18:00:00',
      confirmedPlaceName: '부산역',
    });
  });

  it('아직 확정되지 않은 항목은 null로 둔다', () => {
    const next = applyConfirmationToMeetingView(previous, {
      status: 'PLANNING',
      scheduleDate: '2026-07-18',
    });

    expect(next?.confirmedPlaceName).toBeNull();
    expect(next?.meetingConfirmed).toBe(false);
  });

  it('읽은 적 없는 캐시는 만들지 않는다', () => {
    expect(applyConfirmationToMeetingView(undefined, { status: 'CONFIRMED' })).toBeUndefined();
  });
});

describe('toConfirmationOutcome', () => {
  it('CONFIRMED면 모임 전체 확정으로 본다', () => {
    expect(toConfirmationOutcome({ status: 'CONFIRMED' })).toBe('final');
  });

  it('PLANNING이면 아직 확정할 항목이 남은 것으로 본다', () => {
    expect(toConfirmationOutcome({ status: 'PLANNING' })).toBe('partial');
  });

  it('status를 모르면 화면에 머무른다', () => {
    expect(toConfirmationOutcome({})).toBe('partial');
  });
});
