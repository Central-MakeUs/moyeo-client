'use client';

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { isValidNickname } from '@/entities/nickname';
import { getMeQueryOptions, useUpdateNickname } from '@/shared/api';
import { InputField, toast } from '@/shared/ui';
import { Button } from '@/shared/ui/button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/ui/drawer';

export interface EditNicknameDrawerProps {
  /** Drawer를 여는 트리거. */
  trigger: React.ReactNode;
  currentNickname: string;
}

export function EditNicknameDrawer({ trigger, currentNickname }: EditNicknameDrawerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [nickname, setNickname] = React.useState(currentNickname);
  const isNicknameValid = isValidNickname(nickname);
  const mutate = useUpdateNickname();
  const queryClient = useQueryClient();

  const isChanged = nickname.trim() !== currentNickname;

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    setNickname(currentNickname);
  };

  const handleSubmit = () => {
    if (!isChanged || !isNicknameValid) return;
    mutate.mutate(
      { data: { nickname: nickname.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [...getMeQueryOptions().queryKey] });
          handleOpenChange(false);
          toast.add({ id: 'nickname-change-success', description: '닉네임이 변경되었습니다.' });
        },
        onError: () => {
          toast.add({ id: 'nickname-change-error', description: '닉네임 변경에 실패하였습니다.' });
        },
      }
    );
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="flex flex-col gap-0">
        <DrawerHeader className="gap-1.5 py-0 pb-6">
          <DrawerTitle className="w-full text-start text-bold-16 text-neutral-900">
            기본 닉네임 수정
          </DrawerTitle>
          <DrawerDescription className="w-full text-start">
            모임별 닉네임 수정은 모임 상세페이지에서 가능해요
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="pb-8">
          <InputField
            errorMessage={
              !isNicknameValid ? '* 2~10자로 공백없이 한글과 영어만 입력해주세요' : undefined
            }
            placeholder="닉네임을 입력해주세요"
            description="* 2~10자로 공백없이 한글과 영어만 입력해주세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </DrawerBody>
        <DrawerFooter className="pt-0">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" fullWidth onClick={() => handleOpenChange(false)}>
              취소
            </Button>
            <Button
              fullWidth
              isLoading={mutate.isPending}
              disabled={!isNicknameValid || !isChanged}
              onClick={handleSubmit}
            >
              완료
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
