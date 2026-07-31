import * as React from 'react';
import Image from 'next/image';

import { Icon } from '@/shared/ui/icon';

export interface ThumbnailProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** 실제 이미지 URL. 없거나 로드에 실패하면 플레이스홀더를 보여준다 */
  imageUrl?: string;
  /** 이미지 대체 텍스트. imageUrl이 있을 때만 의미를 갖는다 */
  alt?: string;
  /** 너비(px). 기본 280 */
  width?: number;
  /** 높이(px). 기본 168 */
  height?: number;
  /** 모서리 반경(px). 기본 10 */
  radius?: number;
  /** 플레이스홀더 아이콘 크기(px). 기본 80 */
  iconSize?: number;
  /** 플레이스홀더 아이콘 표시 여부. 기본 true */
  showIcon?: boolean;
}

export function Thumbnail({
  imageUrl,
  alt,
  width = 280,
  height = 168,
  radius = 10,
  iconSize = 80,
  showIcon = true,
  style,
  ...props
}: ThumbnailProps): React.JSX.Element {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      data-slot="thumbnail"
      className="relative overflow-hidden"
      style={{ width, height, borderRadius: radius, ...style }}
      {...props}
    >
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
    </div>
  );
}
