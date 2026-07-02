import { RoomPreviewSection } from '@/widgets/room-preview';

export const metadata = {
  title: 'FSD Example',
  description: 'Feature-Sliced Design layer composition example.',
};

export function ExamplePage() {
  return (
    <main className="flex min-h-svh flex-col gap-6 bg-slate-50 px-5 py-8 text-slate-950">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-500">FSD example</p>
        <h1 className="text-2xl font-bold">레이어 import 방향 예시</h1>
        <p className="text-sm leading-6 text-slate-600">
          이 페이지는 Next route entry에서 FSD page를 불러오고, page가 widget과 feature를 조합하는
          최소 예시입니다.
        </p>
      </section>

      <RoomPreviewSection />
    </main>
  );
}
