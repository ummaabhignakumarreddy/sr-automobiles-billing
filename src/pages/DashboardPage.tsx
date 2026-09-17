import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatINR, formatDateIndian } from '../lib/formatters';
import {
  Bike,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  AlertCircle,
  FilePlus,
  Users,
  PlusCircle,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigateNewInvoice: () => void;
  onNavigateAddVehicle: () => void;
  onNavigateAddCustomer: () => void;
  onViewInvoice: (invoiceId: string) => void;
  onNavigateSales: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateNewInvoice,
  onNavigateAddVehicle,
  onNavigateAddCustomer,
  onViewInvoice,
  onNavigateSales,
}) => {
  const { vehicles, invoices } = useAppData();

  // Metrics calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // 1. Vehicles In Stock
  const inStockVehicles = vehicles.filter(v => v.stock_status === 'IN_STOCK').length;
  const bookedVehicles = vehicles.filter(v => v.stock_status === 'BOOKED').length;

  // 2. Vehicles Sold This Month
  const finalizedInvoices = invoices.filter(inv => inv.status === 'FINALIZED');
  const thisMonthInvoices = finalizedInvoices.filter(inv => {
    const invDate = new Date(inv.invoice_date);
    return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
  });
  const vehiclesSoldThisMonth = thisMonthInvoices.length;

  // 3. Today's Sales
  const todayInvoices = finalizedInvoices.filter(inv => inv.invoice_date === todayStr);
  const todaySalesAmount = todayInvoices.reduce((acc, inv) => acc + inv.grand_total, 0);

  // 4. Monthly Sales Amount
  const monthlySalesAmount = thisMonthInvoices.reduce((acc, inv) => acc + inv.grand_total, 0);

  // 5. Pending Payments count & Total Outstanding
  const pendingPaymentInvoices = finalizedInvoices.filter(inv => inv.balance_amount > 0);
  const pendingPaymentsCount = pendingPaymentInvoices.length;
  const totalOutstandingAmount = pendingPaymentInvoices.reduce((acc, inv) => acc + inv.balance_amount, 0);

  // Recent invoices (top 6)
  const recentInvoices = [...invoices].slice(0, 6);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Quick Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Showroom Operations & Quick Actions</h2>
          <p className="text-xs text-slate-500">Fast vehicle billing and unit inventory intake</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNavigateNewInvoice}
            className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors"
          >
            <FilePlus className="w-4 h-4" />
            <span>NEW INVOICE</span>
          </button>

          <button
            onClick={onNavigateAddVehicle}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ADD VEHICLE</span>
          </button>

          <button
            onClick={onNavigateAddCustomer}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>ADD CUSTOMER</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Vehicles In Stock"
          value={`${inStockVehicles} Units`}
          subtitle={`${bookedVehicles} Booked / Reserved`}
          icon={<Bike className="w-5 h-5 text-red-600" />}
          color="red"
        />

        <StatCard
          title="Vehicles Sold This Month"
          value={`${vehiclesSoldThisMonth} Units`}
          subtitle={`Total Dealership Sales`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          color="emerald"
        />

        <StatCard
          title="Today's Sales"
          value={formatINR(todaySalesAmount)}
          subtitle={`${todayInvoices.length} vehicle(s) invoiced today`}
          icon={<Receipt className="w-5 h-5 text-blue-600" />}
          color="blue"
        />

        <StatCard
          title="Monthly Sales Volume"
          value={formatINR(monthlySalesAmount)}
          subtitle={`Current Calendar Month`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          color="emerald"
        />

        <StatCard
          title="Pending Payments"
          value={`${pendingPaymentsCount} Invoices`}
          subtitle="Awaiting full settlement"
          icon={<CreditCard className="w-5 h-5 text-amber-600" />}
          color="amber"
        />

        <StatCard
          title="Total Outstanding"
          value={formatINR(totalOutstandingAmount)}
          subtitle="Receivable from buyers / finance"
          icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
          color="default"
        />
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Tax Invoices</h3>
            <p className="text-xs text-slate-500">Latest transactions generated at the billing counter</p>
          </div>
          <button
            onClick={onNavigateSales}
            className="flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            <span>View All Invoices</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-fade-in">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No invoices created yet</p>
            <p className="mt-1 text-slate-400 mb-4">Click "New Invoice" to create your first vehicle sale GST invoice.</p>
            <button
              onClick={onNavigateNewInvoice}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors btn-interactive"
            >
              <FilePlus className="w-4 h-4" />
              <span>Create First Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Invoice Number</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Vehicle / VIN</th>
                  <th className="px-6 py-3 text-right">Grand Total</th>
                  <th className="px-6 py-3 text-center">Payment</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-900">
                      {inv.invoice_number}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {formatDateIndian(inv.invoice_date)}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-900">{inv.customer_snapshot.name}</p>
                      <p className="text-[11px] text-slate-500">{inv.customer_snapshot.mobile}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-900">
                        {inv.vehicle_snapshot.brand} {inv.vehicle_snapshot.model}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        VIN: {inv.vehicle_snapshot.vin_chassis}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-950">
                      {formatINR(inv.grand_total)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <StatusBadge status={inv.payment_status} size="sm" />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => onViewInvoice(inv.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition-colors"
                      >
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
