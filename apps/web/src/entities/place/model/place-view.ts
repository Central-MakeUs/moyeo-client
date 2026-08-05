/** 상권 분류명 */
export type PlaceCategoryName = '발달상권' | '관광특구';

export interface PlaceStation {
  /** 지하철역명 */
  name: string;
  /** 해당 역의 호선명 목록. 예: ["2호선", "6호선"] */
  lineNames: string[];
}

export interface PlaceRecommendation {
  rank: number;
  /** 상권 코드. 장소 확정 요청(`commercialAreaCode`)에 쓴다. */
  areaCode: string;
  /** 상권명 */
  areaName: string;
  /** 자치구명. 없으면 undefined */
  guName?: string;
  /** 행정동명. 없으면 undefined */
  dongName?: string;
  categoryName?: PlaceCategoryName;
  /** 참여자 출발지에서 상권까지의 평균 직선거리(m). 랜덤 추천이면 undefined */
  averageStraightDistanceMeters?: number;
  /** 정원이 찬 뒤 저장된 평균 실제 이동시간(초). 직선거리 미리보기 단계면 undefined */
  averageTravelTimeSeconds?: number;
  /** 상권과 매핑된 지하철역. 매핑이 없으면(그냥 장소면) undefined */
  station?: PlaceStation;
}

export interface PlaceParticipant {
  participantId: number;
  /** 연결된 서비스 사용자 ID. 게스트 참여자는 null. "나" 판별에 쓴다. */
  userId: number | null;
  nickname: string;
  isHost: boolean;
  departureName: string;
}

export interface PlaceView {
  /** 현재 참여 인원(방장 포함) */
  participantCount: number;
  /** 추천 상권 목록. 추천이 없으면 빈 배열 */
  recommendations: PlaceRecommendation[];
  /** 참여자별 출발지 응답 현황 */
  participants: PlaceParticipant[];
}
