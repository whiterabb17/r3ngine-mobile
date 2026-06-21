import React from 'react';
import { render } from '@testing-library/react-native';
import NodeCard from '../../src/components/Graph/NodeCard';
import type { ChainGraphNode } from '../../src/api/graphIntel';

const baseNode: ChainGraphNode = {
  id: 'app::example.test',
  type: 'Application',
  color: '#0d9488',
  properties: { name: 'example.test', sensitivity: 'medium' },
};

describe('NodeCard', () => {
  it('renders the node type label in uppercase', () => {
    const { getByText } = render(<NodeCard node={baseNode} />);
    expect(getByText('APPLICATION')).toBeTruthy();
  });

  it('renders name from properties.name', () => {
    const { getByText } = render(<NodeCard node={baseNode} />);
    expect(getByText('example.test')).toBeTruthy();
  });

  it('falls back to host when name is absent', () => {
    const node: ChainGraphNode = {
      ...baseNode,
      properties: { host: 'host.example.test' },
    };
    const { getByText } = render(<NodeCard node={node} />);
    expect(getByText('host.example.test')).toBeTruthy();
  });

  it('falls back to node id when all name properties are absent', () => {
    const node: ChainGraphNode = { ...baseNode, properties: {} };
    const { getByText } = render(<NodeCard node={node} />);
    expect(getByText('app::example.test')).toBeTruthy();
  });

  it('renders without crashing for unknown node type', () => {
    const node: ChainGraphNode = { ...baseNode, type: 'Futuristic' };
    const { getByText } = render(<NodeCard node={node} />);
    expect(getByText('FUTURISTIC')).toBeTruthy();
  });
});
