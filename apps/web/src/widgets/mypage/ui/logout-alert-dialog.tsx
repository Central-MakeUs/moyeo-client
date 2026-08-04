'use client';

import type { ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { clearSession } from '@/entities/session';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui';

export interface LogoutAlertDialogProps {
  trigger: ReactNode;
}

export function LogoutAlertDialog({ trigger }: LogoutAlertDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    // 다음 계정에 이전 계정 데이터가 남지 않도록 캐시를 비운다. (로그인 경로들과 같은 순서)
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>잠시만요!</AlertDialogTitle>
          <AlertDialogDescription>로그인을 해야 모임을 만들 수 있어요</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>로그아웃</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
