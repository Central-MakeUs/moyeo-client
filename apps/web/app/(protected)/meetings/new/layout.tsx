import type { Metadata } from 'next';

import { TopAppBar } from '@/shared/ui';
import { BackButton, WizardProgress } from '@/features/meeting/create-meeting';

export const metadata: Metadata = {
  title: '모임 만들기',
};

export default function CreateMeetingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-dvh flex-col bg-white">
      <TopAppBar leading={<BackButton />} />
      <WizardProgress />

      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
