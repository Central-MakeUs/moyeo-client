'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/cn';
import { useBackHandler } from '@/shared/model';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';

import { useOverlayContainer } from '../overlay/overlay-provider';

/**
 * 열려 있는 동안 네이티브 뒤로가기를 가져간다 — 뒤로가기는 페이지가 아니라 이 다이얼로그를 닫는다.
 *
 * 제어/비제어 처리는 Drawer·AlertDialog와 같다. 비제어일 때만 내부 상태를 두고,
 * 제어일 때는 `open`을 그대로 진실로 삼아 호출부의 제어권을 빼앗지 않는다.
 */
function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  useBackHandler(() => {
    handleOpenChange(false);
    return true;
  }, isOpen);

  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      open={isOpen}
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  container,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  const overlayContainer = useOverlayContainer();

  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"
      container={container ?? overlayContainer ?? undefined}
      {...props}
    />
  );
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn('pointer-events-auto fixed inset-0 z-50 bg-opacity-40', className)}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'pointer-events-auto fixed inset-x-5 top-1/2 z-50 mx-auto flex w-auto max-w-80 -translate-y-1/2 flex-col rounded-12 border border-accessible-100 bg-accessible-10 px-5 pt-[18px] pb-7 text-neutral-900 outline-none',
          className
        )}
        {...props}
      >
        {showCloseButton && (
          // 닫기는 아이콘만 있는 보조 동작이라 버튼의 기본 상호작용 표현(배경·테두리·링·눌림)을
          // 모두 끄고 색 변화만 남긴다. 포커스는 링 대신 색으로 드러난다.
          <DialogPrimitive.Close
            asChild
            className="border-0 p-0 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 active:bg-transparent active:not-aria-[haspopup]:translate-y-0"
          >
            <IconButton
              icon="close"
              aria-label="닫기"
              iconSize={24}
              className="flex justify-end text-neutral-300 hover:text-neutral-500 focus-visible:text-neutral-500"
            />
          </DialogPrimitive.Close>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'mb-5 flex flex-col items-center gap-2 border-b border-accessible-100 pb-[22px]',
        className
      )}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="dialog-body" className={cn('max-h-69 overflow-y-auto', className)} {...props} />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('mt-6 flex shrink-0 flex-col', className)}
      {...props}
    />
  );
}

function DialogAction({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      fullWidth
      className={cn(
        'border-accessible-200 bg-accessible-50 text-accessible-500',
        'hover:text-accessible-500 focus-visible:text-accessible-500 active:text-accessible-500',
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-bold-18 text-accessible-950', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-extrabold-16 text-accessible-900', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogAction,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
