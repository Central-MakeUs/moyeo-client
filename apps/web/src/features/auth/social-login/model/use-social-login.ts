import { startAppleLogin } from './start-apple-login';

export function useSocialLogin(): { startAppleLogin: () => void } {
  return { startAppleLogin };
}
