import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { BasicStep } from './basic-step';

const NAME_PLACEHOLDER = '모임 이름을 입력해주세요';

describe('BasicStep', () => {
  beforeEach(() => {
    // 인원은 필수이므로 이름을 검증하는 테스트의 기준선으로 유효값(6)을 둔다.
    useCreateMeetingDraft.setState({ name: '', description: '', maxParticipants: 6 });
  });

  it("should update draft.name to '주말 등산' when user types '주말 등산' in the name field", async () => {
    render(<BasicStep onNext={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), '주말 등산');

    expect(useCreateMeetingDraft.getState().name).toBe('주말 등산');
  });

  it("should enable the 다음 button when name is '주말 등산' and maxParticipants is set", () => {
    useCreateMeetingDraft.setState({ name: '주말 등산' });

    render(<BasicStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it('should call onNext once when 다음 button is clicked with valid name and participants', async () => {
    const onNext = vi.fn();
    useCreateMeetingDraft.setState({ name: '주말 등산' });
    render(<BasicStep onNext={onNext} />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("should keep the 다음 button disabled when name is '' (empty)", () => {
    useCreateMeetingDraft.setState({ name: '' });

    render(<BasicStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it("should keep the 다음 button disabled when name is '   ' (whitespace only)", () => {
    useCreateMeetingDraft.setState({ name: '   ' });

    render(<BasicStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it("should enable the 다음 button when name is a single character '산'", () => {
    useCreateMeetingDraft.setState({ name: '산' });

    render(<BasicStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it('should keep the 다음 button disabled when maxParticipants is null even with a valid name', () => {
    useCreateMeetingDraft.setState({ name: '주말 등산', maxParticipants: null });

    render(<BasicStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('should keep the 다음 button disabled when name exceeds 15 characters', () => {
    useCreateMeetingDraft.setState({ name: 'ㄱ'.repeat(16) });

    render(<BasicStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it("should not call onNext when 다음 button is clicked while name is '' (disabled)", async () => {
    const onNext = vi.fn();
    useCreateMeetingDraft.setState({ name: '' });
    render(<BasicStep onNext={onNext} />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(onNext).not.toHaveBeenCalled();
  });

  it("should show '모임 이름을 입력해주세요' error when name is whitespace only", () => {
    useCreateMeetingDraft.setState({ name: '   ' });

    render(<BasicStep onNext={vi.fn()} />);

    expect(screen.getByText('모임 이름을 입력해주세요')).toBeInTheDocument();
  });

  it("should show '최대 15자까지 입력할 수 있어요' error when name exceeds 15 characters", () => {
    useCreateMeetingDraft.setState({ name: 'ㄱ'.repeat(16) });

    render(<BasicStep onNext={vi.fn()} />);

    expect(screen.getByText('최대 15자까지 입력할 수 있어요')).toBeInTheDocument();
  });

  it('모임 설명이 50자를 초과하면 최대 글자 수 에러를 표시한다', () => {
    useCreateMeetingDraft.setState({ name: '주말 등산', description: 'ㄱ'.repeat(51) });

    render(<BasicStep onNext={vi.fn()} />);

    expect(screen.getByText('최대 50자까지 입력할 수 있어요')).toBeInTheDocument();
  });

  it('should open the participants picker drawer when the participants field is tapped', async () => {
    const user = userEvent.setup();
    render(<BasicStep onNext={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /참여 인원수/ }));

    expect(await screen.findByText('참여 인원 선택')).toBeInTheDocument();
  });

  it("should show '6명' and set draft.maxParticipants to 6 when 6 is picked and 선택 is clicked", async () => {
    const user = userEvent.setup();
    useCreateMeetingDraft.setState({ maxParticipants: null });
    render(<BasicStep onNext={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /참여 인원수/ }));
    await screen.findByText('참여 인원 선택');
    await user.click(screen.getByText('6명'));
    await user.click(screen.getByRole('button', { name: '선택' }));

    expect(useCreateMeetingDraft.getState().maxParticipants).toBe(6);
    expect(screen.getByRole('button', { name: /6명/ })).toBeInTheDocument();
  });

  it("should show the previously entered name '주말 등산' when the step is remounted", () => {
    useCreateMeetingDraft.setState({ name: '주말 등산', maxParticipants: 6 });
    const { unmount } = render(<BasicStep onNext={vi.fn()} />);
    unmount();

    render(<BasicStep onNext={vi.fn()} />);

    expect(screen.getByPlaceholderText(NAME_PLACEHOLDER)).toHaveValue('주말 등산');
  });
});
