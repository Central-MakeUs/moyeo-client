'use client';

import { usePathname } from 'next/navigation';

import { Progress } from '@/shared/ui';

import { progressPercent, stepFromPath } from '../model/step-config';
import { useStepFlow } from '../model/use-step-flow';

/** 위저드 상단 진행바. 현재 경로의 스텝을 planningType 기준 퍼센트로 채운다. */
export function WizardProgress() {
  const pathname = usePathname();
  const flow = useStepFlow();

  const step = stepFromPath(pathname);

  // 완료 브릿지(created)와 흐름 밖 경로에는 진행바를 렌더하지 않는다.
  if (!step || step === 'created') return null;

  return <Progress value={progressPercent(step, flow)} className="duration-200 ease-in-out" />;
}
