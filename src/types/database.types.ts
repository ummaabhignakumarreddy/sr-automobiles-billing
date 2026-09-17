export type UserRole = 'owner' | 'admin' | 'billing_staff';

export type VehicleCategory = 
  | 'Motorcycle' 
  | 'Scooter' 
  | 'Electric Motorcycle' 
  | 'Electric Scooter' 
  | 'Other';

export type FuelType = 'Petrol' | 'Electric' | 'Other';

export type StockStatus = 'IN_STOCK' | 'BOOKED' | 'SOLD' | 'DELIVERED';

export type CustomerType = 'Individual' | 'Business';

export type PricingMode = 'EXCLUSIVE' | 'INCLUSIVE';

export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export type PaymentMode = 
  | 'CASH' 
  | 'UPI' 
  | 'BANK_TRANSFER' 
  | 'CARD' 
  | 'CHEQUE' 
  | 'FINANCE' 
  | 'OTHER';

export type TaxTreatment = 'TAXABLE' | 'EXEMPT' | 'NON_GST';

export type InvoiceCopyType = 
  | 'ORIGINAL FOR RECIPIENT' 
  | 'DUPLICATE FOR TRANSPORTER' 
  | 'TRIPLICATE FOR SUPPLIER';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at?: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  legal_name: string;
  gstin: string;
  address: string;
  city: string;
  district: string;
  state: string;
  state_code: string;
  pincode: string;
  phone: string;
  alt_phone?: string;
  email: string;
  website?: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  ifsc: string;
  upi_id: string;
  invoice_prefix: string;
  authorized_signatory: string;
  terms_and_conditions: string;
  logo_url?: string;
  signature_url?: string;
  einvoice_applicable: boolean;
  eway_bill_applicable: boolean;
  updated_at?: string;
}

export interface HsnMaster {
  id: string;
  hsn_code: string;
  description: string;
  category: string;
  default_gst_rate: number;
  default_cess_rate: number;
  is_active: boolean;
}

export interface Vehicle {
  id: string;
  vehicle_id: string;
  category: VehicleCategory;
  brand: string;
  model: string;
  variant: string;
  colour: string;
  fuel_type: FuelType;
  vin_chassis: string;
  engine_number?: string;
  motor_number?: string;
  battery_number?: string;
  battery_capacity?: string;
  mfg_month?: number;
  mfg_year: number;
  hsn_code: string;
  default_gst_rate: number;
  default_cess_rate: number;
  purchase_price: number;
  default_selling_price: number;
  supplier_name?: string;
  supplier_invoice_no?: string;
  purchase_date?: string;
  stock_status: StockStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  customer_id: string;
  customer_type: CustomerType;
  name: string;
  mobile: string;
  alt_mobile?: string;
  email?: string;
  gst_registered: boolean;
  gstin?: string;
  billing_address: string;
  delivery_address?: string;
  city: string;
  district?: string;
  state: string;
  state_code: string;
  pincode: string;
  pan?: string;
  notes?: string;
  created_at?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id?: string;
  item_type: 'VEHICLE' | 'ADDITIONAL';
  description: string;
  hsn_sac: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxable_value: number;
  tax_treatment: TaxTreatment;
  gst_rate: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  total_amount: number;
}

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_mode: PaymentMode;
  reference_number?: string;
  finance_company?: string;
  loan_application_ref?: string;
  customer_contribution?: number;
  notes?: string;
  created_at?: string;
  created_by?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  financial_year: string;
  invoice_date: string;
  place_of_supply: string;
  place_of_supply_state_code: string;
  reverse_charge: boolean;
  pricing_mode: PricingMode;
  status: InvoiceStatus;
  
  customer_id: string;
  vehicle_id: string;
  
  customer_snapshot: Customer;
  vehicle_snapshot: Vehicle;
  business_snapshot: BusinessSettings;
  
  items?: InvoiceItem[];
  payments?: PaymentRecord[];
  
  gross_amount: number;
  discount_amount: number;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  other_charges: number;
  non_tax_charges: number;
  round_off: number;
  grand_total: number;
  total_paid: number;
  balance_amount: number;
  payment_status: PaymentStatus;
  
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  
  einvoice_irn?: string;
  einvoice_ack_no?: string;
  einvoice_ack_date?: string;
  einvoice_signed_qr?: string;
  einvoice_status?: string;
  eway_bill_no?: string;
  eway_bill_date?: string;
  transporter_name?: string;
  transporter_id?: string;
  transport_doc_no?: string;
  vehicle_reg_no?: string;
  
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
}
