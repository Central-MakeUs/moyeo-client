'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import Logo from '@/shared/assets/images/moyeo-logo-text.png';
import { Avatar } from '@/shared/ui/avatar';
import { TopAppBar } from '@/shared/ui/top-app-bar';

export function HomeTopBar(): React.JSX.Element {
  const router = useRouter();

  return (
    <TopAppBar
      leading={<Image src={Logo} alt="MOYEO" width={78} height={32} priority />}
      trailing={
        <button
          type="button"
          aria-label="프로필 열기"
          onClick={() => router.push('/mypage')}
          className="flex items-center"
        >
          <Avatar size={28} />
        </button>
      }
      className="shrink-0 border-b border-neutral-50 px-6"
    />
  );
}
