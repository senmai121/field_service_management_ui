export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Reference
export interface ServiceType {
  id: string; name: string; description?: string; is_active: boolean; created_at: string;
}
export interface PriorityLevel {
  id: string; name: string; display_order: number; response_hours?: number; resolve_hours?: number; color_hex?: string; created_at: string;
}
export interface SkillCategory {
  id: string; name: string; description?: string; created_at: string;
}
export interface AssetCategory {
  id: string; name: string; description?: string; created_at: string;
}

// Customer
export interface Customer {
  id: string; code?: string; name: string; tax_id?: string; email?: string; phone?: string; address?: string; is_active: boolean; created_at: string; updated_at: string;
}
export interface CustomerSite {
  id: string; customer_id: string; name: string; address?: string; latitude?: number; longitude?: number; is_active: boolean; created_at: string; updated_at: string;
}

// Technician
export interface Technician {
  id: string; user_id?: number; username?: string; code?: string; full_name: string; phone?: string; email?: string; is_active: boolean; created_at: string; updated_at: string;
}
export interface UserItem {
  id: number; username: string; email: string;
}

// Work Order
export interface WorkOrder {
  id: string; order_no?: string; customer_id: string; customer_name: string; customer_site_id: string; site_name: string;
  asset_id?: string; asset_name?: string; asset_serial?: string;
  service_type_id?: string; service_type_name?: string; priority_level_id?: string; priority_name?: string; priority_color?: string;
  status: string; title: string; description?: string;
  scheduled_start?: string; scheduled_end?: string; actual_start?: string; actual_end?: string; sla_due_at?: string;
  repair_cost?: number; warranty_covered: boolean;
  created_at: string; updated_at: string;
}

// Asset
export interface Asset {
  id: string; customer_site_id: string; site_name: string; customer_name: string;
  asset_category_id?: string; category_name?: string; serial_no?: string;
  name: string; brand?: string; model?: string;
  installed_at?: string; warranty_expires_at?: string;
  status: string; notes?: string;
  latitude?: number; longitude?: number;
  created_at: string; updated_at: string;
}

// Technician My Work Orders
export interface MyWorkOrder {
  id: string; order_no?: string; title: string; description?: string; status: string;
  customer_name: string; site_name: string; site_address?: string;
  asset_name?: string; asset_serial?: string;
  service_type_name?: string; priority_name?: string; priority_color?: string;
  scheduled_start?: string; scheduled_end?: string;
  actual_start?: string; actual_end?: string;
  sla_due_at?: string;
  assigned_at: string;
}

export interface ListResponse<T> { data: T[]; total: number; }
