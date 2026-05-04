// Types matching the QPON backend schemas exactly

export type UserRole = "user" | "company";
export type RewardType = "discount" | "pet";
export type SubscriptionProductCode = "discount_basic" | "pet_3d";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  owner_user_id: number;
  created_at: string;
}

export interface SubscriptionProduct {
  code: SubscriptionProductCode;
  name: string;
  monthly_price_usd: number;
  description: string;
}

export interface Campaign {
  id: number;
  company_id: number;
  code: string;
  title: string;
  description: string | null;
  reward_type: RewardType;
  max_redemptions: number;
  redeemed_count: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface InventoryDiscount {
  id: number;
  title: string;
  description: string | null;
  discount_percentage: number;
  status: string;
  expires_at: string | null;
  granted_at: string;
}

export interface InventoryPet {
  id: number;
  campaign_id: number;
  pet_definition_id: number;
  pet_name: string;
  pet_slug: string;
  asset_url: string | null;
  rarity: string;
  base_attack: number;
  base_defense: number;
  is_permanent: boolean;
  expires_at: string | null;
  granted_at: string;
}

export interface Inventory {
  discounts: InventoryDiscount[];
  pets: InventoryPet[];
}

export interface RedeemResponse {
  message: string;
  reward_type: RewardType;
  discount: InventoryDiscount | null;
  pet: InventoryPet | null;
}

export interface ApiError {
  detail: string;
}

export interface CreateCampaignPayload {
  title: string;
  description?: string;
  reward_type: RewardType;
  max_redemptions: number;
  starts_at?: string;
  ends_at?: string;
  discount_percentage?: number;
  pet_name?: string;
  pet_slug?: string;
  pet_asset_url?: string;
  pet_rarity?: string;
  pet_base_attack?: number;
  pet_base_defense?: number;
  pet_duration_days?: number;
  pet_is_permanent?: boolean;
  code?: string;
}

export interface MockActivatePayload {
  product_code: SubscriptionProductCode;
  days?: number;
}
