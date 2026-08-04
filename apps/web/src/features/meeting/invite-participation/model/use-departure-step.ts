'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';

import type { DepartureDraft } from '@/entities/place';
import type {
  DepartureRequestTransportationMode,
  MeetingInvitationResponsePlanningType,
  ScheduleResponseRequest,
} from '@/shared/api';

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

interface DepartureParticipationAdapter {
  identity: { inviteToken: string } | null;
  scheduleResponse: ScheduleResponseRequest | null;
  departure: DepartureDraft | null;
  transportationMode: DepartureRequestTransportationMode | null;
  setTransportationMode: (value: DepartureRequestTransportationMode | null) => void;
  entryPath: string;
  isSubmitting: boolean;
  submit: () => Promise<void>;
}

export function useDepartureStep({ inviteToken, planningType }: UseDepartureStepParams) {
  const router = useRouter();

  const guestDraft = useGuestJoinDraft(
    useShallow((state) => ({
      identity: state.identity,
      scheduleResponse: state.scheduleResponse,
      departure: state.departure,
      transportationMode: state.transportationMode,
      setTransportationMode: state.setTransportationMode,
    }))
  );
  const memberDraft = useMemberJoinDraft(
    useShallow((state) => ({
      identity: state.identity,
      scheduleResponse: state.scheduleResponse,
      departure: state.departure,
      transportationMode: state.transportationMode,
      setTransportationMode: state.setTransportationMode,
    }))
  );

  const guestSubmit = useSubmitGuestJoin({ inviteCode: inviteToken, planningType });
  const memberSubmit = useSubmitMemberJoin({ inviteCode: inviteToken, planningType });

  const guestAdapter: DepartureParticipationAdapter = {
    ...guestDraft,
    entryPath: `/i/${inviteToken}/guest`,
    ...guestSubmit,
  };
  const memberAdapter: DepartureParticipationAdapter = {
    ...memberDraft,
    entryPath: `/i/${inviteToken}/nickname`,
    ...memberSubmit,
  };

  const isGuestDraftUsable = isDraftUsableFor(guestAdapter.identity, inviteToken);
  const isMemberDraftUsable = isDraftUsableFor(memberAdapter.identity, inviteToken);
  const activeAdapter = isMemberDraftUsable ? memberAdapter : guestAdapter;

  useEffect(() => {
    if (!isGuestDraftUsable && !isMemberDraftUsable) {
      router.replace(`/i/${inviteToken}/guest`);
    }
  }, [isGuestDraftUsable, isMemberDraftUsable, inviteToken, router]);

  const backPath =
    planningType === 'SCHEDULE_AND_PLACE'
      ? `/i/${inviteToken}/respond/schedule`
      : activeAdapter.entryPath;

  const isComplete = isGuestJoinDraftComplete(activeAdapter, planningType);

  return {
    backPath,
    departure: activeAdapter.departure,
    transportationMode: activeAdapter.transportationMode,
    setTransportationMode: activeAdapter.setTransportationMode,
    isComplete,
    isSubmitting: activeAdapter.isSubmitting,
    submit: activeAdapter.submit,
  };
}
