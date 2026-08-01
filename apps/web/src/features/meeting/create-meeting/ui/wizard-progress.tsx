'use client';

import { usePathname } from 'next/navigation';

import { Progress } from '@/shared/ui';

import { getSteps, progressPercent, stepFromPath } from '../model/step-config';
import { useStepFlow } from '../model/use-step-flow';

/** 위저드 상단 진행바. 현재 경로의 스텝을 planningType 기준 퍼센트로 채운다. */
export function WizardProgress() {
  const pathname = usePathname();
  const flow = useStepFlow();

  const step = stepFromPath(pathname);

  // 완료 브릿지(created)와 흐름 밖 경로에는 진행바를 렌더하지 않는다.
  if (!step || step === 'created') return null;

  // 유형이 없으면 흐름 자체가 없다. 뒤로가기로 위저드를 벗어날 때 draft가 먼저 비워지는데,
  // 경로는 아직 스텝이라 진행바가 100%로 잠깐 보이는 것을 막는다.
  if (getSteps(flow).length === 0) return null;

  return <Progress value={progressPercent(step, flow)} />;
}
