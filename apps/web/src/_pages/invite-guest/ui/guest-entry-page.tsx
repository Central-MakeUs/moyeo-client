'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { isValidNickname } from '@/entities/nickname';
import { isValidGuestPassword, useGuestEntry } from '@/features/meeting/invite-participation';
import type { MeetingInvitationResponsePlanningType } from '@/shared/api';
import { IconButton } from '@/shared/ui/icon-button';
import { InputField } from '@/shared/ui/input';
import { ParticipantIdentityForm } from '@/shared/ui/participant-identity-form';
import { TopAppBar } from '@/shared/ui/top-app-bar';
import { PageHeader } from '@/shared/ui/page-header';

const NICKNAME_HINT = '* 2~10자로 공백없이 한글과 영어만 입력해주세요';
const PASSWORD_LENGTH = 4;

/**
 * 서버는 닉네임 중복과 비밀번호 불일치를 하나의 409로 합쳐 준다. 이 응답은 "그 닉네임이 이미
 * 있고 비밀번호가 다르다"일 때만 오므로 원인이 하나로 특정된다.
 */
const PASSWORD_MISMATCH_MESSAGE = '비밀번호가 일치하지 않아요';

export interface GuestEntryPageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

export function GuestEntryPage({ inviteToken, planningType }: GuestEntryPageProps) {
  const router = useRouter();
  const { enter, isEntering, error, clearError } = useGuestEntry({ inviteToken, planningType });

  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isNicknameValid = isValidNickname(nickname);
  const showNicknameError = nickname.length > 0 && !isNicknameValid;
  const isPasswordValid = isValidGuestPassword(password);

  const handleNicknameChange = (value: string) => {
    clearError();
    setNickname(value);
  };

  const handlePasswordChange = (value: string) => {
    clearError();
    setPassword(value.replace(/\D/g, '').slice(0, PASSWORD_LENGTH));
  };

  const handleSubmit = () => {
    if (!isNicknameValid || !isPasswordValid) return;

    void enter({ nickname, password });
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
          nicknamePlaceholder="모임에서 사용할 닉네임을 입력해주세요"
          nicknameDescription={NICKNAME_HINT}
          nicknameErrorMessage={showNicknameError ? NICKNAME_HINT : undefined}
          submitLabel="이번에만 게스트로 참여하기"
          submitDescription={
            <p className="text-medium-12 text-neutral-400">
              게스트는 초대받은 모임에만 참여할 수 있어요
            </p>
          }
          isSubmitDisabled={!isNicknameValid || !isPasswordValid || isEntering}
          onNicknameChange={handleNicknameChange}
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
            errorMessage={error === 'PASSWORD_MISMATCH' ? PASSWORD_MISMATCH_MESSAGE : undefined}
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
