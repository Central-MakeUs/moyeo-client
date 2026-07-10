import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ko } from 'date-fns/locale';

import { cn } from '@/shared/lib/cn';
import { Button, buttonVariants } from '@/shared/ui/primitives/button';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from 'lucide-react';
import { CalendarDayButton } from './calendar-button';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  buttonVariant = 'ghost',
  locale = ko,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'group/calendar bg-white in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent',
        className
      )}
      captionLayout={'label'}
      locale={locale}
      formatters={{
        formatWeekdayName: (date) => date.toLocaleDateString(locale?.code, { weekday: 'short' }),
        formatCaption: (date) => {
          return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
        },
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit'),
        months: cn('relative flex flex-col'),
        month: cn('flex w-full flex-col gap-6'),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-center gap-[110px]'),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-7.5 p-0 select-none aria-disabled:opacity-50 text-neutral-300'
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-7.5 p-0 select-none aria-disabled:opacity-50 text-neutral-300'
        ),
        month_caption: cn('flex h-7.5 w-full items-center justify-center'),
        caption_label: cn('text-bold-16 select-none text-neutral-950'),
        month_grid: cn('w-full border-collapse'),
        weekdays: cn('flex mb-2'),
        weekday: cn('flex-1 text-bold-14 text-neutral-500 select-none'),
        week: cn('mt-2 flex w-full'),
        day: cn(
          'group/day relative flex w-[49px] h-[44px]  rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-lg data-[range-middle=true]:bg-accessible-50',
          props.showWeekNumber
            ? '[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)'
            : '[&:first-child[data-selected=true]_button]:rounded-l-lg'
        ),
        hidden: cn('invisible'),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return <ChevronLeftIcon className={cn('size-4', className)} {...props} />;
          }

          if (orientation === 'right') {
            return <ChevronRightIcon className={cn('size-4', className)} {...props} />;
          }

          return <ChevronDownIcon className={cn('size-4', className)} {...props} />;
        },
        DayButton: ({ ...props }) => <CalendarDayButton locale={locale} {...props} />,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}
export { Calendar };
