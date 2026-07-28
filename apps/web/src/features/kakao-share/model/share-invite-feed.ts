/**
 * 실제 초대 카피/썸네일이 정해지기 전까지 쓰는 임시 테스트 콘텐츠.
 * imageUrl은 카카오톡 앱이 인터넷으로 직접 불러오므로 localhost가 아닌 공개 https 주소여야 한다.
 */
const TEST_IMAGE_URL = 'https://via.placeholder.com/800x400.png?text=Moyeo';

export function shareInviteFeed(): void {
  const kakao = window.Kakao;

  if (!kakao?.isInitialized()) {
    throw new Error('Kakao SDK가 초기화되지 않았습니다.');
  }

  const origin = window.location.origin;

  kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: '모여 초대 테스트',
      description: '웹 JS SDK로 카카오톡 공유가 되는지 확인하는 테스트 카드예요.',
      imageUrl: TEST_IMAGE_URL,
      link: {
        webUrl: origin,
        mobileWebUrl: origin,
      },
    },
    buttons: [
      {
        title: '확인하기',
        link: {
          webUrl: origin,
          mobileWebUrl: origin,
        },
      },
    ],
  });
}
