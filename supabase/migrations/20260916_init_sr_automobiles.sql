-- ==============================================================================
-- SR AUTOMOBILES - Vehicle Sales & GST Billing System
-- Complete PostgreSQL Database Schema & Migration for Supabase
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS & DOMAINS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'billing_staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_category AS ENUM ('Motorcycle', 'Scooter', 'Electric Motorcycle', 'Electric Scooter', 'Other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE fuel_type AS ENUM ('Petrol', 'Electric', 'Other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE stock_status AS ENUM ('IN_STOCK', 'BOOKED', 'SOLD', 'DELIVERED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE customer_type AS ENUM ('Individual', 'Business');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pricing_mode AS ENUM ('EXCLUSIVE', 'INCLUSIVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('DRAFT', 'FINALIZED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_mode AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'FINANCE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tax_treatment AS ENUM ('TAXABLE', 'EXEMPT', 'NON_GST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'billing_staff',
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. BUSINESS SETTINGS (Singleton for SR AUTOMOBILES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'SR AUTOMOBILES',
    legal_name TEXT NOT NULL DEFAULT 'SR AUTOMOBILES',
    gstin TEXT DEFAULT '',
    address TEXT NOT NULL DEFAULT 'Chandrababu Nagar Ring',
    city TEXT NOT NULL DEFAULT 'Mylavaram',
    district TEXT DEFAULT 'NTR',
    state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
    state_code TEXT NOT NULL DEFAULT '37',
    pincode TEXT NOT NULL DEFAULT '521230',
    phone TEXT NOT NULL DEFAULT '8367444144',
    alt_phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    website TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    account_holder TEXT DEFAULT '',
    account_number TEXT DEFAULT '',
    ifsc TEXT DEFAULT '',
    upi_id TEXT DEFAULT '',
    invoice_prefix TEXT NOT NULL DEFAULT 'SRA',
    authorized_signatory TEXT NOT NULL DEFAULT 'Venkata Ramana Reddy Umma',
    terms_and_conditions TEXT NOT NULL DEFAULT E'1. Goods once sold will not be taken back or exchanged.\n2. Vehicle warranty as per standard manufacturer terms and conditions.\n3. Registration and Road Tax are subject to RTO policies and timelines.\n4. All disputes are subject to local judicial jurisdiction only.\n5. Insurance policy cover will commence upon generation by respective insurer.',
    logo_url TEXT,
    signature_url TEXT,
    einvoice_applicable BOOLEAN NOT NULL DEFAULT false,
    eway_bill_applicable BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. HSN & TAX CONFIGURATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hsn_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hsn_code TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Vehicle',
    default_gst_rate NUMERIC(5,2) NOT NULL,
    default_cess_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. VEHICLE INVENTORY (Unit-Level Tracking with unique VIN/Chassis)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id TEXT NOT NULL UNIQUE,
    category vehicle_category NOT NULL DEFAULT 'Motorcycle',
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    variant TEXT NOT NULL,
    colour TEXT NOT NULL,
    fuel_type fuel_type NOT NULL DEFAULT 'Petrol',
    vin_chassis TEXT NOT NULL UNIQUE,
    engine_number TEXT,
    motor_number TEXT,
    battery_number TEXT,
    battery_capacity TEXT,
    mfg_month INTEGER CHECK (mfg_month BETWEEN 1 AND 12),
    mfg_year INTEGER NOT NULL,
    hsn_code TEXT NOT NULL DEFAULT '871120',
    default_gst_rate NUMERIC(5,2) NOT NULL DEFAULT 28.00,
    default_cess_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    purchase_price NUMERIC(12,2) NOT NULL,
    default_selling_price NUMERIC(12,2) NOT NULL,
    supplier_name TEXT,
    supplier_invoice_no TEXT,
    purchase_date DATE,
    stock_status stock_status NOT NULL DEFAULT 'IN_STOCK',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin_chassis);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(stock_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model ON vehicles(brand, model);

-- ------------------------------------------------------------------------------
-- 6. CUSTOMER DATABASE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL UNIQUE,
    customer_type customer_type NOT NULL DEFAULT 'Individual',
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    alt_mobile TEXT,
    email TEXT,
    gst_registered BOOLEAN NOT NULL DEFAULT false,
    gstin TEXT,
    billing_address TEXT NOT NULL,
    delivery_address TEXT,
    city TEXT NOT NULL DEFAULT 'Mylavaram',
    district TEXT DEFAULT 'NTR',
    state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
    state_code TEXT NOT NULL DEFAULT '37',
    pincode TEXT NOT NULL,
    pan TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_gstin ON customers(gstin);

-- ------------------------------------------------------------------------------
-- 7. INVOICE SEQUENCES (FY Consecutive Auto-Numbering)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prefix TEXT NOT NULL DEFAULT 'SRA',
    financial_year TEXT NOT NULL, -- e.g. '26-27'
    last_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(prefix, financial_year)
);

-- ------------------------------------------------------------------------------
-- 8. INVOICES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    financial_year TEXT NOT NULL, -- e.g. '26-27'
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    place_of_supply TEXT NOT NULL,
    place_of_supply_state_code TEXT NOT NULL,
    reverse_charge BOOLEAN NOT NULL DEFAULT false,
    pricing_mode pricing_mode NOT NULL DEFAULT 'EXCLUSIVE',
    status invoice_status NOT NULL DEFAULT 'DRAFT',
    
    -- Relationships & Snapshots (to guarantee historical immutability)
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    customer_snapshot JSONB NOT NULL,
    vehicle_snapshot JSONB NOT NULL,
    business_snapshot JSONB NOT NULL,
    
    -- Monetary totals (Decimal safe)
    gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    taxable_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cess_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    other_charges NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    non_tax_charges NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    round_off NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    balance_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_status payment_status NOT NULL DEFAULT 'UNPAID',

    -- Cancellation tracking
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES profiles(id),
    cancelled_at TIMESTAMPTZ,

    -- E-Invoice & E-Way bill fields (readiness structure)
    einvoice_irn TEXT,
    einvoice_ack_no TEXT,
    einvoice_ack_date TIMESTAMPTZ,
    einvoice_signed_qr TEXT,
    einvoice_status TEXT DEFAULT 'NOT_APPLICABLE',
    eway_bill_no TEXT,
    eway_bill_date TIMESTAMPTZ,
    transporter_name TEXT,
    transporter_id TEXT,
    transport_doc_no TEXT,
    vehicle_reg_no TEXT,

    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);

-- ------------------------------------------------------------------------------
-- 9. INVOICE LINE ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL DEFAULT 'VEHICLE', -- 'VEHICLE', 'ADDITIONAL'
    description TEXT NOT NULL,
    hsn_sac TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit TEXT NOT NULL DEFAULT 'NOS',
    rate NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    taxable_value NUMERIC(12,2) NOT NULL,
    tax_treatment tax_treatment NOT NULL DEFAULT 'TAXABLE',
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    cgst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sgst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    igst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cess_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    cess_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ------------------------------------------------------------------------------
-- 10. PAYMENTS (Split / Multi-mode payments)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12,2) NOT NULL,
    payment_mode payment_mode NOT NULL DEFAULT 'UPI',
    reference_number TEXT,
    finance_company TEXT,
    loan_application_ref TEXT,
    customer_contribution NUMERIC(12,2),
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- ------------------------------------------------------------------------------
-- 11. AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ------------------------------------------------------------------------------
-- 12. STORED PROCEDURES & ATOMIC FUNCTIONS
-- ------------------------------------------------------------------------------

-- Function to generate next consecutive invoice number atomically
CREATE OR REPLACE FUNCTION generate_next_invoice_number(
    p_prefix TEXT,
    p_financial_year TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_seq INTEGER;
    v_inv_no TEXT;
BEGIN
    INSERT INTO invoice_sequences (prefix, financial_year, last_number, updated_at)
    VALUES (p_prefix, p_financial_year, 1, NOW())
    ON CONFLICT (prefix, financial_year)
    DO UPDATE SET 
        last_number = invoice_sequences.last_number + 1,
        updated_at = NOW()
    RETURNING last_number INTO v_seq;

    -- Format: PREFIX/FY/0001 (e.g. SRA/26-27/0001)
    v_inv_no := p_prefix || '/' || p_financial_year || '/' || LPAD(v_seq::TEXT, 4, '0');
    RETURN v_inv_no;
END;
$$;

-- Function to finalize an invoice, update vehicle to SOLD, and audit
CREATE OR REPLACE FUNCTION finalize_invoice(
    p_invoice_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_inv invoices%ROWTYPE;
    v_veh vehicles%ROWTYPE;
    v_user_email TEXT;
BEGIN
    SELECT * INTO v_inv FROM invoices WHERE id = p_invoice_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    IF v_inv.status != 'DRAFT' THEN
        RAISE EXCEPTION 'Only DRAFT invoices can be finalized. Current status: %', v_inv.status;
    END IF;

    -- Validate vehicle availability
    IF v_inv.vehicle_id IS NOT NULL THEN
        SELECT * INTO v_veh FROM vehicles WHERE id = v_inv.vehicle_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Associated vehicle not found';
        END IF;

        IF v_veh.stock_status = 'SOLD' THEN
            RAISE EXCEPTION 'Vehicle VIN % has already been sold!', v_veh.vin_chassis;
        END IF;

        -- Mark vehicle as SOLD
        UPDATE vehicles 
        SET stock_status = 'SOLD', updated_at = NOW()
        WHERE id = v_veh.id;
    END IF;

    -- Update invoice to FINALIZED
    UPDATE invoices
    SET status = 'FINALIZED', updated_at = NOW()
    WHERE id = p_invoice_id;

    -- Get user email for audit
    SELECT email INTO v_user_email FROM profiles WHERE id = p_user_id;

    -- Log to audit
    INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, old_values, new_values)
    VALUES (
        p_user_id,
        v_user_email,
        'INVOICE_FINALIZED',
        'invoices',
        p_invoice_id::TEXT,
        jsonb_build_object('status', 'DRAFT'),
        jsonb_build_object('status', 'FINALIZED', 'invoice_number', v_inv.invoice_number, 'grand_total', v_inv.grand_total)
    );

    RETURN jsonb_build_object('success', true, 'invoice_number', v_inv.invoice_number);
END;
$$;

-- Function to cancel an invoice with mandatory reason and restock options
CREATE OR REPLACE FUNCTION cancel_invoice(
    p_invoice_id UUID,
    p_reason TEXT,
    p_vehicle_restock_status TEXT, -- 'IN_STOCK', 'BOOKED', or 'NONE'
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_inv invoices%ROWTYPE;
    v_user_email TEXT;
BEGIN
    IF TRIM(p_reason) = '' OR p_reason IS NULL THEN
        RAISE EXCEPTION 'A cancellation reason is required.';
    END IF;

    SELECT * INTO v_inv FROM invoices WHERE id = p_invoice_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    IF v_inv.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Invoice is already cancelled.';
    END IF;

    -- Update invoice
    UPDATE invoices
    SET 
        status = 'CANCELLED',
        cancellation_reason = p_reason,
        cancelled_by = p_user_id,
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_invoice_id;

    -- Optionally restock vehicle
    IF v_inv.vehicle_id IS NOT NULL AND p_vehicle_restock_status IN ('IN_STOCK', 'BOOKED') THEN
        UPDATE vehicles
        SET stock_status = p_vehicle_restock_status::stock_status, updated_at = NOW()
        WHERE id = v_inv.vehicle_id;
    END IF;

    SELECT email INTO v_user_email FROM profiles WHERE id = p_user_id;

    INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, old_values, new_values)
    VALUES (
        p_user_id,
        v_user_email,
        'INVOICE_CANCELLED',
        'invoices',
        p_invoice_id::TEXT,
        jsonb_build_object('status', v_inv.status),
        jsonb_build_object('status', 'CANCELLED', 'reason', p_reason, 'restock_status', p_vehicle_restock_status)
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ------------------------------------------------------------------------------
-- 13. SEED MASTER DATA
-- ------------------------------------------------------------------------------
INSERT INTO business_settings (
    id, business_name, legal_name, gstin, address, city, district, state, state_code, pincode,
    phone, alt_phone, email, bank_name, account_holder, account_number, ifsc, upi_id,
    invoice_prefix, authorized_signatory
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SR AUTOMOBILES',
    'SR AUTOMOBILES',
    '',
    'Chandrababu Nagar Ring',
    'Mylavaram',
    'NTR',
    'Andhra Pradesh',
    '37',
    '521230',
    '8367444144',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'SRA',
    'Venkata Ramana Reddy Umma'
) ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    legal_name = EXCLUDED.legal_name,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    state_code = EXCLUDED.state_code,
    pincode = EXCLUDED.pincode,
    phone = EXCLUDED.phone,
    authorized_signatory = EXCLUDED.authorized_signatory;

-- Seed HSN rates
INSERT INTO hsn_master (hsn_code, description, category, default_gst_rate, default_cess_rate) VALUES
('871120', 'Motorcycles and Scooters with cylinder capacity <= 250cc', 'Vehicle', 28.00, 0.00),
('871130', 'Motorcycles with cylinder capacity > 250cc but <= 350cc', 'Vehicle', 28.00, 3.00),
('871160', 'Electrically operated Motorcycles and Scooters (EV)', 'Vehicle', 5.00, 0.00),
('871410', 'Parts and accessories of motorcycles and scooters', 'Accessories', 28.00, 0.00),
('998729', 'Handling, Logistics, PDI & Delivery Charges', 'Services', 18.00, 0.00),
('997134', 'Motor vehicle insurance services', 'Insurance', 18.00, 0.00),
('999293', 'RTO Registration, Smart Card & Road Tax services', 'Government Fee', 0.00, 0.00)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsn_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for profiles" ON profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for business_settings" ON business_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for hsn_master" ON hsn_master FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for vehicles" ON vehicles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for customers" ON customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for invoice_sequences" ON invoice_sequences FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for invoices" ON invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for invoice_items" ON invoice_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for payments" ON payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for audit_logs" ON audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 15. AUTOMATIC USER PROFILE TRIGGER ON AUTH.USERS (Safe & Non-blocking)
-- ------------------------------------------------------------------------------
-- Drop any problematic triggers that cause "Database error granting user"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Grant schema and table privileges to supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO supabase_auth_admin, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'billing_staff'::public.user_role),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent trigger errors from ever aborting user authentication
    RETURN NEW;
END;
$$;

-- Trigger only on INSERT of a new user (NEVER on UPDATE so sign-in never fails)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 16. SEED DEALERSHIP USERS INTO AUTH.USERS & PROFILES (Secure Supabase Login)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_owner_id UUID;
    v_admin_id UUID;
    v_staff_id UUID;
BEGIN
    -- 1. Owner: owner@srautomobiles.in / admin123
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'owner@srautomobiles.in';
    IF v_owner_id IS NULL THEN
        v_owner_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_owner_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'owner@srautomobiles.in',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Venkata Ramana Reddy Umma (Owner)","role":"owner","phone":"+91 8367444144"}'::jsonb,
            NOW(),
            NOW()
        );
    ELSE
        UPDATE auth.users SET
            encrypted_password = crypt('admin123', gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_user_meta_data = '{"full_name":"Venkata Ramana Reddy Umma (Owner)","role":"owner","phone":"+91 8367444144"}'::jsonb
        WHERE id = v_owner_id;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (v_owner_id, 'owner@srautomobiles.in', 'Venkata Ramana Reddy Umma (Owner)', 'owner', '+91 8367444144')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone;

    -- 2. Admin: admin@srautomobiles.in / admin123
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@srautomobiles.in';
    IF v_admin_id IS NULL THEN
        v_admin_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_admin_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin@srautomobiles.in',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Suresh Varma (Admin)","role":"admin","phone":"+91 8367444144"}'::jsonb,
            NOW(),
            NOW()
        );
    ELSE
        UPDATE auth.users SET
            encrypted_password = crypt('admin123', gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_user_meta_data = '{"full_name":"Suresh Varma (Admin)","role":"admin","phone":"+91 8367444144"}'::jsonb
        WHERE id = v_admin_id;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (v_admin_id, 'admin@srautomobiles.in', 'Suresh Varma (Admin)', 'admin', '+91 8367444144')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone;

    -- 3. Staff: billing@srautomobiles.in / staff123
    SELECT id INTO v_staff_id FROM auth.users WHERE email = 'billing@srautomobiles.in';
    IF v_staff_id IS NULL THEN
        v_staff_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_staff_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'billing@srautomobiles.in',
            crypt('staff123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"K. Rajesh (Billing Staff)","role":"billing_staff","phone":"+91 8367444144"}'::jsonb,
            NOW(),
            NOW()
        );
    ELSE
        UPDATE auth.users SET
            encrypted_password = crypt('staff123', gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_user_meta_data = '{"full_name":"K. Rajesh (Billing Staff)","role":"billing_staff","phone":"+91 8367444144"}'::jsonb
        WHERE id = v_staff_id;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (v_staff_id, 'billing@srautomobiles.in', 'K. Rajesh (Billing Staff)', 'billing_staff', '+91 8367444144')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone;
END $$;

-- ------------------------------------------------------------------------------
-- 17. TABLE & SCHEMA PRIVILEGES FOR ROLES
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;


