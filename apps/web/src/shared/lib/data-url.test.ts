import { describe, expect, it } from 'vitest';

import { dataUrlToBlob } from './data-url';

/** 1×1 투명 GIF. 내용보다 base64 왕복이 어긋나지 않는지가 중요하다. */
const PIXEL_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

describe('dataUrlToBlob', () => {
  it('data URL에 적힌 MIME 타입을 Blob에 그대로 옮긴다', () => {
    const blob = dataUrlToBlob(`data:image/jpeg;base64,${PIXEL_BASE64}`);

    expect(blob.type).toBe('image/jpeg');
  });

  it('디코딩한 바이트 수만큼의 Blob을 만든다', () => {
    const blob = dataUrlToBlob(`data:image/png;base64,${PIXEL_BASE64}`);

    expect(blob.size).toBe(atob(PIXEL_BASE64).length);
  });

  it('data URL이 아니면 던진다', () => {
    expect(() => dataUrlToBlob('https://example.com/cover.jpg')).toThrow();
  });

  it('base64가 아닌 data URL이면 던진다', () => {
    // 조용히 깨진 Blob을 만들어 업로드 실패로 흘려보내지 않는다.
    expect(() => dataUrlToBlob('data:text/plain,hello')).toThrow();
  });
});
