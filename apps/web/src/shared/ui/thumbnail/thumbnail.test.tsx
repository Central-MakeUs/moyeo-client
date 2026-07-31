import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Thumbnail } from './thumbnail';

describe('Thumbnail', () => {
  it('imageUrl이 주어지면 해당 src를 가진 img를 렌더한다', () => {
    render(<Thumbnail imageUrl="https://example.com/cover.png" alt="모임 커버" />);

    const img = screen.getByRole('img', { name: '모임 커버' });
    expect(img).toHaveAttribute('src', 'https://example.com/cover.png');
  });

  it('width/height/radius를 지정하면 인라인 style에 그대로 반영된다', () => {
    render(
      <Thumbnail
        imageUrl="https://example.com/cover.png"
        width={120}
        height={80}
        radius={4}
        data-testid="placeholder"
      />
    );

    const root = screen.getByTestId('placeholder');
    expect(root.style.width).toBe('120px');
    expect(root.style.height).toBe('80px');
    expect(root.style.borderRadius).toBe('4px');
  });

  it('width/height/radius를 생략하면 기본값 280/168/10이 적용된다', () => {
    render(<Thumbnail data-testid="placeholder" />);

    const root = screen.getByTestId('placeholder');
    expect(root.style.width).toBe('280px');
    expect(root.style.height).toBe('168px');
    expect(root.style.borderRadius).toBe('10px');
  });

  it('imageUrl이 없으면 플레이스홀더(accessible-50 배경 + moyeo-logo 아이콘)를 렌더하고 img는 렌더하지 않는다', () => {
    render(<Thumbnail data-testid="placeholder" />);

    const root = screen.getByTestId('placeholder');
    const fallback = root.querySelector('[data-slot="thumbnail-fallback"]');
    expect(fallback).toHaveClass('bg-accessible-50');
    expect(root.querySelector('[data-slot="thumbnail-img"]')).not.toBeInTheDocument();
  });

  it('imageUrl 로드가 실패하면(onError) 플레이스홀더로 전환된다', () => {
    render(
      <Thumbnail
        imageUrl="https://example.com/broken.png"
        alt="모임 커버"
        data-testid="placeholder"
      />
    );

    const root = screen.getByTestId('placeholder');
    fireEvent.error(screen.getByRole('img', { name: '모임 커버' }));

    expect(root.querySelector('[data-slot="thumbnail-img"]')).not.toBeInTheDocument();
    expect(root.querySelector('[data-slot="thumbnail-fallback"]')).toBeInTheDocument();
  });

  it('iconSize를 지정하면 플레이스홀더 아이콘 크기에 반영된다', () => {
    render(<Thumbnail iconSize={40} data-testid="placeholder" />);

    const root = screen.getByTestId('placeholder');
    const icon = root.querySelector('[data-slot="icon"]');
    expect(icon).toHaveAttribute('width', '40');
    expect(icon).toHaveAttribute('height', '40');
  });

  it('iconSize를 생략하면 기본값 80이 적용된다', () => {
    render(<Thumbnail data-testid="placeholder" />);

    const root = screen.getByTestId('placeholder');
    const icon = root.querySelector('[data-slot="icon"]');
    expect(icon).toHaveAttribute('width', '80');
    expect(icon).toHaveAttribute('height', '80');
  });

  it('showIcon이 false면 플레이스홀더 아이콘을 렌더하지 않는다', () => {
    render(<Thumbnail showIcon={false} data-testid="placeholder" />);

    const root = screen.getByTestId('placeholder');
    expect(root.querySelector('[data-slot="icon"]')).not.toBeInTheDocument();
  });

  it('showIcon을 생략하면 기본값 true로 아이콘을 렌더한다', () => {
    render(<Thumbnail data-testid="placeholder" />);

    const root = screen.getByTestId('placeholder');
    expect(root.querySelector('[data-slot="icon"]')).toBeInTheDocument();
  });
});
