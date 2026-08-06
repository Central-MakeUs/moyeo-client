'use client';

import { useSession } from '@/entities/session';
import { Avatar, BackButton, TopAppBar } from '@/shared/ui';
import { IconButton } from '@/shared/ui/icon-button';
import {
  EditNicknameDrawer,
  LogoutAlertDialog,
  MypageMenuButton,
  MypageMenuLink,
  SubmitFeedbackDrawer,
} from '@/widgets/mypage';

export default function MyPage() {
  const session = useSession();

  // ProtectedGuard 이후 렌더링 되므로 authenticated지만, 타입을 좁히기 위해 작성
  if (session.status !== 'authenticated') return null;

  return (
    <div className="flex min-h-dvh w-full flex-col bg-neutral-10">
      <TopAppBar leading={<BackButton href="/home" aria-label="홈으로 돌아가기" />} />
      <main className="flex min-h-0 flex-1 flex-col px-5">
        <div className="flex flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center gap-[14px] pt-6 pb-4">
            <Avatar size={84} />
            <div className="flex items-center gap-1.5">
              <span className="text-bold-16 text-neutral-850">
                {session.viewer.nickname ?? '닉네임'}
              </span>
              <EditNicknameDrawer
                currentNickname={session.viewer.nickname ?? ''}
                trigger={<IconButton aria-label="닉네임 편집" icon="edit" iconSize={16} />}
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-12 bg-white px-4 py-[14px]">
            <span className="text-bold-14 text-neutral-400">도움말</span>
            <ul className="flex flex-col gap-5">
              <li className="w-full">
                <SubmitFeedbackDrawer
                  trigger={<MypageMenuButton icon="feedback" label="피드백 보내기" />}
                />
              </li>
              <li className="w-full">
                <MypageMenuLink href="/legal/privacy" icon="lock" label="개인정보처리방침" />
              </li>
              <li className="w-full">
                <MypageMenuLink href="/legal/terms" icon="circle-information" label="이용약관" />
              </li>
            </ul>
          </div>
          <div className="flex w-full flex-col gap-3 rounded-12 bg-white px-4 py-[14px]">
            <ul className="flex flex-col gap-5">
              <li className="w-full">
                <LogoutAlertDialog trigger={<MypageMenuButton icon="log-out" label="로그아웃" />} />
              </li>
              <li className="w-full">
                <MypageMenuLink href="/mypage/withdraw" icon="ban" label="회원탈퇴" />
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
