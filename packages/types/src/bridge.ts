/**
 * 네이티브 앱에서 웹으로 전달하는 메시지
 *
 * 요청에 대한 응답은 요청과 동일한 `requestId`를 사용한다.
 */
export type NativeToWebMessage =
  | { type: 'AUTH_TOKEN'; payload: { token: string } }
  // 저장된 토큰이 없음을 명시적으로 알린다.
  // 이 메시지가 없으면 웹은 타임아웃 전까지 토큰 부재를 확정할 수 없다.
  | { type: 'AUTH_NONE' }
  // COPY_TO_CLIPBOARD 요청의 처리 결과다.
  | { type: 'COPY_RESULT'; requestId: string; payload: { state: 'success' | 'error' } }
  | { type: 'DEVICE_INFO'; payload: { os: 'ios' | 'android' } }
  | { type: 'APP_STATE'; payload: { state: 'active' | 'background' } };

/**
 * 웹에서 네이티브 앱으로 전달하는 메시지
 *
 * 개별 응답을 기다리는 요청은 `requestId`를 전송 메타데이터로 사용한다.
 */
export type WebToNativeMessage =
  // 웹의 메시지 수신 준비가 완료되었음을 알린다.
  // 네이티브는 AUTH_TOKEN 또는 AUTH_NONE으로 응답한다.
  | { type: 'READY' }
  // 로그인 토큰을 네이티브 저장소에도 보관하도록 요청한다.
  | { type: 'AUTH_SIGNED_IN'; payload: { token: string } }
  // 네이티브 저장소의 로그인 토큰을 삭제하도록 요청한다.
  | { type: 'AUTH_SIGNED_OUT' }
  | { type: 'OPEN_CAMERA' }
  | { type: 'HAPTIC_FEEDBACK'; payload: { style: 'light' | 'medium' | 'heavy' } }
  | { type: 'NAVIGATE_NATIVE'; payload: { screen: string } }
  // COPY_RESULT와 연결할 수 있도록 requestId를 함께 전달한다.
  | { type: 'COPY_TO_CLIPBOARD'; requestId: string; payload: { text: string } }
  // WebView 대신 네이티브에서 메시지 앱을 실행한다.
  | { type: 'SHARE_SMS'; payload: { message: string } }
  | { type: 'REQUEST_PERMISSION'; payload: { type: 'camera' | 'location' } };
