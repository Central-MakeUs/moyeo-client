/** 모임 생성 유형 */
export type MeetingPlanningType = 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE';

export interface MeetingParticipant {
  participantId: number;
  /** 연결된 서비스 사용자 ID. 게스트 참여자는 null. "나" 판별에 쓴다. */
  userId: number | null;
  nickname: string;
  isHost: boolean;
}

export interface MeetingDetail {
  name: string;
  /** 입력하지 않았으면 undefined */
  description?: string;
  /** 없으면 Thumbnail이 자체 플레이스홀더로 대체 */
  coverImageUrl?: string;
  /** 최대 참여 인원 */
  capacity: number;
  /** 현재 참여 인원 */
  joinedCount: number;
  planningType: MeetingPlanningType;
  /** 일정과 장소가 모두 확정됐는지. 한쪽만 조율하는 모임은 그 하나로 확정된다. */
  isConfirmed: boolean;
  /** 확정된 일정 날짜(YYYY-MM-DD). 아직 확정 전이거나 장소 전용 모임이면 undefined */
  confirmedScheduleDate?: string;
  /** 확정된 시작 시간. DATE_ONLY 모임이면 확정돼도 undefined */
  confirmedStartTime?: string;
  /** 확정된 종료 시간. DATE_ONLY 모임이면 확정돼도 undefined */
  confirmedEndTime?: string;
  /** 확정된 장소명. 아직 확정 전이거나 일정 전용 모임이면 undefined */
  confirmedPlaceName?: string;
  /** 참여자 목록. 모임장이 먼저 오고 이후 참여 순서다. */
  participants: MeetingParticipant[];
}
