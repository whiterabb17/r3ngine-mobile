import React from 'react';
import GenericToolScreen from '../../src/components/Tools/GenericToolScreen';
import { queryReverseWhois } from '../../src/api/tools';

const ReverseWhoisScreen = () => {
  return (
    <GenericToolScreen
      title="Reverse WHOIS"
      placeholder="e.g. Acme Corp or admin@example.com"
      description="Search for other domains registered by the same organization name or email address."
      onRun={(input) => queryReverseWhois(input)}
    />
  );
};

export default ReverseWhoisScreen;
