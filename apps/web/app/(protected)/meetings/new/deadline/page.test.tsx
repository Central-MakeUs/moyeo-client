import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';

import CreateMeetingDeadlinePage from './page';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

describe('CreateMeetingDeadlinePage', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    // 위치 계열: deadline 선행 스텝(basic·type)만 충족하면 진입 가능.
    useCreateMeetingDraft.setState({
      name: '주말 등산',
      maxParticipants: 6,
      planningType: 'PLACE_ONLY',
      deadlineMinutes: null,
      noDeadline: false,
    });
  });

  // 🚧 마감 기한(CRT-04) 임시 비활성화 — 스텝 흐름에서 빠져 이 경로는 진입할 수 없다.
  //   재활성화하면 이 테스트를 지우고 아래 주석 처리된 원래 테스트를 되살린다.
  it('마감 기한 스텝이 비활성화된 동안에는 화면을 그리지 않고 흐름 안으로 되돌린다', () => {
    const { container } = render(<CreateMeetingDeadlinePage />);

    expect(container).toBeEmptyDOMElement();
    // 되돌아갈 곳은 가드가 아니라 resolveEntryPath가 정한다 = 아직 못 채운 첫 스텝(출발지).
    expect(replace).toHaveBeenCalledWith('/meetings/new/departure');
    expect(push).not.toHaveBeenCalled();
  });

  // 🚧 마감 기한 재활성화 시 되살릴 테스트.
  // TODO(cover): cover 재삽입 시 deadline 다음 목적지는 다시 '/meetings/new/cover'가 된다.
  // it("should push '/meetings/new/created' when 다음 is clicked with a valid deadline (cover deferred)", async () => {
  //   useCreateMeetingDraft.setState({ deadlineMinutes: 1440 });
  //   render(<CreateMeetingDeadlinePage />);
  //
  //   await userEvent.click(screen.getByRole('button', { name: '다음' }));
  //
  //   expect(push).toHaveBeenCalledWith('/meetings/new/created');
  // });
});
