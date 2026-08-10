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
  // PICK_IMAGE 요청의 처리 결과다.
  | { type: 'PICK_IMAGE_RESULT'; requestId: string; payload: PickImageResult }
  | { type: 'DEVICE_INFO'; payload: { os: 'ios' | 'android' } }
  | { type: 'APP_STATE'; payload: { state: 'active' | 'background' } }
  // 네이티브 뒤로가기를 웹이 먼저 처리하도록 넘긴다. 웹은 BACK_RESULT로 답한다.
  | { type: 'BACK_PRESSED'; requestId: string }
  // CAPABILITIES 요청의 처리 결과다.
  | { type: 'CAPABILITIES_RESULT'; requestId: string; payload: { features: NativeFeature[] } }
  // SOCIAL_LOGIN 요청의 처리 결과다.
  | { type: 'SOCIAL_LOGIN_RESULT'; requestId: string; payload: SocialLoginResult };

/**
 * 네이티브 앱이 지원하는 브리지 기능
 *
 * 웹은 배포 즉시 전원에게 반영되지만, 네이티브는 스토어 심사와 사용자 업데이트를 거쳐 항상
 * 늦게 도착한다. 그래서 **구버전 바이너리 + 신버전 웹** 조합이 상시 존재하고, 자동 업데이트를
 * 꺼둔 사용자는 영구적으로 그 상태다.
 *
 * 이때 웹이 `isNativeContext()`만 보고 새 메시지를 보내면, 그 `type`을 모르는 구버전
 * 네이티브는 조용히 무시하고 웹은 타임아웃까지 대기한다. 로그인처럼 대기 시간이 긴 기능은
 * 사실상 불능이 된다.
 *
 * 그래서 새 기능은 "네이티브 컨텍스트인가"가 아니라 **"네이티브가 이 기능을 지원하는가"**로
 * 분기한다. 구버전은 CAPABILITIES에 응답하지 않으므로 자동으로 미지원 판정을 받고 웹 폴백
 * 경로를 탄다.
 *
 * 소셜 로그인은 공급자 단위로 나눈다. 카카오와 애플이 서로 다른 릴리스에 실리므로,
 * `socialLogin` 하나로 묶으면 카카오만 지원하는 바이너리가 애플까지 지원한다고 답하게 된다.
 */
export type NativeFeature = 'socialLogin.kakao' | 'socialLogin.apple';

/** 네이티브 SDK로 로그인할 수 있는 공급자 */
export type SocialLoginProvider = 'kakao' | 'apple';

/**
 * 네이티브 SDK 소셜 로그인 결과
 *
 * `PickImageResult`와 같은 이유로 실패를 한 가지로 뭉치지 않는다. 사용자가 로그인 시트를
 * 스스로 닫은 `cancelled`는 조용히 지나가야 하고, `error`는 안내가 필요하다.
 */
export type SocialLoginResult =
  | {
      state: 'success';
      /** 카카오는 OAuth access token, 애플은 identityToken(JWT). */
      token: string;
      /**
       * 애플 전용. 탈퇴 시 연동 해제(revoke)에 쓸 refresh token을 서버가 확보하려면
       * 이 코드를 함께 넘겨야 한다. 카카오는 사용하지 않는다.
       */
      authorizationCode?: string;
    }
  /** 사용자가 로그인 시트를 닫았다. */
  | { state: 'cancelled' }
  /** SDK 호출이 실패했다. */
  | { state: 'error' };

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
 * 네이티브 앨범에서 고른 이미지
 *
 * 파일 경로(`file://`)가 아니라 data URL로 넘긴다. WebView 안의 웹은 앱 샌드박스의 파일을
 * 직접 읽을 수 없어서, 경로만 받으면 미리보기도 업로드도 할 수 없다.
 *
 * 원본을 그대로 실어 보내면 문자열이 수 MB가 되어 브리지 왕복과 `JSON.parse`가 눈에 띄게
 * 느려지므로, 네이티브가 긴 변 기준으로 축소·재인코딩한 뒤 보낸다. 축소 결과는 서버의
 * 커버 이미지 제약(10MB · 13MP · 한 변 8,000px)도 함께 만족한다.
 */
export interface PickedImage {
  /** `data:image/jpeg;base64,...` 형식 */
  dataUrl: string;
}

/**
 * 이미지 선택 결과
 *
 * 실패를 한 가지로 뭉치지 않는다. 사용자가 스스로 닫은 `cancelled`는 조용히 지나가야 하고,
 * `denied`는 다음 행동(설정에서 권한 변경)을 안내해야 해서 웹의 처리가 서로 다르다.
 */
export type PickImageResult =
  | { state: 'success'; image: PickedImage }
  /** 사용자가 앨범을 그냥 닫았다. */
  | { state: 'cancelled' }
  /** 사진 접근 권한이 없다. */
  | { state: 'denied' }
  /** 권한은 있으나 앨범 실행이나 이미지 변환에 실패했다. */
  | { state: 'error' };

/**
 * 현재 좌표 획득 결과
 *
 * 실패 사유마다 안내할 다음 행동이 다르다 — `denied`는 다시 물어볼 수 있지만 `blocked`는
 * OS 설정을 거쳐야 하고, `servicesDisabled`는 앱 권한과 무관하다. `PickImageResult`와 같은 이유로
 * 실패를 한 가지로 뭉치지 않는다.
 *
 * 앱(브리지)과 브라우저(`navigator.geolocation`)가 이 타입 하나로 수렴한다.
 * 브리지 메시지는 앱 릴리스(2차)에서 추가한다 — 1차는 브라우저 경로만 쓴다.
 */
export type CurrentLocationResult =
  | {
      state: 'success';
      coords: { latitude: number; longitude: number; accuracy: number | null };
    }
  /** 사용자가 이번 요청을 거부했다. 다시 물어볼 수 있다. */
  | { state: 'denied' }
  /** OS가 더 이상 묻지 않는다(`canAskAgain === false`). 설정에서만 바꿀 수 있다. 네이티브만 생성한다. */
  | { state: 'blocked' }
  /** 기기의 위치 서비스 자체가 꺼져 있다. 앱 권한과 무관하다. 네이티브만 생성한다. */
  | { state: 'servicesDisabled' }
  /** 권한은 있으나 제한 시간 안에 좌표를 얻지 못했다. */
  | { state: 'timeout' }
  | { state: 'error' };

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
  | { type: 'HAPTIC_FEEDBACK'; payload: { style: 'light' | 'medium' | 'heavy' } }
  | { type: 'NAVIGATE_NATIVE'; payload: { screen: string } }
  // COPY_RESULT와 연결할 수 있도록 requestId를 함께 전달한다.
  | { type: 'COPY_TO_CLIPBOARD'; requestId: string; payload: { text: string } }
  // WebView 대신 네이티브에서 메시지 앱을 실행한다.
  | { type: 'SHARE_SMS'; payload: { message: string } }
  // 사진 접근 권한 요청과 앨범 실행을 네이티브에 맡긴다.
  //
  // WebView 안에서도 <input type="file">로 앨범을 열 수는 있지만, 그 경로는 iOS가 권한 없이
  // 동작하는 시스템 피커(PHPicker)를 띄워 사진 접근 권한 팝업이 뜨지 않는다. 권한 팝업과
  // 제한 접근(limited) 분기를 화면 명세대로 보여주려면 네이티브 피커를 거쳐야 한다.
  // PICK_IMAGE_RESULT와 연결할 수 있도록 requestId를 함께 전달한다.
  | { type: 'PICK_IMAGE'; requestId: string }
  // BACK_PRESSED와 연결할 수 있도록 요청에 실려 온 requestId를 그대로 돌려준다.
  | { type: 'BACK_RESULT'; requestId: string; payload: { state: BackResultState } }
  // 네이티브가 지원하는 기능 목록을 묻는다. 이 메시지를 모르는 구버전 바이너리는 응답하지
  // 않으므로, 웹은 타임아웃을 미지원으로 해석한다. (NativeFeature 주석 참고)
  // CAPABILITIES_RESULT와 연결할 수 있도록 requestId를 함께 전달한다.
  | { type: 'CAPABILITIES'; requestId: string }
  // 네이티브 SDK로 소셜 로그인을 진행하도록 위임한다.
  //
  // WebView 안에서 공급자 authorize 페이지를 직접 띄우면 카카오톡 앱 간 로그인이 되지 않고
  // 매번 재인증을 요구하며, 서드파티 쿠키와 `intent://` 우회에 의존하게 된다.
  // SOCIAL_LOGIN_RESULT와 연결할 수 있도록 requestId를 함께 전달한다.
  | {
      type: 'SOCIAL_LOGIN';
      requestId: string;
      payload: {
        provider: SocialLoginProvider;
        /**
         * 애플 전용. 웹이 생성해 전달하면 SDK가 그대로 Apple에 넘기고, Apple은 변형 없이
         * identityToken의 `nonce` 클레임에 담아 돌려준다. 덕분에 서버는 웹 경로와 동일한
         * 규칙으로 검증할 수 있다. 카카오는 사용하지 않는다.
         */
        nonce?: string;
      };
    };
