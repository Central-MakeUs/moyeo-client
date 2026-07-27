'use client';

import * as React from 'react';
import { Toast as ToastPrimitive } from '@base-ui/react/toast';

import { cn } from '@/shared/lib/cn';

// 전역 토스트 인스턴스 생성
const toast = ToastPrimitive.createToastManager();
const DEFAULT_TOAST_GAP = '1rem';

const toastBaseStyles =
  'group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-12 bg-neutral-900/[52%] text-neutral-0 backdrop-blur-[64px] will-change-transform outline-none select-none';

/** 겹친 Toast의 간격, 높이, 위치와 축소 비율을 계산한다. */
const toastStackStyles =
  '[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]';

/** 기본 stack과 펼친 stack 사이의 위치·크기 전환을 담당한다. */
const toastTransitionStyles =
  "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_180ms_ease-out,opacity_150ms_ease-out,height_150ms] after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[''] data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]";

/** 새 Toast, 표시 제한 Toast와 일반적인 자동 종료 상태를 표현한다. - TODO 수정할 필요가 있을 수도 있을 것 같음 */
const toastExitStyles =
  'data-limited:opacity-0 data-starting-style:opacity-100 [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:translate-y-2 [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:opacity-0';

/** Swipe로 닫을 때 사용자가 민 방향으로 Toast를 화면 밖까지 이동한다. */
const toastSwipeStyles =
  'data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]';

function ToastProvider(props: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal(props: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        'max-w-[var(--app-shell-max-width, 380px)] pointer-events-none fixed inset-x-5 bottom-[var(--toast-bottom-offset,1rem)] z-50 mx-auto w-auto outline-none',
        className
      )}
      {...props}
    />
  );
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        toastBaseStyles,
        toastStackStyles,
        toastTransitionStyles,
        toastExitStyles,
        toastSwipeStyles,
        className
      )}
      {...props}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        'flex min-h-[51px] items-center overflow-hidden px-4 py-2.5 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100',
        className
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn('text-semibold-14 text-neutral-0', className)}
      {...props}
    />
  );
}

function ToastDescription({ className, ...props }: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn('text-semibold-14 text-neutral-0', className)}
      {...props}
    />
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastDescription />
      </ToastContent>
    </Toast>
  ));
}

function Toaster({ children, toastManager = toast, ...props }: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

interface ToastOffsetBoundaryProps extends React.PropsWithChildren {
  className?: string;
  /**
   * Toast viewport의 화면 하단 간격.
   * 생략하면 boundary의 실제 높이에 gap을 더해 자동 계산한다.
   * 예: `calc(7rem + env(safe-area-inset-bottom))`
   */
  bottomOffset?: string;
  /** footer와 Toast 사이 간격. 자동 계산할 때만 사용한다. */
  gap?: string;
}

/**
 * Portal로 렌더링되는 Toast viewport에 하단 고정 UI의 높이를 전달한다.
 * 경계가 없는 화면에서는 viewport가 기본 16px 하단 간격을 사용한다.
 */
function ToastOffsetBoundary({
  children,
  className,
  bottomOffset,
  gap = DEFAULT_TOAST_GAP,
}: ToastOffsetBoundaryProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const root = document.documentElement;
    const updateOffset = () => {
      const offset = bottomOffset ?? `calc(${element.getBoundingClientRect().height}px + ${gap})`;
      root.style.setProperty('--toast-bottom-offset', offset);
    };

    updateOffset();

    if (bottomOffset !== undefined || typeof ResizeObserver === 'undefined') {
      return () => root.style.removeProperty('--toast-bottom-offset');
    }

    const observer = new ResizeObserver(updateOffset);
    observer.observe(element);

    return () => {
      observer.disconnect();
      root.style.removeProperty('--toast-bottom-offset');
    };
  }, [bottomOffset, gap]);

  return (
    <div ref={ref} data-slot="toast-offset-boundary" className={cn('shrink-0', className)}>
      {children}
    </div>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  createToastManager,
  toast,
  Toast,
  ToastContent,
  ToastDescription,
  Toaster,
  ToastOffsetBoundary,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
};
export type { ToastOffsetBoundaryProps };
