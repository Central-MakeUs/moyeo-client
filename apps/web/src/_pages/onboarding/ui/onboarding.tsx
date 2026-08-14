'use client';

import { useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { useRouter } from 'next/navigation';

import { markOnboardingSeen } from '@/entities/onboarding';
import { cn } from '@/shared/lib/cn';
import { useBackHandler } from '@/shared/model';
import { Button, CTASection, PageIndicator } from '@/shared/ui';

import ConfirmedIllustration from '../assets/onboarding-confirmed.png';
import LocationIllustration from '../assets/onboarding-location.png';
import ScheduleIllustration from '../assets/onboarding-schedule.png';

const LOGIN_PATH = '/login';

interface OnboardingSlide {
  illustration: StaticImageData;
  title: string;
  description: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    illustration: ScheduleIllustration,
    title: '일정 맞추기',
    description: '모두에게 최적의 일정을 추천해요',
  },
  {
    illustration: LocationIllustration,
    title: '위치 맞추기',
    description: '모두에게 공평한 위치를 추천해요',
  },
  {
    illustration: ConfirmedIllustration,
    title: '모임 확정!',
    description: '이제 만나기만 하면 돼요',
  },
];

/**
 * 앱 최초 진입 시 서비스를 소개하는 3장짜리 화면.
 *
 * 캐러셀을 쓰지 않는다 — 스와이프 없이 하단 버튼으로만 넘어가고, 위치는 로컬 상태로 든다.
 * 마지막 장에서 열람 기록을 남기므로, 중간에 이탈하면 다음 실행에 처음부터 다시 본다.
 */
export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const slide = SLIDES[step];
  const isLastStep = step === SLIDES.length - 1;

  // 앱 뒤로가기로 이전 장에 돌아간다. 첫 장에서는 넘겨서 기존 종료 확인 흐름을 그대로 둔다.
  useBackHandler(() => {
    setStep((current) => current - 1);
    return true;
  }, step > 0);

  const handleNext = () => {
    if (!isLastStep) {
      setStep((current) => current + 1);
      return;
    }

    markOnboardingSeen();
    router.replace(LOGIN_PATH);
  };

  if (!slide) return null;

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/*
        CTA는 아래에 고정하고 본문만 넘칠 때 스크롤된다(`CompletionLayout`과 같은 구조).
        높이를 `h-dvh`로 직접 잡는 이유는 이 화면의 라우트 레이아웃((public))이 높이를
        주지 않기 때문이다 — `h-full`을 쓰면 내용 높이로 접혀 CTA가 위로 딸려 올라간다.

        세로 가운데 정렬은 위아래 spacer의 flex-grow로 잡는다 — `justify-center`를 쓰면
        본문이 넘칠 때 위쪽이 잘려 스크롤로도 닿지 못한다.
      */}
      <main className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
        <div aria-hidden="true" className="grow" />

        <div className="flex w-full shrink-0 flex-col items-center gap-17">
          <div className="flex w-full flex-col items-center justify-center gap-12">
            {/*
              보이지 않는 장도 DOM에 두고 숨긴다. 눌러서 넘어간 뒤에야 이미지를 받아오면
              그 사이 빈 자리가 보이기 때문에, 처음 렌더에 세 장을 모두 받아둔다.
            */}
            <div className="w-full">
              {SLIDES.map((item, index) => (
                <Image
                  key={item.title}
                  src={item.illustration}
                  alt=""
                  priority
                  draggable={false}
                  className={cn('w-full', index !== step && 'hidden')}
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-1 px-5 text-center" aria-live="polite">
              <h1 className="text-extrabold-20 text-neutral-800">{slide.title}</h1>
              <p className="text-medium-16 text-neutral-800">{slide.description}</p>
            </div>
          </div>

          <PageIndicator count={SLIDES.length} selectedIndex={step} />
        </div>

        <div aria-hidden="true" className="grow" />
      </main>

      <CTASection
        primaryAction={
          <Button fullWidth onClick={handleNext}>
            {isLastStep ? '시작하기' : '다음'}
          </Button>
        }
      />
    </div>
  );
}
