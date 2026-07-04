import { RoomSummaryCard, sampleRoom } from '@/entities/room';
import { CreateRoomButton } from '@/features/room/create-room';

export function RoomPreviewSection() {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-500">Widget section</p>
        <h2 className="mt-1 text-lg font-semibold">모임 미리보기</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          widget은 entity UI와 feature action을 조합해 페이지의 독립 섹션을 구성합니다.
        </p>
      </div>

      <RoomSummaryCard room={sampleRoom} />
      <CreateRoomButton />
    </section>
  );
}
