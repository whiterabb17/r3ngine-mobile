import { mock } from './setup';
import apiClient from '../src/api/client';
import { getNotifications, getUnreadCount } from '../src/api/notifications';
import { fetchSubdomainHistory, fetchWhoisData } from '../src/api/tools';
import { fetchScanMetrics } from '../src/api/observability';

describe('Mobile API (/mapi/) Integration Tests', () => {
  
  describe('Scan & Engine Operations', () => {
    it('should fetch scan configuration correctly', async () => {
      const mockData = {
        engines: [
          { id: 1, engine_name: 'Full Scan', tasks: ['subdomain', 'port_scan'] },
          { id: 2, engine_name: 'Fast Scan', tasks: ['subdomain'] }
        ]
      };
      
      mock.onGet('/mapi/scans/configuration/').reply(200, mockData);
      
      const response = await apiClient.get('/mapi/scans/configuration/');
      expect(response.status).toBe(200);
      expect(response.data.engines).toHaveLength(2);
      expect(response.data.engines[0].engine_name).toBe('Full Scan');
    });

    it('should initiate a new scan', async () => {
      const payload = {
        engine_id: 1,
        domain_id: 10,
        importSubdomainTextArea: '',
      };
      
      mock.onPost('/mapi/action/initiate/scan/').reply(201, {
        status: true,
        message: 'Scan initiated successfully'
      });
      
      const response = await apiClient.post('/mapi/action/initiate/scan/', payload);
      expect(response.status).toBe(201);
      expect(response.data.status).toBe(true);
    });

    it('should initiate a subtask', async () => {
      const payload = {
        subdomain_id: 5,
        engine_id: 2,
        tasks: ['subdomain']
      };
      
      mock.onPost('/mapi/action/initiate/subtask/').reply(201, {
        status: true,
        message: 'Subscan initiated'
      });
      
      const response = await apiClient.post('/mapi/action/initiate/subtask/', payload);
      expect(response.status).toBe(201);
      expect(response.data.status).toBe(true);
    });
  });

  describe('Subdomain Operations', () => {
    it('should toggle important status', async () => {
      mock.onPost('/mapi/toggle/subdomain/important/').reply(200, {
        status: true
      });
      
      const response = await apiClient.post('/mapi/toggle/subdomain/important/', { subdomain_id: 123 });
      expect(response.status).toBe(200);
      expect(response.data.status).toBe(true);
    });

    it('should fetch subdomain history', async () => {
      mock.onGet('/mapi/subdomain/history/').reply(200, {
        results: [{ id: 1, change: 'IP changed' }]
      });
      
      const response = await fetchSubdomainHistory(123);
      expect(response.status).toBe(200);
      expect(response.data.results).toHaveLength(1);
    });
  });

  describe('Notification Operations', () => {
    it('should fetch notifications', async () => {
      mock.onGet('/mapi/notifications/').reply(200, [
        { id: 1, title: 'Scan Completed', description: 'Scan for example.com finished' }
      ]);
      
      const data = await getNotifications();
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Scan Completed');
    });

    it('should fetch unread count', async () => {
      mock.onGet('/mapi/notifications/unread_count/').reply(200, { count: 5 });
      
      const count = await getUnreadCount();
      expect(count).toBe(5);
    });
  });

  describe('Dashboard & Projects', () => {
    it('should fetch projects correctly', async () => {
      mock.onGet('/mapi/projects/').reply(200, [
        { name: 'Default Project', slug: 'default' }
      ]);
      
      const response = await apiClient.get('/mapi/projects/');
      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].slug).toBe('default');
    });

    it('should fetch dashboard data correctly', async () => {
      mock.onGet('/mapi/dashboard/default/').reply(200, {
        kpis: {
          domain_count: 10,
          subdomain_count: 50,
          endpoint_count: 100,
          vulnerability_count: 5
        }
      });
      
      const response = await apiClient.get('/mapi/dashboard/default/');
      expect(response.status).toBe(200);
      expect(response.data.kpis.domain_count).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      mock.onGet('/mapi/scans/configuration/').reply(401, { detail: 'Unauthorized' });
      
      try {
        await apiClient.get('/mapi/scans/configuration/');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should handle server errors', async () => {
      mock.onPost('/mapi/action/initiate/scan/').reply(500, { message: 'Internal Server Error' });
      
      try {
        await apiClient.post('/mapi/action/initiate/scan/', {});
      } catch (error: any) {
        expect(error.response.status).toBe(500);
      }
    });
  });
});
