'use client';

import Link from 'next/link';

import {
  InviteJoinFailedDialog,
  MeetingInvitationCard,
  type MeetingInvitation,
} from '@/entities/meeting';
import { useJoinEntry } from '@/features/meeting/invite-join-entry';
import type { ParticipationStatusResponse } from '@/shared/api';
import { Button, Celebration, CTASection, TopAppBar } from '@/shared/ui';
import { CompletionLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';
import { LoginDrawer, type LoginDrawerProps } from '@/widgets/login-drawer';

export interface InviteLandingPageProps {
  inviteCode: string;
  invitation: MeetingInvitation | null;
  participationStatus?: ParticipationStatusResponse | null;
}
import {
  INVITE_LANDING_DESCRIPTION,
  INVITE_LANDING_HOME_PATH,
  INVITE_LANDING_TITLE,
} from '../config/copy';

export function InviteLandingPage({
  inviteCode,
  invitation,
  participationStatus,
}: InviteLandingPageProps) {
  const { joinButton, loginDrawer, blocked, retrySession } = useJoinEntry({
    inviteCode,
    participationStatus,
  });

  const loginDrawerProps: LoginDrawerProps =
    loginDrawer.type === 'guest'
      ? {
          type: 'guest',
          isOpen: loginDrawer.isOpen,
          onOpenChange: loginDrawer.onOpenChange,
          next: loginDrawer.next,
          onGuestJoin: loginDrawer.onGuestJoin,
        }
      : {
          type: 'member',
          isOpen: loginDrawer.isOpen,
          onOpenChange: loginDrawer.onOpenChange,
          next: loginDrawer.next,
        };

  const inviteJoinButton = (
    <Button
      fullWidth
      onClick={joinButton.onTap}
      disabled={joinButton.isDisabled}
      isLoading={joinButton.isLoading}
    >
      모임 참여하기
    </Button>
  );

  return (
    <div className="flex h-dvh flex-col bg-celebration">
      <TopAppBar className="shrink-0" />
      <CompletionLayout
        header={
          <PageHeader
            align="center"
            title={INVITE_LANDING_TITLE}
            description={INVITE_LANDING_DESCRIPTION}
          />
        }
        visual={<Celebration icon="invitation" hasConfetti />}
        footer={
          <CTASection
            secondaryAction={
              retrySession !== null ? (
                <div className="flex w-full flex-col items-center gap-0.5">
                  <p className="text-medium-14 text-neutral-600">모임 정보를 불러오지 못했어요</p>
                  <Button variant="link" onClick={retrySession}>
                    다시 시도
                  </Button>
                </div>
              ) : (
                <Button variant="link" asChild>
                  <Link href={INVITE_LANDING_HOME_PATH}>홈으로 가기</Link>
                </Button>
              )
            }
            primaryAction={inviteJoinButton}
          />
        }
      >
        {invitation && (
          <MeetingInvitationCard
            name={invitation.name}
            description={invitation.description}
            hostNickname={invitation.hostNickname}
          />
        )}
      </CompletionLayout>
      <LoginDrawer {...loginDrawerProps} />

      <InviteJoinFailedDialog blockedStatus={blocked.status} onClose={blocked.clear} />
    </div>
  );
}
