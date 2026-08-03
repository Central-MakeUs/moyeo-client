'use client';

import * as React from 'react';

import { Button, Drawer, DrawerBody, DrawerContent, DrawerTitle } from '@/shared/ui';

import type { MeetingViewerRole } from '../model/meeting-viewer-role';

/** 메뉴에 올릴 수 있는 항목. 역할에 따라 조합만 달라진다. */
export type MeetingMenuItem = 'copy-link' | 'edit-nickname' | 'delete-meeting' | 'leave-meeting';

const MENU_LABEL: Record<MeetingMenuItem, string> = {
  'copy-link': '링크 복사하기',
  'edit-nickname': '닉네임 수정하기',
  'delete-meeting': '모임 삭제',
  'leave-meeting': '모임 나가기',
};

/**
 * 역할별 메뉴 구성(VIEW-01-F05).
 *
 * 모임장만 삭제다. 모임 자체가 사라지므로 나가기와는 아예 다른 동작이고, 참여자에게는 삭제를
 * 주지 않는다.
 *
 * 게스트에게 닉네임 수정이 없는 것은 시안이자 API 제약이다 — 모임 내 닉네임 변경은
 * `PATCH /api/meetings/{meetingId}/participants/me/nickname` 하나뿐이고 로그인이 필요하다.
 */
const MENU_BY_ROLE: Record<Exclude<MeetingViewerRole, 'non-participant'>, MeetingMenuItem[]> = {
  host: ['copy-link', 'edit-nickname', 'delete-meeting'],
  member: ['copy-link', 'edit-nickname', 'leave-meeting'],
  guest: ['copy-link', 'leave-meeting'],
};

export interface MeetingMenuDrawerProps {
  /** 메뉴 구성을 정하는 역할. 참여자가 아닌 사람에게는 이 Drawer를 띄우지 않는다. */
  role: Exclude<MeetingViewerRole, 'non-participant'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MeetingMenuItem) => void;
}

/** 현황 화면 더보기 메뉴. 항목의 실제 동작은 호출부가 갖는다. */
export function MeetingMenuDrawer({
  role,
  open,
  onOpenChange,
  onSelect,
}: MeetingMenuDrawerProps): React.JSX.Element {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {/* 목록만 있는 메뉴라 시각적 제목은 없다. 스크린 리더에는 이름이 있어야 한다. */}
        <DrawerTitle className="sr-only">모임 메뉴</DrawerTitle>

        <DrawerBody className="flex w-full flex-col gap-3 pb-11">
          {MENU_BY_ROLE[role].map((item) => (
            <Button key={item} variant="outline" fullWidth onClick={() => onSelect(item)}>
              {MENU_LABEL[item]}
            </Button>
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
