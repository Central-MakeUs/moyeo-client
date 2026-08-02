'use client';

import * as React from 'react';

import { Button, Drawer, DrawerContent, DrawerFooter, DrawerTitle } from '@/shared/ui';

import type { MeetingViewerRole } from '../model/meeting-viewer-role';

/** 메뉴에 올릴 수 있는 항목. 역할에 따라 조합만 달라진다. */
type MenuItem = 'share' | 'edit-nickname' | 'delete-meeting' | 'leave-meeting';

const MENU_LABEL: Record<MenuItem, string> = {
  share: '링크 공유하기',
  'edit-nickname': '닉네임 수정하기',
  'delete-meeting': '모임 삭제',
  'leave-meeting': '모임 나가기',
};

/**
 * 역할별 메뉴 구성(VIEW-01-F05).
 *
 * 게스트에게 닉네임 수정이 없는 것은 시안이자 API 제약이다 — 모임 내 닉네임 변경은
 * `PATCH /api/meetings/{meetingId}/participants/me/nickname` 하나뿐이고 로그인이 필요하다.
 */
const MENU_BY_ROLE: Record<Exclude<MeetingViewerRole, 'non-participant'>, MenuItem[]> = {
  host: ['share', 'edit-nickname', 'delete-meeting'],
  member: ['share', 'edit-nickname', 'leave-meeting'],
  guest: ['share', 'leave-meeting'],
};

export interface MeetingMenuDrawerProps {
  /** 메뉴 구성을 정하는 역할. 참여자가 아닌 사람에게는 이 Drawer를 띄우지 않는다. */
  role: Exclude<MeetingViewerRole, 'non-participant'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 현황 화면 더보기 메뉴.
 *
 * 지금은 구성만 있고 각 항목은 동작하지 않는다. 공유 시트·닉네임 수정·삭제/나가기 확인
 * 팝업은 후속 작업이다(VIEW-01-F05).
 */
export function MeetingMenuDrawer({
  role,
  open,
  onOpenChange,
}: MeetingMenuDrawerProps): React.JSX.Element {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {/* 목록만 있는 메뉴라 시각적 제목은 없다. 스크린 리더에는 이름이 있어야 한다. */}
        <DrawerTitle className="sr-only">모임 메뉴</DrawerTitle>

        <DrawerFooter>
          {MENU_BY_ROLE[role].map((item) => (
            <Button key={item} variant="outline" fullWidth>
              {MENU_LABEL[item]}
            </Button>
          ))}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
