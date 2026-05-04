import { api } from "./client";
import type { Campaign, Company, CreateCampaignPayload, MockActivatePayload, SubscriptionProduct } from "./types";

export async function getProducts(): Promise<SubscriptionProduct[]> {
  return api.get<SubscriptionProduct[]>("/products");
}

export async function getMyCompanies(): Promise<Company[]> {
  return api.get<Company[]>("/companies");
}

export async function activateSubscriptionMock(
  companyId: number,
  payload: MockActivatePayload
): Promise<unknown> {
  return api.post(`/companies/${companyId}/subscriptions/mock-activate`, payload);
}

export async function createCampaign(
  companyId: number,
  payload: CreateCampaignPayload
): Promise<Campaign> {
  return api.post<Campaign>(`/companies/${companyId}/campaigns`, payload);
}
