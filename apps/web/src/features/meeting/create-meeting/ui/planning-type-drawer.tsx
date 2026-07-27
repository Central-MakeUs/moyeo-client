'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  RadioGroup,
  RadioGroupIconCard,
} from '@/shared/ui';
import { Icon, type IconName } from '@/shared/ui/icon';

import { type PlanningType, useCreateMeetingDraft } from '../model/create-meeting-draft';
import { PageHeader } from '@/shared/ui/page-header';

const BASIC_STEP_PATH = '/meetings/new/basic';

const TYPE_OPTIONS: {
  value: PlanningType;
  title: string;
  description: string;
  selectedIcon: IconName;
  unselectedIcon: IconName;
}[] = [
  {
    value: 'SCHEDULE_ONLY',
    title: '일정 정하기',
    description: '모두에게 최적의 날짜와 시간대를 정해드려요',
    selectedIcon: 'calendar-primary',
    unselectedIcon: 'calendar',
  },
  {
    value: 'PLACE_ONLY',
    title: '위치 정하기',
    description: '모두에게 공평한 위치를 찾아드려요',
    selectedIcon: 'pinned-primary',
    unselectedIcon: 'pinned',
  },
  {
    value: 'SCHEDULE_AND_PLACE',
    title: '일정 & 위치 정하기',
    description: '공평한 일정과 위치를 둘 다 찾아드려요',
    selectedIcon: 'note-primary',
    unselectedIcon: 'note',
  },
];

export interface PlanningTypeDrawerProps {
  /** Drawer를 여는 트리거. HOME의 모임 생성 FAB(HOME-01-F06)이 들어온다. */
  trigger: React.ReactNode;
}

/**
 * CRT-01 모임 유형 선택 Drawer.
 *
 * 선택은 `선택`을 누르기 전까지 로컬 상태에만 둔다. 닫기만 한 경우 draft를 건드리지 않아야
 * 하기 때문이다(crt-01.md CRT-01-F04). 확정 시에는 이전 시도의 draft를 먼저 비운다.
 */
export function PlanningTypeDrawer({ trigger }: PlanningTypeDrawerProps): React.JSX.Element {
  const router = useRouter();
  const reset = useCreateMeetingDraft((s) => s.reset);
  const setPlanningType = useCreateMeetingDraft((s) => s.setPlanningType);

  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<PlanningType | null>(null);

  // 닫힐 때 후보 선택을 버린다 — 다시 열면 미선택 상태로 시작한다(crt-01.md §9-2).
  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    if (!next) setSelected(null);
  };

  const handleConfirm = () => {
    if (selected === null) return;

    reset();
    setPlanningType(selected);
    router.push(BASIC_STEP_PATH);
    handleOpenChange(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>

      <DrawerContent className="gap-6">
        <PageHeader
          title="무엇을 정해볼까요?"
          description="이번 모임에서 조율이 필요한 항목을 선택해주세요"
        />

        <DrawerBody>
          {/* 미선택을 undefined가 아닌 ''로 둔다 — undefined면 RadioGroup이 uncontrolled로 시작한다. */}
          <RadioGroup
            value={selected ?? ''}
            onValueChange={(value) => setSelected(value as PlanningType)}
          >
            {TYPE_OPTIONS.map((option) => (
              <RadioGroupIconCard
                key={option.value}
                value={option.value}
                title={option.title}
                description={option.description}
                selectedIcon={<Icon name={option.selectedIcon} className="size-7" />}
                unselectedIcon={<Icon name={option.unselectedIcon} className="size-7" />}
              />
            ))}
          </RadioGroup>
        </DrawerBody>

        <DrawerFooter className="pt-0">
          <Button fullWidth disabled={selected === null} onClick={handleConfirm}>
            선택
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
