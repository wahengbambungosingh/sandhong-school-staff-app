import { useCallback, useEffect, useState } from "react";

/** Runs an async loader on mount (and when `deps` change); exposes reload(). */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader().then(
      (data) => { if (!cancelled) setState({ loading: false, data, error: null }); },
      (error) => { if (!cancelled) setState({ loading: false, data: null, error }); }
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(run, [run]);
  return { ...state, reload: run };
}
