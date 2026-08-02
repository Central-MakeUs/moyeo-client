/** 상권 분류명 */
export type PlaceCategoryName = '발달상권' | '관광특구';

export interface PlaceRecommendation {
  rank: number;
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
}

export interface PlaceView {
  /** 현재 참여 인원(방장 포함) */
  participantCount: number;
  /** 추천 상권 목록. 추천이 없으면 빈 배열 */
  recommendations: PlaceRecommendation[];
}
