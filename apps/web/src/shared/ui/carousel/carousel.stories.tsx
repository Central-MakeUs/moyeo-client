import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fireEvent, waitFor, within } from 'storybook/test';

import { PageControl } from '@/shared/ui/page-control';

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from './carousel';

type CarouselStoryArgs = {
  slideCount: number;
};

/**
 * 카드 한 장씩 스와이프로 넘기는 캐러셀입니다.
 * 화살표 없이 스와이프와 하단 `PageControl`로만 이동하는 형태를 문서화합니다.
 */
const meta = {
  title: 'Primitives/Carousel',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  // 시안(card-meeting.svg) 기준 카드 폭 312px 컨텍스트에서 보여준다.
  decorators: [
    (Story) => (
      <div className="w-78">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    slideCount: {
      control: { type: 'number', min: 1 },
      description:
        '캐러셀에 넣을 슬라이드 개수. 상한은 없다 — 개수가 많을 때의 모습도 확인할 수 있다.',
      table: { defaultValue: { summary: '3' } },
    },
  },
  args: {
    slideCount: 3,
  },
} satisfies Meta<CarouselStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 캐러셀과 PageControl을 연결한 조립본.
 * `setApi`로 embla 인스턴스를 받아 `select` 이벤트마다 현재 인덱스를 동기화한다.
 * 실제 화면 조립(HOME-01)에서도 같은 배선을 쓴다.
 */
function CarouselWithPageControl({ slideCount }: CarouselStoryArgs) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    const syncCurrent = () => setCurrent(api.selectedScrollSnap());

    syncCurrent();
    api.on('select', syncCurrent);

    return () => {
      api.off('select', syncCurrent);
    };
  }, [api]);

  return (
    <div className="flex flex-col items-center gap-3">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {Array.from({ length: slideCount }, (_, index) => (
            <CarouselItem key={index}>
              <div className="flex h-40 items-center justify-center rounded-12 bg-neutral-20 text-semibold-16 text-neutral-700">
                슬라이드 {index + 1}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <PageControl total={slideCount} current={current} />
    </div>
  );
}

const ACTIVE_STYLE = ['w-5', 'bg-accessible-400'];
const INACTIVE_STYLE = ['w-1.5', 'bg-neutral-300/30'];

function getDots(canvasElement: HTMLElement) {
  return Array.from(canvasElement.querySelectorAll('[data-slot="page-control-dot"]'));
}

/**
 * 슬라이드 3개짜리 기본 상태입니다. 첫 슬라이드가 선택된 채로 시작합니다.
 *
 * play: 첫 번째 점만 활성인지 확인합니다. (이슈 #134 AC-1)
 */
export const Default: Story = {
  render: (args) => <CarouselWithPageControl {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slides = await canvas.findAllByRole('group');
    const dots = getDots(canvasElement);

    expect(slides).toHaveLength(3);
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveClass(...ACTIVE_STYLE);
    expect(dots[1]).toHaveClass(...INACTIVE_STYLE);
    expect(dots[2]).toHaveClass(...INACTIVE_STYLE);
  },
};

/**
 * 다음 슬라이드로 넘기면 활성 점이 함께 이동합니다. (이슈 #134 AC-2)
 *
 * 프로덕션에서의 조작은 스와이프지만, 포인터 드래그는 관성·임계값 때문에 재현이 불안정해
 * 같은 `scrollNext` 경로를 타는 방향키(→)로 전환을 일으킨다.
 * `Carousel` 루트는 tabIndex가 없어 포커스를 받지 못하므로, 핸들러가 달린
 * 엘리먼트에 keydown을 직접 디스패치한다.
 */
export const NextSlide: Story = {
  render: (args) => <CarouselWithPageControl {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const carousel = canvas.getByRole('region');

    fireEvent.keyDown(carousel, { key: 'ArrowRight' });

    await waitFor(() => {
      const dots = getDots(canvasElement);
      expect(dots[1]).toHaveClass(...ACTIVE_STYLE);
      expect(dots[0]).toHaveClass(...INACTIVE_STYLE);
    });
  },
};

/** 슬라이드가 하나면 점도 하나만 표시되고 활성 상태입니다. (이슈 #134 AC-3) */
export const SingleSlide: Story = {
  args: { slideCount: 1 },
  render: (args) => <CarouselWithPageControl {...args} />,
  play: async ({ canvasElement }) => {
    const dots = getDots(canvasElement);

    expect(dots).toHaveLength(1);
    expect(dots[0]).toHaveClass(...ACTIVE_STYLE);
  },
};
