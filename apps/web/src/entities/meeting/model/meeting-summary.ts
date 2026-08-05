export interface MeetingSummary {
  meetingId: number;
  /** 모임 현황(VIEW-01) 화면 조회에 쓰는 초대 코드 */
  inviteCode: string;
  name: string;
  /** 없으면 Thumbnail이 자체 플레이스홀더로 대체 */
  coverImageUrl?: string;
  /** Item.maxParticipants ?? 0 */
  capacity: number;
  /** Item.participantCount ?? 0 */
  joinedCount: number;
  confirmedScheduleDate?: string;
  confirmedStartTime?: string;
  confirmedEndTime?: string;
  confirmedPlaceName?: string;
}
