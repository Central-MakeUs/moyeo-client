'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/shared/lib/cn';
import { useBackHandler } from '@/shared/model';

import { useOverlayContainer } from '../overlay/overlay-provider';

type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
  direction?: 'bottom';
};

/**
 * 열려 있는 동안 네이티브 뒤로가기를 가져간다 — 뒤로가기는 페이지가 아니라 이 Drawer를 닫는다.
 *
 * 그러려면 열림 여부를 알아야 하는데 호출부가 제어/비제어 어느 쪽으로도 쓸 수 있다.
 * 비제어일 때만 내부 상태를 두고, 제어일 때는 `open`을 그대로 진실로 삼는다 — 내부에 거울을
 * 두면 호출부가 `onOpenChange`를 무시해 닫힘을 막는 경우에도 Drawer가 닫혀버린다.
 */
function Drawer({
  container,
  handleOnly = true,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: DrawerProps) {
  const overlayContainer = useOverlayContainer();
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
    <DrawerPrimitive.Root
      data-slot="drawer"
      handleOnly={handleOnly}
      direction="bottom"
      container={container ?? overlayContainer ?? undefined}
      open={isOpen}
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn('pointer-events-auto fixed inset-0 z-50 bg-opacity-40', className)}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          // 레이아웃 및 크기 제어
          'group/drawer-content pointer-events-auto fixed z-50 flex h-fit max-h-[80dvh] flex-col px-5',
          // 테마 및 타이포그래피
          'bg-popover text-semibold-14 text-popover-foreground',
          // 바텀 드로어 전용 스타일
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:rounded-t-12',
          // 오버드래그 필러
          "after:absolute after:inset-x-0 after:top-full after:-mt-px after:h-[200%] after:bg-inherit after:content-['']",
          className
        )}
        {...props}
      >
        <DrawerHandle />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHandle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Handle>) {
  return (
    <div className="relative h-[34px] w-full shrink-0">
      <DrawerPrimitive.Handle
        data-slot="drawer-handle"
        className={cn(
          'absolute inset-x-0 top-1.5 h-1! w-9! cursor-grab rounded-full bg-neutral-50',
          className
        )}
        {...props}
      />
    </div>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'flex shrink-0 flex-col gap-0.5 pb-8 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center',
        className
      )}
      {...props}
    />
  );
}

function DrawerBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-body"
      className={cn('min-h-0 flex-auto overflow-y-auto', className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('flex shrink-0 flex-col gap-2 pt-3 pb-11', className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-semibold-14 text-neutral-1000', className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-bold-14 text-neutral-600', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
