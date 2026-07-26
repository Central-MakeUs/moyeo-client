const localAllowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 실기기(폰)에서 LAN IP로 dev 서버 접속 시 /_next/* 가 403으로 차단되는 것을 방지.
  // Next 16은 allowedDevOrigins에 없는 origin의 dev 요청을 거부한다(dev 전용 설정).
  allowedDevOrigins: [
    '192.168.0.*',
    '192.168.1.*',
    '172.30.1.*',
    ...(localAllowedDevOrigins ?? []), // 개인 네트워크 주입
  ],
  // 루트(/)는 /home으로 보낸다. 세션 판정·리다이렉트(login/nickname)는 (protected)의 AuthGuard가 담당.
  // permanent:false(307) — "/→home" 정책이 바뀔 수 있으니 브라우저가 영구 캐싱(308)하지 않게.
  async redirects() {
    return [{ source: '/', destination: '/home', permanent: false }];
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: { svgo: false },
          },
        ],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
