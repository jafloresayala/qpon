import { api } from "./client";
import type { Inventory, RedeemResponse } from "./types";

export async function getInventory(): Promise<Inventory> {
  return api.get<Inventory>("/inventory");
}

export async function redeem(code: string): Promise<RedeemResponse> {
  return api.post<RedeemResponse>("/redeem", { code });
}
