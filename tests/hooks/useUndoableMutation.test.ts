import { renderHook, act } from '@testing-library/react-native';
import { useUndoableMutation } from '../../src/hooks/useUndoableMutation';

jest.useFakeTimers();

describe('useUndoableMutation', () => {
  it('fires the function after the window elapses', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useUndoableMutation({ fn, windowMs: 5000 }));

    act(() => { result.current.fire({ id: 1 }); });
    expect(fn).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(5000); });
    expect(fn).toHaveBeenCalledWith({ id: 1 });
  });

  it('cancel prevents the call', () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useUndoableMutation({ fn, windowMs: 5000 }));

    act(() => { result.current.fire({ id: 1 }); });
    act(() => { result.current.cancel(); });
    act(() => { jest.advanceTimersByTime(5000); });
    expect(fn).not.toHaveBeenCalled();
  });

  it('unmount cancels pending call', () => {
    const fn = jest.fn();
    const { result, unmount } = renderHook(() => useUndoableMutation({ fn, windowMs: 5000 }));

    act(() => { result.current.fire({ id: 1 }); });
    unmount();
    act(() => { jest.advanceTimersByTime(5000); });
    expect(fn).not.toHaveBeenCalled();
  });
});
