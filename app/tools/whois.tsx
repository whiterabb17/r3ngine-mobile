import React from 'react';
import GenericToolScreen from '../../src/components/Tools/GenericToolScreen';
import { queryWhois } from '../../src/api/tools';

const WhoisScreen = () => {
  return (
    <GenericToolScreen
      title="WHOIS Lookup"
      placeholder="e.g. google.com or 8.8.8.8"
      description="Enter a domain name or IP address to retrieve registration and ownership information."
      onRun={(input) => queryWhois(input)}
    />
  );
};

export default WhoisScreen;
