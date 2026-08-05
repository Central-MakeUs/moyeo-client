import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Avatar } from './avatar';

/**
 * jsdom은 이미지를 실제로 로드하지 않아 `complete`가 계속 false다. Radix `Avatar.Image`는
 * `complete && naturalWidth > 0` 일 때만 <img>를 렌더하므로, 목 없이는 이미지가 영영 안 나온다.
 * src에 'broken'이 포함되면 로드 실패(naturalWidth 0)로 취급해 폴백 전환을 검증할 수 있게 한다.
 */
class MockImage {
  complete = false;
  naturalWidth = 0;

  private listeners = new Map<string, Set<() => void>>();
  private currentSrc = '';

  addEventListener(type: string, listener: () => void): void {
    const bucket = this.listeners.get(type) ?? new Set();
    bucket.add(listener);
    this.listeners.set(type, bucket);
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  get src(): string {
    return this.currentSrc;
  }

  set src(value: string) {
    this.currentSrc = value;
    this.complete = true;
    this.naturalWidth = value.includes('broken') ? 0 : 1;
  }
}

const OriginalImage = window.Image;

beforeEach(() => {
  window.Image = MockImage as unknown as typeof window.Image;
});

afterEach(() => {
  window.Image = OriginalImage;
});

describe('Avatar', () => {
  it('should set data-tone to neutral when tone is neutral', () => {
    render(<Avatar tone="neutral" size={24} data-testid="avatar" />);

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-tone', 'neutral');
  });

  it('should set data-tone to primary when tone is primary', () => {
    render(<Avatar tone="primary" size={24} data-testid="avatar" />);

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-tone', 'primary');
  });

  it('should render img with given src when imageUrl is provided and the image loads', () => {
    render(<Avatar imageUrl="https://example.com/p.jpg" alt="모여조 프로필" />);

    expect(screen.getByRole('img', { name: '모여조 프로필' })).toHaveAttribute(
      'src',
      'https://example.com/p.jpg'
    );
  });

  it('should apply width and height in px matching the given size', () => {
    const { rerender } = render(<Avatar size={20} data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveStyle({ width: '20px', height: '20px' });

    rerender(<Avatar size={28} data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveStyle({ width: '28px', height: '28px' });
  });

  it('should apply width and height for a size outside the original 20/24/28 set', () => {
    render(<Avatar size={32} data-testid="avatar" />);

    expect(screen.getByTestId('avatar')).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('should render person fallback icon and no img when imageUrl is omitted', () => {
    render(<Avatar data-testid="avatar" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('avatar').querySelector('[data-slot="icon"]')).toBeInTheDocument();
  });

  it('should render person fallback icon and no img when the image fails to load', () => {
    render(
      <Avatar imageUrl="https://example.com/broken.jpg" alt="모여조 프로필" data-testid="avatar" />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('avatar').querySelector('[data-slot="icon"]')).toBeInTheDocument();
  });
});
