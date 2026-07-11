'use client';

import { Button } from '@/shared/ui';
import type { RoomDraft } from '@/entities/room';

type CreateRoomButtonProps = {
  className?: string;
};

const defaultDraft: RoomDraft = {
  name: '새 모임',
  memberCount: 1,
};

export function CreateRoomButton({ className }: CreateRoomButtonProps) {
  const handleClick = () => {
    window.alert(`${defaultDraft.name} 만들기 예시입니다.`);
  };

  return (
    <Button className={className} type="button" onClick={handleClick}>
      모임 만들기
    </Button>
  );
}
