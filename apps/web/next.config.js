const localAllowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 실기기(폰)에서 LAN IP로 dev 서버 접속 시 /_next/* 가 403으로 차단되는 것을 방지.
  // Next 16은 allowedDevOrigins에 없는 origin의 dev 요청을 거부한다(dev 전용 설정).
  //
  // 사설망 대역 전체를 연다. 공유기마다 서브넷이 달라(192.168.0/1/26/45/219…) IP를 하나씩
  // 등록하면 네트워크가 바뀔 때마다 다시 막힌다. dev 전용 설정이고 사설 IP는 외부에서
  // 접근할 수 없어 대역으로 여는 편이 안전하고 번거롭지 않다.
  allowedDevOrigins: [
    '192.168.*', // 가정용 공유기 대부분
    '172.16.*',
    '172.17.*',
    '172.18.*',
    '172.19.*',
    '172.20.*',
    '172.21.*',
    '172.22.*',
    '172.23.*',
    '172.24.*',
    '172.25.*',
    '172.26.*',
    '172.27.*',
    '172.28.*',
    '172.29.*',
    '172.30.*',
    '172.31.*',
    '10.*',
    ...(localAllowedDevOrigins ?? []), // 위 대역 밖(회사망 등)만 추가로 주입
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
