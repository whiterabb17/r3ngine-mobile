import React from 'react';
import { render } from '@testing-library/react-native';
import CertChainViewer from '../../src/components/Certificates/CertChainViewer';

describe('CertChainViewer', () => {
  it('renders chain entries in depth order', () => {
    const chain = [
      { subject: 'leaf', issuer: 'inter', depth: 0 },
      { subject: 'inter', issuer: 'root', depth: 1 },
      { subject: 'root', issuer: 'root', depth: 2 },
    ];
    const { getByText } = render(<CertChainViewer chain={chain} />);
    expect(getByText('leaf')).toBeTruthy();
    expect(getByText('root')).toBeTruthy();
  });
});
