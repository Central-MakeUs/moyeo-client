'use client';

import * as React from 'react';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Icon, type IconName } from '@/shared/ui/icon';

import { useOverlayContainer } from '../overlay/overlay-provider';

function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({
  container,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  const overlayContainer = useOverlayContainer();

  return (
    <AlertDialogPrimitive.Portal
      data-slot="alert-dialog-portal"
      container={container ?? overlayContainer ?? undefined}
      {...props}
    />
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn('pointer-events-auto fixed inset-0 z-50 bg-opacity-40', className)}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          'pointer-events-auto fixed inset-x-5 top-1/2 z-50 mx-auto flex w-auto max-w-80 -translate-y-1/2 flex-col items-center gap-6 rounded-12 bg-white p-6 text-center outline-none',
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  icon,
  children,
  ...props
}: React.ComponentProps<'div'> & { icon?: IconName }) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col items-center', icon ? 'gap-4' : 'gap-3', className)}
      {...props}
    >
      {icon && <Icon name={icon} size={42} />}
      {icon ? <div className="flex flex-col items-center gap-3">{children}</div> : children}
    </div>
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-bold-18 text-neutral-850', className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-semibold-14 text-neutral-600', className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('grid w-full shrink-0 grid-cols-2 gap-2', className)}
      {...props}
    />
  );
}

/**
 * Button을 `asChild`로 감싸지 않고 Action이 Button을 감싼다.
 *
 * `Button`은 `!asChild && isLoading`일 때만 스피너를 렌더한다(단일 child만 받는 Slot에
 * 스피너를 끼워 넣을 수 없기 때문). Button이 바깥이면 `isLoading`이 항상 무시되므로
 * 방향을 뒤집어 Action이 실제 `<button>`인 Button 위로 props를 합치게 한다.
 */
function AlertDialogAction({
  className,
  variant = 'default',
  isLoading,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<React.ComponentProps<typeof Button>, 'variant'> & { isLoading?: boolean }) {
  return (
    <AlertDialogPrimitive.Action data-slot="alert-dialog-action" asChild {...props}>
      <Button variant={variant} fullWidth isLoading={isLoading} className={className}>
        {children}
      </Button>
    </AlertDialogPrimitive.Action>
  );
}

function AlertDialogCancel({
  className,
  variant = 'outline',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, 'variant'>) {
  return (
    <Button variant={variant} fullWidth asChild>
      <AlertDialogPrimitive.Cancel
        data-slot="alert-dialog-cancel"
        className={className}
        {...props}
      />
    </Button>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
