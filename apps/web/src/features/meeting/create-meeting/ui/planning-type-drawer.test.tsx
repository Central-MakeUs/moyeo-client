import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { PlanningTypeDrawer } from './planning-type-drawer';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const FAB_LABEL = '모임 생성하기';
const CONFIRM_LABEL = '선택';

type User = ReturnType<typeof userEvent.setup>;

function renderDrawer() {
  return render(
    <PlanningTypeDrawer
      trigger={
        <button type="button" aria-label={FAB_LABEL}>
          +
        </button>
      }
    />
  );
}

/** 트리거(FAB)를 눌러 Drawer를 연다. */
async function openDrawer(user: User) {
  await user.click(screen.getByRole('button', { name: FAB_LABEL }));
  await screen.findByText('일정 정하기');
}

/** 유형 카드를 고르고 `선택`을 눌러 확정한다. */
async function chooseAndConfirm(user: User, title: string) {
  await user.click(screen.getByText(title));
  await user.click(screen.getByRole('button', { name: CONFIRM_LABEL }));
}

describe('PlanningTypeDrawer', () => {
  beforeEach(() => {
    push.mockClear();
    useCreateMeetingDraft.getState().reset();
  });

  it('should open the drawer with 3 type cards when trigger is clicked', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole('button', { name: FAB_LABEL }));

    expect(await screen.findByText('일정 정하기')).toBeInTheDocument();
    expect(screen.getByText('위치 정하기')).toBeInTheDocument();
    expect(screen.getByText('일정 & 위치 정하기')).toBeInTheDocument();
  });

  it('should enable the 선택 button when 일정 정하기 card is selected', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await user.click(screen.getByText('일정 정하기'));

    expect(screen.getByRole('button', { name: CONFIRM_LABEL })).toBeEnabled();
  });

  it("should set draft.planningType to 'SCHEDULE_ONLY' when 선택 is clicked after choosing 일정 정하기", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await chooseAndConfirm(user, '일정 정하기');

    expect(useCreateMeetingDraft.getState().planningType).toBe('SCHEDULE_ONLY');
  });

  it("should call router.push('/meetings/new/basic') when 선택 is clicked", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await chooseAndConfirm(user, '일정 정하기');

    expect(push).toHaveBeenCalledWith('/meetings/new/basic');
  });

  it('should close the drawer when 선택 is clicked', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await chooseAndConfirm(user, '일정 정하기');

    await waitFor(() => expect(screen.queryByText('일정 정하기')).not.toBeInTheDocument());
  });

  it("should set draft.planningType to 'PLACE_ONLY' when 위치 정하기 is chosen and 선택 is clicked", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await chooseAndConfirm(user, '위치 정하기');

    expect(useCreateMeetingDraft.getState().planningType).toBe('PLACE_ONLY');
  });

  it("should set draft.planningType to 'SCHEDULE_AND_PLACE' when 일정 & 위치 정하기 is chosen and 선택 is clicked", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await chooseAndConfirm(user, '일정 & 위치 정하기');

    expect(useCreateMeetingDraft.getState().planningType).toBe('SCHEDULE_AND_PLACE');
  });

  it("should clear the previous draft (name '이전 모임') before saving when 선택 is clicked", async () => {
    const user = userEvent.setup();
    useCreateMeetingDraft.setState({ name: '이전 모임', maxParticipants: 8 });
    renderDrawer();
    await openDrawer(user);

    await chooseAndConfirm(user, '일정 정하기');

    const draft = useCreateMeetingDraft.getState();
    expect(draft.name).toBe('');
    expect(draft.maxParticipants).toBeNull();
    expect(draft.planningType).toBe('SCHEDULE_ONLY');
  });

  it("should render the CTA label as '선택'", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await openDrawer(user);

    expect(screen.getByRole('button', { name: CONFIRM_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument();
  });

  it('should disable the 선택 button when no card is selected right after opening', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await openDrawer(user);

    expect(screen.getByRole('button', { name: CONFIRM_LABEL })).toBeDisabled();
  });

  it('should keep only 위치 정하기 selected when it is tapped after 일정 정하기', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await user.click(screen.getByText('일정 정하기'));
    await user.click(screen.getByText('위치 정하기'));

    expect(screen.getByRole('radio', { name: /^위치 정하기/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /^일정 정하기/ })).not.toBeChecked();
  });

  it('should show no selected card when the drawer is reopened after closing without 선택', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);
    await user.click(screen.getByText('일정 정하기'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('일정 정하기')).not.toBeInTheDocument());

    await openDrawer(user);

    expect(screen.getByRole('radio', { name: /^일정 정하기/ })).not.toBeChecked();
    expect(screen.getByRole('button', { name: CONFIRM_LABEL })).toBeDisabled();
  });

  it('should not render a progressbar', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await openDrawer(user);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should keep draft.planningType null when the drawer is closed with Escape after selecting a card', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await user.click(screen.getByText('일정 정하기'));
    await user.keyboard('{Escape}');

    expect(useCreateMeetingDraft.getState().planningType).toBeNull();
  });

  it('should not call router.push when the drawer is closed without pressing 선택', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await user.click(screen.getByText('일정 정하기'));
    await user.keyboard('{Escape}');

    expect(push).not.toHaveBeenCalled();
  });
});
