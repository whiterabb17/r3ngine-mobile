jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
}));

import { useInstanceStore } from '../src/store/useInstanceStore';

beforeEach(() => {
  useInstanceStore.setState({ instances: [], currentInstanceId: null });
});

describe('useInstanceStore', () => {
  it('addInstance appends an instance and returns an id', () => {
    const id = useInstanceStore.getState().addInstance({
      label: 'Prod', serverIp: 'http://192.168.1.1:8000', token: null, refreshToken: null,
    });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    const { instances } = useInstanceStore.getState();
    expect(instances).toHaveLength(1);
    expect(instances[0].id).toBe(id);
    expect(instances[0].label).toBe('Prod');
  });

  it('removeInstance removes a non-active instance', () => {
    const id = useInstanceStore.getState().addInstance({
      label: 'Lab', serverIp: 'http://10.0.0.1:8000', token: null, refreshToken: null,
    });
    useInstanceStore.getState().removeInstance(id);
    expect(useInstanceStore.getState().instances).toHaveLength(0);
  });

  it('removeInstance does nothing when id is the active instance', () => {
    const id = useInstanceStore.getState().addInstance({
      label: 'Active', serverIp: 'http://10.0.0.2:8000', token: null, refreshToken: null,
    });
    useInstanceStore.setState({ currentInstanceId: id });
    useInstanceStore.getState().removeInstance(id);
    expect(useInstanceStore.getState().instances).toHaveLength(1);
  });

  it('updateTokens updates tokens for the matching instance', () => {
    const id = useInstanceStore.getState().addInstance({
      label: 'Dev', serverIp: 'http://10.0.0.3:8000', token: null, refreshToken: null,
    });
    useInstanceStore.getState().updateTokens(id, 'access-abc', 'refresh-xyz');
    const inst = useInstanceStore.getState().instances.find(i => i.id === id);
    expect(inst?.token).toBe('access-abc');
    expect(inst?.refreshToken).toBe('refresh-xyz');
  });

  it('switchInstance sets currentInstanceId', () => {
    const id = useInstanceStore.getState().addInstance({
      label: 'Switch', serverIp: 'http://10.0.0.4:8000', token: 'tok', refreshToken: 'ref',
    });
    useInstanceStore.getState().switchInstance(id);
    expect(useInstanceStore.getState().currentInstanceId).toBe(id);
  });

  it('getCurrentInstance returns the active instance', () => {
    const id = useInstanceStore.getState().addInstance({
      label: 'Current', serverIp: 'http://10.0.0.5:8000', token: null, refreshToken: null,
    });
    useInstanceStore.setState({ currentInstanceId: id });
    const inst = useInstanceStore.getState().getCurrentInstance();
    expect(inst?.id).toBe(id);
    expect(inst?.label).toBe('Current');
  });

  it('getCurrentInstance returns null when no active instance', () => {
    expect(useInstanceStore.getState().getCurrentInstance()).toBeNull();
  });
});
