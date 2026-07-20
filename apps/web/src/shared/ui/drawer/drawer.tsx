'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/shared/lib/cn';

import { useOverlayContainer } from '../overlay/overlay-provider';

type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
  direction?: 'bottom';
};

function Drawer({ container, ...props }: DrawerProps) {
  const overlayContainer = useOverlayContainer();

  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      container={container ?? overlayContainer ?? undefined}
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

function DrawerHandle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className="relative h-[22px] w-full shrink-0">
      <div
        data-slot="drawer-handle"
        className={cn(
          'absolute top-1.5 left-1/2 h-1 w-9 -translate-x-1/2 cursor-grab rounded-full bg-neutral-50',
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
      className={cn('min-h-0 flex-1 overflow-y-auto', className)}
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
};
