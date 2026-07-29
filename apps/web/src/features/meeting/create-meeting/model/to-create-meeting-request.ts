import type { CreateMeetingRequest } from '@/shared/api';

import type { CreateMeetingDraftState } from './create-meeting-draft';

/**
 * draft를 생성 요청 JSON으로 옮긴다.
 *
 * 서버는 유형별로 **보내면 안 되는 필드**를 명시한다(`createMeetingRequest.ts` 주석).
 * 예: `PLACE_ONLY`에 `scheduleCandidateDates`를 실어 보내면 계약 위반이다.
 * 위저드를 되돌아가며 값을 바꾸면 draft에는 이전 유형의 잔여값이 남으므로,
 * 여기서 유형에 맞는 필드만 골라 담는다.
 *
 * 완성도 검사는 `isStepComplete`의 일이다. 이 함수는 이미 통과한 draft를 받는다고 보고,
 * 필수값이 비어 있으면 값을 지어내지 않고 그대로 드러낸다.
 */
export function toCreateMeetingRequest(draft: CreateMeetingDraftState): CreateMeetingRequest {
  const { planningType } = draft;

  if (planningType === null) {
    throw new Error('planningType 없이 생성 요청을 만들 수 없습니다.');
  }

  const needsSchedule = planningType !== 'PLACE_ONLY';
  const needsPlace = planningType !== 'SCHEDULE_ONLY';

  // 시작·종료 시간과 방장 일정 응답은 DATE_AND_TIME에서만 보낸다.
  const hasTimeInput = needsSchedule && draft.scheduleInputType === 'DATE_AND_TIME';

  // request 필수값
  const request: CreateMeetingRequest = {
    name: draft.name.trim(),
    maxParticipants: draft.maxParticipants ?? 0,
    planningType,
    noDeadline: draft.noDeadline,
  };

  // 설명은 선택 입력이다. 빈 문자열을 보내지 않고 파트 자체를 제거한다.
  const description = draft.description.trim();
  if (description.length >= 1) request.description = description;

  // SCHEDULE_ONLY 또는 SCHEDULE_AND_PLACE의 경우, scheduleCandidateDates 필드 추가
  if (needsSchedule) {
    if (draft.scheduleInputType !== null) request.scheduleInputType = draft.scheduleInputType;
    request.scheduleCandidateDates = draft.scheduleCandidateDates;
  }

  // DATE_AND_TIME인 경우 [시작시간, 종료시간, 가능시간] 필드 추가
  if (hasTimeInput) {
    if (draft.availableStartTime !== null) request.availableStartTime = draft.availableStartTime;
    if (draft.availableEndTime !== null) request.availableEndTime = draft.availableEndTime;
    if (draft.scheduleResponse !== null) request.scheduleResponse = draft.scheduleResponse;
  }

  // PLACE_ONLY 또는 SCHEDULE_AND_PLACE인 경우 [출발지, 이동수단] 필드 추가
  if (needsPlace && draft.departure !== null && draft.transportationMode !== null) {
    request.departure = {
      name: draft.departure.name,
      address: draft.departure.address,
      latitude: draft.departure.latitude,
      longitude: draft.departure.longitude,
      transportationMode: draft.transportationMode,
    };
  }

  // noDeadline이 true면 deadlineMinutes를 보내지 않는다(서버가 배타 관계로 검증한다).
  if (!draft.noDeadline && draft.deadlineMinutes !== null) {
    request.deadlineMinutes = draft.deadlineMinutes;
  }

  return request;
}
