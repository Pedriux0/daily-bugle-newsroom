import { useState, useEffect, useCallback } from 'react';

export interface NYC311Report {
  unique_key: string;
  complaint_type: string;
  descriptor: string;
  incident_address: string;
  borough: string;
  created_date: string;
  status: string;
  agency_name: string;
}

const NYC_311_URL = 'https://data.cityofnewyork.us/resource/erm2-nwe9.json';

const useNYC311 = (limit: number = 5) => {
  const [reports, setReports] = useState<NYC311Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        $order: 'created_date DESC',
        $limit: String(limit),
        $where: "borough IS NOT NULL AND complaint_type IS NOT NULL",
      });

      const response = await fetch(`${NYC_311_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`NYC Open Data responded with ${response.status}`);
      }

      const data: NYC311Report[] = await response.json();
      setReports(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load NYC reports';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, isLoading, error, refetch: fetchReports };
};

export default useNYC311;
