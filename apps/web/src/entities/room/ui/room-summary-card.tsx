import type { Room } from '../model/types';

type RoomSummaryCardProps = {
  room: Room;
};

export function RoomSummaryCard({ room }: RoomSummaryCardProps) {
  return (
    <article className="rounded-lg bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Entity UI</p>
          <h3 className="mt-1 text-base font-semibold">{room.name}</h3>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {room.status}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-white p-3">
          <dt className="text-slate-500">참여자</dt>
          <dd className="mt-1 font-semibold">{room.memberCount}명</dd>
        </div>
        <div className="rounded-md bg-white p-3">
          <dt className="text-slate-500">모임일</dt>
          <dd className="mt-1 font-semibold">{room.meetingDate}</dd>
        </div>
      </dl>
    </article>
  );
}
