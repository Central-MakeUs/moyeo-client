import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';

import CreateMeetingResolverPage from './page';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

describe('모임 생성 진입 경로 결정', () => {
  beforeEach(() => {
    replace.mockClear();
    useCreateMeetingDraft.getState().reset();
  });

  // 유형 선택은 위저드 스텝이 아니라 HOME Drawer다. planningType이 없으면 흐름 자체가 없으므로
  // 위저드에 머물 수 없고 HOME으로 돌려보낸다 (crt-01.md §9-2/§9-3).
  it('모임 유형을 선택하지 않고 진입하면 HOME으로 이동한다', () => {
    render(<CreateMeetingResolverPage />);

    expect(replace).toHaveBeenCalledWith('/home');
  });

  it('기본 정보가 남아 있어도 모임 유형이 없으면 HOME으로 이동한다', () => {
    useCreateMeetingDraft.setState({ name: '주말 등산', maxParticipants: 6, planningType: null });

    render(<CreateMeetingResolverPage />);

    expect(replace).toHaveBeenCalledWith('/home');
  });

  it('모임 유형만 선택하고 기본 정보가 비어 있으면 기본 정보 화면으로 이동한다', () => {
    useCreateMeetingDraft.setState({ planningType: 'SCHEDULE_ONLY' });

    render(<CreateMeetingResolverPage />);

    expect(replace).toHaveBeenCalledWith('/meetings/new/basic');
  });

  it('일정 조율 모임의 기본 정보 입력을 마치면 시간대 설정 화면으로 이동한다', () => {
    useCreateMeetingDraft.setState({
      planningType: 'SCHEDULE_ONLY',
      name: '주말 등산',
      maxParticipants: 6,
    });

    render(<CreateMeetingResolverPage />);

    expect(replace).toHaveBeenCalledWith('/meetings/new/time-range');
  });
});
