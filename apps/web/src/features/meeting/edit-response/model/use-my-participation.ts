'use client';

import {
  useGetGuestParticipation,
  useGetMyParticipation,
  type Departure,
  type MyParticipationResponse,
  type MyParticipationResponseScheduleInputType,
  type ScheduleAvailability,
  type ScheduleAvailabilityRequest,
} from '@/shared/api';

import { useResponseOwner, type ResponseOwnerKind } from './use-response-owner';

export interface MyParticipation {
  /** 일정을 날짜만 받는지, 시간까지 받는지. 어떤 편집 화면을 띄울지가 여기서 갈린다. */
  scheduleInputType: MyParticipationResponseScheduleInputType | null;
  /** `DATE_ONLY` 모임에서 내가 고른 날짜. */
  availableDates: string[];
  /** `DATE_AND_TIME` 모임에서 내가 고른 시간 범위. */
  availableTimeRanges: ScheduleAvailabilityRequest[];
  /** 내가 입력한 출발지·이동수단. 위치를 조율하지 않는 모임이면 `null`. */
  departure: Departure | null;
}

export interface UseMyParticipationResult {
  data: MyParticipation | null;
  ownerKind: ResponseOwnerKind;
  isLoading: boolean;
  isError: boolean;
}

/**
 * 조회 응답의 시간 범위를 그대로 쓸 수 없어 좁힌다.
 *
 * 조회 스키마(`ScheduleAvailability`)는 세 필드가 모두 optional인데 화면과 수정 요청
 * (`ScheduleAvailabilityRequest`)은 셋 다 있어야 한다. 하나라도 빠진 범위는 시간표에 칠할
 * 칸을 정할 수 없으므로 버린다.
 */
function toTimeRangeRequests(ranges: ScheduleAvailability[]): ScheduleAvailabilityRequest[] {
  return ranges.flatMap(({ candidateDate, startTime, endTime }) =>
    candidateDate && startTime && endTime ? [{ candidateDate, startTime, endTime }] : []
  );
}

function toMyParticipation(response: MyParticipationResponse): MyParticipation {
  return {
    scheduleInputType: response.scheduleInputType ?? null,
    availableDates: response.scheduleResponse?.availableDates ?? [],
    availableTimeRanges: toTimeRangeRequests(response.scheduleResponse?.availableTimeRanges ?? []),
    departure: response.departure ?? null,
  };
}

/**
 * 내가 이 모임에 낸 응답을 읽는다. 수정 화면의 초기값이다.
 *
 * 회원용·게스트용 조회가 나뉘어 있어 훅을 둘 다 걸고 신원에 맞는 쪽만 `enabled`로 켠다.
 * 훅은 조건부로 호출할 수 없기 때문이다.
 *
 * 한 번의 응답으로 **어떤 편집 화면을 띄울지(`scheduleInputType`)와 무엇을 채울지가 함께**
 * 정해진다. 유형을 따로 조회하지 않는다.
 */
export function useMyParticipation(inviteCode: string): UseMyParticipationResult {
  const { kind, guestNickname } = useResponseOwner(inviteCode);
  const hasCode = inviteCode.length > 0;

  const member = useGetMyParticipation(inviteCode, {
    query: { enabled: hasCode && kind === 'member' },
  });
  const guest = useGetGuestParticipation(inviteCode, guestNickname ?? '', {
    query: { enabled: hasCode && kind === 'guest' && guestNickname !== null },
  });

  const active = kind === 'guest' ? guest : member;

  return {
    data: active.data ? toMyParticipation(active.data) : null,
    ownerKind: kind,
    // 신원을 아직 모르면 조회가 시작되지도 않았다. 화면은 계속 기다려야 한다.
    isLoading: kind === 'resolving' || active.isLoading,
    // 참여자가 아니면 조회 자체를 걸지 않으므로, 실패로 알려야 화면이 안내를 띄운다.
    isError: kind === 'none' || active.isError,
  };
}
