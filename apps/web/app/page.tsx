'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePostMessage } from '../shared/model/use-bridge';
import type { WebToNativeMessage } from '@repo/types';
import styles from './page.module.css';

const setupItems = [
  { label: 'Web', value: 'Next.js 16', detail: 'WebView 화면' },
  { label: 'Native', value: 'Expo SDK 54', detail: 'React Native host' },
  { label: 'Bridge', value: '@repo/types', detail: '메시지 계약 공유' },
];

const actions: Array<{ label: string; message: WebToNativeMessage; description: string }> = [
  {
    label: 'Ready',
    message: { type: 'READY' },
    description: '웹 앱이 로드됐음을 native에 알립니다.',
  },
  {
    label: 'Camera',
    message: { type: 'OPEN_CAMERA' },
    description: 'native 카메라 플로우를 요청합니다.',
  },
  {
    label: 'Haptic',
    message: { type: 'HAPTIC_FEEDBACK', payload: { style: 'light' } },
    description: '가벼운 햅틱 피드백을 요청합니다.',
  },
];

export default function Home() {
  const postMessage = usePostMessage();
  const [lastMessage, setLastMessage] = useState<WebToNativeMessage>({ type: 'READY' });
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    setIsWebView(Boolean(window.ReactNativeWebView));
  }, []);

  const environment = useMemo(() => {
    if (isWebView) {
      return 'React Native WebView';
    }

    return 'Browser preview';
  }, [isWebView]);

  const sendMessage = (message: WebToNativeMessage) => {
    setLastMessage(message);
    postMessage(message);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="page-title">
        <div className={styles.topbar}>
          <strong>모여</strong>
          <span>{environment}</span>
        </div>

        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Next.js + RN WebView Turborepo</p>
          <h1 id="page-title">웹은 Next.js로 만들고, native는 Expo WebView로 감쌉니다.</h1>
          <p>
            이 화면은 <code>apps/web</code>에서 실행되는 WebView 전용 첫 페이지입니다. native 앱은{' '}
            <code>react-native-webview</code>로 이 화면을 로드하고, 양쪽 메시지 타입은{' '}
            <code>@repo/types</code>에서 공유합니다.
          </p>
        </div>
      </section>

      <section className={styles.contentGrid} aria-label="Project status">
        <div className={styles.panel}>
          <h2>세팅 상태</h2>
          <div className={styles.stack}>
            {setupItems.map((item) => (
              <div className={styles.statusRow} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <h2>Bridge 테스트</h2>
          <div className={styles.actionList}>
            {actions.map((action) => (
              <button
                className={styles.actionButton}
                key={action.label}
                type="button"
                onClick={() => sendMessage(action.message)}
              >
                <span>{action.label}</span>
                <small>{action.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.panelWide}>
          <h2>마지막 전송 메시지</h2>
          <pre className={styles.messageBox}>{JSON.stringify(lastMessage, null, 2)}</pre>
          <p>
            브라우저에서 누르면 메시지 상태만 바뀌고, Expo WebView 안에서 누르면
            <code>window.ReactNativeWebView.postMessage</code>로 native에 전달됩니다.
          </p>
        </div>
      </section>
    </main>
  );
}
