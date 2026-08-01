/**
 * Next.js의 Router Handler를 백엔드 API 프록시로 사용하는 코드
 * - 브라우저가 직접 백엔드에 요청을 보내지 않는다.
 * - [ 브라우저 / WebView → Next.js /backend-api/* → 실제 백엔드 API ] 순으로 요청 전달
 */
const REQUEST_HEADERS_TO_REMOVE = [
  'connection',
  'content-length',
  'forwarded',
  'host',
  'origin',
  'referer',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site',
  'transfer-encoding',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
] as const;

const RESPONSE_HEADERS_TO_REMOVE = [
  'connection',
  'content-length',
  'keep-alive',
  'transfer-encoding',
] as const;

interface ProxyRouteContext {
  params: Promise<{ path: string[] }>;
}

function createTargetUrl(path: string[], search: string): URL {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('API_BASE_URL이 설정되지 않았습니다.');
  }

  const baseUrl = new URL(apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`);
  const targetUrl = new URL(path.map(encodeURIComponent).join('/'), baseUrl);
  targetUrl.search = search;

  return targetUrl;
}

async function proxyRequest(request: Request, context: ProxyRouteContext): Promise<Response> {
  try {
    const { path } = await context.params;
    const requestUrl = new URL(request.url);
    const targetUrl = createTargetUrl(path, requestUrl.search);
    const headers = new Headers(request.headers);

    for (const name of REQUEST_HEADERS_TO_REMOVE) {
      headers.delete(name);
    }

    // 압축된 응답을 fetch가 해제한 뒤 원래 Content-Encoding만 남는 상황을 피한다.
    headers.set('accept-encoding', 'identity');

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: request.signal,
    });
    const responseHeaders = new Headers(response.headers);

    for (const name of RESPONSE_HEADERS_TO_REMOVE) {
      responseHeaders.delete(name);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[backend-api proxy] 요청 전달에 실패했습니다.', error);

    return Response.json(
      {
        title: '백엔드 API 연결 실패',
        status: 502,
      },
      { status: 502 }
    );
  }
}

export const dynamic = 'force-dynamic';

export {
  proxyRequest as DELETE,
  proxyRequest as GET,
  proxyRequest as HEAD,
  proxyRequest as OPTIONS,
  proxyRequest as PATCH,
  proxyRequest as POST,
  proxyRequest as PUT,
};
