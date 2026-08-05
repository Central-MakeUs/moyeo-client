'use client';

import { useEffect, useRef } from 'react';

/**
 * 뒤로가기 요청을 받은 화면의 처리 함수.
 *
 * 처리했으면 `true`, 자신이 처리할 상황이 아니면 `false`를 반환한다.
 * `false`면 더 아래에 등록된 핸들러로 넘어간다.
 */
export type BackHandler = () => boolean;

/**
 * 등록 순서대로 쌓이는 핸들러 스택.
 *
 * 나중에 열린 화면·오버레이가 뒤로가기를 먼저 가져가야 하므로 뒤에서부터 실행한다.
 * React 상태가 아니라 모듈 스코프에 두는 이유는, 뒤로가기 신호가 React 트리 밖
 * (네이티브 브리지의 message 이벤트)에서 들어와 렌더링과 무관하게 즉시 조회돼야 하기 때문이다.
 */
const handlers: BackHandler[] = [];

/**
 * 핸들러를 스택에 올린다.
 *
 * @param handler 뒤로가기를 처리할 함수
 * @returns 스택에서 내리는 함수
 */
export function registerBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);

  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  };
}

/**
 * 스택 위에서부터 핸들러를 실행하고, 처음으로 처리한 곳에서 멈춘다.
 *
 * @returns 어느 하나라도 뒤로가기를 처리했으면 `true`
 */
export function runBackHandlers(): boolean {
  for (let index = handlers.length - 1; index >= 0; index -= 1) {
    if (handlers[index]?.() === true) return true;
  }

  return false;
}

/**
 * 컴포넌트가 살아 있는 동안(또는 `enabled`인 동안) 네이티브 뒤로가기를 가져간다.
 *
 * @param handler 뒤로가기를 처리할 함수. 처리했으면 `true`를 반환한다.
 * @param enabled `false`면 등록하지 않는다 — 열려 있을 때만 잡는 오버레이용이다.
 */
export function useBackHandler(handler: BackHandler, enabled = true): void {
  const handlerRef = useRef(handler);

  // 최신 handler를 ref에 담아둔다. 호출부가 매 렌더 새 함수를 넘겨도 재등록하지 않기 위해서다.
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;

    return registerBackHandler(() => handlerRef.current());
  }, [enabled]);
}
