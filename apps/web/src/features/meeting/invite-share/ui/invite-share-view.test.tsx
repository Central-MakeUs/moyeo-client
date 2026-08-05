import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InviteShareView } from './invite-share-view';

const SHARE_URL = 'https://moyeo.app/i/5UKSN9MC2M';

const renderView = (props?: Partial<React.ComponentProps<typeof InviteShareView>>) =>
  render(
    <InviteShareView
      shareUrl={SHARE_URL}
      onShareSms={vi.fn()}
      onShareKakao={vi.fn()}
      onCopyLink={vi.fn()}
      onGoHome={vi.fn()}
      onBack={vi.fn()}
      {...props}
    />
  );

describe('InviteShareView', () => {
  it('공유 링크를 화면에 보여준다', () => {
    renderView();

    expect(screen.getByText(SHARE_URL)).toBeInTheDocument();
  });

  it('공유 버튼을 탭하면 각 핸들러가 호출된다', async () => {
    const onShareSms = vi.fn();
    const onShareKakao = vi.fn();
    const onCopyLink = vi.fn();
    renderView({ onShareSms, onShareKakao, onCopyLink });

    await userEvent.click(screen.getByRole('button', { name: 'SMS' }));
    await userEvent.click(screen.getByRole('button', { name: '카카오톡' }));
    await userEvent.click(screen.getByRole('button', { name: 'URL 복사' }));

    expect(onShareSms).toHaveBeenCalledTimes(1);
    expect(onShareKakao).toHaveBeenCalledTimes(1);
    expect(onCopyLink).toHaveBeenCalledTimes(1);
  });

  it('홈으로 돌아가기를 탭하면 onGoHome이 호출된다', async () => {
    const onGoHome = vi.fn();
    renderView({ onGoHome });

    await userEvent.click(screen.getByRole('button', { name: '홈으로 돌아가기' }));

    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it('뒤로가기를 탭하면 onBack이 호출된다', async () => {
    const onBack = vi.fn();
    renderView({ onBack });

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('링크가 없으면 안내 문구를 보이고 공유·복사 버튼을 비활성화한다', () => {
    renderView({ shareUrl: null });

    expect(screen.getByText('링크를 불러오지 못했어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SMS' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '카카오톡' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'URL 복사' })).toBeDisabled();
  });

  it('링크가 없어도 홈 이동과 뒤로가기는 쓸 수 있다', () => {
    renderView({ shareUrl: null });

    // 링크를 못 만들었다고 화면에 갇히면 안 된다.
    expect(screen.getByRole('button', { name: '홈으로 돌아가기' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '뒤로가기' })).toBeEnabled();
  });
});
