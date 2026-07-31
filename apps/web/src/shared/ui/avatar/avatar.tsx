import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Avatar as AvatarPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

const avatarVariants = cva(
  [
    // 레이아웃
    'relative inline-flex shrink-0 items-center justify-center overflow-hidden',

    // 모양
    'rounded-full border bg-clip-padding',
  ],
  {
    variants: {
      tone: {
        primary: 'border-accessible-200 bg-accessible-50 text-accessible-400',
        neutral: 'border-neutral-70 bg-neutral-20 text-neutral-70',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
);

/** 아바타 지름(px). */
export type AvatarSize = number;
export type AvatarTone = NonNullable<VariantProps<typeof avatarVariants>['tone']>;

export interface AvatarProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  size?: AvatarSize;
  tone?: AvatarTone;
  /** 프로필 이미지 URL. 없거나 로드에 실패하면 person 폴백 아이콘을 렌더한다. */
  imageUrl?: string;
  /** 이미지 대체 텍스트. imageUrl이 있을 때만 의미를 갖는다. */
  alt?: string;
}

export function Avatar({
  size = 24,
  tone = 'neutral',
  imageUrl,
  alt,
  className,
  style,
  ...props
}: AvatarProps): React.JSX.Element {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      data-tone={tone}
      className={cn(avatarVariants({ tone }), className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      {imageUrl && (
        <AvatarPrimitive.Image
          data-slot="avatar-image"
          src={imageUrl}
          alt={alt}
          className="size-full object-cover"
        />
      )}

      <AvatarPrimitive.Fallback
        data-slot="avatar-fallback"
        className="flex size-full items-center justify-center"
      >
        {/* person.svg 자체 여백이 커서 살짝 확대 후 overflow-hidden으로 잘라낸다. */}
        <Icon name="person" size={Math.round(size * 1.1)} />
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { avatarVariants };
