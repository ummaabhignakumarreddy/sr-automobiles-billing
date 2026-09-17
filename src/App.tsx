import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { CustomersPage } from './pages/CustomersPage';
import { NewInvoicePage } from './pages/NewInvoicePage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { PrintableInvoice } from './components/invoice/PrintableInvoice';
import { VehicleFormModal } from './components/vehicles/VehicleFormModal';
import { CustomerFormModal } from './components/customers/CustomerFormModal';
import { Footer } from './components/common/Footer';
import { Invoice } from './types/database.types';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const { invoices } = useAppData();

  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [activeInvoiceView, setActiveInvoiceView] = useState<Invoice | null>(null);

  // Quick modals accessible globally
  const [isQuickVehicleModalOpen, setIsQuickVehicleModalOpen] = useState(false);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-300 font-mono tracking-wider">Loading SR AUTOMOBILES...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleViewInvoiceById = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      setActiveInvoiceView(inv);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* Dark Charcoal Dealership Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={sec => {
          setActiveInvoiceView(null);
          setCurrentSection(sec);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Dealership Header */}
        <Header
          currentSection={currentSection}
          onNavigateNewInvoice={() => {
            setActiveInvoiceView(null);
            setCurrentSection('new-invoice');
          }}
        />

        {/* Scrollable Page Body with Smooth Transition */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] flex flex-col justify-between">
          <div key={activeInvoiceView ? `inv-${activeInvoiceView.id}` : currentSection} className="animate-fade-in-up flex-1">
            {activeInvoiceView ? (
              <div className="p-6">
                <PrintableInvoice
                  invoice={activeInvoiceView}
                  onBack={() => setActiveInvoiceView(null)}
                  showControls={true}
                />
              </div>
            ) : (
              <>
                {currentSection === 'dashboard' && (
                  <DashboardPage
                    onNavigateNewInvoice={() => setCurrentSection('new-invoice')}
                    onNavigateAddVehicle={() => setIsQuickVehicleModalOpen(true)}
                    onNavigateAddCustomer={() => setIsQuickCustomerModalOpen(true)}
                    onViewInvoice={handleViewInvoiceById}
                    onNavigateSales={() => setCurrentSection('sales')}
                  />
                )}

                {currentSection === 'vehicles' && <VehiclesPage />}

                {currentSection === 'customers' && <CustomersPage />}

                {currentSection === 'new-invoice' && (
                  <NewInvoicePage
                    onInvoiceFinalized={inv => {
                      // stays on invoice page showing the finalized A4 printable invoice
                    }}
                  />
                )}

                {currentSection === 'sales' && (
                  <SalesHistoryPage
                    onNavigateNewInvoice={() => setCurrentSection('new-invoice')}
                  />
                )}

                {currentSection === 'payments' && <PaymentsPage />}

                {currentSection === 'reports' && <ReportsPage />}

                {currentSection === 'audit' && <AuditLogPage />}

                {currentSection === 'settings' && <SettingsPage />}
              </>
            )}
          </div>

          {/* Bottom Footer across every page */}
          <Footer />
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <VehicleFormModal
        isOpen={isQuickVehicleModalOpen}
        onClose={() => setIsQuickVehicleModalOpen(false)}
      />

      <CustomerFormModal
        isOpen={isQuickCustomerModalOpen}
        onClose={() => setIsQuickCustomerModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <MainApp />
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;
