import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { formatDateTimeIST } from '../lib/formatters';
import { History, Search, ShieldCheck, User, Clock, FileText } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      log.action.toLowerCase().includes(term) ||
      log.entity_type.toLowerCase().includes(term) ||
      log.entity_id.toLowerCase().includes(term) ||
      (log.user_email && log.user_email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Audit Trail</h2>
          <p className="text-xs text-slate-500">
            Immutable log of invoice creations, cancellations, payments, and inventory status changes (Timestamps in IST Asia/Kolkata)
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600">Timezone: <strong>Asia/Kolkata (IST)</strong></span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search audit trail by Action, User Email, Entity Type, Record ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No audit events recorded yet</p>
            <p className="mt-1">Actions performed across the application will be automatically logged here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Timestamp (IST)</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Entity Type & ID</th>
                  <th className="px-6 py-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.map(log => {
                  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (log.action.includes('FINALIZED')) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (log.action.includes('CANCELLED')) badgeColor = 'bg-red-50 text-red-700 border-red-200';
                  if (log.action.includes('PAYMENT')) badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (log.action.includes('VEHICLE')) badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">
                        {formatDateTimeIST(log.created_at)}
                      </td>
                      <td className="px-6 py-3.5 font-sans font-semibold text-slate-900">
                        {log.user_email || 'staff@srautomobiles.in'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${badgeColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">
                        <span className="font-sans text-slate-500 uppercase text-[10px] block">{log.entity_type}</span>
                        <span className="font-mono text-slate-900">{log.entity_id}</span>
                      </td>
                      <td className="px-6 py-3.5 font-sans text-slate-600 max-w-xs truncate">
                        {log.new_values ? (
                          <span title={JSON.stringify(log.new_values, null, 2)}>
                            {JSON.stringify(log.new_values)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
