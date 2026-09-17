import React from 'react';
import { NavSection } from './Sidebar';
import { FilePlus, Database, CloudCheck, ShieldCheck } from 'lucide-react';
import { getIndianFinancialYear } from '../../lib/invoiceSequence';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAppData } from '../../context/AppDataContext';

interface HeaderProps {
  currentSection: NavSection;
  onNavigateNewInvoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentSection, onNavigateNewInvoice }) => {
  const { settings } = useAppData();
  const currentFY = getIndianFinancialYear(new Date());

  const titles: Record<NavSection, { title: string; desc: string }> = {
    dashboard: { title: 'Dealership Dashboard', desc: 'Real-time sales, inventory, and payment metrics' },
    vehicles: { title: 'Vehicle Inventory', desc: 'Unit-level stock tracking with unique VIN/Chassis numbers' },
    customers: { title: 'Customers Directory', desc: 'Client database with GSTIN verification and addresses' },
    'new-invoice': { title: 'Create GST Tax Invoice', desc: 'Guided vehicle sales billing engine' },
    sales: { title: 'Sales & Invoices History', desc: 'Generated tax invoices, payment records, and lifecycle' },
    payments: { title: 'Payment Management', desc: 'Record split payments, cash, UPI, bank and vehicle finance' },
    reports: { title: 'Compliance & Sales Reports', desc: 'GST sales registers, HSN summary, and exports for accounting' },
    audit: { title: 'Audit Trail', desc: 'Immutable business activity and transaction logs' },
    settings: { title: 'Dealership Settings', desc: 'SR Automobiles profile, tax rates, bank details and compliance' },
  };

  const current = titles[currentSection] || { title: 'SR Automobiles', desc: 'Vehicle Billing' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 no-print">
      <div>
        <h2 className="text-lg font-bold text-slate-900 leading-tight">{current.title}</h2>
        <p className="text-xs text-slate-500">{current.desc}</p>
      </div>

      <div className="flex items-center space-x-4">
        {/* Dealership & FY Badge */}
        <div className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <img src="/logo.png" alt="Logo" className="w-5 h-5 rounded object-cover bg-black" />
          <span className="font-semibold text-slate-800">{settings.business_name}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">FY {currentFY}</span>
        </div>

        {/* Connection Status */}
        {isSupabaseConfigured ? (
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-medium" title="Connected to Supabase cloud PostgreSQL database">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Supabase Live</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-medium" title="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to connect Supabase">
            <Database className="w-3 h-3 text-amber-500" />
            <span>Local DB (Offline)</span>
          </div>
        )}

        {/* Quick New Invoice Action Button */}
        {currentSection !== 'new-invoice' && (
          <button
            onClick={onNavigateNewInvoice}
            className="flex items-center space-x-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <FilePlus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        )}
      </div>
    </header>
  );
};
