import type { AuthUserResponse } from '@/shared/api';

export function resolvePostLoginPath(user: AuthUserResponse | undefined): string {
  return user?.onboardingCompleted ? '/home' : '/nickname';
}
