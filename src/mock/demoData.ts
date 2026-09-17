import { BusinessSettings, HsnMaster, Vehicle, Customer } from '../types/database.types';

export const INITIAL_BUSINESS_SETTINGS: BusinessSettings = {
  id: 'a0000000-0000-0000-0000-000000000001',
  business_name: 'SR AUTOMOBILES',
  legal_name: 'SR AUTOMOBILES',
  gstin: '',
  address: 'Chandrababu Nagar Ring',
  city: 'Mylavaram',
  district: 'NTR',
  state: 'Andhra Pradesh',
  state_code: '37',
  pincode: '521230',
  phone: '8367444144',
  alt_phone: '',
  email: '',
  website: '',
  bank_name: '',
  account_holder: '',
  account_number: '',
  ifsc: '',
  upi_id: '',
  invoice_prefix: 'SRA',
  authorized_signatory: 'Venkata Ramana Reddy Umma',
  terms_and_conditions: `1. Goods once sold will not be taken back or exchanged.
2. Vehicle warranty is strictly as per manufacturer guidelines and policy.
3. Registration and Road Tax are subject to RTO processes and timelines.
4. All disputes are subject to local judicial jurisdiction only.
5. Insurance policy cover shall commence upon issuance by the respective insurance company.`,
  logo_url: '/logo.png',
  signature_url: '',
  einvoice_applicable: false,
  eway_bill_applicable: false,
  updated_at: '2026-09-16T10:00:00.000Z',
};

export const INITIAL_HSN_LIST: HsnMaster[] = [
  {
    id: 'hsn-1',
    hsn_code: '871120',
    description: 'Motorcycles & Scooters with engine capacity <= 250cc',
    category: 'Vehicle',
    default_gst_rate: 28,
    default_cess_rate: 0,
    is_active: true,
  },
  {
    id: 'hsn-2',
    hsn_code: '871130',
    description: 'Motorcycles with engine capacity > 250cc but <= 350cc',
    category: 'Vehicle',
    default_gst_rate: 28,
    default_cess_rate: 3,
    is_active: true,
  },
  {
    id: 'hsn-3',
    hsn_code: '871160',
    description: 'Electrically operated 2-Wheelers (EV Motorcycle / Scooter)',
    category: 'Vehicle',
    default_gst_rate: 5,
    default_cess_rate: 0,
    is_active: true,
  },
  {
    id: 'hsn-4',
    hsn_code: '871410',
    description: 'Motorcycle & Scooter Parts and Accessories (Helmets, Crash Guards)',
    category: 'Accessories',
    default_gst_rate: 28,
    default_cess_rate: 0,
    is_active: true,
  },
  {
    id: 'hsn-5',
    hsn_code: '998729',
    description: 'Logistics, Pre-Delivery Inspection (PDI) & Handling Charges',
    category: 'Services',
    default_gst_rate: 18,
    default_cess_rate: 0,
    is_active: true,
  },
  {
    id: 'hsn-6',
    hsn_code: '997134',
    description: 'Motor Vehicle Comprehensive & Third-Party Insurance',
    category: 'Insurance',
    default_gst_rate: 18,
    default_cess_rate: 0,
    is_active: true,
  },
  {
    id: 'hsn-7',
    hsn_code: '999293',
    description: 'RTO Registration, Smart Card & State Road Tax Fee (Exempt)',
    category: 'Government Fee',
    default_gst_rate: 0,
    default_cess_rate: 0,
    is_active: true,
  },
];

export const INITIAL_VEHICLES: Vehicle[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];
