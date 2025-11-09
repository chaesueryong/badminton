export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: 'MONTHLY' | 'YEARLY';
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  payment_provider: string;
  subscription_id: string | null;
  customer_id: string | null;
  billing_key: string | null;
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id: string | null;
  payment_provider: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  payment_method: string | null;
  receipt_url: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}
