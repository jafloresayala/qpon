import { useCallback, useEffect, useState } from "react";
import { getInventory } from "@/api/inventory";
import type { Inventory } from "@/api/types";

export function useInventory() {
  const [inventory, setInventory] = useState<Inventory>({ discounts: [], pets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventory();
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { inventory, loading, error, refresh };
}
