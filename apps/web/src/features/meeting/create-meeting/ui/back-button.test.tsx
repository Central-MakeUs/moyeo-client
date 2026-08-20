import { readFileSync } from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { runBackHandlers, useSubmissionLock } from '@/shared/model';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { BackButton } from './back-button';

const { back, push, replace, pathname } = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  pathname: { current: '/meetings/new/basic' },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back, push, replace }),
  usePathname: () => pathname.current,
}));

/** 현재 경로를 바꾼다. BackButton은 경로로 현재 스텝을 판단한다. */
function setPathname(next: string) {
  pathname.current = next;
}

async function clickBack() {
  await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }));
}

describe('위저드 뒤로가기 버튼', () => {
  beforeEach(() => {
    back.mockClear();
    push.mockClear();
    replace.mockClear();
    setPathname('/meetings/new/basic');
    useSubmissionLock.getState().unlock();
    useCreateMeetingDraft.getState().reset();
  });

  it("should reset the draft and call router.replace('/home') when the current step is 'basic'", async () => {
    useCreateMeetingDraft.setState({ planningType: 'SCHEDULE_ONLY', name: '주말 등산' });
    render(<BackButton />);

    await clickBack();

    expect(useCreateMeetingDraft.getState().name).toBe('');
    expect(useCreateMeetingDraft.getState().planningType).toBeNull();
    expect(replace).toHaveBeenCalledWith('/home');
  });

  // 🚧 마감 기한 스텝 임시 비활성화로, 중간 스텝 예시를 'deadline' 대신 'time-range'로 든다.
  //   (재활성화 시 'deadline' → '/meetings/new/time-range' 케이스로 되돌린다)
  it("should call router.push('/meetings/new/basic') when the current step is 'time-range' with SCHEDULE_ONLY", async () => {
    useCreateMeetingDraft.setState({
      planningType: 'SCHEDULE_ONLY',
      scheduleInputType: 'DATE_AND_TIME',
    });
    setPathname('/meetings/new/time-range');
    render(<BackButton />);

    await clickBack();

    expect(push).toHaveBeenCalledWith('/meetings/new/basic');
  });

  it("should reset the draft and call router.replace('/home') when the pathname is not a wizard step", async () => {
    useCreateMeetingDraft.setState({ planningType: 'SCHEDULE_ONLY', name: '주말 등산' });
    setPathname('/meetings/new/unknown');
    render(<BackButton />);

    await clickBack();

    expect(useCreateMeetingDraft.getState().name).toBe('');
    expect(replace).toHaveBeenCalledWith('/home');
  });

  it('should not call router.back() when clicked (history 비의존)', async () => {
    useCreateMeetingDraft.setState({ planningType: 'SCHEDULE_ONLY' });
    render(<BackButton />);

    await clickBack();

    expect(back).not.toHaveBeenCalled();
  });

  it("App Router용 'next/navigation'의 useRouter를 사용한다", () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/features/meeting/create-meeting/ui/back-button.tsx'),
      'utf-8'
    );

    expect(source).not.toContain("'next/router'");
    expect(source).toContain("'next/navigation'");
  });

  it('제출 중에는 뒤로가기 버튼이 잠긴다', () => {
    useSubmissionLock.getState().lock();
    render(<BackButton />);

    expect(screen.getByRole('button', { name: '뒤로가기' })).toBeDisabled();
  });

  it('제출 중에는 하드웨어 뒤로가기가 위저드를 벗어나지 않는다', () => {
    useSubmissionLock.getState().lock();
    render(<BackButton />);

    expect(runBackHandlers()).toBe(true);
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
