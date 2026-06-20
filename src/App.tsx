/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Loan, Transaction, InstallmentSchedule, LoanStatus, PawnshopSettings, PaymentTerm } from './types';
import { 
  SAMPLE_CUSTOMERS, 
  SAMPLE_LOANS, 
  SAMPLE_TRANSACTIONS,
  formatKhmerDate,
  formatUSD,
  formatKHR,
  EXCHANGE_RATE_USD_TO_KHR
} from './utils/sampleData';
import { sendTelegramNotification } from './utils/telegram';

// Component Views
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import LoanWizard from './components/LoanWizard';
import LoanDetails from './components/LoanDetails';
import Transactions from './components/Transactions';
import BackupRestore from './components/BackupRestore';
import Settings from './components/Settings';
import LoginScreen from './components/LoginScreen';
import QuickCalculator from './components/QuickCalculator';

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
  Search,
  Settings as SettingsIcon,
  LogOut,
  Calculator
} from 'lucide-react';

const DEFAULT_SETTINGS: PawnshopSettings = {
  businessName: 'V4U Pawn Group',
  businessSlogan: 'ប្រព័ន្ធគ្រប់គ្រងហាងបញ្ចាំ កម្ចី និងរំលស់',
  businessPhone: '012 345 678 / 098 765 432',
  businessAddress: 'ផ្លូវលេខ ២៧១, សង្កាត់បឹងសាឡាង, ភ្នំពេញ',
  defaultInterestRate: 2.0,
  defaultPenaltyRate: 1.0,
  defaultAdminFee: 5.0,
  defaultPaymentTerm: PaymentTerm.MONTHLY,
  accentColor: 'yellow',
  language: 'kh',
  isSecurityEnabled: false,
  appPasscode: '1234',
  isTelegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
};

export default function App() {
  // 1. Persistent Storage State Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<PawnshopSettings>(DEFAULT_SETTINGS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Global search bar query
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  // Navigation active tab State
  // Values: 'dashboard', 'customers', 'loans', 'loans_new', 'transactions', 'backup', 'settings'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [targetCustomerIdForNewLoan, setTargetCustomerIdForNewLoan] = useState<string | undefined>(undefined);
  
  // Responsive mobile sidebar toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false);
  
  // Digital Cambodian Clock Time state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // UseEffect to load existing localStorage or seed with beautiful sample Khmer data!
  useEffect(() => {
    const localCustomers = localStorage.getItem('pawnshop_customers');
    const localLoans = localStorage.getItem('pawnshop_loans');
    const localTransactions = localStorage.getItem('pawnshop_transactions');
    const localSettings = localStorage.getItem('pawnshop_settings');

    if (localSettings) {
      setSettings(JSON.parse(localSettings));
    } else {
      localStorage.setItem('pawnshop_settings', JSON.stringify(DEFAULT_SETTINGS));
    }

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

    // Send Telegram Notification
    if (settings.isTelegramEnabled) {
      const msg = `👤 <b>អតិថិជនថ្មីត្រូវបានចុះឈ្មោះ (New Client Registered)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🆔 លេខកូដ៖ <code>${newCustomer.id}</code>\n` +
        `👤 ឈ្មោះ៖ <b>${newCustomer.nameKh} (${newCustomer.nameEn})</b>\n` +
        `📞 លេខទូរស័ព្ទ៖ <code>${newCustomer.phone}</code>\n` +
        `🏠 អាសយដ្ឋាន៖ <i>${newCustomer.address}</i>\n` +
        `⏰ កាលបរិច្ឆេទ៖ <code>${new Date().toLocaleString('kh-KH')}</code>`;
      sendTelegramNotification(settings, msg).catch(err => console.error('Telegram error:', err));
    }
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

    // Send Telegram Notification
    if (settings.isTelegramEnabled) {
      const client = customers.find(c => c.id === newLoan.customerId);
      const clientName = client ? `${client.nameKh} (${client.nameEn})` : newLoan.customerName;
      const typeLabel = newLoan.type === 'STANDARD' ? 'កម្ចីសាមញ្ញ (Standard)' : (newLoan.type === 'PAWN' ? 'បញ្ចាំទ្រព្យ (Pawn)' : 'បង់រំលស់ (Installment)');
      
      const msg = `🛍️ <b>កិច្ចសន្យាថ្មីត្រូវបានបង្កើត (New Contract Created)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `📄 លេខកុងត្រា៖ <code>${newLoan.id}</code>\n` +
        `👤 ឈ្មោះអតិថិជន៖ <b>${clientName}</b>\n` +
        `📝 ប្រភេទកិច្ចសន្យា៖ <b>${typeLabel}</b>\n` +
        `💰 ទឹកប្រាក់ស្នើសុំ៖ <b>${formatUSD(newLoan.principal)}</b> (≈ ${formatKHR(newLoan.principal * EXCHANGE_RATE_USD_TO_KHR)})\n` +
        `📈 អត្រាការប្រាក់៖ <b>${newLoan.interestRate}%</b>/ខែ (${newLoan.interestType === 'FLAT' ? 'ការប្រាក់ថេរ' : 'ការប្រាក់ថយចុះ'})\n` +
        `📅 រយៈពេល៖ <b>${newLoan.termCount} ដង</b>\n` +
        `⏰ ថ្ងៃបង្កើត៖ <code>${newLoan.startDate}</code>`;
      sendTelegramNotification(settings, msg).catch(err => console.error('Telegram error:', err));
    }
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

    // Send Telegram Notification
    if (settings.isTelegramEnabled) {
      const currentLoan = loans.find(l => l.id === newTx.loanId);
      const clientName = currentLoan ? currentLoan.customerName : 'មិនស្គាល់';
      const statusLabel = newLoanStatus === 'PAID' ? '🔒 រួចរាល់ស្ថាពរ (FULLY PAID)' : '⏳ កំពុងបន្តសង';
      
      const msg = `💵 <b>ការបង់ប្រាក់ជោគជ័យ (Payment Received Alert)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🧾 វិក្កយបត្រ៖ <code>${newTx.id}</code>\n` +
        `📄 លេខកុងត្រា៖ <code>${currentLoan?.id || '---'}</code>\n` +
        `👤 អតិថិជន៖ <b>${clientName}</b>\n` +
        `💵 ប្រាក់ដើមកាត់៖ <b>${formatUSD(newTx.paidPrincipal)}</b>\n` +
        `📈 ការប្រាក់បង់៖ <b>${formatUSD(newTx.paidInterest)}</b>\n` +
        `💰 ផាកពិន័យ៖ <b>${formatUSD(newTx.penaltyFee)}</b>\n` +
        `🧾 សរុបទឹកប្រាក់៖ <b>${formatUSD(newTx.totalAmount)}</b> (≈ ${formatKHR(newTx.totalAmount * EXCHANGE_RATE_USD_TO_KHR)})\n` +
        `📊 ស្ថានភាពបន្ត៖ <b>${statusLabel}</b>\n` +
        `⏰ កាលបរិច្ឆេទបង់៖ <code>${newTx.date}</code>`;
      sendTelegramNotification(settings, msg).catch(err => console.error('Telegram error:', err));
    }
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

  const handleSaveSettings = (newSettings: PawnshopSettings) => {
    localStorage.setItem('pawnshop_settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  const handleResetSettings = () => {
    localStorage.setItem('pawnshop_settings', JSON.stringify(DEFAULT_SETTINGS));
    setSettings(DEFAULT_SETTINGS);
  };

  const accent = settings.accentColor === 'indigo' ? {
    text: 'text-indigo-500', bg: 'bg-indigo-600', activeBtn: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10', activeIcon: 'text-white', textActive: 'text-slate-200'
  } : settings.accentColor === 'emerald' ? {
    text: 'text-emerald-500', bg: 'bg-emerald-500', activeBtn: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10', activeIcon: 'text-white', textActive: 'text-slate-200'
  } : settings.accentColor === 'violet' ? {
    text: 'text-violet-600', bg: 'bg-violet-600', activeBtn: 'bg-violet-600 text-white shadow-md shadow-violet-600/10', activeIcon: 'text-white', textActive: 'text-slate-200'
  } : settings.accentColor === 'rose' ? {
    text: 'text-rose-500', bg: 'bg-rose-500', activeBtn: 'bg-rose-500 text-white shadow-md shadow-rose-500/10', activeIcon: 'text-white', textActive: 'text-slate-200'
  } : settings.accentColor === 'slate' ? {
    text: 'text-slate-400', bg: 'bg-slate-700', activeBtn: 'bg-slate-700 text-white shadow-md shadow-slate-700/10', activeIcon: 'text-white', textActive: 'text-slate-200'
  } : {
    text: 'text-yellow-500', bg: 'bg-yellow-500', activeBtn: 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/10', activeIcon: 'text-slate-950', textActive: 'text-slate-800'
  };

  if (settings.isSecurityEnabled && !isAuthenticated) {
    return <LoginScreen settings={settings} onVerify={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" id="app_root">
      
      {/* Sidebar Navigation */}
      <aside className={`w-72 bg-slate-900 text-white shrink-0 flex flex-col z-40 md:relative fixed inset-y-0 left-0 transform md:translate-x-0 transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Sidebar Header branding */}
        <div className="p-6 border-b border-slate-800 space-y-3 relative">
          <div className="flex items-center gap-2">
            <Coins className={`w-8 h-8 ${accent.text} bg-yellow-400/10 p-1.5 rounded-xl border border-yellow-500/20 shadow-xs`} />
            <div className="space-y-0.5">
              <span className={`font-extrabold text-[12px] ${accent.bg} ${settings.accentColor === 'yellow' ? 'text-slate-950' : 'text-white'} px-1.5 py-0.2 rounded-xs tracking-wider uppercase`}>
                {settings.businessName.substring(0, 12)}
              </span>
              <p className="font-semibold text-slate-300 text-[10px] font-mono leading-none">PAWNSHOP SUITE</p>
            </div>
          </div>
          <h1 className={`moul-heading ${accent.text} text-xs tracking-wide leading-relaxed`}>
            {settings.businessName}
          </h1>
          <p className="text-[10px] text-slate-400 font-sans">{settings.businessSlogan || 'កម្ចី បញ្ចាំ និងបង់រំលស់គ្រប់ប្រភេទ'}</p>

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
            { id: 'settings', label: 'ការកំណត់ប្រព័ន្ធ', desc: 'System Settings', icon: SettingsIcon },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full p-3 rounded-xl flex items-center gap-3.5 text-left transition-all ${
                  isActive 
                    ? accent.activeBtn 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? accent.activeIcon : 'text-slate-400'}`} />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold leading-none">{item.label}</div>
                  <div className={`text-[10px] font-normal tracking-wide ${isActive ? accent.textActive : 'text-slate-500 font-mono'}`}>{item.desc}</div>
                </div>
              </button>
            );
          })}

          {/* Quick Loan Calculator Action Button */}
          <button
            type="button"
            onClick={() => {
              setIsCalcOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full mt-4 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/18 border border-amber-500/20 text-amber-500 hover:text-amber-400 flex items-center gap-3.5 text-left transition-all cursor-pointer shadow-xs font-semibold"
          >
            <Calculator className="w-5 h-5 text-amber-500 shrink-0 select-none" />
            <div className="space-y-0.5">
              <div className="text-xs font-bold leading-none">គណនាឥណទានរហ័ស</div>
              <div className="text-[10px] font-normal tracking-wide text-slate-400">Quick Loan Calculator</div>
            </div>
          </button>
        </nav>

        {/* Sidebar Footer context summary */}
        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/20 text-[10px] text-slate-500">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className={`w-3.5 h-3.5 ${accent.text}`} />
              <span className="font-bold">ប្រព័ន្ធសុវត្ថិភាពខ្ពស់ (Local Safe)</span>
            </div>
          </div>
          <p className="leading-relaxed">រាល់ទិន្នន័យទាំងអស់ត្រូវបានរក្សាទុកនៅលើដ្រាយវ៍របស់អ្នកជាលក្ខណៈសម្ងាត់បំផុត គ្មានការលេចធ្លាយឡើយ។</p>
          {settings.isSecurityEnabled && (
            <button
              onClick={() => setIsAuthenticated(false)}
              className="w-full py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-900/30 text-red-400 hover:text-red-300 rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] font-bold mt-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ចាកចេញពីគណនី (Lock App)</span>
            </button>
          )}
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
              settings={settings}
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

          {activeTab === 'settings' && (
            <Settings 
              settings={settings} 
              onSaveSettings={handleSaveSettings} 
              onResetSettings={handleResetSettings} 
            />
          )}
        </main>
      </div>

      {/* Standalone Quick Loan Calculator Modal */}
      <QuickCalculator 
        isOpen={isCalcOpen} 
        onClose={() => setIsCalcOpen(false)} 
        accentColor={settings.accentColor} 
      />
    </div>
  );
}
