'use client';

import React from 'react';

import { useCreate } from '@/shared/api';
import { TextareaField, toast } from '@/shared/ui';
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

export interface SubmitFeedbackDrawerProps {
  trigger: React.ReactNode;
}

export function SubmitFeedbackDrawer({ trigger }: SubmitFeedbackDrawerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');
  const mutation = useCreate();

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    setFeedback('');
  };

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    mutation.mutate(
      { data: { content: feedback } },
      {
        onSuccess: () => {
          toast.add({
            id: 'feedback-success',
            description: '피드백이 성공적으로 제출되었습니다. 감사합니다!',
          });
          handleOpenChange(false);
        },
        onError: () => {
          toast.add({
            id: 'feedback-error',
            description: '피드백 제출에 실패했습니다. 잠시 후 다시 시도해주세요.',
          });
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
            피드백 보내기
          </DrawerTitle>
          <DrawerDescription className="w-full text-start">
            더 나은 모여를 만들 수 있도록 의견을 들려주세요!
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="pb-8">
          <TextareaField
            maxLength={1000}
            className="h-24"
            placeholder={`예) 이런 기능이 있으면 좋겠어요,
                OO가 불편했어요, OO가 좋았어요`}
            value={feedback}
            characterCountVisibility="always"
            onChange={(e) => setFeedback(e.target.value)}
          />
        </DrawerBody>
        <DrawerFooter className="pt-0">
          <Button
            fullWidth
            disabled={!feedback.trim()}
            isLoading={mutation.isPending}
            onClick={handleSubmit}
          >
            보내기
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
