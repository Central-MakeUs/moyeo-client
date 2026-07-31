import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AvatarGroup } from './avatar-group';

function getAvatarTones(): (string | null)[] {
  const avatars = screen.getByTestId('group').querySelectorAll('[data-slot="avatar"]');

  return Array.from(avatars, (node) => node.getAttribute('data-tone'));
}

describe('AvatarGroup', () => {
  it('should render 5 avatars in order neutral,neutral,primary,primary,primary and no overflow badge when capacity is 5 and joinedCount is 3', () => {
    render(<AvatarGroup capacity={5} joinedCount={3} data-testid="group" />);

    expect(getAvatarTones()).toEqual(['neutral', 'neutral', 'primary', 'primary', 'primary']);
    expect(
      screen.getByTestId('group').querySelector('[data-slot="avatar-group-overflow"]')
    ).not.toBeInTheDocument();
  });

  it('should render 4 neutral avatars and a "+16" badge when capacity is 20 and joinedCount is 13', () => {
    render(<AvatarGroup capacity={20} joinedCount={13} data-testid="group" />);

    expect(getAvatarTones()).toEqual(['neutral', 'neutral', 'neutral', 'neutral']);
    expect(screen.getByText('+16')).toBeInTheDocument();
  });

  it('should give the overflow badge position:relative so it stacks above the preceding avatar', () => {
    render(<AvatarGroup capacity={20} joinedCount={13} data-testid="group" />);

    const badge = screen.getByTestId('group').querySelector('[data-slot="avatar-group-overflow"]');
    expect(badge).toHaveClass('relative');
  });

  it('should render a single avatar and no badge when capacity is 1', () => {
    render(<AvatarGroup capacity={1} joinedCount={1} data-testid="group" />);

    expect(getAvatarTones()).toEqual(['primary']);
    expect(
      screen.getByTestId('group').querySelector('[data-slot="avatar-group-overflow"]')
    ).not.toBeInTheDocument();
  });
});
