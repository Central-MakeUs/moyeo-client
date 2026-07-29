// RN → WebView: 네이티브가 웹에 데이터 전달
export type NativeToWebMessage =
  | { type: 'AUTH_TOKEN'; payload: { token: string } }
  // 네이티브에 저장된 토큰이 없음을 알린다.
  // 이 응답이 없으면 웹은 비로그인 여부를 타임아웃으로만 판단할 수 있다.
  | { type: 'AUTH_NONE' }
  | { type: 'COPY_RESULT'; payload: { state: 'success' | 'error' } }
  | { type: 'DEVICE_INFO'; payload: { os: 'ios' | 'android' } }
  | { type: 'APP_STATE'; payload: { state: 'active' | 'background' } };

// WebView → RN: 웹이 네이티브 기능 요청
export type WebToNativeMessage =
  | { type: 'READY' }
  // 웹에서 로그인했으니 네이티브 저장소(SecureStore)에도 토큰을 보관하라는 통지.
  // 이 메시지가 없으면 네이티브는 보관할 토큰을 얻지 못해 다음 실행에서 AUTH_TOKEN을 보낼 수 없다.
  | { type: 'AUTH_SIGNED_IN'; payload: { token: string } }
  // 웹에서 로그아웃했으니 네이티브 저장소(SecureStore)도 비우라는 통지
  | { type: 'AUTH_SIGNED_OUT' }
  | { type: 'OPEN_CAMERA' }
  | { type: 'HAPTIC_FEEDBACK'; payload: { style: 'light' | 'medium' | 'heavy' } }
  | { type: 'NAVIGATE_NATIVE'; payload: { screen: string } }
  | { type: 'COPY_TO_CLIPBOARD'; payload: { text: string } }
  | { type: 'REQUEST_PERMISSION'; payload: { type: 'camera' | 'location' } };
