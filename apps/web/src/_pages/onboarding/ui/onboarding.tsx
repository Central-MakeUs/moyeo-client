'use client';

import { useCallback, useEffect, useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { useRouter } from 'next/navigation';

import { markOnboardingSeen } from '@/entities/onboarding';
import { useBackHandler } from '@/shared/model';
import { Button, CTASection } from '@/shared/ui';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselPageControl,
} from '@/shared/ui/carousel';

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
 * 스와이프로 앞뒤 장을 오갈 수 있고, 하단 버튼으로도 다음 장으로 넘어간다.
 * 마지막 장에서 열람 기록을 남기므로, 중간에 이탈하면 다음 실행에 처음부터 다시 본다.
 */
export function OnboardingPage() {
  const router = useRouter();
  const [api, setApi] = useState<CarouselApi>();
  const [step, setStep] = useState(0);

  const isLastStep = step === SLIDES.length - 1;

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => setStep(api.selectedScrollSnap());
    handleSelect();
    api.on('select', handleSelect);

    return () => {
      api.off('select', handleSelect);
    };
  }, [api]);

  // 앱 뒤로가기로 이전 장에 돌아간다. 첫 장에서는 넘겨서 기존 종료 확인 흐름을 그대로 둔다.
  useBackHandler(() => {
    api?.scrollPrev();
    return true;
  }, step > 0);

  const handleNext = useCallback(() => {
    if (!isLastStep) {
      api?.scrollNext();
      return;
    }

    markOnboardingSeen();
    router.replace(LOGIN_PATH);
  }, [api, isLastStep, router]);

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

        {/* loop: false — 마지막 장에서 더 넘기면 "시작하기" 버튼으로만 완료하도록 순환을 막는다. */}
        <Carousel
          setApi={setApi}
          opts={{ loop: false }}
          className="flex w-full shrink-0 flex-col items-center gap-17"
        >
          <CarouselContent>
            {SLIDES.map((item) => (
              <CarouselItem
                key={item.title}
                className="flex flex-col items-center justify-center gap-12"
              >
                <Image
                  src={item.illustration}
                  alt=""
                  priority
                  draggable={false}
                  className="w-full"
                />

                <div
                  className="flex flex-col items-center gap-1 px-5 text-center"
                  aria-live="polite"
                >
                  <h1 className="text-extrabold-20 text-neutral-800">{item.title}</h1>
                  <p className="text-medium-16 text-neutral-800">{item.description}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPageControl className="mt-0" />
        </Carousel>

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
