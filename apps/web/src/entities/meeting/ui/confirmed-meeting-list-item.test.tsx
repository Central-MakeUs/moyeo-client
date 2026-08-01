import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmedMeetingListItem } from './confirmed-meeting-list-item';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('ConfirmedMeetingListItem', () => {
  it('confirmedDate="2026-07-18" confirmedStartTime="14:00" place="공덕역"로 렌더하면 제목, "2026년 7월 18일 14시", "공덕역", 기본 플레이스홀더 썸네일이 표시된다', () => {
    render(
      <ConfirmedMeetingListItem
        title="CMC UT데이 (모여조)"
        confirmedDate="2026-07-18"
        confirmedStartTime="14:00"
        place="공덕역"
      />
    );

    expect(screen.getByText('CMC UT데이 (모여조)')).toBeInTheDocument();
    expect(screen.getByText('2026년 7월 18일 14시')).toBeInTheDocument();
    expect(screen.getByText('공덕역')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="thumbnail-fallback"]')).toBeInTheDocument();
  });

  it('confirmedStartTime 없이(DATE_ONLY) 렌더하면 "2026년 7월 18일"만 표시되고 시각은 표시되지 않는다', () => {
    render(
      <ConfirmedMeetingListItem
        title="CMC UT데이 (모여조)"
        confirmedDate="2026-07-18"
        place="공덕역"
      />
    );

    expect(screen.getByText('2026년 7월 18일')).toBeInTheDocument();
    expect(screen.queryByText('2026년 7월 18일 14시')).not.toBeInTheDocument();
  });

  it('카드를 클릭해도 router.push가 호출되지 않는다(탭 핸들러 없음)', async () => {
    push.mockClear();
    const { container } = render(
      <ConfirmedMeetingListItem
        title="CMC UT데이 (모여조)"
        confirmedDate="2026-07-18"
        place="공덕역"
      />
    );

    await userEvent.click(container.firstChild as Element);

    expect(push).not.toHaveBeenCalled();
  });
});
