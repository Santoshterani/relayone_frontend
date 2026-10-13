import { useCallback, useEffect, useRef, useState } from 'react';

/** Load data on mount / when deps change. Returns { data, meta, loading, error, reload }. */
export default function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    return fn().then((r) => { if (alive.current) setState({ data: r.data, meta: r.meta, loading: false, error: null }); })
      .catch((e) => { if (alive.current) setState((s) => ({ ...s, loading: false, error: e })); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}
