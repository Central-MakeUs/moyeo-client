declare module '*.css';

declare module '*.svg' {
  import { FC, SVGProps } from 'react';

  const SvgComponent: FC<SVGProps<SVGSVGElement>>;
  export default SvgComponent;
}

interface KakaoShareLink {
  webUrl: string;
  mobileWebUrl: string;
}

interface KakaoFeedTemplate {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: KakaoShareLink;
  };
  buttons?: Array<{
    title: string;
    link: KakaoShareLink;
  }>;
}

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
