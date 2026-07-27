'use client';

import { useRouter } from 'next/navigation';

import { IconButton } from '@/shared/ui/icon-button';

export function NicknameBackButton() {
  const router = useRouter();

  return <IconButton icon="chevron-left" aria-label="뒤로가기" onClick={() => router.back()} />;
}
