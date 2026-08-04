'use client';

import type { ComponentProps } from 'react';

import Link from 'next/link';

import { cn } from '@/shared/lib/cn';
import { Icon, type IconName } from '@/shared/ui/icon';

/**
 * 마이페이지 메뉴 행 공통 스타일.
 */
const MENU_ROW_CLASS =
  'flex h-6 w-full items-center justify-between text-left text-semibold-14 text-neutral-700 hover:text-primary-500';

interface MenuRowContentProps {
  icon: IconName;
  label: string;
}

function MenuRowContent({ icon, label }: MenuRowContentProps) {
  return (
    <>
      <span className="flex items-center gap-1.5">
        <Icon size={20} name={icon} /> {label}
      </span>
      <Icon name="chevron-right" className="text-neutral-300" />
    </>
  );
}

export type MypageMenuButtonProps = MenuRowContentProps &
  Omit<ComponentProps<'button'>, 'children'>;

/**
 * 다른 화면으로 가지 않고 Drawer·AlertDialog를 여는 버튼
 */
export function MypageMenuButton({ icon, label, className, ...props }: MypageMenuButtonProps) {
  return (
    <button className={cn(MENU_ROW_CLASS, className)} {...props}>
      <MenuRowContent icon={icon} label={label} />
    </button>
  );
}

export type MypageMenuLinkProps = MenuRowContentProps &
  Omit<ComponentProps<typeof Link>, 'children'>;

/** 다른 화면으로 이동하는 링크 */
export function MypageMenuLink({ icon, label, className, ...props }: MypageMenuLinkProps) {
  return (
    <Link className={cn(MENU_ROW_CLASS, className)} {...props}>
      <MenuRowContent icon={icon} label={label} />
    </Link>
  );
}
