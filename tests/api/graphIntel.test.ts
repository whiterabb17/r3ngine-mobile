// tests/api/graphIntel.test.ts
import { mock } from '../setup';
import {
  getFullChainGraph,
  getChainNodesByType,
  GRAPH_KEYS,
} from '../../src/api/graphIntel';

describe('graphIntel — getFullChainGraph', () => {
  it('GETs /mapi/graph/chain/ with scan_id param', async () => {
    mock.onGet('/mapi/graph/chain/').reply(200, {
      nodes: [
        { id: 'app::example.test', type: 'Application', color: '#0d9488', properties: { name: 'example.test' } },
        { id: 'org::example', type: 'Organization', color: '#d97706', properties: { name: 'Example Corp' } },
      ],
      edges: [
        { from: 'org::example', to: 'app::example.test', type: 'PART_OF', confidence: 0.9 },
      ],
    });
    const res = await getFullChainGraph(7);
    expect(res.nodes).toHaveLength(2);
    expect(res.nodes[0].type).toBe('Application');
    expect(res.edges[0].type).toBe('PART_OF');
    expect(mock.history.get[0].params).toEqual({ scan_id: 7 });
  });

  it('returns empty nodes and edges on empty response', async () => {
    mock.onGet('/mapi/graph/chain/').reply(200, { nodes: [], edges: [] });
    const res = await getFullChainGraph(1);
    expect(res.nodes).toHaveLength(0);
    expect(res.edges).toHaveLength(0);
  });
});

describe('graphIntel — getChainNodesByType', () => {
  it('GETs /mapi/graph/chain/nodes/ with scan_id and type params', async () => {
    mock.onGet('/mapi/graph/chain/nodes/').reply(200, {
      type: 'APIEndpoint',
      count: 3,
      nodes: [
        { id: 'api::https://api.example.test/v1', base_url: 'https://api.example.test/v1', api_type: 'rest' },
      ],
    });
    const res = await getChainNodesByType(7, 'APIEndpoint');
    expect(res.type).toBe('APIEndpoint');
    expect(res.count).toBe(3);
    expect(res.nodes).toHaveLength(1);
    expect(mock.history.get[0].params).toEqual({ scan_id: 7, type: 'APIEndpoint' });
  });
});

describe('graphIntel — GRAPH_KEYS', () => {
  it('chain key is a stable tuple', () => {
    expect(GRAPH_KEYS.chain(1)).toEqual(['graph', 'chain', 1]);
  });

  it('chainNodes key is a stable tuple', () => {
    expect(GRAPH_KEYS.chainNodes(1, 'Application')).toEqual(['graph', 'chain', 'nodes', 1, 'Application']);
  });
});
