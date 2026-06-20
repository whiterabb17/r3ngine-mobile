import React from 'react';
import { render } from '@testing-library/react-native';
import PriorityBadge from '../../src/components/Intelligence/PriorityBadge';

describe('PriorityBadge', () => {
  it('renders P0 label', () => {
    const { getByText } = render(<PriorityBadge priority="P0" />);
    expect(getByText('P0')).toBeTruthy();
  });

  it('renders neutral ? for unknown', () => {
    // @ts-expect-error intentional bad input
    const { getByText } = render(<PriorityBadge priority={'WTF'} />);
    expect(getByText('?')).toBeTruthy();
  });
});
