'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getDocuments,
  saveDocument,
  deleteDocument,
} from '@/lib/actions';


export function useCentralData<T = any>(
  prefix?: string
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getDocuments(prefix);

    if (result.success) {
      setData((result.data || []) as T[]);
    } else {
      setError(
        result.error ||
        'Failed to load central data'
      );
    }

    setLoading(false);
  }, [prefix]);


  useEffect(() => {
    refresh();
  }, [refresh]);


  const save = useCallback(
    async (
      key: string,
      value: Record<string, any>
    ) => {
      const result = await saveDocument(
        key,
        value
      );

      if (result.success) {
        await refresh();
      }

      return result;
    },
    [refresh]
  );


  const remove = useCallback(
    async (key: string) => {
      const result = await deleteDocument(key);

      if (result.success) {
        await refresh();
      }

      return result;
    },
    [refresh]
  );


  return {
    data,
    loading,
    error,
    refresh,
    save,
    remove,
  };
}
