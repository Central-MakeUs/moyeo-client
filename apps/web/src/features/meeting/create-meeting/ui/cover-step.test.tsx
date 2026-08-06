import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { isNativeContext, requestPickImage } from '@/shared/model';
import { toast } from '@/shared/ui';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { CoverStep } from './cover-step';

vi.mock('@/shared/model', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/model')>()),
  isNativeContext: vi.fn(),
  requestPickImage: vi.fn(),
}));

/** jsdom에는 캔버스가 없어 실제 축소를 돌릴 수 없다. 브라우저 경로는 변환 결과만 대신 넣는다. */
vi.mock('@/shared/lib/normalize-cover-image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/normalize-cover-image')>()),
  normalizeCoverImage: vi.fn(),
}));

const { normalizeCoverImage } = await import('@/shared/lib/normalize-cover-image');

const DATA_URL = 'data:image/jpeg;base64,AAAA';

const asMock = vi.mocked;

describe('CoverStep', () => {
  beforeEach(() => {
    // vi.mock 팩토리가 만든 모의 함수는 restoreAllMocks 대상이 아니라 호출 기록이 계속 쌓인다.
    vi.clearAllMocks();
    useCreateMeetingDraft.setState({
      name: '데모데이에 모여',
      maxParticipants: 5,
      coverImage: null,
    });
    asMock(isNativeContext).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('사진을 고르지 않아도 다음 버튼이 활성이다', async () => {
    const onNext = vi.fn();
    render(<CoverStep onNext={onNext} />);

    const next = screen.getByRole('button', { name: '다음' });
    expect(next).toBeEnabled();

    await userEvent.click(next);
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('미리보기 카드에 앞 단계에서 입력한 모임 이름이 나온다', () => {
    render(<CoverStep onNext={vi.fn()} />);

    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
  });

  it('미리보기 카드에는 참여 인원을 표시하지 않는다', () => {
    // 아직 만들어지지 않은 모임이라 참여자라는 개념이 없다.
    render(<CoverStep onNext={vi.fn()} />);

    expect(document.body).not.toHaveTextContent('참여중');
  });

  it('앱에서 사진 추가를 누르면 네이티브 앨범을 요청하고 고른 사진을 미리보기에 반영한다', async () => {
    asMock(requestPickImage).mockResolvedValue({
      state: 'success',
      image: { dataUrl: DATA_URL },
    });
    render(<CoverStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /사진 추가/ }));

    expect(requestPickImage).toHaveBeenCalledOnce();
    expect(await screen.findByAltText('선택한 커버 사진')).toHaveAttribute('src', DATA_URL);
    expect(useCreateMeetingDraft.getState().coverImage).toBe(DATA_URL);
  });

  it('권한을 거부하면 권한 안내만 하고 커버 없이 진행할 수 있다', async () => {
    const add = vi.spyOn(toast, 'add');
    asMock(requestPickImage).mockResolvedValue({ state: 'denied' });
    render(<CoverStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /사진 추가/ }));

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining('사진 접근을 허용하면') })
    );
    expect(useCreateMeetingDraft.getState().coverImage).toBeNull();
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it('앨범을 열지 못하면 재시도를 안내한다', async () => {
    const add = vi.spyOn(toast, 'add');
    asMock(requestPickImage).mockResolvedValue({ state: 'error' });
    render(<CoverStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /사진 추가/ }));

    // 권한 문제와 달리 다시 눌러 볼 여지가 있다.
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining('잠시 후 다시 시도') })
    );
  });

  it('네이티브 응답이 오지 않아도 재시도를 안내한다', async () => {
    const add = vi.spyOn(toast, 'add');
    asMock(requestPickImage).mockRejectedValue(new Error('timeout'));
    render(<CoverStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /사진 추가/ }));

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining('잠시 후 다시 시도') })
    );
  });

  it('앨범을 그냥 닫으면 아무것도 알리지 않는다', async () => {
    const add = vi.spyOn(toast, 'add');
    asMock(requestPickImage).mockResolvedValue({ state: 'cancelled' });
    render(<CoverStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /사진 추가/ }));

    expect(add).not.toHaveBeenCalled();
    expect(useCreateMeetingDraft.getState().coverImage).toBeNull();
  });

  it('삭제 버튼을 누르면 사진이 제거되고 기본 커버로 돌아간다', async () => {
    useCreateMeetingDraft.setState({ coverImage: DATA_URL });
    render(<CoverStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '커버 사진 삭제' }));

    expect(screen.queryByAltText('선택한 커버 사진')).not.toBeInTheDocument();
    expect(useCreateMeetingDraft.getState().coverImage).toBeNull();
  });

  it('브라우저에서는 네이티브를 부르지 않고 파일 선택창을 연다', async () => {
    asMock(isNativeContext).mockReturnValue(false);
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<CoverStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /사진 추가/ }));

    expect(requestPickImage).not.toHaveBeenCalled();
    expect(click).toHaveBeenCalledOnce();
  });

  it('JPG·PNG가 아닌 파일을 고르면 형식을 안내하고 변환하지 않는다', async () => {
    asMock(isNativeContext).mockReturnValue(false);
    const add = vi.spyOn(toast, 'add');
    const { container } = render(<CoverStep onNext={vi.fn()} />);

    const input = container.querySelector('input[type="file"]');
    if (input === null) throw new Error('파일 입력이 없다');

    // 선택창의 형식 필터를 `모든 파일`로 바꾸면 accept를 우회할 수 있다.
    // userEvent.upload는 accept에 맞지 않는 파일을 걸러 버리므로 change를 직접 일으킨다.
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'clip.mp4', { type: 'video/mp4' })] },
    });

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining('JPG, PNG') })
    );
    expect(normalizeCoverImage).not.toHaveBeenCalled();
    expect(useCreateMeetingDraft.getState().coverImage).toBeNull();
  });

  it('고른 사진을 읽지 못하면 다른 사진을 고르도록 안내한다', async () => {
    asMock(isNativeContext).mockReturnValue(false);
    asMock(normalizeCoverImage).mockRejectedValue(new Error('decode failed'));
    const add = vi.spyOn(toast, 'add');
    const { container } = render(<CoverStep onNext={vi.fn()} />);

    const input = container.querySelector('input[type="file"]');
    if (input === null) throw new Error('파일 입력이 없다');

    await userEvent.upload(
      input as HTMLInputElement,
      new File(['x'], 'broken.png', { type: 'image/png' })
    );

    // 같은 사진으로 다시 눌러도 결과가 같으므로 재시도를 권하지 않는다.
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining('다른 사진') })
    );
  });

  it('브라우저에서 고른 파일은 축소한 결과를 초안에 담는다', async () => {
    asMock(isNativeContext).mockReturnValue(false);
    asMock(normalizeCoverImage).mockResolvedValue(DATA_URL);
    const { container } = render(<CoverStep onNext={vi.fn()} />);

    const input = container.querySelector('input[type="file"]');
    if (input === null) throw new Error('파일 입력이 없다');

    await userEvent.upload(
      input as HTMLInputElement,
      new File(['x'], 'photo.png', { type: 'image/png' })
    );

    expect(await screen.findByAltText('선택한 커버 사진')).toHaveAttribute('src', DATA_URL);
  });
});
