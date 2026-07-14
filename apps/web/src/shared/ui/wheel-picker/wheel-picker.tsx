'use client';

import * as React from 'react';
import Picker, { type PickerValue } from 'react-mobile-picker';

import { cn } from '@/shared/lib/cn';

const ITEM_HEIGHT = 38;
const VISIBLE_ROWS = 5;
const HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

export interface WheelOption {
  value: string | number;
  label: string;
}

export interface WheelColumn {
  /** 컬럼 식별 key (onChange에서 어떤 컬럼이 바뀌었는지 구분) */
  key: string;
  /** 위→아래 순서의 옵션 목록 */
  options: readonly WheelOption[];
  /** 현재 선택된 값 */
  value: string | number;
  /**
   * 컬럼 안에서 텍스트를 붙일 위치. 두 컬럼을 가운데 경계로 모을 때 쓴다.
   * end/start는 경계 쪽으로 13.5px씩(=27) 붙어 두 텍스트 간격이 54px가 된다.
   */
  align?: 'start' | 'center' | 'end';
}

interface WheelPickerProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  columns: WheelColumn[];
  onChange: (key: string, value: string | number) => void;
}

/** 선택 행(거리 0)에서 멀어질수록 연해진다: 0 → 1 → 2+ */
function textColorByDistance(distance: number): string {
  if (distance === 0) return 'text-neutral-950';
  if (distance === 1) return 'text-neutral-400';
  return 'text-neutral-100';
}

/**
 * pr/pl-[27px] = 시안 gap 54의 절반. 컬럼은 flex로 폭을 반씩 나눠 가져(=바 전체가 드래그 영역)
 * 텍스트만 w-full+text-align으로 가운데 경계 쪽에 붙인다.
 */
const ALIGN_CLASS: Record<NonNullable<WheelColumn['align']>, string> = {
  end: 'w-full pr-[27px] text-right',
  start: 'w-full pl-[27px] text-left',
  center: 'w-full text-center',
};

/**
 * 여러 컬럼을 굴려 값을 고르는 모바일 휠 피커 primitive.
 * 선택 행 하이라이트·거리별 글자색·라이브러리 기본 선/페이드 제거 같은 룩앤필만 담당하고,
 * 값의 의미(시각/기간 등)는 이 컴포넌트를 감싸는 쪽에서 정한다.
 */
function WheelPicker({ columns, onChange, className, ...props }: WheelPickerProps) {
  const pickerValue: PickerValue = Object.fromEntries(columns.map((col) => [col.key, col.value]));

  return (
    <div className={cn('relative w-full', className)} {...props}>
      {/* 선택 행 하이라이트. rounded-md는 이 프로젝트에서 8px (Tailwind 기본 6px 아님) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 rounded-md bg-neutral-20"
        style={{ height: ITEM_HEIGHT }}
      />

      <Picker
        value={pickerValue}
        onChange={(next, key) => onChange(key, next[key] as string | number)}
        height={HEIGHT}
        itemHeight={ITEM_HEIGHT}
        wheelMode="normal"
        // 라이브러리 기본 위아래 페이드 제거
        style={{ maskImage: 'none', WebkitMaskImage: 'none' }}
        // 라이브러리 기본 가운데 구분선을 담은 인디케이터 div 숨김 (선이 inline style이라 bg로는 못 덮음)
        className="relative z-10 [&>div:last-child]:hidden"
      >
        {columns.map((col) => {
          const selectedIndex = col.options.findIndex((opt) => opt.value === col.value);
          return (
            <Picker.Column key={col.key} name={col.key}>
              {col.options.map((opt, index) => (
                <Picker.Item key={opt.value} value={opt.value}>
                  <span
                    className={cn(
                      'text-semibold-16 transition-colors',
                      ALIGN_CLASS[col.align ?? 'center'],
                      textColorByDistance(Math.abs(index - selectedIndex))
                    )}
                  >
                    {opt.label}
                  </span>
                </Picker.Item>
              ))}
            </Picker.Column>
          );
        })}
      </Picker>
    </div>
  );
}

export { WheelPicker };
