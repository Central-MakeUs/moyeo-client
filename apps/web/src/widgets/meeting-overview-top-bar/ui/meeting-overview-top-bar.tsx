'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { IconButton } from '@/shared/ui/icon-button';
import { TopAppBar } from '@/shared/ui/top-app-bar';

import { useMeetingViewerRole } from '../model/use-meeting-viewer-role';
import { MeetingMenuDrawer } from './meeting-menu-drawer';

export interface MeetingOverviewTopBarProps {
  /** 현황을 보고 있는 모임의 초대 코드. */
  inviteCode: string;
}

/**
 * 현황 화면(VIEW-01) 상단바.
 *
 * 커버 사진 위에 얹히므로 배경이 없고 아이콘이 흰색이다.
 *
 * 뒤로가기·더보기는 이 모임의 참여자에게만 보인다(VIEW-01-F05). 링크만 열어본 사람에게는
 * 돌아갈 이전 화면도, 실행할 메뉴도 없기 때문이다. 역할이 아직 판별되지 않은 동안에도
 * 감춘다 — 참여자가 아닌 사람에게 잠깐 보였다 사라지는 편보다 낫다.
 */
export function MeetingOverviewTopBar({
  inviteCode,
}: MeetingOverviewTopBarProps): React.JSX.Element {
  const router = useRouter();
  const role = useMeetingViewerRole(inviteCode);
  const [isMenuOpen, setMenuOpen] = React.useState(false);

  const isParticipant = role !== null && role !== 'non-participant';

  return (
    <>
      <TopAppBar
        className="relative z-20 shrink-0"
        leading={
          isParticipant && (
            <IconButton
              icon="chevron-left"
              aria-label="뒤로가기"
              className="text-white"
              onClick={() => router.back()}
            />
          )
        }
        trailing={
          isParticipant && (
            <IconButton
              icon="kebab"
              aria-label="더보기"
              className="text-white"
              onClick={() => setMenuOpen(true)}
            />
          )
        }
      />

      {isParticipant && (
        <MeetingMenuDrawer role={role} open={isMenuOpen} onOpenChange={setMenuOpen} />
      )}
    </>
  );
}
