import { getToken } from '../model/token-storage';
import type { OnboardingRequest, AuthUserResponse } from '../model/types';

// TODO(orval): Orval 미도입으로 인한 임시 인라인 fetch 구현.
// Orval 도입 시 생성된 API 함수로 교체·제거 예정.
export async function putOnboarding(body: OnboardingRequest): Promise<AuthUserResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/onboarding`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}
