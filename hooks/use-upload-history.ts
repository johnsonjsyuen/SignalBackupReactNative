import { useCallback, useEffect, useState } from 'react';

import { getAllUploadRecords } from '@/lib/database';
import type { UploadRecord } from '@/types/upload';

export function useUploadHistory() {
  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    try {
      const all = getAllUploadRecords();
      setRecords(all);
    } catch {
      // Database may not be initialized yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { records, isLoading, refresh };
}
