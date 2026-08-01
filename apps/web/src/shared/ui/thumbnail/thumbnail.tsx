import * as React from 'react';
import Image from 'next/image';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

export interface ThumbnailProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** 실제 이미지 URL. 없거나 로드에 실패하면 플레이스홀더를 보여준다 */
  imageUrl?: string;
  /** 이미지 대체 텍스트. imageUrl이 있을 때만 의미를 갖는다 */
  alt?: string;
  /** 플레이스홀더 아이콘 크기(px). 기본 80 */
  iconSize?: number;
  /** 플레이스홀더 아이콘 표시 여부. 기본 true */
  showIcon?: boolean;
  /** 이미지 위 블랙 20% 오버레이 표시 여부. 기본 false */
  overlay?: boolean;
}

export function Thumbnail({
  imageUrl,
  alt,
  iconSize = 80,
  showIcon = true,
  overlay = false,
  className,
  ...props
}: ThumbnailProps): React.JSX.Element {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div data-slot="thumbnail" className={cn('relative overflow-hidden', className)} {...props}>
      {imageUrl && !hasError ? (
        <Image
          data-slot="thumbnail-img"
          src={imageUrl}
          alt={alt ?? ''}
          fill
          unoptimized
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          data-slot="thumbnail-fallback"
          className="flex size-full items-center justify-center bg-accessible-50"
        >
          {showIcon && <Icon name="moyeo-logo-placeholder" size={iconSize} />}
        </div>
      )}
      {overlay && <div data-slot="thumbnail-overlay" className="absolute inset-0 bg-black/20" />}
    </div>
  );
}
