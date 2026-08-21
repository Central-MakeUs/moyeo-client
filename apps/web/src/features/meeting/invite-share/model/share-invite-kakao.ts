import {
  INVITE_SHARE_MESSAGE,
  getInviteShareImageUrl,
  createInviteShareTitle,
} from './create-invite-share-message';

/**
 * `26.04.09`버전의 카카오 JS SDK
 * - `KakaoShareButton`이 붙인 스크립트가 로드되면 window에 생긴다.
 *
 * @see https://developers.kakao.com/docs/ko/javascript/download
 */
export const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js';

export function getKakaoJsKey(): string {
  return process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? '';
}

/**
 * 카카오 `JavaScript SDK`를 초기화한다.
 *
 * SDK가 로드되어 있고 아직 초기화되지 않은 경우에만
 * `Kakao.init()`을 호출한다.
 *
 * @see https://developers.kakao.com/docs/ko/javascript/getting-started#init
 */
export function initKakao(): void {
  const kakao = window.Kakao;
  const jsKey = getKakaoJsKey();

  if (!kakao || jsKey.length === 0 || kakao.isInitialized()) return;

  // JavaScript SDK 초기화 함수 호출
  kakao.init(jsKey);
}

export interface ShareInviteKakaoParams {
  /** 공유할 절대 URL. */
  shareUrl: string;
  /** 링크를 실제로 공유한 현재 사용자의 닉네임. */
  senderNickname: string;
}

/**
 * 초대 정보를 기본 피드 템플릿으로 구성해 카카오톡 공유 시트를 연다.
 *
 * 카카오 JavaScript SDK가 초기화되지 않은 경우 공유 시트를 열지 않고 `false`를 반환한다.
 * `true`는 공유 시트 호출을 요청했음을 의미하며, 실제 메시지 전송 완료를 보장하지 않는다.
 *
 * @see https://developers.kakao.com/docs/ko/kakaotalk-share/js-link
 */
export function shareInviteKakao({ shareUrl, senderNickname }: ShareInviteKakaoParams): boolean {
  const kakao = window.Kakao;
  if (!kakao?.isInitialized()) return false;

  const link = { webUrl: shareUrl, mobileWebUrl: shareUrl };

  kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: `${createInviteShareTitle(senderNickname)}💌`,
      description: INVITE_SHARE_MESSAGE,
      imageUrl: getInviteShareImageUrl(),
      imageWidth: 1200,
      imageHeight: 630,
      link,
    },
    buttonTitle: '초대장 보기',
  });

  return true;
}
