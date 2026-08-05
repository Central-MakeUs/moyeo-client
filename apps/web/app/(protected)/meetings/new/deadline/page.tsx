'use client';

import { useRouter } from 'next/navigation';

import {
  DeadlineStep,
  nextStep,
  stepToPath,
  useStepFlow,
  useStepGuard,
} from '@/features/meeting/create-meeting';

/**
 * 🚧 마감 기한(CRT-04) — 1차 출시 임시 비활성화.
 *
 * 화면이 약속하는 "마감 전 리마인더 발송"이 아직 구현되지 않아, `getSteps`의 스텝 흐름에서
 * 'deadline'을 빼 두었다(step-config.ts의 `🚧` 주석). 그래서 이 경로는 위저드에서 이어지지
 * 않고, 주소로 직접 들어와도 `useStepGuard`가 흐름 밖 스텝으로 보고 되돌린다.
 *
 * 화면·계산 로직은 그대로 살아 있으므로, 리마인더가 붙으면 step-config의 두 줄을 되살리는
 * 것만으로 이 페이지가 다시 흐름에 들어온다. 여기는 손댈 것이 없다.
 */
export default function CreateMeetingDeadlinePage() {
  const router = useRouter();
  const allowed = useStepGuard('deadline');
  const flow = useStepFlow();

  if (!allowed) return null;

  return (
    <DeadlineStep
      onNext={() => {
        const next = nextStep('deadline', flow);
        if (next) router.push(stepToPath(next));
      }}
    />
  );
}
