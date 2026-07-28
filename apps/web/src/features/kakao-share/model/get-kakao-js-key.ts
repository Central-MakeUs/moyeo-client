export function getKakaoJsKey(): string {
  return process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? '';
}
