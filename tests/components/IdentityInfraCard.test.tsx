import React from 'react';
import { render } from '@testing-library/react-native';
import IdentityInfraCard from '../../src/components/Identity/IdentityInfraCard';

describe('IdentityInfraCard', () => {
  it('renders provider badge', () => {
    const item = {
      id: 1,
      provider: 'okta' as const,
      match_strength: 'high' as const,
      detection_signals: { matched_urls: ['x'], matched_titles: [], matched_headers: {} },
      first_seen: '',
    };
    const { getByText } = render(<IdentityInfraCard item={item} onPress={() => {}} />);
    expect(getByText('OKTA')).toBeTruthy();
  });

  it('renders signal count', () => {
    const item = {
      id: 2,
      provider: 'azure_ad' as const,
      match_strength: 'medium' as const,
      detection_signals: { matched_urls: ['a', 'b'], matched_titles: ['t'], matched_headers: {} },
      first_seen: '',
    };
    const { getByText } = render(<IdentityInfraCard item={item} onPress={() => {}} />);
    expect(getByText(/3 signals/)).toBeTruthy();
  });
});
