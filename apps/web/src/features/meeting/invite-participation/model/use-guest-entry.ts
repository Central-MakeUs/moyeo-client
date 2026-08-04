'use client';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { writeGuestSession } from '@/entities/guest-session';
import {
  checkGuestEntry,
  type GuestEntryRequest,
  type MeetingInvitationResponsePlanningType,
} from '@/shared/api';
import { toast } from '@/shared/ui';

import { getGuestEntryNextPath } from './guest-entry-next-path';
import { useParticipationDraft } from './participation-draft';
import { toGuestEntryType } from './to-guest-entry-type';

const ENTRY_ERROR_TOAST_ID = 'guest-entry-failed';
const ENTRY_ERROR_MESSAGE = '참여를 시작하지 못했어요. 잠시 후 다시 시도해주세요';

/** 이미 쓰는 닉네임인데 비밀번호가 다를 때 서버가 주는 상태 코드. */
const DUPLICATE_NICKNAME_STATUS = 409;

const getStatus = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } } | null)?.response?.status;

/** 화면에 인라인으로 노출할 오류. 문구는 화면이 정한다. */
export type GuestEntryError = 'PASSWORD_MISMATCH';

export interface UseGuestEntryParams {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

export interface UseGuestEntryReturn {
  /** 진입 분기를 물어 다음 화면으로 보낸다. `NEW_GUEST`면 초안에 신원을 저장한다. */
  enter: (request: GuestEntryRequest) => Promise<void>;
  /** 진행 중이면 `true`. CTA `disabled`와 중복 요청 차단에 쓴다. */
  isEntering: boolean;
  /** 인라인으로 보여줄 오류. 없으면 `null`. */
  error: GuestEntryError | null;
  /** 입력이 바뀌면 오류를 지운다. */
  clearError: () => void;
}

/**
 * 게스트 참여 진입 분기.
 *
 * 서버가 "이 모임에서 처음 쓰는 닉네임인지"를 판정해주기 전에는 어디로 갈지 알 수 없으므로,
 * 응답을 받은 뒤에 이동한다. `409`는 닉네임이 이미 있고 비밀번호가 다를 때만 오므로 원인이
 * 하나로 특정된다 — 화면에 인라인으로 알리고, 나머지 실패는 토스트로 알린다.
 */
export function useGuestEntry({
  inviteToken,
  planningType,
}: UseGuestEntryParams): UseGuestEntryReturn {
  const router = useRouter();
  const setIdentity = useParticipationDraft((state) => state.setIdentity);

  const [isEntering, setIsEntering] = useState(false);
  const [error, setError] = useState<GuestEntryError | null>(null);
  const isEnteringRef = useRef(false);

  const enter = async (request: GuestEntryRequest) => {
    if (isEnteringRef.current) return;

    isEnteringRef.current = true;
    setIsEntering(true);
    setError(null);

    try {
      const entryType = toGuestEntryType(await checkGuestEntry(inviteToken, request));

      // 어디로 보내야 할지 모르는 응답이다. 이동하지 않고 실패로 다룬다.
      if (entryType === null) {
        toast.add({ id: ENTRY_ERROR_TOAST_ID, description: ENTRY_ERROR_MESSAGE });
        return;
      }

      // 제출로 이어지는 쪽만 초안이 필요하다. EXISTING_GUEST는 제출하지 않는다.
      // 직전에 회원으로 입력하던 값이 있으면 `setIdentity`가 함께 비운다.
      if (entryType === 'NEW_GUEST') {
        setIdentity({ kind: 'guest', inviteToken, ...request });
      }

      // 서버가 이 모임의 게스트임을 확인해준 시점이다. 현황 화면이 신원을 알아볼 수 있도록
      // 닉네임을 남긴다. NEW_GUEST는 아직 참여 전이라 남기지 않는다.
      if (entryType === 'EXISTING_GUEST') {
        writeGuestSession(inviteToken, request.nickname);
      }

      router.push(getGuestEntryNextPath(inviteToken, planningType, entryType));
    } catch (caught) {
      if (getStatus(caught) === DUPLICATE_NICKNAME_STATUS) {
        setError('PASSWORD_MISMATCH');
        return;
      }

      toast.add({ id: ENTRY_ERROR_TOAST_ID, description: ENTRY_ERROR_MESSAGE });
    } finally {
      isEnteringRef.current = false;
      setIsEntering(false);
    }
  };

  return { enter, isEntering, error, clearError: () => setError(null) };
}
