import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BusinessSettings,
  HsnMaster,
  Vehicle,
  Customer,
  Invoice,
  PaymentRecord,
  AuditLog,
  StockStatus,
} from '../types/database.types';
import {
  INITIAL_BUSINESS_SETTINGS,
  INITIAL_HSN_LIST,
  INITIAL_VEHICLES,
  INITIAL_CUSTOMERS,
} from '../mock/demoData';
import { getIndianFinancialYear, formatInvoiceNumber } from '../lib/invoiceSequence';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { round2 } from '../lib/gstEngine';

interface AppDataContextType {
  settings: BusinessSettings;
  updateSettings: (newSettings: Partial<BusinessSettings>) => Promise<void>;
  
  hsnList: HsnMaster[];
  addHsn: (hsn: Omit<HsnMaster, 'id'>) => Promise<void>;
  updateHsn: (id: string, hsn: Partial<HsnMaster>) => Promise<void>;

  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string; vehicle?: Vehicle }>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<{ success: boolean; error?: string }>;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string; customer?: Customer }>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<{ success: boolean; error?: string }>;

  invoices: Invoice[];
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoice_number' | 'financial_year' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string; invoice?: Invoice }>;
  finalizeInvoice: (invoiceId: string, userId: string, userEmail: string) => Promise<{ success: boolean; error?: string; invoice?: Invoice }>;
  cancelInvoice: (invoiceId: string, reason: string, restockStatus: StockStatus | 'NONE', userId: string, userEmail: string) => Promise<{ success: boolean; error?: string }>;
  recordPayment: (invoiceId: string, payment: Omit<PaymentRecord, 'id' | 'invoice_id' | 'created_at'>, userEmail?: string) => Promise<{ success: boolean; error?: string }>;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, entityType: string, entityId: string, oldValues?: any, newValues?: any, userEmail?: string) => void;

  getNextInvoiceNumberPreview: () => string;
  resetToDemoData: () => void;
  wipeAllData: () => void;
}

const STORAGE_KEYS = {
  SETTINGS: 'sra_settings_v1',
  HSN: 'sra_hsn_v1',
  VEHICLES: 'sra_vehicles_v1',
  CUSTOMERS: 'sra_customers_v1',
  INVOICES: 'sra_invoices_v1',
  SEQUENCES: 'sra_sequences_v1',
  AUDIT: 'sra_audit_logs_v1',
};

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const isValidUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings State
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Automatic migration: if old demo data is present, update to SR AUTOMOBILES Mylavaram AP details
        if (
          parsed.legal_name?.includes('DEALERSHIP LLP') ||
          parsed.city === 'Hyderabad' ||
          parsed.state === 'Telangana' ||
          parsed.state_code === '36' ||
          parsed.authorized_signatory?.includes('Ramesh Reddy') ||
          parsed.phone?.includes('98490 12345') ||
          parsed.pincode === '500070'
        ) {
          const migrated: BusinessSettings = {
            ...INITIAL_BUSINESS_SETTINGS,
            invoice_prefix: parsed.invoice_prefix || INITIAL_BUSINESS_SETTINGS.invoice_prefix,
            terms_and_conditions: parsed.terms_and_conditions || INITIAL_BUSINESS_SETTINGS.terms_and_conditions,
          };
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(migrated));
          return migrated;
        }
        return parsed;
      } catch (e) {
        return INITIAL_BUSINESS_SETTINGS;
      }
    }
    return INITIAL_BUSINESS_SETTINGS;
  });

  // 2. HSN Master State
  const [hsnList, setHsnList] = useState<HsnMaster[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HSN);
    return saved ? JSON.parse(saved) : INITIAL_HSN_LIST;
  });

  // 3. Vehicles State (Clean slate, demo data purged)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Purge old demo vehicles if found
        if (Array.isArray(parsed) && parsed.some((v: any) => v.vin_chassis?.startsWith('MD625AY') || v.vehicle_id === 'VEH-2026-001' || v.vin_chassis === 'MD626CY90P0543212')) {
          localStorage.removeItem(STORAGE_KEYS.VEHICLES);
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return INITIAL_VEHICLES;
  });

  // 4. Customers State (Clean slate, demo data purged)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Purge old demo customers if found
        if (Array.isArray(parsed) && parsed.some((c: any) => c.customer_id === 'CUST-2026-001' || c.name === 'Venkatesh Rao Goud' || c.pan === 'BVRPG1234K')) {
          localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return INITIAL_CUSTOMERS;
  });

  // 5. Invoices State (Clean slate)
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Purge demo invoices
        if (Array.isArray(parsed) && parsed.some((inv: any) => inv.customer_snapshot?.name?.includes('Venkatesh') || inv.vehicle_snapshot?.vin_chassis?.startsWith('MD625AY'))) {
          localStorage.removeItem(STORAGE_KEYS.INVOICES);
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // 6. Sequences State: { [fy: string]: number }
  const [sequences, setSequences] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SEQUENCES);
    return saved ? JSON.parse(saved) : { '26-27': 0 };
  });

  // 7. Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state to local storage for offline reliability
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HSN, JSON.stringify(hsnList));
  }, [hsnList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEQUENCES, JSON.stringify(sequences));
  }, [sequences]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Load from Supabase if configured
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const loadRemoteData = async () => {
      try {
        const { data: dbSettings } = await client.from('business_settings').select('*').single();
        if (dbSettings) setSettings(dbSettings);

        const { data: dbHsn } = await client.from('hsn_master').select('*');
        if (dbHsn && dbHsn.length > 0) setHsnList(dbHsn);

        const { data: dbVehicles } = await client.from('vehicles').select('*').order('created_at', { ascending: false });
        if (dbVehicles) setVehicles(dbVehicles);

        const { data: dbCustomers } = await client.from('customers').select('*').order('created_at', { ascending: false });
        if (dbCustomers) setCustomers(dbCustomers);

        const { data: dbInvoices } = await client
          .from('invoices')
          .select('*, items:invoice_items(*), payments:payments(*)')
          .order('created_at', { ascending: false });
        if (dbInvoices) setInvoices(dbInvoices);

        const { data: dbSequences } = await client.from('invoice_sequences').select('*');
        if (dbSequences && dbSequences.length > 0) {
          const seqMap: Record<string, number> = {};
          dbSequences.forEach((s: any) => {
            if (s.financial_year) seqMap[s.financial_year] = Number(s.last_number) || 0;
          });
          setSequences(prev => ({ ...prev, ...seqMap }));
        }
      } catch (err) {
        console.warn('Could not load remote Supabase data, using local cache:', err);
      }
    };

    loadRemoteData();
  }, []);

  // Audit Logger Helper
  const addAuditLog = (
    action: string,
    entityType: string,
    entityId: string,
    oldValues?: any,
    newValues?: any,
    userEmail?: string
  ) => {
    const log: AuditLog = {
      id: generateUUID(),
      user_email: userEmail || 'owner@srautomobiles.in',
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      created_at: new Date().toISOString(),
    };
    setAuditLogs(prev => [log, ...prev]);

    const client = supabase;
    if (isSupabaseConfigured && client) {
      client.from('audit_logs').insert([log]).then(({ error }) => {
        if (error) console.error('Audit log remote save error:', error);
      });
    }
  };

  // Preview next consecutive invoice number
  const getNextInvoiceNumberPreview = (): string => {
    const fy = getIndianFinancialYear(new Date());
    const currentSeq = sequences[fy] || 0;
    return formatInvoiceNumber(settings.invoice_prefix || 'SRA', fy, currentSeq + 1);
  };

  // Settings update
  const updateSettings = async (newSettings: Partial<BusinessSettings>) => {
    const updated = { ...settings, ...newSettings, updated_at: new Date().toISOString() };
    setSettings(updated);
    addAuditLog('SETTINGS_MODIFIED', 'business_settings', updated.id, settings, updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('business_settings').upsert(updated);
    }
  };

  // HSN Management
  const addHsn = async (hsn: Omit<HsnMaster, 'id'>) => {
    const newHsn: HsnMaster = {
      id: generateUUID(),
      ...hsn,
    };
    setHsnList(prev => [...prev, newHsn]);
    addAuditLog('HSN_CREATED', 'hsn_master', newHsn.id, null, newHsn);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('hsn_master').insert([newHsn]);
    }
  };

  const updateHsn = async (id: string, updates: Partial<HsnMaster>) => {
    const old = hsnList.find(h => h.id === id);
    setHsnList(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)));
    addAuditLog('HSN_UPDATED', 'hsn_master', id, old, updates);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('hsn_master').update(updates).eq('id', id);
    }
  };

  // Vehicle Management
  const addVehicle = async (
    vehicleInput: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string; vehicle?: Vehicle }> => {
    const cleanVin = vehicleInput.vin_chassis.trim().toUpperCase();

    // Validate VIN uniqueness
    const exists = vehicles.some(v => v.vin_chassis.trim().toUpperCase() === cleanVin);
    if (exists) {
      return { success: false, error: `Vehicle with Chassis/VIN "${cleanVin}" already exists in inventory.` };
    }

    // Engine uniqueness if present
    if (vehicleInput.engine_number && vehicleInput.engine_number.trim()) {
      const cleanEngine = vehicleInput.engine_number.trim().toUpperCase();
      const engineExists = vehicles.some(v => v.engine_number && v.engine_number.trim().toUpperCase() === cleanEngine);
      if (engineExists) {
        return { success: false, error: `Vehicle with Engine Number "${cleanEngine}" already exists.` };
      }
    }

    // Motor uniqueness if present
    if (vehicleInput.motor_number && vehicleInput.motor_number.trim()) {
      const cleanMotor = vehicleInput.motor_number.trim().toUpperCase();
      const motorExists = vehicles.some(v => v.motor_number && v.motor_number.trim().toUpperCase() === cleanMotor);
      if (motorExists) {
        return { success: false, error: `Vehicle with Motor Number "${cleanMotor}" already exists.` };
      }
    }

    const newVehicle: Vehicle = {
      id: generateUUID(),
      ...vehicleInput,
      vin_chassis: cleanVin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setVehicles(prev => [newVehicle, ...prev]);
    addAuditLog('VEHICLE_ADDED', 'vehicles', newVehicle.id, null, newVehicle);

    if (isSupabaseConfigured && supabase) {
      const { error: insertErr } = await supabase.from('vehicles').insert([newVehicle]);
      if (insertErr) {
        console.error('Remote vehicle save error:', insertErr);
      }
    }

    return { success: true, vehicle: newVehicle };
  };

  const updateVehicle = async (
    id: string,
    updates: Partial<Vehicle>
  ): Promise<{ success: boolean; error?: string }> => {
    const target = vehicles.find(v => v.id === id);
    if (!target) {
      return { success: false, error: 'Vehicle not found' };
    }

    // VIN uniqueness check if changing
    if (updates.vin_chassis) {
      const cleanVin = updates.vin_chassis.trim().toUpperCase();
      const exists = vehicles.some(v => v.id !== id && v.vin_chassis.trim().toUpperCase() === cleanVin);
      if (exists) {
        return { success: false, error: `Chassis/VIN "${cleanVin}" is already assigned to another vehicle.` };
      }
    }

    const updated = { ...target, ...updates, updated_at: new Date().toISOString() };
    setVehicles(prev => prev.map(v => (v.id === id ? updated : v)));
    addAuditLog('VEHICLE_UPDATED', 'vehicles', id, target, updates);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('vehicles').update(updates).eq('id', id);
    }

    return { success: true };
  };

  // Customer Management
  const addCustomer = async (
    customerInput: Omit<Customer, 'id' | 'created_at'>
  ): Promise<{ success: boolean; error?: string; customer?: Customer }> => {
    const newCustomer: Customer = {
      id: generateUUID(),
      ...customerInput,
      created_at: new Date().toISOString(),
    };

    setCustomers(prev => [newCustomer, ...prev]);
    addAuditLog('CUSTOMER_ADDED', 'customers', newCustomer.id, null, newCustomer);

    if (isSupabaseConfigured && supabase) {
      const { error: insertErr } = await supabase.from('customers').insert([newCustomer]);
      if (insertErr) {
        console.error('Remote customer insert error:', insertErr);
      }
    }

    return { success: true, customer: newCustomer };
  };

  const updateCustomer = async (
    id: string,
    updates: Partial<Customer>
  ): Promise<{ success: boolean; error?: string }> => {
    const target = customers.find(c => c.id === id);
    if (!target) {
      return { success: false, error: 'Customer not found' };
    }

    const updated = { ...target, ...updates };
    setCustomers(prev => prev.map(c => (c.id === id ? updated : c)));
    addAuditLog('CUSTOMER_UPDATED', 'customers', id, target, updates);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('customers').update(updates).eq('id', id);
    }

    return { success: true };
  };

  // Invoice Creation & Lifecycle
  const createInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'invoice_number' | 'financial_year' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string; invoice?: Invoice }> => {
    const fy = getIndianFinancialYear(new Date(invoiceData.invoice_date || new Date()));
    const nextSeq = (sequences[fy] || 0) + 1;
    const invNo = formatInvoiceNumber(settings.invoice_prefix || 'SRA', fy, nextSeq);

    const invoiceId = generateUUID();

    const itemsWithIds = (invoiceData.items || []).map(item => ({
      ...item,
      id: generateUUID(),
      invoice_id: invoiceId,
    }));

    const paymentsWithIds = (invoiceData.payments || []).map(p => ({
      ...p,
      id: generateUUID(),
      invoice_id: invoiceId,
    }));

    const newInvoice: Invoice = {
      ...invoiceData,
      id: invoiceId,
      invoice_number: invNo,
      financial_year: fy,
      items: itemsWithIds,
      payments: paymentsWithIds,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update sequence
    setSequences(prev => ({ ...prev, [fy]: nextSeq }));

    // If invoice is created as FINALIZED immediately
    if (newInvoice.status === 'FINALIZED') {
      // Mark vehicle as SOLD
      if (newInvoice.vehicle_id) {
        setVehicles(prev =>
          prev.map(v => (v.id === newInvoice.vehicle_id ? { ...v, stock_status: 'SOLD' } : v))
        );
      }
    }

    setInvoices(prev => [newInvoice, ...prev]);
    addAuditLog(
      newInvoice.status === 'FINALIZED' ? 'INVOICE_FINALIZED' : 'INVOICE_CREATED',
      'invoices',
      newInvoice.id,
      null,
      { invoice_number: newInvoice.invoice_number, grand_total: newInvoice.grand_total }
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const { items, payments, ...invRecord } = newInvoice;
        const cleanInvRecord = {
          ...invRecord,
          customer_id: isValidUUID(invRecord.customer_id) ? invRecord.customer_id : null,
          vehicle_id: isValidUUID(invRecord.vehicle_id) ? invRecord.vehicle_id : null,
          created_by: isValidUUID(invRecord.created_by) ? invRecord.created_by : null,
          cancelled_by: isValidUUID(invRecord.cancelled_by) ? invRecord.cancelled_by : null,
        };

        const { error: invErr } = await supabase.from('invoices').insert([cleanInvRecord]);
        if (invErr) {
          console.error('Remote invoice insert error:', invErr);
        }

        if (itemsWithIds && itemsWithIds.length > 0) {
          const itemsPayload = itemsWithIds.map(it => ({
            id: it.id,
            invoice_id: invoiceId,
            item_type: it.item_type,
            description: it.description,
            hsn_sac: it.hsn_sac,
            quantity: it.quantity,
            unit: it.unit,
            rate: it.rate,
            discount: it.discount,
            taxable_value: it.taxable_value,
            tax_treatment: it.tax_treatment,
            gst_rate: it.gst_rate,
            cgst_rate: it.cgst_rate,
            cgst_amount: it.cgst_amount,
            sgst_rate: it.sgst_rate,
            sgst_amount: it.sgst_amount,
            igst_rate: it.igst_rate,
            igst_amount: it.igst_amount,
            cess_rate: it.cess_rate,
            cess_amount: it.cess_amount,
            total_amount: it.total_amount,
          }));
          const { error: itemErr } = await supabase.from('invoice_items').insert(itemsPayload);
          if (itemErr) {
            console.error('Remote invoice items error:', itemErr);
          }
        }

        if (paymentsWithIds && paymentsWithIds.length > 0) {
          const paymentsPayload = paymentsWithIds.map(p => ({
            id: p.id,
            invoice_id: invoiceId,
            payment_date: p.payment_date,
            amount: p.amount,
            payment_mode: p.payment_mode,
            reference_number: p.reference_number || null,
            finance_company: p.finance_company || null,
            loan_application_ref: p.loan_application_ref || null,
            customer_contribution: p.customer_contribution || null,
            notes: p.notes || null,
            created_by: isValidUUID(p.created_by) ? p.created_by : null,
          }));
          const { error: payErr } = await supabase.from('payments').insert(paymentsPayload);
          if (payErr) {
            console.error('Remote invoice payments error:', payErr);
          }
        }

        if (newInvoice.status === 'FINALIZED' && newInvoice.vehicle_id) {
          await supabase.from('vehicles').update({ stock_status: 'SOLD', updated_at: new Date().toISOString() }).eq('id', newInvoice.vehicle_id);
        }

        // Upsert sequence into Supabase
        await supabase.from('invoice_sequences').upsert({
          prefix: settings.invoice_prefix || 'SRA',
          financial_year: fy,
          last_number: nextSeq,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'prefix,financial_year' });
      } catch (err) {
        console.error('Remote invoice save error:', err);
      }
    }

    return { success: true, invoice: newInvoice };
  };

  const finalizeInvoice = async (
    invoiceId: string,
    userId: string,
    userEmail: string
  ): Promise<{ success: boolean; error?: string; invoice?: Invoice }> => {
    const target = invoices.find(inv => inv.id === invoiceId);
    if (!target) {
      return { success: false, error: 'Invoice not found' };
    }

    if (target.status !== 'DRAFT') {
      return { success: false, error: `Only DRAFT invoices can be finalized. Current status: ${target.status}` };
    }

    // Verify vehicle availability
    if (target.vehicle_id) {
      const veh = vehicles.find(v => v.id === target.vehicle_id);
      if (veh && veh.stock_status === 'SOLD') {
        return { success: false, error: `Vehicle VIN ${veh.vin_chassis} has already been sold!` };
      }
    }

    const updatedInvoice: Invoice = {
      ...target,
      status: 'FINALIZED',
      updated_at: new Date().toISOString(),
    };

    setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updatedInvoice : inv)));

    // Mark vehicle as SOLD
    if (target.vehicle_id) {
      setVehicles(prev =>
        prev.map(v => (v.id === target.vehicle_id ? { ...v, stock_status: 'SOLD' } : v))
      );
    }

    addAuditLog(
      'INVOICE_FINALIZED',
      'invoices',
      invoiceId,
      { status: 'DRAFT' },
      { status: 'FINALIZED', invoice_number: target.invoice_number, grand_total: target.grand_total },
      userEmail
    );

    if (isSupabaseConfigured && supabase) {
      await supabase.from('invoices').update({ status: 'FINALIZED' }).eq('id', invoiceId);
      if (target.vehicle_id) {
        await supabase.from('vehicles').update({ stock_status: 'SOLD' }).eq('id', target.vehicle_id);
      }
    }

    return { success: true, invoice: updatedInvoice };
  };

  const cancelInvoice = async (
    invoiceId: string,
    reason: string,
    restockStatus: StockStatus | 'NONE',
    userId: string,
    userEmail: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!reason || !reason.trim()) {
      return { success: false, error: 'Cancellation reason is required.' };
    }

    const target = invoices.find(inv => inv.id === invoiceId);
    if (!target) {
      return { success: false, error: 'Invoice not found' };
    }

    if (target.status === 'CANCELLED') {
      return { success: false, error: 'Invoice is already cancelled.' };
    }

    const updatedInvoice: Invoice = {
      ...target,
      status: 'CANCELLED',
      cancellation_reason: reason.trim(),
      cancelled_by: userEmail,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updatedInvoice : inv)));

    // Restock vehicle if requested
    if (target.vehicle_id && restockStatus !== 'NONE') {
      setVehicles(prev =>
        prev.map(v => (v.id === target.vehicle_id ? { ...v, stock_status: restockStatus } : v))
      );
    }

    addAuditLog(
      'INVOICE_CANCELLED',
      'invoices',
      invoiceId,
      { status: target.status },
      { status: 'CANCELLED', reason, restock_status: restockStatus },
      userEmail
    );

    if (isSupabaseConfigured && supabase) {
      await supabase.from('invoices').update({
        status: 'CANCELLED',
        cancellation_reason: reason.trim(),
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', invoiceId);

      if (target.vehicle_id && restockStatus !== 'NONE') {
        await supabase.from('vehicles').update({ 
          stock_status: restockStatus,
          updated_at: new Date().toISOString(),
        }).eq('id', target.vehicle_id);
      }
    }

    return { success: true };
  };

  const recordPayment = async (
    invoiceId: string,
    paymentInput: Omit<PaymentRecord, 'id' | 'invoice_id' | 'created_at'>,
    userEmail?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const target = invoices.find(inv => inv.id === invoiceId);
    if (!target) {
      return { success: false, error: 'Invoice not found' };
    }

    const newPaymentId = generateUUID();
    const newPayment: PaymentRecord = {
      id: newPaymentId,
      invoice_id: invoiceId,
      ...paymentInput,
      created_at: new Date().toISOString(),
      created_by: userEmail,
    };

    const updatedPayments = [...(target.payments || []), newPayment];
    const newTotalPaid = round2(updatedPayments.reduce((acc, p) => acc + p.amount, 0));
    const newBalance = round2(Math.max(0, target.grand_total - newTotalPaid));
    const newPaymentStatus = newBalance <= 0 ? 'PAID' : newTotalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

    const updatedInvoice: Invoice = {
      ...target,
      payments: updatedPayments,
      total_paid: newTotalPaid,
      balance_amount: newBalance,
      payment_status: newPaymentStatus,
      updated_at: new Date().toISOString(),
    };

    setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updatedInvoice : inv)));

    addAuditLog(
      'PAYMENT_RECORDED',
      'invoices',
      invoiceId,
      { total_paid: target.total_paid, balance: target.balance_amount },
      { payment_amount: paymentInput.amount, mode: paymentInput.payment_mode, new_balance: newBalance },
      userEmail
    );

    if (isSupabaseConfigured && supabase) {
      const dbPayment = {
        id: newPayment.id,
        invoice_id: invoiceId,
        payment_date: newPayment.payment_date,
        amount: newPayment.amount,
        payment_mode: newPayment.payment_mode,
        reference_number: newPayment.reference_number || null,
        finance_company: newPayment.finance_company || null,
        loan_application_ref: newPayment.loan_application_ref || null,
        customer_contribution: newPayment.customer_contribution || null,
        notes: newPayment.notes || null,
        created_by: isValidUUID(newPayment.created_by) ? newPayment.created_by : null,
      };
      const { error: payErr } = await supabase.from('payments').insert([dbPayment]);
      if (payErr) {
        console.error('Remote payment insert error:', payErr);
      }

      await supabase.from('invoices').update({
        total_paid: newTotalPaid,
        balance_amount: newBalance,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', invoiceId);
    }

    return { success: true };
  };

  const resetToDemoData = () => {
    setSettings(INITIAL_BUSINESS_SETTINGS);
    setHsnList(INITIAL_HSN_LIST);
    setVehicles(INITIAL_VEHICLES);
    setCustomers(INITIAL_CUSTOMERS);
    setInvoices([]);
    setSequences({ '26-27': 0 });
    setAuditLogs([]);
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  };

  const wipeAllData = () => {
    setVehicles([]);
    setCustomers([]);
    setInvoices([]);
    setAuditLogs([]);
    setSequences({ '26-27': 0 });
    localStorage.removeItem(STORAGE_KEYS.VEHICLES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    localStorage.removeItem(STORAGE_KEYS.SEQUENCES);
  };

  return (
    <AppDataContext.Provider
      value={{
        settings,
        updateSettings,
        hsnList,
        addHsn,
        updateHsn,
        vehicles,
        addVehicle,
        updateVehicle,
        customers,
        addCustomer,
        updateCustomer,
        invoices,
        createInvoice,
        finalizeInvoice,
        cancelInvoice,
        recordPayment,
        auditLogs,
        addAuditLog,
        getNextInvoiceNumberPreview,
        resetToDemoData,
        wipeAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
