import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MeetingCard } from './meeting-card';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('MeetingCard', () => {
  it('title="데모데이에 모여" capacity={5} joinedCount={3} coverImageUrl 없이 렌더하면 제목, "3/5명 참여중" 텍스트, 기본 플레이스홀더 커버가 표시된다', () => {
    render(
      <MeetingCard
        meetingId={1}
        inviteCode="29NRVBGXGP"
        title="데모데이에 모여"
        capacity={5}
        joinedCount={3}
      />
    );

    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    // 참여 인원과 "/N명 참여중"이 별도 span으로 나뉘어 있어 getByText로는 못 잡는다.
    expect(document.body).toHaveTextContent('3/5명 참여중');
    expect(document.querySelector('[data-slot="thumbnail-fallback"]')).toBeInTheDocument();
  });

  it('coverImageUrl="https://example.com/cover.jpg"로 렌더하면 해당 이미지가 커버 영역에 표시된다(플레이스홀더 아님)', () => {
    render(
      <MeetingCard
        meetingId={1}
        inviteCode="29NRVBGXGP"
        title="데모데이에 모여"
        capacity={5}
        joinedCount={3}
        coverImageUrl="https://example.com/cover.jpg"
      />
    );

    const img = document.querySelector('[data-slot="thumbnail-img"]');
    expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
    expect(document.querySelector('[data-slot="thumbnail-fallback"]')).not.toBeInTheDocument();
  });

  it('inviteCode="ABCDE12345"로 렌더된 카드를 탭하면 router.push가 /meetings?code=ABCDE12345로 호출된다', async () => {
    push.mockClear();
    render(
      <MeetingCard
        meetingId={42}
        inviteCode="ABCDE12345"
        title="데모데이에 모여"
        capacity={5}
        joinedCount={3}
      />
    );

    await userEvent.click(screen.getByRole('button'));

    expect(push).toHaveBeenCalledWith('/meetings?code=ABCDE12345');
  });
});
