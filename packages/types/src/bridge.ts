// RN → WebView: 네이티브가 웹에 데이터 전달
export type NativeToWebMessage =
    | { type: 'AUTH_TOKEN'; payload: { token: string } }
    | { type: 'DEVICE_INFO'; payload: { os: 'ios' | 'android' } }
    | { type: 'APP_STATE'; payload: { state: 'active' | 'background' } };

// WebView → RN: 웹이 네이티브 기능 요청
export type WebToNativeMessage =
    | { type: 'READY' }
    | { type: 'OPEN_CAMERA' }
    | { type: 'HAPTIC_FEEDBACK'; payload: { style: 'light' | 'medium' | 'heavy' } }
    | { type: 'NAVIGATE_NATIVE'; payload: { screen: string } }
    | { type: 'REQUEST_PERMISSION'; payload: { type: 'camera' | 'location' } };
