import React from 'react';
import { render } from '@testing-library/react-native';
import ExposureCard from '../../src/components/Exposures/ExposureCard';

const e = {
  id: 1,
  title: 'Open SSH on edge',
  status: 'open' as const,
  severity: 'high' as const,
  asset_summary: { hostname: 'edge.example.com', port: 22 },
  evidence_data: {},
  linked_vulnerability_ids: [],
  created_at: '2026-06-20',
};

describe('ExposureCard', () => {
  it('renders title and asset', () => {
    const { getByText } = render(
      <ExposureCard exposure={e} onPress={() => {}} onLongPress={() => {}} selected={false} />,
    );
    expect(getByText('Open SSH on edge')).toBeTruthy();
    expect(getByText(/edge.example.com:22/)).toBeTruthy();
  });

  it('shows selected border when selected=true', () => {
    const { getByText } = render(
      <ExposureCard exposure={e} onPress={() => {}} onLongPress={() => {}} selected={true} />,
    );
    expect(getByText('Open SSH on edge')).toBeTruthy();
  });
});
