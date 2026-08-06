'use client';

import * as React from 'react';

import { normalizeCoverImage } from '@/shared/lib/normalize-cover-image';
import { isNativeContext, requestPickImage } from '@/shared/model';
import { toast } from '@/shared/ui';

import { useCreateMeetingDraft } from './create-meeting-draft';

/** 안내가 겹쳐 쌓이지 않도록 커버 사진 관련 토스트는 한 자리를 공유한다. */
const COVER_TOAST_ID = 'create-meeting-cover';
const COVER_TOAST_TIMEOUT_MS = 3000;

/**
 * 실패 사유별 안내 문구.
 *
 * 한 문구로 뭉치지 않는 이유는 사용자가 할 수 있는 일이 사유마다 다르기 때문이다.
 * 권한 문제는 다시 눌러도 소용없고, 사진 자체를 못 읽는 경우는 다른 사진을 골라야 하며,
 * 앨범을 못 연 경우만 재시도가 의미 있다.
 *
 * 커버 사진은 선택 입력이라 어느 경우에도 흐름을 막지 않는다. 설정 화면으로 보내지도 않는다 —
 * 사진 없이 계속 진행하는 편이 자연스럽고, 다시 시도하려면 사용자가 스스로 설정을 열면 된다.
 */
const MESSAGE = {
  /** 사진 접근 권한이 없다. */
  denied: '사진 접근을 허용하면 커버 사진을 등록할 수 있어요',
  /** 앨범을 열지 못했거나 네이티브 응답이 오지 않았다. 사진 자체의 문제는 아니다. */
  pickFailed: '사진을 불러오지 못했어요. 잠시 후 다시 시도해주세요',
  /** 고른 사진을 읽지 못했다(손상·미지원 코덱). 같은 사진으로 다시 시도해도 결과가 같다. */
  decodeFailed: '사진을 등록하지 못했어요. 다른 사진을 선택해주세요',
  /** accept를 우회해 다른 형식을 골랐다. */
  unsupportedType: 'JPG, PNG 사진만 등록할 수 있어요',
} as const;

/** 커버로 받는 이미지 형식. 서버가 받는 형식과 맞춘다. */
const SUPPORTED_TYPES: readonly string[] = ['image/jpeg', 'image/png'];

/** 브라우저 파일 선택창에 노출할 형식. */
export const COVER_IMAGE_ACCEPT = SUPPORTED_TYPES.join(',');

export interface UseCoverImagePickerResult {
  /** 현재 초안에 담긴 커버 사진(data URL). 고르지 않았으면 null. */
  coverImage: string | null;
  /** 사진을 고르거나 변환하는 중. 버튼을 잠가 중복 실행을 막는다. */
  isPicking: boolean;
  /** 브라우저 경로에서 쓰는 숨은 파일 입력에 연결한다. */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** `사진 추가` 버튼의 동작. 실행 환경에 따라 네이티브 앨범과 파일 선택창으로 갈린다. */
  pick: () => void;
  /** 숨은 파일 입력의 change 핸들러. */
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** 고른 사진을 지우고 기본 커버로 되돌린다. */
  remove: () => void;
}

/**
 * 커버 사진 선택(CRT-05 F01).
 *
 * 모여는 앱(WebView)과 브라우저 양쪽에서 쓰이므로 사진을 고르는 경로가 두 개다.
 *
 * - 앱: 네이티브 브리지. WebView 안에서도 `<input type="file">`로 앨범을 열 수는 있지만,
 *   그 경로는 iOS가 권한 없이 동작하는 시스템 피커를 띄워 화면 명세가 요구하는 사진 접근
 *   권한 팝업이 뜨지 않는다.
 * - 브라우저: 숨겨 둔 `<input type="file">`. 프로그래밍으로 파일 선택창을 여닫을 때 생기는
 *   "취소를 감지할 수 없다"는 문제를, 실제 입력 요소를 두고 change만 받는 방식으로 피한다.
 *
 * 어느 경로로 고르든 결과는 같은 형태의 data URL이라, 이후 미리보기와 업로드는 하나로 합쳐진다.
 */
export function useCoverImagePicker(): UseCoverImagePickerResult {
  const coverImage = useCreateMeetingDraft((state) => state.coverImage);
  const setCoverImage = useCreateMeetingDraft((state) => state.setCoverImage);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isPicking, setIsPicking] = React.useState(false);

  const notify = (description: string) => {
    toast.add({ id: COVER_TOAST_ID, description, timeout: COVER_TOAST_TIMEOUT_MS });
  };

  const pickWithNative = async () => {
    setIsPicking(true);

    try {
      const result = await requestPickImage();

      // 네이티브가 이미 커버 기준으로 줄여서 보낸다. 웹에서 한 번 더 줄일 필요가 없다.
      if (result.state === 'success') {
        setCoverImage(result.image.dataUrl);
        return;
      }

      // 사용자가 앨범을 스스로 닫은 경우다. 알릴 것이 없다.
      if (result.state === 'cancelled') return;

      notify(result.state === 'denied' ? MESSAGE.denied : MESSAGE.pickFailed);
    } catch {
      // 브리지 부재나 응답 지연. 앨범을 열지 못한 것이므로 재시도가 의미 있다.
      notify(MESSAGE.pickFailed);
    } finally {
      setIsPicking(false);
    }
  };

  const applyFile = async (file: File) => {
    // 파일 선택창은 accept를 강제하지 않는다. 형식 필터를 `모든 파일`로 바꿔 고를 수 있다.
    // 빈 문자열은 브라우저가 형식을 판별하지 못한 경우라, 막지 않고 디코딩에 맡긴다.
    if (file.type !== '' && !SUPPORTED_TYPES.includes(file.type)) {
      notify(MESSAGE.unsupportedType);
      return;
    }

    setIsPicking(true);

    try {
      setCoverImage(await normalizeCoverImage(file));
    } catch {
      // 파일은 받았지만 이미지로 읽지 못했다. 같은 사진으로 다시 눌러도 결과가 같다.
      notify(MESSAGE.decodeFailed);
    } finally {
      setIsPicking(false);
    }
  };

  const pick = () => {
    if (isPicking) return;

    if (isNativeContext()) {
      void pickWithNative();
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // 지웠다가 같은 사진을 다시 고르면 값이 바뀌지 않아 change가 오지 않는다. 매번 비워 둔다.
    event.target.value = '';

    if (file === undefined) return;

    void applyFile(file);
  };

  return {
    coverImage,
    isPicking,
    fileInputRef,
    pick,
    handleFileChange,
    remove: () => setCoverImage(null),
  };
}
