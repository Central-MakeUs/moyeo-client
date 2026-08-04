'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { joinMember, type MeetingInvitationResponsePlanningType } from '@/shared/api';
import { toast } from '@/shared/ui';

import { useMemberJoinDraft } from './member-join-draft';
import { isGuestJoinDraftComplete } from './is-guest-join-draft-complete';
import { toMemberJoinRequest } from './to-member-join-request';

const SUBMIT_ERROR_TOAST_ID = 'member-join-failed';
const SUBMIT_ERROR_MESSAGE = '참여하지 못했어요. 잠시 후 다시 시도해주세요';

export interface UseSubmitMemberJoinParams {
  inviteCode: string;
  planningType: MeetingInvitationResponsePlanningType;
}

export function useSubmitMemberJoin({ inviteCode, planningType }: UseSubmitMemberJoinParams) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const submit = async () => {
    const { identity, scheduleResponse, departure, transportationMode } =
      useMemberJoinDraft.getState();
    const draft = { scheduleResponse, departure, transportationMode };

    if (
      identity === null ||
      !isGuestJoinDraftComplete(draft, planningType) ||
      isSubmittingRef.current
    ) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await joinMember(inviteCode, toMemberJoinRequest({ identity, ...draft }));
      router.replace(`/i/${inviteCode}/complete`);
    } catch {
      toast.add({ id: SUBMIT_ERROR_TOAST_ID, description: SUBMIT_ERROR_MESSAGE });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
