'use client';

import * as React from 'react';

import { Button } from '@/shared/ui/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/ui/drawer';

import { SelectTrigger, type SelectTriggerProps } from './select-trigger';

interface SelectProps<T> extends Omit<
  SelectTriggerProps,
  'value' | 'defaultValue' | 'title' | 'children'
> {
  /** 선택된 값 (없을 시 트리거에 placeholder 노출) */
  value?: T;
  /** 값이 없을 때 피커가 시작할 값 */
  defaultValue: T;
  /** 값을 트리거에 표시할 텍스트로 변환 (예: `(v) => `${v.period} ${v.hour}시`` ) */
  format: (value: NoInfer<T>) => string;
  /** CTA 를 눌러 값을 확정했을 시 호출 */
  onValueChange: (value: NoInfer<T>) => void;
  /** drawer 안에 넣을 피커 (확정 전 임시 값(draft)과 그 setter 를 받는다.) */
  children: (draft: NoInfer<T>, setDraft: (value: NoInfer<T>) => void) => React.ReactNode;
  /** drawer 헤더 문구 */
  title: React.ReactNode;
  /** 확정 CTA 문구 */
  confirmLabel?: React.ReactNode;
  /** drawer 열림 상태 (controlled) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * 트리거 박스를 누르면 피커 바텀시트가 열리는 Select
 *
 * 피커에서 고른 값은 확정 전까지 drawer 안에만 머무는 임시 값(draft)
 * CTA를 눌러야 `onValueChange`로 올라간다. 그냥 닫으면 값은 바뀌지 않는다.
 */
function Select<T>({
  label,
  title,
  value,
  defaultValue,
  format,
  onValueChange,
  children,
  confirmLabel = '선택',
  open,
  onOpenChange,
  ...triggerProps
}: SelectProps<T>) {
  const [draft, setDraft] = React.useState<T>(value ?? defaultValue);

  const handleOpenChange = (nextOpen: boolean) => {
    // 직전에 확정 없이 닫은 draft가 남지 않도록, 열 때마다 선택값에서 다시 시작
    if (nextOpen) setDraft(value ?? defaultValue);
    onOpenChange?.(nextOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} autoFocus>
      <DrawerTrigger asChild>
        <SelectTrigger
          label={label}
          value={value === undefined ? undefined : format(value)}
          {...triggerProps}
        />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>{children(draft, setDraft)}</DrawerBody>
        <DrawerFooter>
          {/* 닫기는 drawer 프리미티브(DrawerClose)에 맡기고, 여기서는 값 확정만 한다 */}
          <DrawerClose asChild>
            <Button fullWidth onClick={() => onValueChange(draft)}>
              {confirmLabel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export { Select };
export type { SelectProps };
