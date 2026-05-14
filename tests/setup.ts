import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import apiClient from '../src/api/client';

// This will allow us to mock calls made through the shared apiClient
export const mock = new MockAdapter(apiClient);

// Reset mocks between tests
afterEach(() => {
  mock.reset();
});
