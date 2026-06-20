/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Loan, Transaction, InstallmentSchedule, LoanStatus } from './types';
import { 
  SAMPLE_CUSTOMERS, 
  SAMPLE_LOANS, 
  SAMPLE_TRANSACTIONS,
  formatKhmerDate
} from './utils/sampleData';

// Component Views
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import LoanWizard from './components/LoanWizard';
import LoanDetails from './components/LoanDetails';
import Transactions from './components/Transactions';
import BackupRestore from './components/BackupRestore';

// Lucide Icons
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  PlusCircle, 
  History, 
  Database,
  Coins,
  Shield,
  Clock,
  Menu,
  X,
  Sparkles,
  Search
} from 'lucide-react';

export default function App() {
  // 1. Persistent Storage State Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Global search bar query
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  // Navigation active tab State
  // Values: 'dashboard', 'customers', 'loans', 'loans_new', 'transactions', 'backup'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [targetCustomerIdForNewLoan, setTargetCustomerIdForNewLoan] = useState<string | undefined>(undefined);
  
  // Responsive mobile sidebar toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Digital Cambodian Clock Time state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // UseEffect to load existing localStorage or seed with beautiful sample Khmer data!
  useEffect(() => {
    const localCustomers = localStorage.getItem('pawnshop_customers');
    const localLoans = localStorage.getItem('pawnshop_loans');
    const localTransactions = localStorage.getItem('pawnshop_transactions');

    if (localCustomers && localLoans && localTransactions) {
      setCustomers(JSON.parse(localCustomers));
      setLoans(JSON.parse(localLoans));
      setTransactions(JSON.parse(localTransactions));
    } else {
      // Seed with Khmer Sample Dataset
      localStorage.setItem('pawnshop_customers', JSON.stringify(SAMPLE_CUSTOMERS));
      localStorage.setItem('pawnshop_loans', JSON.stringify(SAMPLE_LOANS));
      localStorage.setItem('pawnshop_transactions', JSON.stringify(SAMPLE_TRANSACTIONS));
      
      setCustomers(SAMPLE_CUSTOMERS);
      setLoans(SAMPLE_LOANS);
      setTransactions(SAMPLE_TRANSACTIONS);
    }
  }, []);

  // Sync state changes with robust localStorage persistence
  const saveStateToLocalStorage = (c: Customer[], l: Loan[], t: Transaction[]) => {
    localStorage.setItem('pawnshop_customers', JSON.stringify(c));
    localStorage.setItem('pawnshop_loans', JSON.stringify(l));
    localStorage.setItem('pawnshop_transactions', JSON.stringify(t));
    
    setCustomers(c);
    setLoans(l);
    setTransactions(t);
  };

  // Digital clock update tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Navigation Actions Handler
  const handleNavigate = (tab: string, arg?: any) => {
    setActiveTab(tab);
    setMobileMenuOpen(false); // close raw menu
    setGlobalSearchQuery(''); // reset search when navigating
    
    if (tab === 'loans') {
      // If navigating to detail tab with a specific contract ID
      setSelectedLoanId(arg || null);
    } else if (tab === 'loans_new') {
      // If initiating loan for specific pre-selected client
      setTargetCustomerIdForNewLoan(arg?.customerId || undefined);
    }
  };

  // 3. Database operation callbacks
  const handleAddCustomer = (newCustomer: Customer) => {
    const updated = [newCustomer, ...customers];
    saveStateToLocalStorage(updated, loans, transactions);
  };

  const handleEditCustomer = (updatedCustomer: Customer) => {
    const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    saveStateToLocalStorage(updated, loans, transactions);
  };

  const handleDeleteCustomer = (id: string) => {
    const updatedCust = customers.filter(c => c.id !== id);
    // Also remove any loans or schedules linked to this customer
    const updatedLoans = loans.filter(l => l.customerId !== id);
    const updatedTx = transactions.filter(t => loans.find(l => l.id === t.loanId)?.customerId !== id);
    saveStateToLocalStorage(updatedCust, updatedLoans, updatedTx);
  };

  const handleAddLoan = (newLoan: Loan) => {
    const updated = [newLoan, ...loans];
    saveStateToLocalStorage(customers, updated, transactions);
  };

  const handleAddTransactionUpdateLoan = (
    newTx: Transaction, 
    updatedSchedules: InstallmentSchedule[], 
    newLoanStatus: LoanStatus
  ) => {
    // 1. Add new transaction receipts record
    const updatedTx = [newTx, ...transactions];

    // 2. Identify and update active Loan schedule array and its main status state
    const updatedLoans = loans.map(loan => {
      if (loan.id === newTx.loanId) {
        return {
          ...loan,
          status: newLoanStatus,
          schedules: updatedSchedules
        };
      }
      return loan;
    });

    saveStateToLocalStorage(customers, updatedLoans, updatedTx);
  };

  // System Database Operations (Backup restore / resets)
  const handleImportSystemData = (imported: { customers: Customer[]; loans: Loan[]; transactions: Transaction[] }) => {
    saveStateToLocalStorage(imported.customers, imported.loans, imported.transactions);
  };

  const handleLoadSampleDataset = () => {
    saveStateToLocalStorage(SAMPLE_CUSTOMERS, SAMPLE_LOANS, SAMPLE_TRANSACTIONS);
  };

  const handleResetCleanSlate = () => {
    saveStateToLocalStorage([], [], []);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" id="app_root">
      
      {/* Sidebar Navigation */}
      <aside className={`w-72 bg-slate-900 text-white shrink-0 flex flex-col z-40 md:relative fixed inset-y-0 left-0 transform md:translate-x-0 transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Sidebar Header branding */}
        <div className="p-6 border-b border-slate-800 space-y-3 relative">
          <div className="flex items-center gap-2">
            <Coins className="w-8 h-8 text-yellow-500 bg-yellow-400/10 p-1.5 rounded-xl border border-yellow-500/20 shadow-xs" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-[12px] bg-yellow-500 text-slate-950 px-1.5 py-0.2 rounded-xs tracking-wider uppercase">V4U Pawn</span>
              <p className="font-semibold text-slate-300 text-[10px] font-mono leading-none">PAWNSHOP SUITE</p>
            </div>
          </div>
          <h1 className="moul-heading text-yellow-500 text-xs tracking-wide leading-relaxed">
            ប្រព័ន្ធហាងបញ្ចាំ និងកម្ចី
          </h1>
          <p className="text-[10px] text-slate-400 font-sans">កម្ចី បញ្ចាំ និងបង់រំលស់គ្រប់ប្រភេទ</p>

          {/* Close drawer on mobile */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden absolute right-4 top-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto text-xs font-semibold">
          {[
            { id: 'dashboard', label: 'ផ្ទាំងគ្រប់គ្រងទូទៅ', desc: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'customers', label: 'គ្រប់គ្រងអតិថិជន', desc: 'Customers Directory', icon: Users },
            { id: 'loans', label: 'បញ្ជីកិច្ចសន្យា/បង់ប្រាក់', desc: 'Contracts & Collections', icon: FileText },
            { id: 'loans_new', label: 'បង្កើតកិច្ចសន្យាថ្មី', desc: 'Create New Contract', icon: PlusCircle },
            { id: 'transactions', label: 'ប្រវត្តិវិក្កយបត្រទទួលប្រាក់', desc: 'Payment Transactions', icon: History },
            { id: 'backup', label: 'របាយការណ៍ និងទិន្នន័យ', desc: 'Database & Backups', icon: Database },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full p-3 rounded-xl flex items-center gap-3.5 text-left transition-all ${
                  isActive 
                    ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/10' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold leading-none">{item.label}</div>
                  <div className={`text-[10px] font-normal tracking-wide ${isActive ? 'text-slate-800' : 'text-slate-500 font-mono'}`}>{item.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer context summary */}
        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/20 text-[10px] text-slate-500">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-yellow-500" />
            <span className="font-bold">ប្រព័ន្ធសុវត្ថិភាពខ្ពស់ (Local Safe)</span>
          </div>
          <p className="leading-relaxed">រាល់ទិន្នន័យទាំងអស់ត្រូវបានរក្សាទុកនៅលើដ្រាយវ៍របស់អ្នកជាលក្ខណៈសម្ងាត់បំផុត គ្មានការលេចធ្លាយឡើយ។</p>
        </div>
      </aside>

      {/* Main Core Section */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Dynamic Header top-bar */}
        <header className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30" id="top_bar">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cambodia Fintech ERP Enterprise</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                <span>សាខាទី១ (ភ្នំពេញ)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded-xs font-bold font-sans">ONLINE</span>
              </div>
            </div>
          </div>

          {/* Global Search Bar (Only shown for Customers and Loans panels) */}
          {(activeTab === 'customers' || activeTab === 'loans') && (
            <div className="flex-1 max-w-sm lg:max-w-md mx-4 md:mx-6 relative hidden md:block">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'customers' 
                    ? "ស្វែងរកអតិថិជនរហ័ស (ឈ្មោះខ្មែរ ឡាតាំង ឬលេខទូរស័ព្ទ)..." 
                    : "ស្វែងរកកិច្ចសន្យារហ័ស (លេខកុងត្រា ឈ្មោះខ្មែរ ឬលេខទូរស័ព្ទ)..."
                }
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:bg-white outline-hidden transition-all text-slate-900 font-semibold placeholder-slate-400"
              />
              {globalSearchQuery && (
                <button 
                  onClick={() => setGlobalSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Right Header: Dynamic Clock / Calendar */}
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 bg-slate-100 rounded-lg px-3 py-1.5 flex items-center gap-1.5 font-mono shadow-inner border border-slate-200/50">
                <Clock className="w-4 h-4 text-indigo-500" />
                {currentTime.toLocaleTimeString('en-US', { hour12: true })}
              </span>
              <p className="text-[9px] text-slate-400 font-semibold">{formatKhmerDate(currentTime.toISOString().split('T')[0])}</p>
            </div>
          </div>
        </header>

        {/* Primary Tab content injection */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto" id="main_panels">
          {activeTab === 'dashboard' && (
            <Dashboard 
              customers={customers} 
              loans={loans} 
              transactions={transactions} 
              onNavigate={handleNavigate} 
            />
          )}

          {activeTab === 'customers' && (
            <Customers 
              customers={customers} 
              loans={loans} 
              onAddCustomer={handleAddCustomer} 
              onEditCustomer={handleEditCustomer} 
              onDeleteCustomer={handleDeleteCustomer}
              onNavigate={handleNavigate} 
              globalSearchQuery={globalSearchQuery}
              setGlobalSearchQuery={setGlobalSearchQuery}
            />
          )}

          {activeTab === 'loans' && (
            <LoanDetails 
              loans={loans} 
              customers={customers} 
              selectedLoanId={selectedLoanId} 
              onSelectLoan={(id) => setSelectedLoanId(id)}
              onAddTransaction={handleAddTransactionUpdateLoan} 
              globalSearchQuery={globalSearchQuery}
              setGlobalSearchQuery={setGlobalSearchQuery}
            />
          )}

          {activeTab === 'loans_new' && (
            <LoanWizard 
              customers={customers} 
              initialSelectedCustomerId={targetCustomerIdForNewLoan}
              onAddLoan={handleAddLoan} 
              onAddCustomer={handleAddCustomer}
              onNavigate={handleNavigate} 
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions 
              transactions={transactions} 
            />
          )}

          {activeTab === 'backup' && (
            <BackupRestore 
              customers={customers} 
              loans={loans} 
              transactions={transactions} 
              onImportData={handleImportSystemData} 
              onLoadSample={handleLoadSampleDataset} 
              onResetAll={handleResetCleanSlate} 
            />
          )}
        </main>
      </div>

    </div>
  );
}
