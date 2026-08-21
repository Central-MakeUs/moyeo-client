declare module '*.css';

declare module '*.svg' {
  import { FC, SVGProps } from 'react';

  const SvgComponent: FC<SVGProps<SVGSVGElement>>;
  export default SvgComponent;
}

/**
 * 카카오 JS SDK. `<Script src={KAKAO_SDK_URL}>`가 로드되면 window에 붙는다.
 * 타입 패키지가 없어 쓰는 범위만 직접 선언한다.
 */
interface KakaoShareLink {
  webUrl: string;
  mobileWebUrl: string;
}

/**
 * KakaoFeedTemplate에서 실제 사용하는 필드만 추출한다.
 * - 이후 추가가 필요하다면 다음 문서를 참고하여 수정한다.
 *
 * API Schema
 * https://developers.kakao.com/docs/ko/message-template/default#feed-object
 */
interface KakaoFeedTemplate {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    imageWidth?: number;
    imageHeight?: number;
    link: KakaoShareLink;
  };
  buttonTitle?: string;
  buttons?: Array<{
    title: string;
    link: KakaoShareLink;
  }>;
}

/**
 * JavaScript SDK를 사용하는 카카오 API 타입 정의
 *
 * 기본 템플릿으로 메세지 보내기
 *
 * API Schema
 * https://developers.kakao.com/docs/ko/kakaotalk-share/js-link#default-template-msg
 */
interface KakaoSdk {
  init(jsKey: string): void;
  isInitialized(): boolean;
  Share: {
    sendDefault(template: KakaoFeedTemplate): void;
  };
}

interface Window {
  Kakao?: KakaoSdk;
}
