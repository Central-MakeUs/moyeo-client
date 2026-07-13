import React from 'react';
import { DayButton, type Locale } from 'react-day-picker';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

const calendarDayButtonClasses = cn(
  'flex w-full h-full items-center justify-center rounded-lg text-medium-14 transition-colors border-0',
  // hover
  'hover:bg-accessible-100',
  // today
  'data-[today=true]:not-data-[selected=true]:text-primary',

  // selected single
  'data-[selected-single=true]:bg-accessible-400 data-[selected-single=true]:text-white',

  // disabled
  'disabled:pointer-events-none disabled:text-neutral-200 ',

  // outside / outdated
  'data-[outside=true]:text-neutral-200',

  // range
  'data-[range-start=true]:rounded-r-none data-[range-start=true]:bg-accessible-400 data-[range-start=true]:text-white',
  'data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accessible-50 data-[range-middle=true]:text-neutral-850',
  'data-[range-end=true]:rounded-l-none data-[range-end=true]:bg-accessible-400 data-[range-end=true]:text-white'
);

export function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected={modifiers.selected}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-outside={modifiers.outside}
      data-today={modifiers.today}
      data-disabled={modifiers.disabled}
      className={cn(calendarDayButtonClasses, className)}
      {...props}
    />
  );
}
