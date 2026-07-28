'use client';

import * as React from 'react';

import { Icon } from '@/shared/ui/icon';

import { useShareInviteSms } from '../model/use-share-invite-sms';

export function SmsShareButton(): React.JSX.Element {
  const shareInviteSms = useShareInviteSms();

  return (
    <button
      type="button"
      onClick={shareInviteSms}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-8 bg-neutral-100"
    >
      <Icon name="envelope" size={18} className="text-neutral-900" />
      <span className="text-bold-16 text-neutral-900">SMS 공유 테스트</span>
    </button>
  );
}
