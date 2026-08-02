'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  getGuestJoinNextPath,
  isValidGuestNickname,
  isValidGuestPassword,
  useGuestJoinDraft,
} from '@/features/meeting/invite-participation';
import type { MeetingInvitationResponsePlanningType } from '@/shared/api';
import { IconButton } from '@/shared/ui/icon-button';
import { InputField } from '@/shared/ui/input';
import { ParticipantIdentityForm } from '@/shared/ui/participant-identity-form';
import { TopAppBar } from '@/shared/ui/top-app-bar';
import { PageHeader } from '@/shared/ui/page-header';

const NICKNAME_HINT = '* 2~10자로 공백없이 한글과 영어만 입력해주세요';
const PASSWORD_LENGTH = 4;

export interface GuestMeetingJoinPageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

export function GuestMeetingJoinPage({ inviteToken, planningType }: GuestMeetingJoinPageProps) {
  const router = useRouter();
  const setIdentity = useGuestJoinDraft((state) => state.setIdentity);

  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isNicknameValid = isValidGuestNickname(nickname);
  const showNicknameError = nickname.length > 0 && !isNicknameValid;
  const isPasswordValid = isValidGuestPassword(password);

  const handlePasswordChange = (value: string) => {
    setPassword(value.replace(/\D/g, '').slice(0, PASSWORD_LENGTH));
  };

  const handleSubmit = () => {
    if (!isNicknameValid || !isPasswordValid) return;

    setIdentity({ inviteToken, nickname, password });
    router.push(getGuestJoinNextPath(inviteToken, planningType));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <TopAppBar
        leading={
          <IconButton
            icon="chevron-left"
            aria-label="초대장으로 돌아가기"
            onClick={() => router.push(`/i/${inviteToken}`)}
          />
        }
      />
      <main className="flex flex-1 flex-col gap-12">
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
          nicknamePlaceholder="모임에서 사용할 닉네임"
          nicknameDescription={NICKNAME_HINT}
          nicknameErrorMessage={showNicknameError ? NICKNAME_HINT : undefined}
          submitLabel="이번에만 게스트로 참여하기"
          submitDescription={
            <p className="text-medium-12 text-neutral-400">
              게스트는 초대받은 모임에만 참여할 수 있어요
            </p>
          }
          isSubmitDisabled={!isNicknameValid || !isPasswordValid}
          onNicknameChange={setNickname}
          onSubmit={handleSubmit}
        >
          <InputField
            label="비밀번호"
            placeholder="4자리 숫자 비밀번호를 입력해주세요"
            type={isPasswordVisible ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="off"
            maxLength={PASSWORD_LENGTH}
            value={password}
            onChange={(event) => handlePasswordChange(event.target.value)}
            trailingAction={
              <IconButton
                type="button"
                shape="rounded"
                icon={isPasswordVisible ? 'eye-off' : 'eye'}
                iconSize={20}
                variant="ghost"
                className="relative size-5 shrink-0 p-0 after:absolute after:-inset-2.5 after:content-['']"
                aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
              />
            }
          />
        </ParticipantIdentityForm>
      </main>
    </div>
  );
}
