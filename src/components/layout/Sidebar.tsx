import React from 'react';
import {
  LayoutDashboard,
  Bike,
  Users,
  FilePlus,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  History,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavSection =
  | 'dashboard'
  | 'vehicles'
  | 'customers'
  | 'new-invoice'
  | 'sales'
  | 'payments'
  | 'reports'
  | 'settings'
  | 'audit';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSelectSection }) => {
  const { user, logout, isOwner } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles' as NavSection, label: 'Vehicles', icon: Bike },
    { id: 'customers' as NavSection, label: 'Customers', icon: Users },
    { id: 'new-invoice' as NavSection, label: 'New Invoice', icon: FilePlus, highlight: true },
    { id: 'sales' as NavSection, label: 'Sales / Invoices', icon: Receipt },
    { id: 'payments' as NavSection, label: 'Payments', icon: CreditCard },
    { id: 'reports' as NavSection, label: 'Reports', icon: BarChart3 },
    { id: 'audit' as NavSection, label: 'Audit Log', icon: History },
    { id: 'settings' as NavSection, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#16191f] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none no-print min-h-screen">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#12141a]">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-700/60 bg-black shadow-md shadow-black/60">
            <img src="/logo.png" alt="SR Automobiles" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold tracking-wider text-white uppercase font-mono truncate">
              SR AUTOMOBILES
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-red-400 font-semibold truncate">
              Vehicle Sales & GST
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group btn-interactive ${
                isActive
                  ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-950/40 translate-x-1'
                  : item.highlight
                  ? 'text-red-400 hover:bg-slate-800/60 hover:text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
              }`}
            >
              <Icon
                className={`w-4 h-4 mr-3 transition-colors ${
                  isActive
                    ? 'text-white'
                    : item.highlight
                    ? 'text-red-500 group-hover:text-white'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {item.highlight && !isActive && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-[#12141a]/60">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Staff User'}</p>
            <div className="flex items-center space-x-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-red-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                {user?.role || 'staff'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-md transition-colors border border-slate-800"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
