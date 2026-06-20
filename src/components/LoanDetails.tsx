/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, Loan, LoanStatus, LoanType, Transaction, InstallmentSchedule } from '../types';
import { formatUSD, formatKhmerDate, formatKHR, EXCHANGE_RATE_USD_TO_KHR } from '../utils/sampleData';
import { 
  FileText, 
  Search, 
  Hash, 
  Calendar, 
  User, 
  Coins, 
  Box, 
  Receipt, 
  Printer, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Check, 
  ArrowLeft,
  DollarSign,
  Briefcase,
  ExternalLink,
  ThumbsUp
} from 'lucide-react';

interface LoanDetailsProps {
  loans: Loan[];
  customers: Customer[];
  selectedLoanId: string | null;
  onSelectLoan: (loanId: string | null) => void;
  onAddTransaction: (transaction: Transaction, updatedSchedules: InstallmentSchedule[], newStatus: LoanStatus) => void;
  globalSearchQuery?: string;
  setGlobalSearchQuery?: (query: string) => void;
}

export default function LoanDetails({ 
  loans, 
  customers, 
  selectedLoanId, 
  onSelectLoan, 
  onAddTransaction,
  globalSearchQuery,
  setGlobalSearchQuery
}: LoanDetailsProps) {
  // Filters & State
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  const searchQuery = globalSearchQuery !== undefined ? globalSearchQuery : localSearchQuery;
  const setSearchQuery = setGlobalSearchQuery !== undefined ? setGlobalSearchQuery : setLocalSearchQuery;
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Repayment form states
  const [paymentScheduleId, setPaymentScheduleId] = useState<number>(0);
  const [penaltyFee, setPenaltyFee] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('ABA Mobile (Bank Transfer)');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showReceiptPreview, setShowReceiptPreview] = useState<Transaction | null>(null);
  const [showContractPreview, setShowContractPreview] = useState<boolean>(false);

  // Filter the list of overall contracts (by Contract ID, Customer Name Khmer/English, Customer Phone Number)
  const filteredLoans = useMemo(() => {
    return loans.filter(l => {
      const query = searchQuery.toLowerCase().trim();
      const loanCustomer = customers.find(c => c.id === l.customerId);
      const customerPhone = loanCustomer ? loanCustomer.phone : '';
      const customerNameEn = loanCustomer ? loanCustomer.nameEn : '';
      
      const matchSearch = l.id.toLowerCase().includes(query) ||
                          l.customerName.toLowerCase().includes(query) ||
                          customerNameEn.toLowerCase().includes(query) ||
                          customerPhone.includes(query);
      
      const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
      const matchType = typeFilter === 'ALL' || l.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [loans, customers, searchQuery, statusFilter, typeFilter]);

  // Selected Loan Object
  const currentLoan = useMemo(() => {
    if (!selectedLoanId) return null;
    return loans.find(l => l.id === selectedLoanId) || null;
  }, [loans, selectedLoanId]);

  // Selected Loan Customer Account info
  const currentCustomer = useMemo(() => {
    if (!currentLoan) return null;
    return customers.find(c => c.id === currentLoan.customerId) || null;
  }, [currentLoan, customers]);

  // Automatically pre-fill the next unpaid schedule ID when a loan is loaded
  React.useEffect(() => {
    if (currentLoan) {
      const nextUnpaid = currentLoan.schedules.find(s => s.status !== 'PAID');
      if (nextUnpaid) {
        setPaymentScheduleId(nextUnpaid.id);
      } else {
        setPaymentScheduleId(0);
      }
      // reset form
      setPenaltyFee(0);
      setPaymentNotes('');
    }
  }, [currentLoan, selectedLoanId]);

  // Selected schedule detailed numbers
  const selectedScheduleObj = useMemo(() => {
    if (!currentLoan || paymentScheduleId === 0) return null;
    return currentLoan.schedules.find(s => s.id === paymentScheduleId) || null;
  }, [currentLoan, paymentScheduleId]);

  // Handle payments submission
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoan || !selectedScheduleObj) return;

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Create new transaction object
    const receiptId = `REC-${String(Date.now()).slice(-5)}`;
    const txTotal = selectedScheduleObj.total + penaltyFee;

    const newTransaction: Transaction = {
      id: receiptId,
      loanId: currentLoan.id,
      customerName: currentLoan.customerName,
      date: new Date().toISOString(),
      scheduleId: selectedScheduleObj.id,
      paidPrincipal: selectedScheduleObj.principal,
      paidInterest: selectedScheduleObj.interest,
      penaltyFee: penaltyFee,
      totalAmount: txTotal,
      paymentMethod: paymentMethod,
      receiver: 'បុគ្គលិកវេន (Staff)',
      notes: paymentNotes || `បង់គណនីលើកទី ${selectedScheduleObj.id}`
    };

    // Update the schedules array
    const updatedSchedules = currentLoan.schedules.map(sched => {
      if (sched.id === selectedScheduleObj.id) {
        return {
          ...sched,
          status: 'PAID' as const,
          paidAmount: sched.total,
          paidDate: todayStr
        };
      }
      return sched;
    });

    // Determine new Loan Status
    // If all installments are now PAID, loan status becomes PAID
    const hasUnpaid = updatedSchedules.some(s => s.status !== 'PAID');
    const newStatus = hasUnpaid ? LoanStatus.ACTIVE : LoanStatus.PAID;

    onAddTransaction(newTransaction, updatedSchedules, newStatus);
    
    // Auto preview receipt
    setShowReceiptPreview(newTransaction);
    
    // Refresh pre-fill
    const nextUnpaid = updatedSchedules.find(s => s.status !== 'PAID');
    if (nextUnpaid) {
      setPaymentScheduleId(nextUnpaid.id);
    } else {
      setPaymentScheduleId(0);
    }
    setPenaltyFee(0);
    setPaymentNotes('');
  };

  // Printable Area triggers
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="contracts_details_view">
      
      {/* Receipts Preview Modal */}
      {showReceiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative border border-slate-100 font-sans print:shadow-none print:border-none print:p-0">
            {/* Header branding */}
            <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-slate-200">
              <h4 className="font-bold moul-heading text-sm text-slate-900 tracking-wider">បង្កាន់ដៃទទួលទូទាត់ប្រាក់</h4>
              <p className="text-[11px] font-bold text-indigo-600 font-mono tracking-wide">PAWNSHOP & LOAN RECEIPT</p>
              <p className="text-[10px] text-slate-400 font-mono">ID: {showReceiptPreview.id}</p>
            </div>

            {/* Fields list */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">កិច្ចសន្យា (Contract ID):</span>
                <span className="font-bold font-mono text-slate-900">{showReceiptPreview.loanId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">អតិថិជន (Client):</span>
                <span className="font-bold text-slate-900">{showReceiptPreview.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">កាលបរិច្ឆេទ (Date):</span>
                <span className="font-mono text-slate-800">{showReceiptPreview.date.slice(0, 10)} {showReceiptPreview.date.slice(11, 16)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ការបង់ដំណាក់កាលទី (Installment #):</span>
                <span className="font-bold text-slate-900">ដងទី {showReceiptPreview.scheduleId}</span>
              </div>
              
              <hr className="border-slate-100" />
              
              {/* Receipts financials breakdown */}
              <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between text-slate-500">
                  <span>ប្រាក់ដើម (Principal Paid):</span>
                  <div className="text-right">
                    <span className="font-mono block">{formatUSD(showReceiptPreview.paidPrincipal)}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">≈ {formatKHR(showReceiptPreview.paidPrincipal * EXCHANGE_RATE_USD_TO_KHR)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>ការប្រាក់ (Interest Paid):</span>
                  <div className="text-right">
                    <span className="font-mono block">{formatUSD(showReceiptPreview.paidInterest)}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">≈ {formatKHR(showReceiptPreview.paidInterest * EXCHANGE_RATE_USD_TO_KHR)}</span>
                  </div>
                </div>
                {showReceiptPreview.penaltyFee > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>ផាកពិន័យ/យឺតយ៉ាវ (Penalty fee):</span>
                    <div className="text-right">
                      <span className="font-mono block">+{formatUSD(showReceiptPreview.penaltyFee)}</span>
                      <span className="text-[10px] text-red-500 font-mono block">≈ {formatKHR(showReceiptPreview.penaltyFee * EXCHANGE_RATE_USD_TO_KHR)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-indigo-700 font-extrabold text-sm pt-2 border-t border-dashed border-slate-200">
                  <span>ទឹកប្រាក់សរុប (Grand Total):</span>
                  <div className="text-right">
                    <span className="font-mono block text-sm">{formatUSD(showReceiptPreview.totalAmount)}</span>
                    <span className="text-xs text-indigo-650 font-mono block">≈ {formatKHR(showReceiptPreview.totalAmount * EXCHANGE_RATE_USD_TO_KHR)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">វិធីបង់ប្រាក់ (Payment Method):</span>
                <span className="font-bold text-slate-800">{showReceiptPreview.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">អ្នកទទួលប្រាក់ (Agent):</span>
                <span className="font-bold text-slate-800">{showReceiptPreview.receiver}</span>
              </div>
            </div>

            {/* Footer message */}
            <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4 font-medium space-y-1">
              <p>សូមអរគុណសម្រាប់ការប្រើប្រាស់សេវាកម្មរបស់យើងខ្ញុំ!</p>
              <p className="font-sans font-normal text-[9px]">Please keep this digital e-receipt for reference.</p>
            </div>

            {/* Dialog buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 print:hidden justify-end">
              <button
                onClick={() => setShowReceiptPreview(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-55 text-slate-600 font-bold rounded-lg text-xs"
              >
                បិទសម្រាក
              </button>
              <button
                onClick={triggerPrint}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> <b>បោះពុម្ពវិក្កយបត្រ</b>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Pledge Agreement (លិខិតកិច្ចសន្យា) Modal preview */}
      {showContractPreview && currentLoan && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 relative border border-slate-100 text-slate-900 print:shadow-none print:border-none print:p-0 my-8">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-6 border-b border-double border-slate-300">
              <h2 className="text-lg font-bold moul-heading text-slate-900">ព្រះរាជាណាចក្រកម្ពុជា</h2>
              <p className="text-xs font-semibold tracking-wider text-slate-800">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
              <div className="text-[10px] font-mono text-slate-400">❖❖❖</div>
              <h3 className="text-base font-bold text-indigo-700 moul-heading pt-2">លិខិតកិច្ចសន្យាខ្ចីប្រាក់ និងបញ្ចាំទ្រព្យសកម្ម</h3>
              <p className="text-[11px] text-slate-500 font-semibold">កូដកិច្ចសន្យា៖ <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-sm">{currentLoan.id}</span></p>
            </div>

            {/* Contract Body Clause context */}
            <div className="text-xs space-y-4 leading-relaxed font-medium">
              <p>
                យើងខ្ញុំទាំងអស់គ្នានឹងសន្មតថា កាលបរិច្ឆេទបង្កើតឯកសារនេះគឺ <b>{formatKhmerDate(currentLoan.startDate)}</b> រវាង៖
              </p>
              
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <p><b>ភាគីម្ចាស់ហាង (ម្ចាស់បំណុល/អ្នកទទួលបញ្ចាំ)៖</b> ប្រព័ន្ធគ្រប់គ្រងបញ្ចាំ និងបង់រំលស់ កម្ពុជា សាខាទី១ (ភ្នំពេញ)</p>
                <p>
                  <b>ភាគីអតិថិជន (អ្នកខ្ចី/ម្ចាស់ទ្រព្យបញ្ចាំ)៖</b> ឈ្មោះ <b>{currentLoan.customerName}</b> {currentCustomer && (
                    <span>
                      , ឡាតាំង <b>{currentCustomer.nameEn}</b>, កាន់អត្តសញ្ញាណប័ណ្ណលេខ <b>{currentCustomer.idCard}</b>, លេខទូរស័ព្ទ <b>{currentCustomer.phone}</b>, អាសយដ្ឋានបច្ចុប្បន្ន <b>{currentCustomer.address}</b>
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-900 text-[13px] border-b border-slate-100 pb-1">ប្រការ ១៖ លក្ខខណ្ឌហិរញ្ញវត្ថុ</p>
                <p>
                  អ្នកខ្ចីបានសន្មត់ខ្ចីប្រាក់ចំនួនសរុប <b>{formatUSD(currentLoan.principal)} ({formatKHR(currentLoan.principal * EXCHANGE_RATE_USD_TO_KHR)})</b> ជាមួយអត្រាការប្រាក់ <b>{currentLoan.interestRate}%</b> ក្នុងមួយខែ គណនាជាប្រភេទ <b>{currentLoan.interestType === 'FLAT' ? 'ការប្រាក់ថេរ (Flat)' : 'ការប្រាក់ថយចុះ (Declining)'}</b>។ រយៈពេលសរុបមានចំនួន <b>{currentLoan.termCount} ដង</b> ({currentLoan.termUnit}) ដោយចាប់ផ្តើមគិតចាប់ពី <b>{formatKhmerDate(currentLoan.startDate)}</b> រហូតដល់ថ្ងៃបញ្ចប់សព្វគ្រប់នៅ <b>{formatKhmerDate(currentLoan.endDate)}</b>។
                </p>
              </div>

              {currentLoan.collateral && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 text-[13px] border-b border-slate-100 pb-1">ប្រការ ២៖ ទ្រព្យសម្បត្តិបញ្ចាំ / ទំនិញរងការធានា</p>
                  <p>
                    ដើម្បីធានាលើការបង់ប្រាក់ឱ្យមានភាពជឿជាក់ខ្ពស់ ភាគីអតិថិជនបានដាក់ទុកជាទ្រព្យបញ្ចាំ / ទំនិញបង់រំលស់នូវ៖ <b>{currentLoan.collateral.name}</b>, ប្រភេទលំអិត/ស៊េរី <b>{currentLoan.collateral.serialNumber}</b>, ស្ថានភាពជាក់ស្តែង <b>{currentLoan.collateral.condition}</b>, ដែលមានតម្លៃប៉ាន់ស្មានទីផ្សារប្រមាណ <b>{formatUSD(currentLoan.collateral.estimatedValue)} ({formatKHR(currentLoan.collateral.estimatedValue * EXCHANGE_RATE_USD_TO_KHR)})</b>។ ទ្រព្យសកម្មនេះនឹងត្រូវរក្សាទុកក្នុងទូដែក ឬឃ្លាំងដែលមានសុវត្ថិភាពនៅ <b>{currentLoan.collateral.storageLocation}</b> រហូតដល់ថ្ងៃសងប្រាក់ផ្ដាច់។
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-bold text-slate-900 text-[13px] border-b border-slate-100 pb-1">ប្រការ ៣៖ ការផាកពិន័យ និងទំនួលខុសត្រូវ</p>
                <p>
                  ភាគីអតិថិជនសន្យាបង់ប្រាក់ឱ្យបានទាន់ពេលវេលាកំណត់ជាប្រចាំដំណាក់កាលនីមួយៗ។ ករណីបង់យឺតយ៉ាវ ហាងមានសិទ្ធិផាកពិន័យបន្ថែម ឬក្នុងករណីមិនអាចទំនាក់ទំនងបានសោះរយៈពេលលើសពី ៣០ ថ្ងៃ ភាគីម្ចាស់ហាងមានសិទ្ធិអំណាចពេញលេញក្នុងការលក់ឡាយឡុងទ្រព្យបញ្ចាំដើម្បីទូទាត់សងដើមបំណុល ដោយពុំចាំបាច់ដោះស្រាយតាមផ្លូវតុលាការឡើយ។
                </p>
              </div>

              {/* Signatures mocks */}
              <div className="grid grid-cols-2 text-center pt-10 font-bold">
                <div className="space-y-16">
                  <p>ស្នាមមេដៃអតិថិជន (អ្នកខ្ចី)</p>
                  <div className="text-slate-300">(ស្នាមមេដៃ / ហត្ថលេខា)</div>
                </div>
                <div className="space-y-16">
                  <p>តំណាងភាគីហាង (អ្នកទទួល)</p>
                  <div className="text-slate-300">(ត្រា និងហត្ថលេខា)</div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-100 print:hidden justify-end">
              <button
                onClick={() => setShowContractPreview(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-xs"
              >
                ចាកចេញ
              </button>
              <button
                onClick={triggerPrint}
                className="px-5 py-2 bg-slate-900 hover:bg-indigo-950 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" /> <b>បោះពុម្ពកិច្ចសន្យា</b>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Split View layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Contracts List & search */}
        <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4" id="contracts_sidebar_list">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">បញ្ជីកិច្ចសន្យាទាំងអស់</h3>
            <p className="text-[11px] text-slate-400">ស្វែងរកចម្រោះតាមប្រភេទ និងស្ថានភាពកាតបង់ប្រាក់</p>
          </div>

          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="លេខកុងត្រា ឬឈ្មោះអតិថិជន..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Drops */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">ស្ថានភាព៖</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="ALL">ទាំងអស់ (Active & Paid)</option>
                  <option value={LoanStatus.ACTIVE}>ដំណើរការ</option>
                  <option value={LoanStatus.OVERDUE}>យឺតយ៉ាវ</option>
                  <option value={LoanStatus.PAID}>ទូទាត់រួចសព្វគ្រប់</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">ប្រភេទកិច្ចសន្យា៖</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="ALL">គ្រប់ប្រភេទ</option>
                  <option value={LoanType.PAWN}>បញ្ចាំ (Pawn)</option>
                  <option value={LoanType.STANDARD}>កម្ចីទូទៅ</option>
                  <option value={LoanType.INSTALLMENT}>បង់រំលស់</option>
                </select>
              </div>
            </div>
          </div>

          {/* List scrollable box */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredLoans.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                រកមិនឃើញកិច្ចសន្យាស្របគ្នានេះទេ!
              </div>
            ) : (
              filteredLoans.map((loan) => {
                const isSelected = selectedLoanId === loan.id;
                const outstandingTotal = loan.schedules.reduce((sum, s) => s.status !== 'PAID' ? sum + s.total : sum, 0);

                return (
                  <div
                    key={loan.id}
                    onClick={() => onSelectLoan(loan.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group relative ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                        : 'border-slate-150 bg-slate-50/50 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-mono text-xs font-bold leading-none ${isSelected ? 'text-yellow-400' : 'text-indigo-600'}`}>{loan.id}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-xs font-extrabold ${isSelected ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                          {loan.type === 'PAWN' ? 'បញ្ចាំ' : loan.type === 'STANDARD' ? 'កម្ចី' : 'រំលស់'}
                        </span>
                      </div>
                      <div className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{loan.customerName}</div>
                      <div className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                        ដើមមេ៖ {formatUSD(loan.principal)} | សល់៖ {formatUSD(outstandingTotal)}
                        <span className="block text-[9px] font-sans opacity-95 mt-0.5">
                          (≈ សល់ {formatKHR(outstandingTotal * EXCHANGE_RATE_USD_TO_KHR)})
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-1.5 shrink-0 flex flex-col items-end">
                      {loan.status === LoanStatus.ACTIVE && <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">កំពុងបង់</span>}
                      {loan.status === LoanStatus.OVERDUE && <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[9px] font-bold">យឺតយ៉ាវ</span>}
                      {loan.status === LoanStatus.PAID && <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[9px] font-bold">រួចរាល់</span>}
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'translate-x-1 text-yellow-400' : 'group-hover:translate-x-0.5'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Loan Profile & Interactive Collect installation form */}
        <div className="xl:col-span-2 space-y-6">
          {currentLoan ? (
            <div className="space-y-6 animate-fadeIn" id="contracts_detail_right_panel">
              
              {/* TOP HEADER - Loan Details Summary */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 font-mono text-slate-700 px-2 py-0.5 rounded-md font-bold">កិច្ចសន្យា៖ {currentLoan.id}</span>
                      {currentLoan.status === LoanStatus.ACTIVE && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-250 text-[10px] font-bold">សកម្មភាពបង់ប្រាក់កំពុងដំណើរការ</span>}
                      {currentLoan.status === LoanStatus.OVERDUE && <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">មានការយឺតយ៉ាវទូទាត់</span>}
                      {currentLoan.status === LoanStatus.PAID && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">បានទូទាត់រួចរាល់សព្វគ្រប់</span>}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 leading-normal">
                      <User className="w-5 h-5 text-indigo-500" />
                      ម្ចាស់កិច្ចសន្យា៖ {currentLoan.customerName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      ប្រភេទកុងត្រា៖ <span className="font-bold text-slate-700">{currentLoan.type === 'PAWN' ? 'បញ្ចាំទ្រព្យសកម្ម' : currentLoan.type === 'STANDARD' ? 'កម្ចីទូទៅ' : 'បង់រំលស់ទំនិញ'}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowContractPreview(true)}
                      className="p-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs flex items-center gap-1.5 font-bold transition-all shadow-xs"
                    >
                      <Printer className="w-4 h-4" /> <b>បោះពុម្ពកិច្ចសន្យា</b>
                    </button>
                  </div>
                </div>

                {/* Info Fields cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-wider">ប្រាក់ដើមស្នើសុំ</div>
                    <div className="text-base text-slate-900 font-bold font-mono">{formatUSD(currentLoan.principal)}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">≈ {formatKHR(currentLoan.principal * EXCHANGE_RATE_USD_TO_KHR)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-105 rounded-xl">
                    <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-wider">អត្រាការប្រាក់</div>
                    <div className="text-base text-slate-900 font-bold font-mono">{currentLoan.interestRate}% <span className="text-[10px] text-slate-400">/ខែ</span></div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-wider">រយៈពេលកុងត្រា</div>
                    <div className="text-base text-slate-900 font-bold">{currentLoan.termCount} {currentLoan.termUnit === 'MONTHLY' ? 'ខែ' : 'សប្តាហ៍'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-wider">វិធីគណនាការប្រាក់</div>
                    <div className="text-sm font-bold text-slate-800 leading-tight">{currentLoan.interestType === 'FLAT' ? 'ការប្រាក់ថេរ' : 'ការប្រាក់ថយចុះ'}</div>
                  </div>
                </div>

                {/* Collateral detailed card */}
                {currentLoan.collateral && (
                  <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-3 font-medium text-xs">
                    <div className="flex items-center gap-2 text-amber-800 font-bold">
                      <Box className="w-4.5 h-4.5 text-amber-600" />
                      <span>ព័ត៌មានលម្អិតរបស់ទ្រព្យបញ្ចាំ / ធានា៖</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div><span className="text-slate-400">ឈ្មោះទ្រព្យ៖</span> <span className="font-bold text-slate-800">{currentLoan.collateral.name}</span></div>
                      <div><span className="text-slate-400">លេខគ្រឿង/Serial៖</span> <span className="font-mono text-slate-700">{currentLoan.collateral.serialNumber}</span></div>
                      <div><span className="text-slate-400">ស្ថានភាព៖</span> <span className="font-semibold text-slate-700">{currentLoan.collateral.condition}</span></div>
                      <div><span className="text-slate-400">តម្លៃប៉ាន់ស្មាន៖</span> <span className="font-mono font-bold text-emerald-600">{formatUSD(currentLoan.collateral.estimatedValue)} ({formatKHR(currentLoan.collateral.estimatedValue * EXCHANGE_RATE_USD_TO_KHR)})</span></div>
                      <div className="md:col-span-2"><span className="text-slate-400">ទីតាំងរក្សាទុក៖</span> <span className="font-bold text-indigo-900">{currentLoan.collateral.storageLocation}</span></div>
                    </div>
                    {currentLoan.collateral.notes && (
                      <p className="border-t border-amber-100/50 pt-2 text-[11px] text-slate-500">
                        <b>កំណត់សម្គាល់ទ្រព្យ៖</b> {currentLoan.collateral.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ACTION: Collect Installment Payment (Form) */}
              {currentLoan.status !== LoanStatus.PAID && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5" id="collect_payment_box">
                  <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-indigo-600 bg-indigo-50 p-1 rounded-full" />
                    <h4 className="font-bold text-slate-900 text-sm">ទទួលប្រាក់បង់ជាប្រចាំពីអតិថិជន (Collect Installment)</h4>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="text-xs font-semibold text-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    {/* Schedule select */}
                    <div className="space-y-1">
                      <label className="text-slate-600 text-[11px]">ជ្រើសរើសដំណាក់កាលបង់ប្រាក់ *</label>
                      <select
                        value={paymentScheduleId}
                        onChange={(e) => setPaymentScheduleId(parseInt(e.target.value) || 0)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-lg text-slate-900 font-bold"
                      >
                        <option value="">-- សូមជ្រើសរើស --</option>
                        {currentLoan.schedules.map(s => {
                          const statusLabel = s.status === 'PAID' ? ' - បង់រួចរាល់' : '';
                          return (
                            <option key={s.id} value={s.id} disabled={s.status === 'PAID'}>
                              លើកទី {s.id} (ថ្ងៃត្រូវបង់៖ {s.dueDate}){statusLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Pre-fill calculations review */}
                    {selectedScheduleObj && (
                      <div className="md:col-span-2 p-3 bg-indigo-50/50 border border-indigo-100/60 rounded-xl text-xs space-y-1 my-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ប្រាក់ត្រូវទូទាត់សរុបដំណាក់កាល៖</span>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 block">{formatUSD(selectedScheduleObj.total)}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">≈ {formatKHR(selectedScheduleObj.total * EXCHANGE_RATE_USD_TO_KHR)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>(ប្រាក់ដើម៖ {formatUSD(selectedScheduleObj.principal)} | ការប្រាក់៖ {formatUSD(selectedScheduleObj.interest)})</span>
                          {selectedScheduleObj.dueDate < new Date().toISOString().split('T')[0] && (
                            <span className="text-red-500 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> ហួសថ្ងៃកំណត់គិតថ្លៃយឺតយ៉ាវ
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Penalty fee Input */}
                    <div className="space-y-1">
                      <label className="text-slate-600 text-[11px] text-red-650 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> ប្រាក់ផាកពិន័យ/យឺតយ៉ាវ (Penalty fee)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          value={penaltyFee}
                          onChange={(e) => setPenaltyFee(parseFloat(e.target.value) || 0)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="absolute right-3 top-3 text-[10px] text-slate-400">USD</span>
                      </div>
                    </div>

                    {/* Method */}
                    <div className="space-y-1">
                      <label className="text-slate-600 text-[11px]">វិធីសាស្រ្តទទួលប្រាក់ *</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                      >
                        <option value="ABA Mobile (Bank Transfer)">ABA Mobile Transfer</option>
                        <option value="Cash (សាច់ប្រាក់)">Cash (សាច់ប្រាក់)</option>
                        <option value="Wing Cash / TrueMoney">Wing / TrueMoney</option>
                        <option value="Acleda ToanChet">Acleda ToanChet</option>
                      </select>
                    </div>

                    {/* Action trigger button */}
                    <div>
                      <button
                        type="submit"
                        disabled={!selectedScheduleObj}
                        className={`w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl text-center shadow-md shadow-indigo-600/10 hover:shadow-lg transition-all ${
                          !selectedScheduleObj ? 'cursor-not-allowed' : 'hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                      >
                        ទូទាត់ និងចេញវិក្កយបត្រ
                      </button>
                    </div>

                    {/* Notes remarks input box */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-slate-600 text-[11px]">ចំណាំលើកិច្ចការបង់ប្រាក់នេះ (Notes) (Optional)</label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="ឧ. បង់ដោយអូនប្រុស កាត់តាមកុងត្រា..."
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </form>
                </div>
              )}

              {/* REPAYMENT CALENDAR SCHEDULES TABLE - Interactive listing */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-150/50">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" /> តារាងកាលបរិច្ឆេទបង់ជាប្រចាំដំណាក់កាល (Repayments Log Calendar)
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {currentLoan.schedules.length} ដង
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-400 font-medium pb-2 text-[11px]">
                        <th className="py-3 px-3">លើកទី</th>
                        <th className="py-3 px-3">ថ្ងៃត្រូវបង់សន្យា</th>
                        <th className="py-3 px-3 text-right">ទឹកប្រាក់សរុប</th>
                        <th className="py-3 px-3 text-right text-slate-400">ប្រាក់ដើម</th>
                        <th className="py-3 px-3 text-right text-slate-400">ការប្រាក់</th>
                        <th className="py-3 px-3">ថ្ងៃបង់ជាក់ស្តែង</th>
                        <th className="py-3 px-3 text-center">ស្ថានភាព</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 leading-normal">
                      {currentLoan.schedules.map((s) => {
                        const today = new Date().toISOString().split('T')[0];
                        const isOverdue = s.dueDate < today && s.status !== 'PAID';
                        
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-3 font-bold font-mono text-slate-450">#{s.id}</td>
                            <td className="py-3 px-3 font-mono">
                              {s.dueDate}
                              <span className="block text-[9px] text-slate-400 font-sans">{formatKhmerDate(s.dueDate)}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              <div>{formatUSD(s.total)}</div>
                              <div className="text-[10px] text-slate-400 font-mono font-normal">
                                ≈ {formatKHR(s.total * EXCHANGE_RATE_USD_TO_KHR)}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-550">
                              <div>{formatUSD(s.principal)}</div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                ≈ {formatKHR(s.principal * EXCHANGE_RATE_USD_TO_KHR)}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-550">
                              <div>+{formatUSD(s.interest)}</div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                ≈ {formatKHR(s.interest * EXCHANGE_RATE_USD_TO_KHR)}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500">
                              {s.paidDate ? s.paidDate : <span className="text-slate-350 italic">មិនទាន់បង់</span>}
                              {s.paidDate && (
                                <span className="block text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                                  <ThumbsUp className="w-3 h-3" /> បានបង់ជាមាស
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {s.status === 'PAID' ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 justify-center w-24 mx-auto">
                                  <Check className="w-3.5 h-3.5" /> បង់រួចរាល់
                                </span>
                              ) : isOverdue ? (
                                <span className="px-2 py-0.5 rounded-full bg-red-105 text-red-700 text-[10px] font-bold border border-red-200 flex items-center gap-1 justify-center w-24 mx-auto">
                                  <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> ហួសថ្ងៃបង់
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-200 flex items-center gap-1 justify-center w-24 mx-auto">
                                  <Clock className="w-3.5 h-3.5" /> រង់ចាំបង់
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <FileText className="w-12 h-12 text-slate-300 opacity-50" />
              សូមជ្រើសរើសកិច្ចសន្យាណាមួយពីបញ្ជីខាងឆ្វេង ដើម្បីមើលតារាងបង់ប្រាក់លម្អិត បោះពុម្ព ឬធ្វើការបង់ប្រាក់។
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
