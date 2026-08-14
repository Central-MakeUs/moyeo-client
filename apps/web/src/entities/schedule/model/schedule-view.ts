/** "빠른 일자 순"(기본값) / "길게 만나는 순" 정렬 기준 */
export type ScheduleSort = 'EARLIEST_DATE' | 'LONGEST_MEETING';

/**
 * 일정 참여 입력 유형. 날짜만 고르는 모임과 시간까지 고르는 모임을 가른다.
 * `NONE`은 일정을 조율하지 않는 모임(PLACE_ONLY)이다.
 */
export type ScheduleInputType = 'DATE_ONLY' | 'DATE_AND_TIME' | 'NONE';

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
  /** 서버가 유형을 주지 않으면 undefined. 호출부는 유형을 아는 경우에만 갈라져야 한다. */
  scheduleInputType?: ScheduleInputType;
  /** 동시 참여 가능 인원이 최대인 후보 목록. 겹치는 시간이 없으면 빈 배열 */
  candidates: ScheduleCandidate[];
}
