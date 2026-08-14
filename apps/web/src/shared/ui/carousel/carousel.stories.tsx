import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';

import { Carousel, CarouselContent, CarouselItem, CarouselPageControl } from './carousel';

type CarouselStoryArgs = {
  slideCount: number;
};

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
      description: '캐러셀에 넣을 슬라이드 개수',
      table: { defaultValue: { summary: '3' } },
    },
  },
  args: {
    slideCount: 3,
  },
} satisfies Meta<CarouselStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

const ACTIVE_STYLE = ['w-5', 'bg-accessible-400'];
const INACTIVE_STYLE = ['w-1.5', 'bg-neutral-300/30'];

function getDots(canvasElement: HTMLElement) {
  return Array.from(canvasElement.querySelectorAll('[data-slot="page-indicator-dot"]'));
}

/** 슬라이드 3개짜리 기본 상태입니다. 첫 슬라이드가 선택된 채로 시작합니다. */
export const Default: Story = {
  render: ({ slideCount }) => (
    <Carousel className="w-full">
      <CarouselContent>
        {Array.from({ length: slideCount }, (_, index) => (
          <CarouselItem key={index}>
            <div className="flex h-40 items-center justify-center rounded-12 bg-neutral-20 text-semibold-16 text-neutral-700">
              슬라이드 {index + 1}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPageControl />
    </Carousel>
  ),
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

/** 다음 슬라이드로 넘기면 활성 점이 함께 이동합니다. */
export const NextSlide: Story = {
  render: ({ slideCount }) => (
    <Carousel className="w-full">
      <CarouselContent>
        {Array.from({ length: slideCount }, (_, index) => (
          <CarouselItem key={index}>
            <div className="flex h-40 items-center justify-center rounded-12 bg-neutral-20 text-semibold-16 text-neutral-700">
              슬라이드 {index + 1}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPageControl />
    </Carousel>
  ),
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

/** 마지막 슬라이드에서 한 번 더 넘기면 첫 슬라이드로 순환합니다. */
export const LoopsBackToFirstSlide: Story = {
  render: ({ slideCount }) => (
    <Carousel className="w-full">
      <CarouselContent>
        {Array.from({ length: slideCount }, (_, index) => (
          <CarouselItem key={index}>
            <div className="flex h-40 items-center justify-center rounded-12 bg-neutral-20 text-semibold-16 text-neutral-700">
              슬라이드 {index + 1}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPageControl />
    </Carousel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const carousel = canvas.getByRole('region');

    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(getDots(canvasElement)[1]).toHaveClass(...ACTIVE_STYLE);
    });

    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(getDots(canvasElement)[2]).toHaveClass(...ACTIVE_STYLE);
    });

    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    await waitFor(() => {
      const dots = getDots(canvasElement);
      expect(dots[0]).toHaveClass(...ACTIVE_STYLE);
      expect(dots[2]).toHaveClass(...INACTIVE_STYLE);
    });
  },
};

/** 슬라이드가 하나면 점도 하나만 표시되고 활성 상태입니다. */
export const SingleSlide: Story = {
  args: { slideCount: 1 },
  render: ({ slideCount }) => (
    <Carousel className="w-full">
      <CarouselContent>
        {Array.from({ length: slideCount }, (_, index) => (
          <CarouselItem key={index}>
            <div className="flex h-40 items-center justify-center rounded-12 bg-neutral-20 text-semibold-16 text-neutral-700">
              슬라이드 {index + 1}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPageControl />
    </Carousel>
  ),
  play: async ({ canvasElement }) => {
    const dots = getDots(canvasElement);

    expect(dots).toHaveLength(1);
    expect(dots[0]).toHaveClass(...ACTIVE_STYLE);
  },
};
