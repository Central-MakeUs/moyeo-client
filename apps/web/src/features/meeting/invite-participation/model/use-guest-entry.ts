'use client';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { writeGuestSession } from '@/entities/guest-session';
import { isExplainedBlockReason } from '@/entities/meeting';
import {
  checkGuestEntry,
  getInvitation,
  type GuestEntryRequest,
  type MeetingInvitationResponsePlanningType,
  type ParticipationStatusResponse,
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

/**
 * 참여 가능 여부와 확정 상태를 확인한다. 실패하면 `null`.
 *
 * 확인은 편의일 뿐이고 최종 방어선은 서버의 참여 제출 거절이다. 확인이 안 된다고 참여 자체를
 * 막지 않는다(`use-join-entry.ts`의 `resolveCheckedPath`와 같은 정책).
 */
async function fetchInvitationSafely(inviteToken: string) {
  try {
    return await getInvitation(inviteToken);
  } catch {
    return null;
  }
}

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
  /**
   * 참여를 막은 서버 상태. 막히지 않았으면 `null`.
   * 문구로 바꾸는 일은 화면이 한다(`toBlockedGuide`).
   */
  blockedStatus: ParticipationStatusResponse | null;
  /** 차단 안내를 닫는다. */
  clearBlocked: () => void;
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
  const [blockedStatus, setBlockedStatus] = useState<ParticipationStatusResponse | null>(null);
  const isEnteringRef = useRef(false);

  const enter = async (request: GuestEntryRequest) => {
    if (isEnteringRef.current) return;

    isEnteringRef.current = true;
    setIsEntering(true);
    setError(null);

    try {
      const entryType = toGuestEntryType(await checkGuestEntry(inviteToken, request));

      if (entryType === null) {
        toast.add({ id: ENTRY_ERROR_TOAST_ID, description: ENTRY_ERROR_MESSAGE });
        return;
      }

      const invitation = await fetchInvitationSafely(inviteToken);

      // 응답을 이미 한 게스트인 경우
      if (entryType === 'EXISTING_GUEST') {
        writeGuestSession(inviteToken, request.nickname); // 로그인 정보 저장
        router.push(
          getGuestEntryNextPath(
            inviteToken,
            planningType,
            entryType,
            invitation?.status === 'CONFIRMED'
          )
        );
        return;
      }

      // NEW_GUEST인 경우
      // 모임이 참여 가능 상태인지 확인
      const status = invitation?.participationStatus;

      // 모임이 기간 만료/인원 초과의 이유로 현재 참여 불가능한 경우
      if (
        status !== undefined &&
        status.canJoin !== true &&
        isExplainedBlockReason(status.reason)
      ) {
        setBlockedStatus(status);
        return;
      }

      // NEW_GUEST의 초안(nickname, password)을 저장한다.
      // 직전에 회원으로 입력하던 값이 있으면 `setIdentity`가 함께 비운다.
      setIdentity({ kind: 'guest', inviteToken, ...request });
      router.push(getGuestEntryNextPath(inviteToken, planningType, entryType, false));
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

  return {
    enter,
    isEntering,
    error,
    clearError: () => setError(null),
    blockedStatus,
    clearBlocked: () => setBlockedStatus(null),
  };
}
