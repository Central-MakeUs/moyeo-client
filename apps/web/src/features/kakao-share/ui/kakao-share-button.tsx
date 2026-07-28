'use client';

import Script from 'next/script';
import * as React from 'react';

import { Icon } from '@/shared/ui/icon';

import { getKakaoJsKey } from '../model/get-kakao-js-key';
import { shareInviteFeed } from '../model/share-invite-feed';

export function KakaoShareButton(): React.JSX.Element {
  const handleScriptLoad = (): void => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(getKakaoJsKey());
    }
  };

  const handleClick = (): void => {
    try {
      shareInviteFeed();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '카카오톡 공유에 실패했습니다.');
    }
  };

  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
        onLoad={handleScriptLoad}
      />
      <button
        type="button"
        onClick={handleClick}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-8 bg-[#FEE500]"
      >
        <Icon name="kakao" size={18} className="text-black" />
        <span className="text-bold-16 text-black/85">카카오톡 공유 테스트</span>
      </button>
    </>
  );
}
