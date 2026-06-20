import { useCallback, useEffect, useRef, useState } from 'react';

export interface UndoableMutationOptions<TVars> {
  fn: (vars: TVars) => Promise<unknown>;
  windowMs?: number;
}

export function useUndoableMutation<TVars>(opts: UndoableMutationOptions<TVars>) {
  const { fn, windowMs = 5000 } = opts;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(false);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setPending(false);
    }
  }, []);

  const fire = useCallback((vars: TVars) => {
    cancel();
    setPending(true);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setPending(false);
      void fn(vars);
    }, windowMs);
  }, [fn, windowMs, cancel]);

  useEffect(() => () => { cancel(); }, [cancel]);

  return { fire, cancel, pending };
}
