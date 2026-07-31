/** 이 개수를 넘는 정원은 슬롯을 전부 그리지 않고 오버플로 배지로 접는다. */
const INLINE_SLOT_LIMIT = 5;

/** 오버플로가 발생했을 때 실제로 그리는 아바타 개수. 나머지는 "+N" 배지가 대신한다. */
const COLLAPSED_SLOT_COUNT = 4;

export type AvatarSlot = 'empty' | 'filled';

export interface ComputeAvatarGroupSlotsInput {
  /** 정원 */
  capacity: number;
  /** 참여 완료 인원 */
  joinedCount: number;
}

export interface AvatarGroupSlots {
  /** 렌더할 아바타 슬롯. 회색(empty)이 항상 앞에 온다. */
  slots: AvatarSlot[];
  /** 오버플로 배지 숫자. 표시하지 않으면 null. */
  overflow: number | null;
}

function buildSlots(emptyCount: number, filledCount: number): AvatarSlot[] {
  return [
    ...Array.from<unknown, AvatarSlot>({ length: emptyCount }, () => 'empty'),
    ...Array.from<unknown, AvatarSlot>({ length: filledCount }, () => 'filled'),
  ];
}

/** 정원·참여 인원으로 아바타 슬롯을 계산한다. 잘못된 입력은 던지지 않고 클램프한다. */
export function computeAvatarGroupSlots({
  capacity,
  joinedCount,
}: ComputeAvatarGroupSlotsInput): AvatarGroupSlots {
  if (capacity <= 0) return { slots: [], overflow: null };

  const joined = Math.min(Math.max(joinedCount, 0), capacity);
  const unfilled = capacity - joined;

  if (capacity <= INLINE_SLOT_LIMIT) {
    return { slots: buildSlots(unfilled, joined), overflow: null };
  }

  const emptyCount = Math.min(COLLAPSED_SLOT_COUNT, unfilled);

  return {
    slots: buildSlots(emptyCount, COLLAPSED_SLOT_COUNT - emptyCount),
    overflow: capacity - COLLAPSED_SLOT_COUNT,
  };
}
