export type UserRole = "cso" | "pharma" | "admin";
export type CompanyType = "pharma" | "supplier";
export type CustomerType = "hospital" | "pharmacy" | "other";
export type TransactionStatus = "pending" | "reviewing" | "approved" | "rejected" | "completed";
export type SaleStatus = "on_sale" | "discontinued" | "pending";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  company_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  business_number: string | null;
  representative: string | null;
  address: string | null;
  phone: string | null;
  type: CompanyType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  generic_name: string | null;
  category: string | null;
  department: string | null;
  base_price: number;
  commission_rate: number;
  commission_amount: number;
  description: string | null;
  sale_status: SaleStatus;
  is_tradeable: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  type: CustomerType;
  address: string | null;
  phone: string | null;
  contact_person: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  product_id: string;
  customer_id: string;
  status: TransactionStatus;
  quantity: number;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
  customer?: Customer;
}

export interface EdiRecord {
  id: string;
  user_id: string;
  product_id: string;
  customer_id: string | null;
  edi_date: string;
  quantity: number;
  amount: number;
  commission: number;
  file_url: string | null;
  created_at: string;
  product?: Product;
  customer?: Customer;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}
