import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export interface EditResponseButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'variant'
> {}

/**
 * "내 응답 수정하기" 버튼. 일정 조율/위치 조율 등 여러 화면에서 재사용한다.
 * 실제로 무엇을 수정하는지(일정 입력, 출발지 입력 등)는 화면마다 다르므로
 * 이동 동작은 만들지 않고, 호출부가 onClick으로 각자의 수정 화면으로 보낸다.
 */
export function EditResponseButton({
  className,
  ...props
}: EditResponseButtonProps): React.JSX.Element {
  return (
    <Button
      variant="outline"
      className={cn('h-8 w-[114px] gap-1 px-2 py-1.5 text-bold-14', className)}
      {...props}
    >
      내 응답 수정하기
    </Button>
  );
}
