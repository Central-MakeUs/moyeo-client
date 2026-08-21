import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { TextareaField } from './textarea';

describe('TextareaField', () => {
  it('always이면 빈 값에서도 글자 수를 표시한다', () => {
    render(
      <TextareaField
        aria-label="의견"
        maxLength={100}
        characterCountVisibility="always"
        value=""
        onChange={() => undefined}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('0/100');
  });

  it('auto이면 빈 입력은 포커스된 동안 글자 수를 표시한다', () => {
    render(<TextareaField aria-label="의견" maxLength={100} characterCountVisibility="auto" />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    const textarea = screen.getByRole('textbox', { name: '의견' });

    fireEvent.focus(textarea);

    expect(screen.getByRole('status')).toHaveTextContent('0/100');

    fireEvent.change(textarea, { target: { value: '안녕' } });

    expect(screen.getByRole('status')).toHaveTextContent('2/100');

    fireEvent.blur(textarea);

    expect(screen.getByRole('status')).toHaveTextContent('2/100');
  });

  it('auto이면 값이 있을 때 포커스되지 않아도 글자 수를 표시한다', () => {
    render(
      <TextareaField
        aria-label="의견"
        maxLength={100}
        defaultValue="안녕하세요"
        characterCountVisibility="auto"
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('5/100');
  });

  it('className은 FieldShell에, textareaClassName은 textarea에 적용한다', () => {
    render(<TextareaField aria-label="의견" className="h-[92px]" textareaClassName="text-right" />);

    const textarea = screen.getByRole('textbox', { name: '의견' });

    expect(textarea).toHaveClass('text-right');
    expect(textarea).not.toHaveClass('h-[92px]');
    expect(textarea.closest('[data-slot="field-shell"]')).toHaveClass('h-[92px]');
  });

  it('최대 글자 수에 도달하면 오류로 표시하지 않고 FieldShell을 강조한다', () => {
    render(
      <TextareaField aria-label="의견" maxLength={2} value="안녕" onChange={() => undefined} />
    );

    const textarea = screen.getByRole('textbox', { name: '의견' });
    const fieldShell = textarea.closest('[data-slot="field-shell"]');

    expect(fieldShell).toHaveAttribute('data-limit-reached', 'true');
    expect(fieldShell).not.toHaveAttribute('data-invalid');
    expect(textarea).not.toHaveAttribute('aria-invalid', 'true');
  });
});
