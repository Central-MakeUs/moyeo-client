/**
 * data URL을 업로드할 수 있는 `Blob`으로 되돌린다.
 *
 * 초안에는 직렬화되는 문자열로 보관하지만(`normalize-cover-image` 참고), 실제 전송은
 * multipart 파일 파트여야 하므로 제출 직전에 이진 데이터로 되돌려야 한다.
 *
 * `fetch(dataUrl)`로도 같은 일을 할 수 있지만, 그 경로는 비동기인 데다 테스트 환경과
 * 콘텐츠 보안 정책의 영향을 받는다. 문자열을 직접 해석하면 그런 변수가 없다.
 *
 * @param dataUrl `data:<mime>;base64,<payload>` 형식의 문자열
 * @returns 원본 MIME 타입이 지정된 Blob
 * @throws base64 data URL이 아니면 `Error`를 던진다.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) throw new Error('Not a data URL');

  const header = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);

  // base64가 아닌 data URL(퍼센트 인코딩)은 이 함수의 대상이 아니다. 조용히 깨진 Blob을
  // 만들어 업로드 실패로 흘려보내는 대신 여기서 멈춘다.
  if (!header.startsWith('data:') || !header.includes(';base64')) {
    throw new Error('Not a base64 data URL');
  }

  const mimeType = header.slice('data:'.length, header.indexOf(';'));
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}
