import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Customer } from '../types/database.types';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import {
  Users,
  Plus,
  Search,
  Building2,
  User,
  Phone,
  MapPin,
  FileCheck,
  Edit2,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { customers } = useAppData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        c.mobile.includes(term) ||
        (c.alt_mobile && c.alt_mobile.includes(term)) ||
        (c.gstin && c.gstin.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        c.city.toLowerCase().includes(term);

      const matchType = selectedType === 'ALL' || c.customer_type === selectedType;

      return matchSearch && matchType;
    });
  }, [customers, searchTerm, selectedType]);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customers Master</h2>
          <p className="text-xs text-slate-500">
            Registered vehicle buyers, individual retail customers, and business accounts for GST invoices
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search customers by Name, Mobile Number, GSTIN, Email, City..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="ALL">All Account Types</option>
              <option value="Individual">Individual (B2C Retail)</option>
              <option value="Business">Business (B2B Registered)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-fade-in">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No customers found</p>
            <p className="mt-1 text-slate-400 mb-4">Register retail buyers or GST registered business clients.</p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors btn-interactive"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Customer Profile</th>
                  <th className="px-6 py-3">Contact Details</th>
                  <th className="px-6 py-3">GSTIN / Tax ID</th>
                  <th className="px-6 py-3">Location & State</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Customer Profile */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-700 mt-0.5">
                          {cust.customer_type === 'Business' ? (
                            <Building2 className="w-4 h-4 text-blue-600" />
                          ) : (
                            <User className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{cust.name}</p>
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mt-0.5 ${
                              cust.customer_type === 'Business'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {cust.customer_type}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-3.5">
                      <p className="font-mono font-semibold text-slate-900">{cust.mobile}</p>
                      {cust.alt_mobile && (
                        <p className="text-[11px] font-mono text-slate-500">Alt: {cust.alt_mobile}</p>
                      )}
                      {cust.email && <p className="text-[11px] text-slate-500">{cust.email}</p>}
                    </td>

                    {/* GSTIN */}
                    <td className="px-6 py-3.5">
                      {cust.gst_registered && cust.gstin ? (
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                            {cust.gstin}
                          </span>
                          <span className="block text-[10px] text-emerald-700 font-semibold">
                            Registered B2B
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unregistered (B2C)</span>
                      )}
                      {cust.pan && <p className="text-[10px] font-mono text-slate-500 mt-0.5">PAN: {cust.pan}</p>}
                    </td>

                    {/* Location */}
                    <td className="px-6 py-3.5">
                      <p className="text-slate-800 font-medium">{cust.city}, {cust.state}</p>
                      <p className="text-[11px] text-slate-500">
                        State Code: <strong className="text-slate-700">{cust.state_code}</strong> &bull; PIN: {cust.pincode}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleEdit(cust)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors inline-flex items-center space-x-1"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialCustomer={selectedCustomer}
      />
    </div>
  );
};
