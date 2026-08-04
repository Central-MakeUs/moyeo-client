'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { clearSession } from '@/entities/session';
import { useWithdraw } from '@/shared/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  toast,
} from '@/shared/ui';

export interface WithdrawAlertDialogProps {
  trigger: ReactNode;
}

export function WithdrawAlertDialog({ trigger }: WithdrawAlertDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const withdraw = useWithdraw();

  const handleWithdraw = (event: MouseEvent<HTMLButtonElement>) => {
    // Radix Action은 클릭 즉시 다이얼로그를 닫는다. 되돌릴 수 없는 요청이므로
    // 응답이 올 때까지 열어 둔 채 로딩을 보여주고, 그동안 다시 누르지 못하게 한다.
    event.preventDefault();
    if (withdraw.isPending) return;

    withdraw.mutate(undefined, {
      onSuccess: () => {
        toast.add({ id: 'withdraw-success', description: '탈퇴가 완료되었습니다.' });
        clearSession();
        queryClient.clear();
        router.replace('/login');
      },
      onError: () => {
        toast.add({ id: 'withdraw-failed', description: '탈퇴에 실패하였습니다.' });
        setIsOpen(false);
      },
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>탈퇴를 진행하시겠어요?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={withdraw.isPending}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleWithdraw} isLoading={withdraw.isPending}>
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
