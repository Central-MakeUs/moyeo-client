import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MeetingCover } from './meeting-cover';

describe('MeetingCover', () => {
  it('뒤로가기 버튼을 누르면 onBack이 호출된다', async () => {
    const onBack = vi.fn();
    render(<MeetingCover onBack={onBack} />);

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('coverImageUrl 없이 렌더하면 기본 플레이스홀더 커버가 표시된다', () => {
    render(<MeetingCover onBack={vi.fn()} />);

    expect(document.querySelector('[data-slot="thumbnail-fallback"]')).toBeInTheDocument();
  });

  it('coverImageUrl="https://example.com/cover.jpg"로 렌더하면 해당 이미지가 표시된다', () => {
    render(<MeetingCover coverImageUrl="https://example.com/cover.jpg" onBack={vi.fn()} />);

    const img = document.querySelector('[data-slot="thumbnail-img"]');
    expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });
});
