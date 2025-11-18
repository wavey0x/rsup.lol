import { useState, useEffect } from "react";
import axios from "axios";

const API_URL =
  "https://raw.githubusercontent.com/wavey0x/open-data/master/resupply_market_data.json";

interface UseResupplyDataOptions<T> {
  dataPath?: string;
  transform?: (data: any) => T;
  refreshInterval?: number;
}

interface UseResupplyDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
  lastUpdateFromApi: string | null;
  lastUpdateDate: Date | null;
  refetch: () => Promise<void>;
}

/**
 * Centralized hook for fetching data from the resupply API
 * Eliminates 120+ lines of duplicated fetching logic across pages
 *
 * @param options - Configuration options
 * @param options.dataPath - Path to data in response (e.g., "data.market_data")
 * @param options.transform - Optional transformation function for the data
 * @param options.refreshInterval - Auto-refresh interval in milliseconds (default: 5 minutes)
 *
 * @example
 * // Fetch market data
 * const { data, isLoading, error } = useResupplyData({
 *   dataPath: "data.market_data",
 *   transform: (markets) => Object.values(markets),
 * });
 *
 * @example
 * // Fetch sreUSD data
 * const { data } = useResupplyData({
 *   dataPath: "data.sreusd",
 * });
 */
export function useResupplyData<T = any>({
  dataPath,
  transform,
  refreshInterval = 5 * 60 * 1000,
}: UseResupplyDataOptions<T> = {}): UseResupplyDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [lastUpdateFromApi, setLastUpdateFromApi] = useState<string | null>(
    null
  );
  const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_URL);

      // Parse last_update field
      if (response.data.last_update) {
        setLastUpdateFromApi(response.data.last_update);
        const ts = Number(response.data.last_update);
        if (!isNaN(ts) && ts > 1000000000) {
          setLastUpdateDate(new Date(ts * 1000));
        } else {
          setLastUpdateDate(null);
        }
      }

      // Extract data from specified path
      let extractedData = response.data;
      if (dataPath) {
        const pathParts = dataPath.split(".");
        for (const part of pathParts) {
          extractedData = extractedData?.[part];
        }
      }

      // Apply transformation if provided
      const finalData = transform ? transform(extractedData) : extractedData;

      setData(finalData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching resupply data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [dataPath, refreshInterval]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    lastUpdateFromApi,
    lastUpdateDate,
    refetch: fetchData,
  };
}
