import { useCallback, useEffect, useState } from "react";
import { getMyCompanies } from "@/api/campaigns";
import type { Company } from "@/api/types";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyCompanies();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar empresas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { companies, loading, error, refresh };
}
