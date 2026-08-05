'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { toEditResponsePath, type EditResponseTarget } from '../model/edit-response-paths';

export interface EditResponseButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'variant' | 'onClick'
> {
  inviteCode: string;
  /** 무엇을 고치러 가는지. 일정 조율 탭이면 `'schedule'`, 위치 조율 탭이면 `'departure'`. */
  target: EditResponseTarget;
}

/**
 * "내 응답 수정하기" 버튼. 일정 조율·위치 조율 화면에서 함께 쓴다.
 *
 * 가는 곳이 탭마다 다를 뿐 규칙은 하나라(`toEditResponsePath`) 이동까지 버튼이 맡는다.
 * 호출부 세 곳이 같은 경로 조립을 각자 들고 있을 이유가 없다.
 */
export function EditResponseButton({
  inviteCode,
  target,
  className,
  ...props
}: EditResponseButtonProps): React.JSX.Element {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className={cn('h-8 w-[114px] gap-1 px-2 py-1.5 text-bold-14', className)}
      onClick={() => router.push(toEditResponsePath(target, inviteCode))}
      {...props}
    >
      내 응답 수정하기
    </Button>
  );
}
