import { NicknameOnboardingForm } from '@/features/onboarding';

export function NicknamePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* TODO(#84): 공용 TopAppBar(뒤로가기 포함)로 교체 예정 */}
      <header className="h-[54px] w-full" />
      <main className="flex flex-1 flex-col gap-12">
        <div className="flex flex-col gap-1 px-5 pt-10">
          <h1 className="text-extrabold-22 text-neutral-900">기본 닉네임을 정해주세요</h1>
          <p className="text-bold-14 text-neutral-600">닉네임은 나중에 변경할 수 있어요</p>
        </div>
        <NicknameOnboardingForm />
      </main>
    </div>
  );
}
