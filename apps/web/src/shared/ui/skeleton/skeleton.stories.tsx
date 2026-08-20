import * as React from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Skeleton, type SkeletonTextStyle, type SkeletonTone } from './skeleton';

/**
 * 토큰별 실제 텍스트 클래스. Tailwind는 클래스명을 정적으로 추출하므로
 * `text-` 뒤를 변수로 조립할 수 없어 리터럴로 둔다.
 */
const TEXT_SAMPLES = [
  { textStyle: 'extrabold-22', textClass: 'text-extrabold-22' },
  { textStyle: 'extrabold-20', textClass: 'text-extrabold-20' },
  { textStyle: 'extrabold-18', textClass: 'text-extrabold-18' },
  { textStyle: 'extrabold-16', textClass: 'text-extrabold-16' },
  { textStyle: 'extrabold-14', textClass: 'text-extrabold-14' },
  { textStyle: 'extrabold-10', textClass: 'text-extrabold-10' },
  { textStyle: 'extrabold-8', textClass: 'text-extrabold-8' },
  { textStyle: 'bold-18', textClass: 'text-bold-18' },
  { textStyle: 'bold-16', textClass: 'text-bold-16' },
  { textStyle: 'bold-14', textClass: 'text-bold-14' },
  { textStyle: 'bold-12', textClass: 'text-bold-12' },
  { textStyle: 'semibold-16', textClass: 'text-semibold-16' },
  { textStyle: 'semibold-14', textClass: 'text-semibold-14' },
  { textStyle: 'semibold-12', textClass: 'text-semibold-12' },
  { textStyle: 'medium-16', textClass: 'text-medium-16' },
  { textStyle: 'medium-14', textClass: 'text-medium-14' },
  { textStyle: 'medium-12', textClass: 'text-medium-12' },
] as const satisfies readonly { textStyle: SkeletonTextStyle; textClass: string }[];

const TEXT_STYLE_OPTIONS = TEXT_SAMPLES.map((sample) => sample.textStyle);

/** 시안에서 행간을 `auto`로 둔 토큰. SUIT 실측 배수(1.248)로 높이를 계산한다. */
const AUTO_LINE_HEIGHT_TOKENS = new Set<SkeletonTextStyle>([
  'extrabold-16',
  'extrabold-14',
  'extrabold-8',
]);

/** Controls의 textStyle 기본값. 비워도 자리표시자가 사라지지 않도록 fallback으로도 쓴다. */
const DEFAULT_TEXT_STYLE: SkeletonTextStyle = 'extrabold-22';

/**
 * Controls의 className이 비어 있을 때 쓸 variant별 기본 크기.
 *
 * 하나로 두면 모양을 바꿀 때 어긋난다 — `h-16 w-full`을 circular에 그대로 두면
 * 원이 아니라 납작한 알약이 된다.
 */
const DEFAULT_CLASS_NAME = {
  block: 'h-16 w-full',
  circular: 'size-16',
} as const;

/**
 * 스토리 전용으로 평탄화한 props.
 *
 * `SkeletonProps`는 discriminated union이라 Storybook의 타입 계산에서 두 갈래가 교차하며
 * `never`로 붕괴한다(모든 스토리가 `args` 필수가 되고, 문서 표의 타입이 `unknown`으로 뜬다).
 * Controls는 어차피 조합을 자유롭게 바꿔야 하므로 여기서는 두 prop을 모두 선택형으로 둔다 —
 * 잘못된 조합은 아래 `render`가 정리한다.
 */
type SkeletonStoryProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  variant?: 'block' | 'text' | 'circular';
  textStyle?: SkeletonTextStyle;
  tone?: SkeletonTone;
};

const meta = {
  title: 'Primitives/Skeleton',
  // 평탄화한 props로 바라본 Skeleton. 실제 컴포넌트를 그대로 두어야 문서의 코드 예시가 맞는다.
  component: Skeleton as React.ComponentType<SkeletonStoryProps>,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['block', 'text', 'circular'],
      description:
        '자리표시자의 모양입니다. block=네모난 덩어리(카드·이미지), text=문구 한 줄, circular=원형(프로필 사진·아이콘)',
      table: {
        type: { summary: 'block | text | circular' },
        defaultValue: { summary: 'block' },
      },
    },
    textStyle: {
      control: 'select',
      options: TEXT_STYLE_OPTIONS,
      description:
        '자리를 대신할 문구의 타이포 토큰입니다. 이 값이 높이를 정하므로 실제 문구에 쓰인 토큰과 같은 것을 고릅니다.',
      if: { arg: 'variant', eq: 'text' },
      table: { type: { summary: '타이포 토큰 17개' } },
    },
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'accessible'],
      description:
        '올라갈 면의 색 계열입니다. neutral=흰 면·회색 면, accessible=분홍 면(초대 카드·모임 카드 등). 배경과 색이 가까우면 자리표시자가 보이지 않습니다.',
      table: {
        type: { summary: 'neutral | accessible' },
        defaultValue: { summary: 'neutral' },
      },
    },
    className: {
      control: 'text',
      description:
        '크기를 지정합니다. block은 높이와 너비 모두(h-16 w-full), circular는 지름(size-16)을 줍니다. 비우면 모양에 맞는 기본 크기로 그립니다.',
      // text는 높이를 textStyle이 정하므로 크기를 직접 줄 일이 없다.
      if: { arg: 'variant', neq: 'text' },
      table: { type: { summary: 'Tailwind 클래스' } },
    },
  },
  args: {
    variant: 'block',
    tone: 'neutral',
    textStyle: DEFAULT_TEXT_STYLE,
  },
  /*
   * 컨트롤을 만지는 사람이 빈 화면을 보지 않도록, 비어 있는 값을 모양에 맞는 기본값으로 채운다.
   * text는 textStyle만으로 높이를 확인할 수 있게 크기 클래스를 아예 넘기지 않는다.
   */
  render: ({ variant = 'block', textStyle, className, ...args }) => {
    if (variant === 'text') {
      return <Skeleton {...args} variant="text" textStyle={textStyle ?? DEFAULT_TEXT_STYLE} />;
    }

    const skeleton = (
      <Skeleton {...args} variant={variant} className={className || DEFAULT_CLASS_NAME[variant]} />
    );

    // block·text는 폭을 채우지만 circular는 지름만큼만 차지해 왼쪽에 붙어 보인다.
    return variant === 'circular' ? (
      <div className="flex justify-center">{skeleton}</div>
    ) : (
      skeleton
    );
  },
} satisfies Meta<SkeletonStoryProps>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 실제 화면 폭(360px)에 가깝게 잡아 너비 비율(`w-2/5` 등)이 실물과 비슷하게 보이도록 한다.
 * meta가 아니라 스토리에 다는 이유는, meta 데코레이터는 모든 스토리를 감싸버려
 * 폭이 필요한 대조표까지 320px에 가두기 때문이다.
 */
const mobileWidthDecorator: NonNullable<Story['decorators']> = [
  (Story) => (
    <div className="w-80">
      <Story />
    </div>
  ),
];

/**
 * 오른쪽 **Controls** 에서 모양과 크기를 직접 바꿔볼 수 있습니다.
 *
 * `variant`를 text로 바꾸면 크기 대신 타이포 토큰을 고르는 항목이 나타납니다.
 * text는 높이를 토큰이 정하므로 크기를 직접 줄 필요가 없습니다.
 */
export const Default: Story = {
  name: '기본 (직접 조작해보기)',
  decorators: mobileWidthDecorator,
};

/** 세 가지 모양을 나란히 비교합니다. 어떤 상황에 무엇을 쓰는지 함께 적었습니다. */
export const Variants: Story = {
  name: '모양 세 가지',
  decorators: mobileWidthDecorator,
  render: () => (
    <div className="flex flex-col gap-8">
      <Section title="block" caption="카드·이미지·지도처럼 네모난 덩어리">
        <Skeleton className="h-24 w-full" />
      </Section>

      <Section title="circular" caption="프로필 사진·동그란 아이콘">
        <div className="flex items-center justify-center gap-3">
          <Skeleton variant="circular" className="size-5" />
          <Skeleton variant="circular" className="size-8" />
          <Skeleton variant="circular" className="size-12" />
        </div>
      </Section>

      <Section title="text" caption="문구 한 줄. 너비는 들어올 문구의 대략적인 길이에 맞춘다">
        <div className="flex flex-col gap-2">
          <Skeleton variant="text" textStyle="bold-18" className="w-2/5" />
          <Skeleton variant="text" textStyle="semibold-14" className="w-4/5" />
        </div>
      </Section>
    </div>
  ),
};

/**
 * **자리표시자의 높이가 실제 문구와 같은지 확인하는 표입니다.**
 *
 * 각 줄에서 가운데(실제 텍스트)와 오른쪽(자리표시자)의 높이가 같아야
 * 로딩이 끝날 때 화면이 밀리지 않습니다.
 *
 * 토큰 이름 옆의 빨간 `auto` 표시는 시안에서 행간을 auto로 둔 것들로,
 * 폰트(SUIT)에서 직접 잰 값으로 높이를 계산합니다.
 */
export const TextStyles: Story = {
  name: '타이포 토큰별 높이 대조표',
  parameters: { layout: 'padded' },
  render: () => (
    <div className="grid grid-cols-[9rem_auto_minmax(10rem,1fr)] items-center gap-x-6 gap-y-3">
      <span className="text-bold-12 text-neutral-500">토큰</span>
      <span className="text-bold-12 text-neutral-500">실제 텍스트</span>
      <span className="text-bold-12 text-neutral-500">자리표시자</span>

      {TEXT_SAMPLES.map(({ textStyle, textClass }) => (
        <React.Fragment key={textStyle}>
          <span className="text-medium-12 text-neutral-600">
            {textStyle}
            {AUTO_LINE_HEIGHT_TOKENS.has(textStyle) && (
              <span className="ml-1 text-medium-12 text-primary">auto</span>
            )}
          </span>
          {/* 줄바꿈되면 행 높이가 문구 높이와 달라져 비교가 안 된다. */}
          <span className={`${textClass} whitespace-nowrap text-neutral-800`}>가나다 AaBb 123</span>
          <Skeleton variant="text" textStyle={textStyle} className="w-full" />
        </React.Fragment>
      ))}
    </div>
  ),
};

function Section({
  title,
  caption,
  children,
}: React.PropsWithChildren<{ title: string; caption: string }>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-bold-14 text-neutral-800">{title}</span>
      <span className="text-medium-12 text-neutral-500">{caption}</span>
      <div className="pt-2">{children}</div>
    </div>
  );
}
