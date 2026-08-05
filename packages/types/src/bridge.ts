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
  | { type: 'APP_STATE'; payload: { state: 'active' | 'background' } }
  // 네이티브 뒤로가기를 웹이 먼저 처리하도록 넘긴다. 웹은 BACK_RESULT로 답한다.
  | { type: 'BACK_PRESSED'; requestId: string };

/**
 * 네이티브 뒤로가기에 대한 웹의 처리 결과
 *
 * - `handled`: 웹이 처리했다(오버레이를 닫았거나 화면을 옮겼다). 네이티브는 아무것도 하지 않는다.
 * - `passthrough`: 웹이 처리할 것이 없다. 네이티브가 WebView 방문 기록으로 뒤로 간다.
 * - `exit`: 앱의 시작 화면이라 더 돌아갈 곳이 없다. 네이티브가 종료 확인 단계로 넘어간다.
 *
 * 방문 기록의 깊이는 웹이 알 수 없으므로(`history.length`는 뒤로 가도 줄지 않는다),
 * 일반 화면의 뒤로가기는 `passthrough`로 네이티브에 맡긴다.
 */
export type BackResultState = 'handled' | 'passthrough' | 'exit';

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
  | { type: 'REQUEST_PERMISSION'; payload: { type: 'camera' | 'location' } }
  // BACK_PRESSED와 연결할 수 있도록 요청에 실려 온 requestId를 그대로 돌려준다.
  | { type: 'BACK_RESULT'; requestId: string; payload: { state: BackResultState } };
