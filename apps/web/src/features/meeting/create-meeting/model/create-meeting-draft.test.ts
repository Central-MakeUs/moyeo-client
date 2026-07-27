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
});
