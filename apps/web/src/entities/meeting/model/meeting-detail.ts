/** 모임 생성 유형 */
export type MeetingPlanningType = 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE';

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
}
