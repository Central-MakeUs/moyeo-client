'use client';

import { usePathname } from 'next/navigation';

import { Progress } from '@/shared/ui';

import { getSteps, progressPercent, stepFromPath } from '../model/step-config';
import { useStepFlow } from '../model/use-step-flow';

export function WizardProgress() {
  const pathname = usePathname();
  const flow = useStepFlow();

  const step = stepFromPath(pathname);

  if (!step || step === 'created') return null;

  if (getSteps(flow).length === 0) return null;

  return <Progress value={progressPercent(step, flow)} />;
}
