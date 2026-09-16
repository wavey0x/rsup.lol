import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://api.wavey.info/api/resupply/data";

interface UseResupplyDataOptions<T> {
  dataPath: string;
  transform?: (data: any) => T;
}

export function useResupplyData<T = any>({ dataPath, transform }: UseResupplyDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL, { timeout: 30000, signal: controller.signal });
        let extracted = response.data;
        for (const part of dataPath.split(".")) extracted = extracted?.[part];
        if (extracted == null) throw new Error("Incomplete feed");
        const next = transform ? transform(extracted) : extracted;
        const timestamp = Number(response.data._meta?.collection_finished_at ?? response.data.last_update);
        setData(next);
        setLastUpdateDate(Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000) : null);
        setError(response.data._meta?.error ? "Collection failed; showing last available data." : null);
      } catch {
        if (!controller.signal.aborted) setError("Refresh failed; showing last available data.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    void fetchData();
    const timer = setInterval(fetchData, 5 * 60 * 1000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [dataPath, transform]);

  return { data, isLoading, error, lastUpdateDate };
}
