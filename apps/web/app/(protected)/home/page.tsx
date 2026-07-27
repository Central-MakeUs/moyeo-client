import Image from 'next/image';

import { PlanningTypeDrawer } from '@/features/meeting/create-meeting';
import Logo from '@/shared/assets/images/logo.png';
import { Icon } from '@/shared/ui/icon';
import { IconButton } from '@/shared/ui/icon-button';

export default function HomePage() {
  return (
    <div className="relative flex h-dvh flex-col bg-white">
      <header className="flex h-[54px] w-full shrink-0 items-center justify-between px-6">
        <Image src={Logo} alt="MOYEO" className="h-auto w-[78px]" priority />

        <button type="button" aria-label="프로필 열기">
          <Icon name="avatar" size={28} />
        </button>
      </header>
      <main className="flex w-full flex-1 flex-col"></main>
      <PlanningTypeDrawer
        trigger={
          <IconButton
            icon="plus"
            aria-label="모임 생성하기"
            variant="default"
            shape="circle"
            className="absolute right-5 bottom-[42px] size-12 shadow-[0px_4px_8px_0px_#F437301A,0px_0px_2px_0px_#F437301A]"
          />
        }
      />
    </div>
  );
}
