'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import type { MeetingInvitationResponsePlanningType } from '@/shared/api';

import { useGuestJoinDraft } from './guest-join-draft';
import { isGuestJoinDraftComplete } from './is-guest-join-draft-complete';
import { useMemberJoinDraft } from './member-join-draft';
import { useSubmitGuestJoin } from './use-submit-guest-join';
import { useSubmitMemberJoin } from './use-submit-member-join';
import { isDraftUsableFor } from './validate-guest-identity';

export interface UseDepartureStepParams {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

export function useDepartureStep({ inviteToken, planningType }: UseDepartureStepParams) {
  const router = useRouter();

  const guestIdentity = useGuestJoinDraft((state) => state.identity);
  const guestScheduleResponse = useGuestJoinDraft((state) => state.scheduleResponse);
  const guestDeparture = useGuestJoinDraft((state) => state.departure);
  const guestTransportationMode = useGuestJoinDraft((state) => state.transportationMode);
  const setGuestTransportationMode = useGuestJoinDraft((state) => state.setTransportationMode);
  const memberIdentity = useMemberJoinDraft((state) => state.identity);
  const memberScheduleResponse = useMemberJoinDraft((state) => state.scheduleResponse);
  const memberDeparture = useMemberJoinDraft((state) => state.departure);
  const memberTransportationMode = useMemberJoinDraft((state) => state.transportationMode);
  const setMemberTransportationMode = useMemberJoinDraft((state) => state.setTransportationMode);

  const guestSubmit = useSubmitGuestJoin({ inviteCode: inviteToken, planningType });
  const memberSubmit = useSubmitMemberJoin({ inviteCode: inviteToken, planningType });

  const isGuestDraftUsable = isDraftUsableFor(guestIdentity, inviteToken);
  const isMemberDraftUsable = isDraftUsableFor(memberIdentity, inviteToken);
  const scheduleResponse = isMemberDraftUsable ? memberScheduleResponse : guestScheduleResponse;
  const departure = isMemberDraftUsable ? memberDeparture : guestDeparture;
  const transportationMode = isMemberDraftUsable
    ? memberTransportationMode
    : guestTransportationMode;

  useEffect(() => {
    if (!isGuestDraftUsable && !isMemberDraftUsable) {
      router.replace(`/i/${inviteToken}/guest`);
    }
  }, [isGuestDraftUsable, isMemberDraftUsable, inviteToken, router]);

  const backPath =
    planningType === 'SCHEDULE_AND_PLACE'
      ? `/i/${inviteToken}/respond/schedule`
      : isMemberDraftUsable
        ? `/i/${inviteToken}/nickname`
        : `/i/${inviteToken}/guest`;

  const isComplete = isGuestJoinDraftComplete(
    { scheduleResponse, departure, transportationMode },
    planningType
  );

  return {
    backPath,
    departure,
    transportationMode,
    setTransportationMode: isMemberDraftUsable
      ? setMemberTransportationMode
      : setGuestTransportationMode,
    isComplete,
    isSubmitting: isMemberDraftUsable ? memberSubmit.isSubmitting : guestSubmit.isSubmitting,
    submit: isMemberDraftUsable ? memberSubmit.submit : guestSubmit.submit,
  };
}
