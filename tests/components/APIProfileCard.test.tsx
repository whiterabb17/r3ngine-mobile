import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import APIProfileCard from '../../src/components/APIIntel/APIProfileCard';
import type { APIIntelProfile } from '../../src/api/apiIntel';

const BASE_PROFILE: APIIntelProfile = {
  id: 1,
  scan_history: 5,
  target_domain: 1,
  subdomain: null,
  base_url: 'https://api.example.test/v1',
  api_type: 'rest',
  endpoint_count: 12,
  requires_auth: true,
  auth_scheme: 'Bearer',
  parameters_sample: [],
  graphql_schema_snippet: null,
  raw_endpoints: [],
};

describe('APIProfileCard', () => {
  it('renders the base_url', () => {
    const { getByText } = render(<APIProfileCard profile={BASE_PROFILE} />);
    expect(getByText('https://api.example.test/v1')).toBeTruthy();
  });

  it('renders endpoint count', () => {
    const { getByText } = render(<APIProfileCard profile={BASE_PROFILE} />);
    expect(getByText('12 endpoints')).toBeTruthy();
  });

  it('shows auth scheme when requires_auth is true', () => {
    const { getByText } = render(<APIProfileCard profile={BASE_PROFILE} />);
    expect(getByText('Bearer')).toBeTruthy();
  });

  it('shows "No Auth" when requires_auth is false', () => {
    const profile = { ...BASE_PROFILE, requires_auth: false, auth_scheme: null };
    const { getByText } = render(<APIProfileCard profile={profile} />);
    expect(getByText('No Auth')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <APIProfileCard profile={BASE_PROFILE} onPress={onPress} testID="card" />,
    );
    fireEvent.press(getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without crashing for unknown api_type', () => {
    const profile = { ...BASE_PROFILE, api_type: 'grpc' as any };
    expect(() => render(<APIProfileCard profile={profile} />)).not.toThrow();
  });
});
