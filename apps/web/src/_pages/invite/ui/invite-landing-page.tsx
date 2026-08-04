'use client';

import { MeetingInvitationCard, type MeetingInvitation } from '@/entities/meeting';
import { useJoinEntry } from '@/features/meeting/invite-join-entry';
import type { ParticipationStatusResponse } from '@/shared/api';
import { Button, Celebration, CTASection, TopAppBar } from '@/shared/ui';
import { IconButton } from '@/shared/ui/icon-button';
import { CompletionLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';
import { LoginDrawer, type LoginDrawerProps } from '@/widgets/login-drawer';

import { toParticipationGuide } from '../config/participation-guide';
import Link from 'next/link';

export interface InviteLandingPageProps {
  /** 경로의 초대 코드. 참여 경로 조립에 쓴다. */
  inviteCode: string;
  /** 정규화된 초대 정보. 모임 이름이 없어 그릴 수 없으면 null. */
  invitation: MeetingInvitation | null;
  /** 서버가 계산한 참여 가능 상태. 응답에 없으면 undefined. */
  participationStatus?: ParticipationStatusResponse | null;
}

export function InviteLandingPage({
  inviteCode,
  invitation,
  participationStatus,
}: InviteLandingPageProps) {
  const participationGuide = toParticipationGuide(participationStatus);

  const {
    isBlocked,
    isDrawerOpen,
    drawerType,
    participate,
    participateAsGuest,
    setDrawerOpen,
    retrySession,
    loginNextPath,
  } = useJoinEntry({
    inviteCode,
    canJoin: participationGuide.canJoin,
  });
  const loginDrawerProps: LoginDrawerProps =
    drawerType === 'guest'
      ? {
          type: 'guest',
          isOpen: isDrawerOpen,
          onOpenChange: setDrawerOpen,
          next: loginNextPath,
          onGuestJoin: participateAsGuest,
        }
      : {
          type: 'member',
          isOpen: isDrawerOpen,
          onOpenChange: setDrawerOpen,
          next: loginNextPath,
        };

  return (
    <div className="flex h-dvh flex-col bg-celebration">
      <TopAppBar
        className="shrink-0"
        leading={<IconButton icon="chevron-left" aria-label="뒤로가기" />}
      />
      <CompletionLayout
        header={
          <PageHeader
            align="center"
            title={participationGuide.title}
            description={participationGuide.description}
          />
        }
        visual={
          // 마감·정원 초과처럼 축하할 상황이 아니면 컨페티를 터뜨리지 않는다.
          <Celebration icon="invitation" hasConfetti={participationGuide.canJoin} />
        }
        footer={
          <CTASection
            secondaryAction={
              // 세션 오류일 때는 이 자리를 오류 안내가 쓴다. 진행상황 확인하기는 어차피
              // 비활성이고, 새 영역을 만들면 시안에 없는 레이아웃을 발명하게 된다.
              retrySession !== null ? (
                <div className="flex w-full flex-col items-center gap-0.5">
                  <p className="text-medium-14 text-neutral-600">모임 정보를 불러오지 못했어요</p>
                  <Button variant="link" onClick={retrySession}>
                    다시 시도
                  </Button>
                </div>
              ) : (
                <Button
                  fullWidth
                  variant="ghost"
                  className="text-neutral-500 hover:text-neutral-400"
                  asChild
                  disabled
                >
                  <Link
                    href={`/meetings?code=${inviteCode}`}
                    className="text-bold-14 underline underline-offset-3"
                  >
                    진행상황 확인하기
                  </Link>
                </Button>
              )
            }
            primaryAction={
              <Button fullWidth onClick={participate} disabled={isBlocked}>
                모임 참여하기
              </Button>
            }
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
    </div>
  );
}
