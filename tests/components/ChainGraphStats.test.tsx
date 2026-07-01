import React from 'react';
import { render } from '@testing-library/react-native';
import ChainGraphStats from '../../src/components/Graph/ChainGraphStats';
import type { ChainGraphNode, ChainGraphEdge } from '../../src/api/graphIntel';

const nodes: ChainGraphNode[] = [
  { id: 'app::a.test', type: 'Application', color: '#0d9488', properties: {} },
  { id: 'api::b.test', type: 'APIEndpoint', color: '#ec4899', properties: {} },
  { id: 'app::c.test', type: 'Application', color: '#0d9488', properties: {} },
];
const edges: ChainGraphEdge[] = [
  { from: 'app::a.test', to: 'api::b.test', type: 'DEPENDS_ON' },
  { from: 'org::x', to: 'app::a.test', type: 'PART_OF' },
];

describe('ChainGraphStats', () => {
  it('renders total node count', () => {
    const { getAllByText } = render(<ChainGraphStats nodes={nodes} edges={edges} />);
    // "3" appears as total nodes
    const threes = getAllByText('3');
    expect(threes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders unique edge type count', () => {
    // 2 unique edge types: DEPENDS_ON, PART_OF
    const { getAllByText } = render(<ChainGraphStats nodes={nodes} edges={edges} />);
    const twos = getAllByText('2');
    expect(twos.length).toBeGreaterThanOrEqual(1);
  });

  it('renders unique node type count', () => {
    // 2 unique node types: Application, APIEndpoint
    const { getAllByText } = render(<ChainGraphStats nodes={nodes} edges={edges} />);
    const twos = getAllByText('2');
    expect(twos.length).toBeGreaterThanOrEqual(1);
  });

  it('renders zero stats gracefully on empty data', () => {
    const { getAllByText } = render(<ChainGraphStats nodes={[]} edges={[]} />);
    const zeros = getAllByText('0');
    expect(zeros.length).toBe(3);
  });
});
