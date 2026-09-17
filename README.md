# SR AUTOMOBILES — Vehicle Sales & GST Billing System

A dealership-grade, production-quality internal web application engineered specifically for **SR AUTOMOBILES** in India. Built for billing two-wheelers including petrol motorcycles, scooters, and electric vehicles (EVs) in compliance with the **Central Goods and Services Tax (CGST) Act, 2017** and **Rule 46 of CGST Rules, 2017**.

---

## Key Features & Architecture

- **Unit-Level Inventory Management**: Individual physical unit tracking with strictly unique Chassis/VIN numbers, engine/motor numbers, battery numbers, HSN classification, and dynamic stock statuses (`IN_STOCK`, `BOOKED`, `SOLD`, `DELIVERED`).
- **Customer Master**: Retail Individual (B2C) and Registered Business (B2B) directory with 15-character statutory GSTIN validation and state code cross-verification.
- **Dynamic GST Calculation Engine**:
  - Automatically assesses **Place of Supply (POS)** against SR Automobiles' supplier state code.
  - **Intra-State**: Applies equal 50/50 split of `CGST` + `SGST`.
  - **Inter-State**: Applies full `IGST`.
  - Configurable Compensation Cess (e.g., 3% on engines > 250cc).
  - Decimal-safe financial arithmetic to eliminate IEEE-754 floating-point rounding errors.
  - Full support for both **Tax-Exclusive** and **Tax-Inclusive** reverse calculations.
  - Standard half-up integer currency round-off and Indian numbering system Number-to-Words converter (*"Rupees One Lakh Twenty Five Thousand Only"*).
- **Sequential FY-Based Invoice Numbering**:
  - Financial Year runs from 1 April to 31 March (e.g., `SRA/26-27/0001`).
  - Consecutive, un-reused, auto-generated sequence numbers.
- **Split & Multi-Mode Payment Engine**:
  - Handles Cash, UPI, Bank Transfer (NEFT/RTGS/IMPS), Debit/Credit Card, Cheque, and Auto Loans/Financing.
  - Captures finance company, loan sanction reference, and customer contribution.
- **Dealership A4 Tax Invoice Engine**:
  - Dedicated `@media print` CSS for pixel-perfect single-page A4 printing with zero browser chrome or sidebar clutter.
  - Copy type toggle: `ORIGINAL FOR RECIPIENT`, `DUPLICATE FOR TRANSPORTER`, `TRIPLICATE FOR SUPPLIER`.
  - In-browser vector PDF export via `html2canvas` and `jsPDF`.
- **Statutory Reports & Accounting Export**:
  - GST Sales Register (B2B & B2C breakdown).
  - HSN / SAC Summary.
  - Rate-wise Tax Summary (5%, 18%, 28%, Exempt).
  - Vehicles Sold Register and Outstanding Payments Report.
  - One-click export to CSV / Excel for Chartered Accountants and tax auditors.
- **Audit Logging**:
  - Immutable business activity log recording timestamps in Indian Standard Time (`Asia/Kolkata` IST).
- **Dual-Mode Backend Resilience**:
  - Seamlessly integrates with live **Supabase PostgreSQL** when configured.
  - Provides an intelligent, high-fidelity offline/local fallback with pre-loaded realistic Indian two-wheeler inventory for instant evaluation and testing.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Backend / Database**: Supabase, PostgreSQL 15+, Row-Level Security (RLS).
- **PDF & Printing**: `@media print` engine, jsPDF, html2canvas.
- **Testing**: Vitest automated unit testing suite.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Clone the repository and navigate to the project directory
cd Billing

# Install project dependencies
npm install
```

### 3. Running Locally in Development Mode
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

---

## Supabase Setup & Database Migration

### 1. Create a Supabase Project
1. Visit [Supabase](https://supabase.com) and create a new project.
2. Under **Project Settings -> API**, copy your `Project URL` and `anon public` key.

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### 3. Run Database Migrations
1. Open the **SQL Editor** in your Supabase dashboard.
2. Copy and execute the complete migration script located at:
   ```
   supabase/migrations/20260916_init_sr_automobiles.sql
   ```
3. This creates:
   - PostgreSQL ENUMs (`user_role`, `stock_status`, `vehicle_category`, etc.).
   - Tables (`profiles`, `business_settings`, `hsn_master`, `vehicles`, `customers`, `invoices`, `invoice_items`, `payments`, `audit_logs`, `invoice_sequences`).
   - Stored functions (`generate_next_invoice_number`, `finalize_invoice`, `cancel_invoice`).
   - Pre-seeded SR Automobiles master data and HSN tax codes.

---

## Creating the First Owner Account

1. Under **Supabase Dashboard -> Authentication -> Users**, click **Add User**.
2. Enter email (e.g. `owner@srautomobiles.in`) and password.
3. In the SQL Editor, link the user to the `owner` role:
   ```sql
   INSERT INTO profiles (id, email, full_name, role)
   VALUES ('<USER-UUID-FROM-AUTH>', 'owner@srautomobiles.in', 'Venkata Ramana Reddy Umma', 'owner');
   ```

*Note: For local development and evaluation, the application provides built-in 1-click test credentials for Owner, Admin, and Billing Staff.*

---

## Configuring Dealership Settings

1. Navigate to **Settings -> Dealership Identity**:
   - Verify Business Name: `SR AUTOMOBILES`
   - Owner / Authorized Person: `Venkata Ramana Reddy Umma`
   - Dealership Address: `Chandrababu Nagar Ring`, City: `Mylavaram`, State: `Andhra Pradesh` (State Code: `37`), PIN: `521230`.
   - Phone: `8367444144` (+91 8367444144), Invoice Prefix: `SRA`.
2. Navigate to **Settings -> Bank & UPI Accounts**:
   - Enter Bank Name, Account Holder Name, Account Number, IFSC, and UPI ID.
   - These details are automatically embedded into every printable tax invoice footer.
3. Navigate to **Settings -> Tax & HSN Master**:
   - Manage HSN codes (e.g., `871120` @ 28% for petrol vehicles, `871160` @ 5% for electric vehicles, `871410` @ 28% for accessories).

---

## Running Automated Tests

Run the Vitest test suite to verify tax calculations, currency words conversion, and statutory validations:
```bash
npm test
```

To run tests in watch mode:
```bash
npx vitest
```

---

## Building for Production

```bash
# Build the optimized production bundle
npm run build

# Preview the production build locally
npm run preview
```
The compiled bundle will be output to the `dist/` directory, ready for deployment to any modern web hosting platform (Vercel, Netlify, Cloudflare Pages, AWS Amplify, or self-hosted Nginx).

---

## Backing Up & Restoring Data

- **Database Backup via Supabase CLI**:
  ```bash
  supabase db dump -f sr_automobiles_backup.sql
  ```
- **CSV Data Extraction**:
  Navigate to **Reports -> GST Sales Register** or **Vehicle Sold Register** and click **Export CSV / Excel** to archive business transaction data.
