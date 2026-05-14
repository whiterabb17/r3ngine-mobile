import React from 'react';
import GenericToolScreen from '../../src/components/Tools/GenericToolScreen';
import { queryIpToDomain } from '../../src/api/tools';

const IpToDomainScreen = () => {
  return (
    <GenericToolScreen
      title="IP to Domain"
      placeholder="e.g. 8.8.8.8 or 104.16.0.0/24"
      description="Resolve IP addresses or CIDR blocks back to their associated hostnames and PTR records."
      onRun={(input) => queryIpToDomain(input)}
    />
  );
};

export default IpToDomainScreen;
