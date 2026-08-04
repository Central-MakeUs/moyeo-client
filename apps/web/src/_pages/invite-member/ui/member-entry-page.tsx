'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { isValidNickname } from '@/entities/nickname';
import {
  getGuestJoinNextPath,
  useParticipationDraft,
} from '@/features/meeting/invite-participation';
import type { MeetingInvitationResponsePlanningType } from '@/shared/api';
import { PageHeader } from '@/shared/ui/page-header';
import { ParticipantIdentityForm } from '@/shared/ui/participant-identity-form';

const NICKNAME_HINT = '* 2~10자로 공백없이 한글과 영어만 입력해주세요';

export interface MemberEntryPageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

export function MemberEntryPage({ inviteToken, planningType }: MemberEntryPageProps) {
  const router = useRouter();
  const setIdentity = useParticipationDraft((state) => state.setIdentity);
  const [nickname, setNickname] = useState('');
  const isNicknameValid = isValidNickname(nickname);
  const showNicknameError = nickname.length > 0 && !isNicknameValid;

  const handleSubmit = () => {
    if (!isNicknameValid) return;
    // 직전에 게스트로 입력하던 값이 있으면 `setIdentity`가 함께 비운다.
    setIdentity({ kind: 'member', inviteToken, nickname });
    router.push(getGuestJoinNextPath(inviteToken, planningType));
  };

  return (
    <div className="flex flex-1 flex-col gap-12">
      <PageHeader
        className="px-5 pt-10"
        title={
          <>
            모임에서 사용할 <br />
            닉네임을 정해주세요
          </>
        }
        description="닉네임은 나중에 변경할 수 있어요"
      />
      <ParticipantIdentityForm
        nickname={nickname}
        nicknameLabel="내 닉네임"
        nicknamePlaceholder="모임에서 사용할 닉네임을 입력해주세요"
        nicknameDescription={NICKNAME_HINT}
        nicknameErrorMessage={showNicknameError ? NICKNAME_HINT : undefined}
        submitLabel="다음"
        isSubmitDisabled={!isNicknameValid}
        onNicknameChange={setNickname}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
