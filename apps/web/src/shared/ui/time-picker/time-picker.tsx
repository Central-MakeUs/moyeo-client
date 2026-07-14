'use client';

import * as React from 'react';
import Picker, { type PickerValue } from 'react-mobile-picker';

import { cn } from '@/shared/lib/cn';

const PERIODS = ['오전', '오후'] as const;
type Period = (typeof PERIODS)[number];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

const ITEM_HEIGHT = 38;
const VISIBLE_ROWS = 5;
const HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

export interface TimePickerValue {
  period: Period;
  hour: number;
}

interface TimePickerProps extends Omit<React.ComponentProps<'div'>, 'value' | 'onChange'> {
  value: TimePickerValue;
  onChange: (value: TimePickerValue) => void;
}

function textColorByDistance(distance: number): string {
  if (distance === 0) return 'text-neutral-950';
  if (distance === 1) return 'text-neutral-400';
  return 'text-neutral-100';
}

/** 오전/오후 + 시를 고르는 휠 타임피커 */
function TimePicker({ value, onChange, className, ...props }: TimePickerProps) {
  const pickerValue: PickerValue = { period: value.period, hour: value.hour };

  const handleChange = (next: PickerValue) => {
    onChange({ period: next.period as Period, hour: Number(next.hour) });
  };

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
        onChange={handleChange}
        height={HEIGHT}
        itemHeight={ITEM_HEIGHT}
        wheelMode="natural"
        // 라이브러리 기본 위아래 페이드 제거
        style={{ maskImage: 'none', WebkitMaskImage: 'none' }}
        // 라이브러리 기본 가운데 구분선을 담은 인디케이터 div 숨김 (선이 inline style이라 bg로는 덮지 못함)
        className="relative z-10 [&>div:last-child]:hidden"
      >
        {/*
          두 컬럼이 폭을 절반씩 나눠 가지게 두고(=바 전체가 드래그 영역), 텍스트만 w-full+text-align으로
          가운데 경계 쪽에 붙인다. pr/pl-[27px](시안 gap 54의 절반)로 두 텍스트 간격을 54px로 맞춤
        */}
        <Picker.Column name="period">
          {PERIODS.map((period) => {
            const distance = Math.abs(PERIODS.indexOf(period) - PERIODS.indexOf(value.period));
            return (
              <Picker.Item key={period} value={period}>
                <span
                  className={cn(
                    'w-full pr-[27px] text-right text-semibold-16 transition-colors',
                    textColorByDistance(distance)
                  )}
                >
                  {period}
                </span>
              </Picker.Item>
            );
          })}
        </Picker.Column>

        <Picker.Column name="hour">
          {HOURS.map((hour) => {
            const distance = Math.abs(hour - value.hour);
            return (
              <Picker.Item key={hour} value={hour}>
                <span
                  className={cn(
                    'w-full pl-[27px] text-left text-semibold-16 transition-colors',
                    textColorByDistance(distance)
                  )}
                >
                  {hour}시
                </span>
              </Picker.Item>
            );
          })}
        </Picker.Column>
      </Picker>
    </div>
  );
}

export { TimePicker, PERIODS };
