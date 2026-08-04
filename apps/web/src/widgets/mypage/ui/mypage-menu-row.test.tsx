import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MypageMenuButton, MypageMenuLink } from './mypage-menu-row';

describe('MypageMenuButton', () => {
  it('라벨을 가진 버튼으로 읽힌다', () => {
    render(<MypageMenuButton icon="log-out" label="로그아웃" />);

    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });

  it('받은 props를 root로 흘려보낸다', async () => {
    // Drawer/AlertDialog Trigger의 `asChild` 대상이므로 onClick이 전달돼야 한다.
    const onClick = vi.fn();
    render(<MypageMenuButton icon="feedback" label="피드백 보내기" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: '피드백 보내기' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('MypageMenuLink', () => {
  it('라벨과 목적지를 가진 링크로 읽힌다', () => {
    render(<MypageMenuLink href="/legal/terms" icon="circle-information" label="이용약관" />);

    expect(screen.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/legal/terms');
  });

  it('링크 안에 버튼을 중첩하지 않는다', () => {
    // <a> 안의 <button>은 유효하지 않은 HTML이고 스크린리더에서 이중 컨트롤로 읽힌다.
    render(<MypageMenuLink href="/mypage/withdraw" icon="ban" label="회원탈퇴" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
