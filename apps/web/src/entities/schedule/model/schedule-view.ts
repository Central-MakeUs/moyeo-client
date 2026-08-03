/** "빠른 일자 순"(기본값) / "길게 만나는 순" 정렬 기준 */
export type ScheduleSort = 'EARLIEST_DATE' | 'LONGEST_MEETING';

export interface ScheduleCandidateParticipant {
  participantId: number;
  /** 연결된 서비스 사용자 ID. 게스트 참여자는 null. "나" 판별에 쓴다. */
  userId: number | null;
  nickname: string;
}

export interface ScheduleCandidate {
  /** ISO 날짜(YYYY-MM-DD) */
  candidateDate: string;
  /** "HH:mm:ss". DATE_ONLY 모임이면 undefined */
  startTime?: string;
  /** "HH:mm:ss". DATE_ONLY 모임이면 undefined */
  endTime?: string;
  availableParticipantCount: number;
  availableParticipants: ScheduleCandidateParticipant[];
}

export interface ScheduleView {
  /** 현재 참여 인원(방장 포함) */
  participantCount: number;
  /** 동시 참여 가능 인원이 최대인 후보 목록. 겹치는 시간이 없으면 빈 배열 */
  candidates: ScheduleCandidate[];
}
