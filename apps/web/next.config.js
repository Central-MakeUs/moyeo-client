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
