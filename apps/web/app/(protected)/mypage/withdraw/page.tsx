import { BackButton, Button, TopAppBar } from '@/shared/ui';
import { PageHeader } from '@/shared/ui/page-header';
import { WithdrawAlertDialog } from '@/widgets/mypage';

export default function WithdrawPage() {
  return (
    <div className="flex h-dvh w-full flex-col">
      <TopAppBar leading={<BackButton href="/mypage" aria-label="마이페이지로 돌아가기" />} />
      <main className="flex min-h-0 w-full flex-1 flex-col justify-between px-5 py-10">
        <div className="flex flex-col gap-12">
          <PageHeader
            title={
              <>
                모여를 떠나시나요?
                <br />
                너무 아쉬워요...
              </>
            }
            description="언제든 다시 돌아오시기를 기다릴게요."
          />
          <div className="flex w-full flex-col items-center gap-3 rounded-12 bg-neutral-10 px-4 py-[30px] text-neutral-400">
            <span className="text-bold-16">모여를 탈퇴하기 전 확인하세요</span>
            <p className="text-center text-medium-14">
              탈퇴 후 기존 모임에 접근할 수 없고,
              <br /> 내가 만든 모임은 모두 삭제돼요.
              <br /> 탈퇴 이후 모든 데이터는 복구가 불가능해요.
            </p>
          </div>
        </div>
        <WithdrawAlertDialog trigger={<Button fullWidth>회원 탈퇴</Button>} />
      </main>
    </div>
  );
}
