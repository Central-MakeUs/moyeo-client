import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {/*
        상태바 뒤 안전 영역은 항상 흰색이고 웹도 라이트 전용이라 글자색을 고정한다.
        "auto"는 기기 시스템 테마를 따라가서, 다크 모드에선 흰 배경에 흰 글자가 돼 시계가 안 보인다.
      */}
      <StatusBar style="dark" />
    </>
  );
}
