/**
 * 커버 사진 정규화 기준.
 *
 * 서버는 커버 이미지를 10MB · 13MP · 한 변 8,000px 이하의 JPEG 또는 PNG로 제한한다. 요즘 기기의
 * 사진은 그대로 두면 이 제약에 걸릴 수 있고, 걸리지 않더라도 draft가 쓰는 `sessionStorage`
 * 용량(브라우저마다 약 5MB)을 넘겨 초안 저장이 통째로 실패한다. 그래서 고른 직후에 줄인다.
 *
 * 네이티브 앱은 브리지로 넘기기 전에 같은 기준으로 줄인다(`apps/native`의 `pickCoverImage`).
 * 한쪽을 바꾸면 다른 쪽도 같이 맞춰야 두 경로의 결과물이 같은 크기로 유지된다.
 */
export const COVER_MAX_EDGE = 1440;
export const COVER_JPEG_QUALITY = 0.85;

/** 정규화 결과물의 형식. 서버가 받는 JPEG · PNG 중 하나이며, 사진에는 JPEG가 유리하다. */
export const COVER_IMAGE_MIME_TYPE = 'image/jpeg';

/** 업로드 multipart 파트에 붙일 파일명. 원본 이름은 정규화 과정에서 의미를 잃는다. */
export const COVER_IMAGE_FILE_NAME = 'cover.jpg';

/**
 * 고른 이미지를 커버 사진 기준에 맞게 줄이고 JPEG data URL로 만든다.
 *
 * data URL로 만드는 이유는 초안 때문이다. 생성 위저드는 스텝마다 라우트를 옮기고 초안을
 * `sessionStorage`에 직렬화해 두는데, `File`이나 `Blob`은 JSON으로 직렬화되지 않아 스텝을
 * 넘어가는 순간 사라진다. 문자열로 들고 있으면 새로고침이나 뒤로가기에도 남는다.
 *
 * @param source 사용자가 고른 이미지 파일
 * @returns `data:image/jpeg;base64,...` 형식의 문자열
 * @throws 이미지를 해석할 수 없거나 캔버스를 쓸 수 없으면 reject한다.
 */
export async function normalizeCoverImage(source: Blob): Promise<string> {
  const bitmap = await createImageBitmap(source);

  try {
    // 두 변에 같은 배율을 적용해 비율을 유지한다. 상한보다 작은 사진은 확대하지 않는다(배율 1).
    const longEdge = Math.max(bitmap.width, bitmap.height);
    const scale = longEdge > COVER_MAX_EDGE ? COVER_MAX_EDGE / longEdge : 1;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext('2d');
    if (context === null) throw new Error('Canvas 2D context is unavailable');

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL(COVER_IMAGE_MIME_TYPE, COVER_JPEG_QUALITY);
  } finally {
    // 디코딩된 원본 픽셀은 캔버스에 그린 뒤로는 쓸 일이 없다. 큰 사진일수록 메모리 차이가 크다.
    bitmap.close();
  }
}
