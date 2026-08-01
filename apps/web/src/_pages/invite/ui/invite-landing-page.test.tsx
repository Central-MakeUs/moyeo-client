import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { MeetingInvitation } from '@/entities/meeting';

import { InviteLandingPage } from './invite-landing-page';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

// 세션 상태별 분기 검증은 #147 몫이라 여기서는 anonymous로 고정한다.
vi.mock('@/entities/session', () => ({
  useSession: () => ({ status: 'anonymous' }),
}));

const INVITATION: MeetingInvitation = {
  name: '데모데이에 모여',
  description: '부산 BEXCO에서 열리는 데모데이에 초대합니다',
  hostNickname: '소미',
};

const renderPage = (invitation: MeetingInvitation | null = INVITATION) =>
  render(<InviteLandingPage inviteCode="ABC123" invitation={invitation} />);

describe('InviteLandingPage', () => {
  it('name·description·hostNickname이 모두 있는 초대를 렌더하면 세 값이 화면에 있다', () => {
    renderPage();

    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.getByText('부산 BEXCO에서 열리는 데모데이에 초대합니다')).toBeInTheDocument();
    expect(screen.getByText('소미')).toBeInTheDocument();
  });

  it('유효한 초대를 렌더하면 모임 초대장이 왔어요! 헤더와 모임 참여하기 버튼이 화면에 있다', () => {
    renderPage();

    expect(screen.getByText('모임 초대장이 왔어요!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeInTheDocument();
  });

  it('최초 렌더 직후 본문은 그려지고 이번에만 게스트로 참여하기 버튼은 화면에 없다', () => {
    renderPage();

    // 본문 존재를 함께 단언한다. 화면이 통째로 비어도 "Drawer가 닫혀 있다"는
    // 만족되므로, 부재 단언만 두면 초기 렌더 공백 회귀를 잡지 못한다.
    expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeInTheDocument();
    // Drawer가 열렸는지를 내부 상태가 아니라 사용자가 보는 것으로 판정한다.
    expect(screen.queryByText('이번에만 게스트로 참여하기')).not.toBeInTheDocument();
  });

  it('유효한 초대를 렌더하면 진행상황 확인하기 버튼이 화면에 있고 disabled 상태다', () => {
    renderPage();

    // VIEW-01이 아직 없어 목적지가 없다(prd.md §4).
    expect(screen.getByRole('button', { name: '진행상황 확인하기' })).toBeDisabled();
  });

  it('description이 null인 초대를 렌더하면 설명 문단이 없고 모임명과 모임장은 남는다', () => {
    renderPage({ ...INVITATION, description: null });

    expect(
      screen.queryByText('부산 BEXCO에서 열리는 데모데이에 초대합니다')
    ).not.toBeInTheDocument();
    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.getByText('소미')).toBeInTheDocument();
  });

  it('hostNickname이 null인 초대를 렌더하면 소미가 없고 모임명과 설명은 남는다', () => {
    renderPage({ ...INVITATION, hostNickname: null });

    expect(screen.queryByText('소미')).not.toBeInTheDocument();
    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.getByText('부산 BEXCO에서 열리는 데모데이에 초대합니다')).toBeInTheDocument();
  });

  it('description과 hostNickname이 모두 null이면 데모데이에 모여 한 줄만 남은 카드가 렌더된다', () => {
    renderPage({ ...INVITATION, description: null, hostNickname: null });

    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(
      screen.queryByText('부산 BEXCO에서 열리는 데모데이에 초대합니다')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('소미')).not.toBeInTheDocument();
  });

  it('invitation이 null이면 초대 카드는 없고 헤더와 모임 참여하기 버튼은 남는다', () => {
    renderPage(null);

    expect(screen.queryByText('데모데이에 모여')).not.toBeInTheDocument();
    // 404 전용 화면은 #145 몫이라, 여기서는 카드만 생략하고 골격은 유지한다.
    expect(screen.getByText('모임 초대장이 왔어요!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeInTheDocument();
  });
});
