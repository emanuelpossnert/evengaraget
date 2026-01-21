"use client";

/**
 * Shared TypeScript Interfaces for EventGaraget CRM
 * This file centralizes all interface definitions to avoid duplication
 */

// =============================================
// AUTHENTICATION & USERS
// =============================================
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "warehouse" | "printer" | "support";
  created_at: string;
  updated_at: string;
}

// =============================================
// CUSTOMERS
// =============================================
export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company_name?: string;
  org_number?: string;
  street_address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  customer_type?: "private" | "business" | "vip";
  status?: "active" | "inactive" | "blocked";
  is_vip?: boolean;
  total_bookings?: number;
  total_revenue?: number;
  lifetime_value?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contact_at?: string;
}

// =============================================
// PRODUCTS & ADDONS
// =============================================
export interface Product {
  id: string;
  name: string;
  category?: string;
  description?: string;
  base_price_per_day: number;
  min_rental_days?: number;
  quantity_total?: number;
  quantity_available?: number;
  requires_setup?: boolean;
  setup_cost?: number;
  can_be_wrapped?: boolean;
  wrapping_cost?: number;
  image_url?: string;
  specifications?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductAddon {
  id: string;
  product_id: string;
  addons: Addon[];
  created_at: string;
  updated_at: string;
}

// =============================================
// BOOKINGS
// =============================================
export interface BookingProduct {
  name: string;
  quantity: number;
  wrapping_requested: boolean;
  price_per_day?: number;
  total_price?: number;
}

export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  status: "draft" | "pending" | "confirmed" | "completed" | "cancelled";
  event_date: string;
  event_end_date?: string;
  delivery_date: string;
  pickup_date?: string;
  location: string;
  total_amount: number;
  tax_amount?: number;
  shipping_cost?: number;
  delivery_type?: "internal" | "external" | "customer_pickup";
  products_requested: BookingProduct[] | any;
  delivery_street_address?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  delivery_country?: string;
  notes?: string;
  contract_signed?: boolean;
  contract_signed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingDetail extends Booking {
  customer?: Customer;
  booking_notes?: BookingNote[];
  wrapping_images?: WrappingImage[];
  tasks?: WarehouseTask[];
}

export interface BookingNote {
  id: string;
  booking_id: string;
  note: string;
  created_by_email: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// TASKS & TODO
// =============================================
export interface Task {
  id: string;
  booking_id: string | null;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  task_type: string;
  assigned_to_user_id?: string;
  assigned_to_name?: string;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseTask {
  id: string;
  booking_id: string;
  booking_number?: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  task_type: string;
  delivery_type?: "internal" | "external" | "customer_pickup";
  due_date?: string;
  start_date?: string;
  end_date?: string;
  assigned_to_user_id?: string;
  assigned_to_name?: string;
  location?: string;
  event_date?: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// FILES & MEDIA
// =============================================
export interface WrappingImage {
  id: string;
  booking_id: string;
  file_name: string;
  image_url: string;
  uploaded_by?: string;
  uploaded_at: string;
  image_type?: string;
}

// =============================================
// PRINTER/FOLIERING
// =============================================
export interface FoilingOrder {
  id: string;
  booking_number: string;
  event_date: string;
  location: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  products_requested: BookingProduct[] | any;
  status: string;
  image_count: number;
  latest_image_uploaded?: string;
}

// =============================================
// CALENDAR & EVENTS
// =============================================
export interface BookingEvent {
  id: string;
  booking_number?: string;
  title: string;
  date: string;
  startDate?: string;
  endDate?: string;
  type: "pickup" | "delivery" | "event" | "internal" | "foliering" | "external_shipping" | "customer_pickup" | "booked" | "inquiry";
  location?: string;
  customer_name?: string;
  delivery_type?: "internal" | "external" | "customer_pickup";
  category?: string;
}

// =============================================
// INVOICES
// =============================================
export interface InvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: string;
  booking_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_street_address?: string;
  customer_postal_code?: string;
  customer_city?: string;
  customer_country?: string;
  customer_org_number?: string;
  company_name?: string;
  company_address?: string;
  company_vat_number?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  items: InvoiceItem[];
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  payment_date?: string;
  payment_method?: string;
  notes?: string;
  terms_and_conditions?: string;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTask {
  id: string;
  booking_id: string;
  invoice_id?: string;
  title: string;
  description?: string;
  status: "pending" | "invoiced" | "cancelled";
  task_type?: string;
  completed_date?: string;
  should_invoice_at?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
export interface Conversation {
  id: string;
  customer_email: string;
  customer_id?: string;
  subject?: string;
  last_message_at: string;
  message_count: number;
  status: "open" | "closed" | "resolved";
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  from_email: string;
  to_email: string;
  subject?: string;
  body: string;
  direction: "inbound" | "outbound";
  sender_type: "customer" | "ai_agent" | "human_staff";
  created_at: string;
}

// =============================================
// QUOTATIONS
// =============================================
export interface Quotation {
  id: string;
  booking_id?: string;
  customer_id: string;
  quotation_number: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  event_date: string;
  location: string;
  products: BookingProduct[];
  total_amount: number;
  valid_until: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// API & UI RESPONSES
// =============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================
// UI STATE
// =============================================
export interface MessageState {
  type: "success" | "error" | "warning" | "info";
  text: string;
}

export interface FilterState {
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
