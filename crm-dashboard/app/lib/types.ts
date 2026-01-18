// User Types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "warehouse" | "support";
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Customer Types
export interface Customer {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  company_name?: string;
  org_number?: string;
  billing_street: string;
  billing_postal_code: string;
  billing_city: string;
  delivery_street?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  notes?: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price_per_day: number;
  image_url?: string;
  stock_quantity: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// Booking Types
export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  quotation_id?: string;
  status: "draft" | "pending" | "confirmed" | "completed" | "cancelled";
  event_date: string;
  event_end_date: string;
  delivery_date: string;
  pickup_date: string;
  location: string;
  delivery_street_address?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  delivery_instructions?: string;
  products_requested: any[];
  wrapping_selected: any[];
  total_amount: number;
  tax_amount: number;
  deposit_amount: number;
  remaining_amount?: number;
  payment_status: "unpaid" | "partial" | "paid";
  payment_method?: string;
  contract_signed: boolean;
  contract_signed_at?: string;
  requires_setup: boolean;
  setup_date?: string;
  requires_delivery: boolean;
  delivery_time_slot?: string;
  internal_notes?: string;
  customer_notes?: string;
  conversation_id?: string;
  created_at: string;
  updated_at: string;
}

// Quotation Types
export interface Quotation {
  id: string;
  booking_id: string;
  customer_id: string;
  quotation_number: string;
  total_amount: number;
  tax_amount: number;
  tax_percent: number;
  discount_amount?: number;
  signature_token: string;
  signature_link: string;
  status: "draft" | "sent" | "signed" | "invoiced";
  valid_until: string;
  signed_at?: string;
  terms_and_conditions: string;
  notes?: string;
  products_json: any[];
  pdf_url?: string;
  addon_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Message Types
export interface Message {
  id: string;
  conversation_id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  body_plain: string;
  direction: "inbound" | "outbound";
  sender_type: "customer" | "agent";
  sentiment?: string;
  created_at: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  booking_id: string;
  customer_id: string;
  invoice_number: string;
  total_amount: number;
  tax_amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string;
  paid_date?: string;
  payment_method?: string;
  notes?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  overdueInvoices: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
}

