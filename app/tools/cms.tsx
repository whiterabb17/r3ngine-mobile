import React from 'react';
import GenericToolScreen from '../../src/components/Tools/GenericToolScreen';
import { queryCmsDetector } from '../../src/api/tools';

const CmsScreen = () => {
  return (
    <GenericToolScreen
      title="CMS Detector"
      placeholder="e.g. https://example.com"
      description="Identify the Content Management System (CMS) and technology stack being used by the target URL."
      onRun={(input) => queryCmsDetector(input)}
    />
  );
};

export default CmsScreen;
