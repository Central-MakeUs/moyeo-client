import { KakaoShareButton } from '@/features/kakao-share';
import { SmsShareButton } from '@/features/sms-share';

export default function HomePage() {
  return (
    <main className="flex flex-col gap-4 p-5">
      <p>HOME-01 placeholder</p>
      <KakaoShareButton />
      <SmsShareButton />
    </main>
  );
}
