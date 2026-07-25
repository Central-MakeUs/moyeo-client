import type { AuthUserResponse } from '@/entities/auth';

export function resolvePostLoginPath(user: AuthUserResponse): string {
  return user.onboardingCompleted ? '/home' : '/nickname';
}
