import type { MeetingConfirmationResponse } from '@/shared/api';

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
