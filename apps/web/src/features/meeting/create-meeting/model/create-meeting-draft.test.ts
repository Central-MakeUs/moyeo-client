import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useCreateMeetingDraft } from './create-meeting-draft';

describe('useCreateMeetingDraft', () => {
  beforeEach(() => {
    // 테스트 격리: SUT의 reset()이 아니라 zustand 내장 setState로 초기 상태를 되돌린다.
    useCreateMeetingDraft.setState({ name: '', description: '', maxParticipants: null });
  });

  it("should set name to '주말 등산' when setName('주말 등산') is called", () => {
    useCreateMeetingDraft.getState().setName('주말 등산');

    expect(useCreateMeetingDraft.getState().name).toBe('주말 등산');
  });

  it('should set maxParticipants to 6 when setMaxParticipants(6) is called', () => {
    useCreateMeetingDraft.getState().setMaxParticipants(6);

    expect(useCreateMeetingDraft.getState().maxParticipants).toBe(6);
  });

  it("should persist name to sessionStorage and rehydrate to '주말 등산' when store is recreated", async () => {
    useCreateMeetingDraft.getState().setName('주말 등산');

    // 모듈 캐시를 비우고 재import → 새 store 인스턴스가 sessionStorage에서 rehydrate 되는지 확인.
    vi.resetModules();
    const { useCreateMeetingDraft: recreated } = await import('./create-meeting-draft');

    expect(recreated.getState().name).toBe('주말 등산');
  });

  it("should restore all fields to initial values (name==='', maxParticipants===null) when reset() is called", () => {
    useCreateMeetingDraft.setState({ name: '주말 등산', maxParticipants: 6 });

    useCreateMeetingDraft.getState().reset();

    expect(useCreateMeetingDraft.getState().name).toBe('');
    expect(useCreateMeetingDraft.getState().maxParticipants).toBeNull();
  });

  it('should keep description and maxParticipants unchanged when only setName is called', () => {
    useCreateMeetingDraft.setState({ description: '등산 모임', maxParticipants: 8 });

    useCreateMeetingDraft.getState().setName('주말 등산');

    expect(useCreateMeetingDraft.getState().description).toBe('등산 모임');
    expect(useCreateMeetingDraft.getState().maxParticipants).toBe(8);
  });

  it("should store ['2026-07-10','2026-07-11'] when setScheduleCandidateDates is called with two dates", () => {
    useCreateMeetingDraft.getState().setScheduleCandidateDates(['2026-07-10', '2026-07-11']);

    expect(useCreateMeetingDraft.getState().scheduleCandidateDates).toEqual([
      '2026-07-10',
      '2026-07-11',
    ]);
  });

  it('should store the range object when setScheduleResponse is called with availableTimeRanges of length 1', () => {
    useCreateMeetingDraft.getState().setScheduleResponse({
      availableTimeRanges: [{ candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' }],
    });

    expect(useCreateMeetingDraft.getState().scheduleResponse).toEqual({
      availableTimeRanges: [{ candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' }],
    });
  });

  it('should restore scheduleCandidateDates to [] and scheduleResponse to null when reset is called', () => {
    useCreateMeetingDraft.setState({
      scheduleCandidateDates: ['2026-07-10'],
      scheduleResponse: {
        availableTimeRanges: [
          { candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' },
        ],
      },
    });

    useCreateMeetingDraft.getState().reset();

    expect(useCreateMeetingDraft.getState().scheduleCandidateDates).toEqual([]);
    expect(useCreateMeetingDraft.getState().scheduleResponse).toBeNull();
  });

  /**
   * 위저드는 뒤로 돌아가 조율 범위를 바꿀 수 있다. 시간표에서 고른 응답은 그 범위 안에서만
   * 의미가 있으므로, 범위를 좁힌 순간 밖으로 나간 선택이 초안에 남아 있으면 안 된다.
   * 남으면 화면에는 보이지 않은 채 생성 요청에 실려 나간다.
   */
  describe('조율 범위를 좁혔을 때', () => {
    beforeEach(() => {
      useCreateMeetingDraft.setState({
        scheduleInputType: 'DATE_AND_TIME',
        scheduleCandidateDates: ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13'],
        availableStartTime: '09:00',
        availableEndTime: '18:00',
        scheduleResponse: {
          availableTimeRanges: [
            { candidateDate: '2026-08-10', startTime: '10:00', endTime: '12:00' },
            { candidateDate: '2026-08-13', startTime: '10:00', endTime: '12:00' },
          ],
        },
      });
    });

    it('후보 날짜를 줄이면 빠진 날짜의 구간이 사라진다', () => {
      useCreateMeetingDraft
        .getState()
        .setScheduleCandidateDates(['2026-08-10', '2026-08-11', '2026-08-12']);

      expect(useCreateMeetingDraft.getState().scheduleResponse).toEqual({
        availableTimeRanges: [
          { candidateDate: '2026-08-10', startTime: '10:00', endTime: '12:00' },
        ],
      });
    });

    it('시작 시간을 늦추면 저장된 구간의 앞이 잘린다', () => {
      useCreateMeetingDraft.getState().setAvailableStartTime('11:00');

      expect(useCreateMeetingDraft.getState().scheduleResponse).toEqual({
        availableTimeRanges: [
          { candidateDate: '2026-08-10', startTime: '11:00', endTime: '12:00' },
          { candidateDate: '2026-08-13', startTime: '11:00', endTime: '12:00' },
        ],
      });
    });

    it('종료 시간을 앞당기면 저장된 구간의 뒤가 잘린다', () => {
      useCreateMeetingDraft.getState().setAvailableEndTime('11:00');

      expect(useCreateMeetingDraft.getState().scheduleResponse).toEqual({
        availableTimeRanges: [
          { candidateDate: '2026-08-10', startTime: '10:00', endTime: '11:00' },
          { candidateDate: '2026-08-13', startTime: '10:00', endTime: '11:00' },
        ],
      });
    });

    it('날짜만 정하기로 되돌리면 availableTimeRanges가 비워진다', () => {
      // `날짜만 정하고 싶어요`(time-range-step)가 두 시각을 null로 되돌리는 순서 그대로.
      useCreateMeetingDraft.getState().setAvailableStartTime(null);
      useCreateMeetingDraft.getState().setAvailableEndTime(null);

      expect(useCreateMeetingDraft.getState().scheduleResponse).toEqual({
        availableTimeRanges: [],
      });
    });
  });
});
