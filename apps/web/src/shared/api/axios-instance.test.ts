import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 기준 URL은 모듈을 읽는 시점에 환경변수로 정해진다.
 * 환경마다 다른 동작을 보려면 stub 후 모듈을 새로 불러와야 한다.
 */
async function importWith(proxyPath?: string) {
  vi.resetModules();

  if (proxyPath === undefined) {
    vi.stubEnv('NEXT_PUBLIC_API_PROXY_PATH', '');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');
  } else {
    vi.stubEnv('NEXT_PUBLIC_API_PROXY_PATH', proxyPath);
  }

  return import('./axios-instance');
}

describe('toApiAssetUrl', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('상대 API 경로 앞에 기준 URL을 붙인다', async () => {
    const { toApiAssetUrl } = await importWith('/backend-api');

    // 그대로 <img src>에 넣으면 웹 오리진에서 찾아 404가 난다.
    expect(toApiAssetUrl('/api/meetings/invitations/ABCD/cover-image?v=1')).toBe(
      '/backend-api/api/meetings/invitations/ABCD/cover-image?v=1'
    );
  });

  it('기준 URL 끝의 슬래시를 겹쳐 붙이지 않는다', async () => {
    const { toApiAssetUrl } = await importWith('/backend-api/');

    expect(toApiAssetUrl('/api/cover.jpg')).toBe('/backend-api/api/cover.jpg');
  });

  it('이미 절대 URL이면 손대지 않는다', async () => {
    const { toApiAssetUrl } = await importWith('/backend-api');

    expect(toApiAssetUrl('https://cdn.example.com/cover.jpg')).toBe(
      'https://cdn.example.com/cover.jpg'
    );
  });

  it('값이 없으면 undefined를 돌려준다', async () => {
    const { toApiAssetUrl } = await importWith('/backend-api');

    expect(toApiAssetUrl(undefined)).toBeUndefined();
    expect(toApiAssetUrl('')).toBeUndefined();
  });

  it('기준 URL이 없으면 경로를 그대로 둔다', async () => {
    const { toApiAssetUrl } = await importWith();

    expect(toApiAssetUrl('/api/cover.jpg')).toBe('/api/cover.jpg');
  });
});
