'use client';

import { useEffect } from 'react';

import Clarity from '@microsoft/clarity';

import { isNativeContext } from '@/shared/model';

/** 개발 환경의 StrictMode에서도 Clarity를 한 번만 초기화한다. */
let hasInitialized = false;

/**
 * Microsoft Clarity 초기화
 *
 * `NEXT_PUBLIC_CLARITY_ID`가 없으면 실행하지 않아 로컬·프리뷰 조작이 운영 데이터에 섞이지
 * 않는다. 브라우저와 네이티브 WebView의 기록은 `surface` 태그로 구분한다.
 *
 * @see https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
 */
export function ClarityInitializer(): null {
  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (!projectId || hasInitialized) return;

    hasInitialized = true;
    Clarity.init(projectId);
    Clarity.setTag('surface', isNativeContext() ? 'app' : 'browser');
  }, []);

  return null;
}
