import React from 'react';
import GenericToolScreen from '../../src/components/Tools/GenericToolScreen';
import { queryDomainIpHistory } from '../../src/api/tools';

const IpHistoryScreen = () => {
  return (
    <GenericToolScreen
      title="Domain IP History"
      placeholder="e.g. google.com"
      description="Retrieve historical IP addresses and infrastructure changes for a specific domain."
      onRun={(input) => queryDomainIpHistory(input)}
    />
  );
};

export default IpHistoryScreen;
