import type { CreateMeetingDraftState } from './create-meeting-draft';

/**
 * 위저드 스텝 키.
 *
 * ℹ️ CRT-05 커버사진('cover')은 **1차 MVP에서 제외**되어 여기 없다(crt-06.md 배너).
 *   후속 개발에서 갤러리 피커와 함께 재활성화할 때 'cover'를 다시 포함할 예정이다.
 *   → 그때 필요한 것: 이 유니온 · STEP_PATHS · getSteps · isStepComplete 각 한 줄.
 */
export type StepKey =
  | 'basic'
  | 'time-range'
  | 'deadline'
  | 'created'
  | 'schedule-dates'
  | 'schedule-times'
  | 'departure';

/**
 * 스텝 흐름을 결정하는 draft 부분집합.
 * 분기 조건이 늘어도(예: placeMode) 시그니처가 깨지지 않도록 객체로 받는다.
 */
export type StepFlowInput = Pick<CreateMeetingDraftState, 'planningType' | 'scheduleInputType'>;

const WIZARD_PATH_PREFIX = '/meetings/new/';

/** 스텝 키 → 라우트 경로 세그먼트. host 스텝만 2세그먼트다. */
const STEP_PATHS: Record<StepKey, string> = {
  basic: 'basic',
  'time-range': 'time-range',
  deadline: 'deadline',
  created: 'created',
  'schedule-dates': 'schedule/dates',
  'schedule-times': 'schedule/times',
  departure: 'departure',
};

/** 경로 세그먼트 → 스텝 키. stepFromPath는 렌더마다 불리므로 역방향 맵을 미리 만들어 둔다. */
const PATH_TO_STEP = new Map<string, StepKey>(
  Object.entries(STEP_PATHS).map(([step, path]) => [path, step as StepKey])
);

/**
 * planningType + scheduleInputType에 따른 스텝 순서 (spec-fixed §3-1).
 * PLACE_ONLY는 time-range를, DATE_ONLY는 schedule-times를 제외한다.
 *
 * ℹ️ 모임 유형(planningType) 선택은 **위저드 스텝이 아니다**(2026-07-27 기획 변경).
 *   HOME의 FAB → 유형 선택 Drawer에서 먼저 정해져 draft에 들어오고, 위저드는 basic부터 시작한다.
 *   따라서 스텝 배열에도, 진행률 분모에도 유형 선택은 들어가지 않는다.
 *
 * ℹ️ 커버사진(CRT-05)은 1차 MVP 제외라 흐름이 deadline → created 로 직행한다.
 *   재활성화 시 deadline 다음에 'cover'를 포함할 예정이다(StepKey 주석 참고).
 */
export function getSteps({ planningType, scheduleInputType }: StepFlowInput): StepKey[] {
  // 유형 미선택(= HOME Drawer를 거치지 않은 진입)이면 흐름 자체가 없다.
  // 어디로 보낼지는 라우팅 계층의 결정이다 — resolver가 HOME으로 돌려보낸다(crt-01.md §9-2/§9-3).
  if (planningType === null) return [];

  if (planningType === 'PLACE_ONLY') {
    return ['basic', 'deadline', 'created', 'departure'];
  }

  // 일정 조율 계열(SCHEDULE_ONLY · SCHEDULE_AND_PLACE) 공통 골격
  const steps: StepKey[] = ['basic', 'time-range', 'deadline', 'created', 'schedule-dates'];

  // DATE_AND_TIME만 방장 시간 입력(INV-02-B)을 갖는다.
  // scheduleInputType이 null이면 제외한다 — time-range 미완성이라 가드가 먼저 막는 상태다.
  if (scheduleInputType === 'DATE_AND_TIME') steps.push('schedule-times');

  if (planningType === 'SCHEDULE_AND_PLACE') steps.push('departure');

  return steps;
}

/** 스텝 완성 여부. 서버 제약을 통과하는지로 판정한다(spec-fixed §5-2). */
export function isStepComplete(step: StepKey, draft: CreateMeetingDraftState): boolean {
  switch (step) {
    case 'basic':
      return (
        // 이름 필수: trim 1자 이상, 최대 15자
        draft.name.trim().length >= 1 &&
        draft.name.length <= 15 &&
        // 설명 선택: 있으면 최대 100자
        draft.description.length <= 100 &&
        // 인원 필수: 2~20 선택됨
        draft.maxParticipants !== null &&
        draft.maxParticipants >= 2 &&
        draft.maxParticipants <= 20
      );
    case 'time-range':
      if (draft.scheduleInputType === 'DATE_ONLY') return true;
      if (draft.scheduleInputType === 'DATE_AND_TIME')
        return (
          draft.availableStartTime !== null &&
          draft.availableEndTime !== null &&
          draft.availableEndTime > draft.availableStartTime
        );
      return false;
    case 'deadline':
      if (draft.noDeadline) return true;
      return draft.deadlineMinutes !== null && draft.deadlineMinutes >= 10;
    case 'created':
      // Bridge 화면 — 입력이 없으므로 항상 통과다.
      // (false로 두면 뒤따르는 host 스텝의 가드가 영원히 막힌다)
      return true;
    case 'schedule-dates':
      return draft.scheduleCandidateDates.length >= 1;
    case 'schedule-times':
      // 모임장은 availableTimeRanges만 채운다. availableDates만 있으면 미완성이다.
      return (draft.scheduleResponse?.availableTimeRanges?.length ?? 0) >= 1;
    default:
      return false;
  }
}

/** 스텝 키 → 라우트 경로. */
export function stepToPath(step: StepKey): string {
  return `${WIZARD_PATH_PREFIX}${STEP_PATHS[step]}`;
}

/** 모임 유형이 없어 위저드를 열 수 없을 때 돌아갈 곳. HOME의 FAB에서 유형 Drawer를 다시 연다. */
const HOME_PATH = '/home';

/**
 * 지금 draft로 위저드를 열면 도착해야 할 경로.
 *
 * 진입점 resolver와 스텝 가드가 **같은 규칙**을 쓰도록 한 곳에 둔다.
 * 가드가 resolver로 넘기고 resolver가 다시 판단하면 화면이 한 번 더 렌더되고,
 * 두 곳의 규칙이 어긋나면 뒤로가기가 엉뚱한 곳으로 간다.
 *
 * - 유형 미선택(= 흐름 없음) → HOME
 * - 그 외 → 아직 못 채운 첫 스텝. 전부 채웠으면 마지막 스텝(= 제출 지점)
 */
export function resolveEntryPath(draft: CreateMeetingDraftState): string {
  const steps = getSteps(draft);
  const target = steps.find((step) => !isStepComplete(step, draft)) ?? steps[steps.length - 1];

  return target === undefined ? HOME_PATH : stepToPath(target);
}

/** 라우트 경로 → 스텝 키. 위저드 스텝이 아니면 null. */
export function stepFromPath(pathname: string): StepKey | null {
  if (!pathname.startsWith(WIZARD_PATH_PREFIX)) return null;

  const segment = pathname.slice(WIZARD_PATH_PREFIX.length).replace(/\/$/, '');

  return PATH_TO_STEP.get(segment) ?? null;
}

/**
 * 진행률 구간. Bridge(`created`)를 경계로 흐름이 둘로 나뉜다.
 * - `'create'` — 모임 정보 입력(CRT-02~CRT-04). 마지막 스텝에서 100%가 된다.
 * - `'host'`   — 모임장 참여 정보 입력(INV 화면 재사용). 0에서 다시 시작한다.
 */
export type StepPhase = 'create' | 'host';

/**
 * 스텝이 속한 진행률 구간. 흐름 밖이거나 Bridge면 null.
 * 경계는 `getSteps` 안의 `created` 위치로 판정하므로 스텝이 늘어도 따로 손댈 곳이 없다.
 */
export function stepPhase(step: StepKey, input: StepFlowInput): StepPhase | null {
  if (step === 'created') return null;

  const steps = getSteps(input);
  const index = steps.indexOf(step);

  if (index === -1) return null;

  return index < steps.indexOf('created') ? 'create' : 'host';
}

/**
 * 진행바 퍼센트. **분모는 전체 흐름이 아니라 현재 구간(`stepPhase`)의 입력 화면 수**다.
 *
 * CRT-06(`created`)은 "모임 정보 입력이 다 끝났다"를 알리는 Bridge라, 그 직전 스텝(CRT-04
 * deadline)에서 진행률이 **100%로 꽉 차야** 한다. 이어지는 host 입력 구간은 별개의 진행률로
 * 0부터 다시 시작한다. 모임 유형(CRT-01)은 위저드 스텝이 아니므로 어느 분모에도 없다.
 *
 * ℹ️ 'cover' 재활성화 시 create 구간 분모가 한 칸 늘어난다.
 */
export function progressPercent(step: StepKey, input: StepFlowInput): number {
  const phase = stepPhase(step, input);

  if (phase === null) return 100; // 흐름 밖(created 등)은 100%

  const steps = getSteps(input);
  const bridgeIndex = steps.indexOf('created');
  const phaseSteps =
    phase === 'create' ? steps.slice(0, bridgeIndex) : steps.slice(bridgeIndex + 1);
  const index = phaseSteps.indexOf(step);

  return Math.round(((index + 1) / phaseSteps.length) * 100);
}

/**
 * getSteps 순서에서 현재 스텝의 이전 스텝.
 * 첫 스텝이면 null(= 위저드 종료 지점, 뒤로가기가 HOME으로 나가야 함).
 */
export function prevStep(step: StepKey, input: StepFlowInput): StepKey | null {
  const steps = getSteps(input);
  const index = steps.indexOf(step);

  if (index <= 0) return null;

  return steps[index - 1] ?? null;
}

/** getSteps 순서에서 현재 스텝의 다음 스텝. 마지막이면 null(= 제출 지점). */
export function nextStep(step: StepKey, input: StepFlowInput): StepKey | null {
  const steps = getSteps(input);
  const index = steps.indexOf(step);

  if (index === -1 || index === steps.length - 1) return null;

  return steps[index + 1] ?? null;
}
