import React from 'react';
import { render } from '@testing-library/react-native';
import PipelineBuilderView, { TASK_TIER_MAP, TIER_LABELS } from '../src/components/Scan/PipelineBuilderView';

describe('PipelineBuilderView', () => {
  it('renders tier badges for active tasks', () => {
    const { getAllByText } = render(
      <PipelineBuilderView tasks={['subdomain_discovery', 'http_crawl', 'vulnerability_scan']} />
    );
    expect(getAllByText('T1').length).toBeGreaterThan(0);
    expect(getAllByText('T2').length).toBeGreaterThan(0);
    expect(getAllByText('T6').length).toBeGreaterThan(0);
  });

  it('TASK_TIER_MAP maps subdomain_discovery to tier 1', () => {
    expect(TASK_TIER_MAP['subdomain_discovery']).toBe(1);
  });

  it('TASK_TIER_MAP maps vulnerability_scan to tier 6', () => {
    expect(TASK_TIER_MAP['vulnerability_scan']).toBe(6);
  });

  it('TIER_LABELS has entries for tiers 1 through 7', () => {
    for (let i = 1; i <= 7; i++) {
      expect(TIER_LABELS[i]).toBeDefined();
    }
  });
});
