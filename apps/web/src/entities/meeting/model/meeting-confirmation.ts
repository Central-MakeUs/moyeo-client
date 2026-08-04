import type { MeetingConfirmationResponse, MeetingViewResponse } from '@/shared/api';

/**
 * 일정·장소 확정 요청의 결과. 확정 후 어디로 갈지가 여기서 갈린다.
 *
 * 모임이 일정과 장소를 모두 조율하면 하나만 확정한 시점에는 아직 진행 중이고, 남은 하나까지
 * 확정해야 최종 확정된다. 하나만 조율하는 모임은 그 하나로 바로 최종 확정된다.
 */
export type ConfirmationOutcome =
  /** 모임 전체가 확정됐다. 확정 화면으로 보낸다. */
  | 'final'
  /** 아직 확정할 항목이 남았다. 화면에 머무르며 결과만 알린다. */
  | 'partial';

/**
 * 확정 응답에서 다음 행선지를 정한다.
 *
 * 남은 항목이 있는지는 서버가 `status`로 알려주므로 프론트가 다시 세지 않는다. 아는 값이
 * 아니면 `partial`로 다룬다 — 확정은 이미 서버에 반영됐으니, 화면을 옮기는 쪽보다 머무르며
 * 목록을 다시 읽는 쪽이 덜 혼란스럽다.
 */
export function toConfirmationOutcome(response: MeetingConfirmationResponse): ConfirmationOutcome {
  return response.status === 'CONFIRMED' ? 'final' : 'partial';
}

/**
 * 확정 결과를 모임 현황 캐시에 얹는다.
 *
 * 확정 응답이 확정된 일정·장소를 그대로 주므로 서버를 다시 읽지 않아도 화면을 맞출 수 있다.
 * 재조회를 기다렸다 움직이면 확정 카드가 그려지는 것을 본 뒤에야 확정 화면으로 넘어간다.
 *
 * 아직 읽은 적 없는 캐시는 건드리지 않는다 — 지어낸 값으로 채우면 나머지 필드가 비어 있는
 * 모임이 잠깐 보인다.
 */
export function applyConfirmationToMeetingView(
  previous: MeetingViewResponse | undefined,
  response: MeetingConfirmationResponse
): MeetingViewResponse | undefined {
  if (!previous) return previous;

  return {
    ...previous,
    confirmedScheduleDate: response.scheduleDate ?? null,
    confirmedStartTime: response.startTime ?? null,
    confirmedEndTime: response.endTime ?? null,
    confirmedPlaceName: response.placeName ?? null,
    meetingConfirmed: response.status === 'CONFIRMED',
  };
}
