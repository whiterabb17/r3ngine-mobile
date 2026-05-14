import React from 'react';
import GenericToolScreen from '../../src/components/Tools/GenericToolScreen';
import { queryWafDetector } from '../../src/api/tools';

const WafScreen = () => {
  return (
    <GenericToolScreen
      title="WAF Detector"
      placeholder="e.g. https://example.com"
      description="Analyze a URL to identify if it is behind a Web Application Firewall (WAF) such as Cloudflare, Akamai, or AWS WAF."
      onRun={(input) => queryWafDetector(input)}
    />
  );
};

export default WafScreen;
