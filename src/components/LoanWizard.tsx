/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Loan, LoanType, InterestType, PaymentTerm, LoanStatus, Collateral } from '../types';
import { generateSchedule, formatUSD, formatKhmerDate } from '../utils/sampleData';
import { Calendar, Percent, DollarSign, FileText, Check, ShieldAlert, HeartHandshake, Box, UserPlus, Info, Search } from 'lucide-react';

interface LoanWizardProps {
  customers: Customer[];
  onAddLoan: (loan: Loan) => void;
  onAddCustomer: (customer: Customer) => void;
  initialSelectedCustomerId?: string;
  onNavigate: (tab: string, arg?: any) => void;
}

export default function LoanWizard({ customers, onAddLoan, onAddCustomer, initialSelectedCustomerId, onNavigate }: LoanWizardProps) {
  // Wizard Setup States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialSelectedCustomerId || '');
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [loanType, setLoanType] = useState<LoanType>(LoanType.STANDARD);
  const [principal, setPrincipal] = useState<number>(1000);
  const [interestRate, setInterestRate] = useState<number>(2.0); // % per month
  const [interestType, setInterestType] = useState<InterestType>(InterestType.FLAT);
  const [termCount, setTermCount] = useState<number>(6);
  const [termUnit, setTermUnit] = useState<PaymentTerm>(PaymentTerm.MONTHLY);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Collateral States (Active if Pawn or Installment is selected)
  const [colName, setColName] = useState('');
  const [colSerial, setColSerial] = useState('');
  const [colCondition, setColCondition] = useState('');
  const [colValue, setColValue] = useState<number>(1200);
  const [colLocation, setColLocation] = useState('');
  const [colNotes, setColNotes] = useState('');

  // Dropdown for client search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const query = customerSearch.toLowerCase().trim();
    return customers.filter(c => 
      c.nameKh.toLowerCase().includes(query) ||
      c.nameEn.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  }, [customers, customerSearch]);

  // Sync initial customer ID if provided via arg
  useEffect(() => {
    if (initialSelectedCustomerId) {
      setSelectedCustomerId(initialSelectedCustomerId);
    }
  }, [initialSelectedCustomerId]);

  // Selected customer object
  const selectedCustomerObj = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Auto calculate repayment amortization schedule dynamically in real time!
  const liveSchedules = useMemo(() => {
    if (principal <= 0 || interestRate < 0 || termCount <= 0 || !startDate) return [];
    return generateSchedule(principal, interestRate, interestType, termCount, termUnit, startDate);
  }, [principal, interestRate, interestType, termCount, termUnit, startDate]);

  const scheduleSummary = useMemo(() => {
    if (liveSchedules.length === 0) return { principalSum: 0, interestSum: 0, totalPay: 0 };
    let principalSum = 0;
    let interestSum = 0;
    liveSchedules.forEach(s => {
      principalSum += s.principal;
      interestSum += s.interest;
    });
    return {
      principalSum,
      interestSum,
      totalPay: principalSum + interestSum
    };
  }, [liveSchedules]);

  // Quick Inline Customer Register Form States
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickKhName, setQuickKhName] = useState('');
  const [quickEnName, setQuickEnName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickIdCard, setQuickIdCard] = useState('');

  const handleQuickRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickKhName || !quickPhone) {
      alert('សូមបំពេញឈ្មោះខ្មែរ និងលេខទូរស័ព្ទ!');
      return;
    }
    const newId = `C-${String(customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      id: newId,
      nameKh: quickKhName,
      nameEn: quickEnName || quickKhName,
      phone: quickPhone,
      idCard: quickIdCard || 'N/A',
      address: 'ភ្នំពេញ (ភ្នំពេញ)',
      createdAt: new Date().toISOString()
    };
    onAddCustomer(newCust);
    setSelectedCustomerId(newId);
    setShowQuickRegister(false);
    // Reset quick fields
    setQuickKhName('');
    setQuickEnName('');
    setQuickPhone('');
    setQuickIdCard('');
  };

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('សូមជ្រើសរើសអតិថិជនជាមុនសិន!');
      return;
    }
    if (principal <= 0 || interestRate < 0 || termCount <= 0) {
      alert('សូមបំពេញព័ត៌មានកម្ចីឱ្យបានត្រឹមត្រូវ!');
      return;
    }

    const uniqueId = `TX-${String(Date.now()).slice(-4)}`;
    const needCollateral = loanType === LoanType.PAWN || loanType === LoanType.INSTALLMENT;
    
    let collateral: Collateral | undefined = undefined;
    if (needCollateral) {
      if (!colName) {
        alert('សូមបំពេញឈ្មោះទ្រព្យបញ្ចាំ/ទំនិញ!');
        return;
      }
      collateral = {
        name: colName,
        serialNumber: colSerial || 'N/A',
        condition: colCondition || 'ល្អបង្គួរ',
        estimatedValue: colValue,
        storageLocation: colLocation || 'ការិយាល័យកណ្តាល',
        notes: colNotes
      };
    }

    const newLoan: Loan = {
      id: uniqueId,
      customerId: selectedCustomerId,
      customerName: selectedCustomerObj?.nameKh || 'Unregistered',
      type: loanType,
      principal,
      interestRate,
      interestType,
      termCount,
      termUnit,
      startDate,
      endDate: liveSchedules[liveSchedules.length - 1]?.dueDate || startDate,
      collateral,
      status: LoanStatus.ACTIVE,
      schedules: liveSchedules,
      notes,
      createdAt: new Date().toISOString()
    };

    onAddLoan(newLoan);
    alert(`កិច្ចសន្យាលេខ ${uniqueId} ត្រូវបានបង្កើតឡើងដោយជោគជ័យ!`);
    onNavigate('loans', uniqueId); // redirect to detail view
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="loan_wizard_view">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight moul-heading text-slate-900">
          បង្កើតកិច្ចសន្យាថ្មី (New Contract Wizard)
        </h2>
        <p className="text-xs text-slate-500">ប្រព័ន្ធគណនាការប្រាក់ស្វ័យប្រវត្តិ តារាងបង់រំលស់ជាប្រចាំ និងចងក្រងឯកសារបញ្ចាំលម្អិត។</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN - Settings Form */}
        <form onSubmit={handleSaveLoan} className="xl:col-span-2 space-y-6 font-medium text-xs text-slate-700">
          
          {/* Section 1: Select Customer */}
          <div className="bg-white rounded-2xl border border-slate-200/85 p-6 shadow-xs space-y-4">
            <h3 className="text-slate-950 font-semibold text-sm flex items-center gap-2">
              <Check className="w-5 h-5 text-indigo-500 bg-indigo-50 p-1 rounded-full" /> ១. ព័ត៌មានអតិថិជន (Customer Identity)
            </h3>

            {!showQuickRegister ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Combobox Select */}
                  <div className="space-y-1">
                    <label className="text-slate-600 text-[11px]">ស្វែងរក / ជ្រើសរើសអតិថិជន *</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="ស្វែងរកតាមឈ្មោះ ឬលេខទូរស័ព្ទ..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-slate-900 outline-hidden focus:ring-1 focus:ring-indigo-550 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Customer display options */}
                  <div className="space-y-1">
                    <label className="text-slate-600 text-[11px]">បញ្ជីលទ្ធផលស្វែងរក</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-slate-250 rounded-lg text-slate-900 outline-hidden font-medium text-xs focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- សូមជ្រើសរើសអតិថិជន --</option>
                      {filteredCustomers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nameKh} ({c.nameEn}) - {c.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Create Quick register Link */}
                <div className="flex justify-between items-center text-[11px] font-medium pt-1">
                  <span className="text-slate-400">ស្វែងរកមិនឃើញ? ចុះឈ្មោះអតិថិជនរហ័សទីនេះ</span>
                  <button
                    type="button"
                    onClick={() => setShowQuickRegister(true)}
                    className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 font-bold"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> បង្កើតគណនីអតិថិជនភ្លាមៗ
                  </button>
                </div>

                {selectedCustomerObj && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-xs">{selectedCustomerObj.nameKh} ({selectedCustomerObj.nameEn})</div>
                      <div className="text-slate-500 text-[11px] font-mono">លេខទូរស័ព្ទ៖ {selectedCustomerObj.phone} | អត្តសញ្ញាណប័ណ្ណ៖ {selectedCustomerObj.idCard}</div>
                    </div>
                    <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-sm uppercase">{selectedCustomerObj.id}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Inline register form close button included */
              <div className="p-4 border border-indigo-100 bg-indigo-50/35 rounded-xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-indigo-100/50">
                  <span className="font-bold text-slate-800 text-xs">ចុះឈ្មោះអតិថិជនរហ័ស</span>
                  <button 
                    type="button" 
                    onClick={() => setShowQuickRegister(false)}
                    className="text-indigo-600 hover:text-red-500 text-[11px] font-extrabold"
                  >
                    ត្រឡប់ទៅការស្វែងរក
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-slate-500 font-semibold">ឈ្មោះខ្មែរ *</label>
                    <input 
                      type="text" 
                      required={showQuickRegister}
                      value={quickKhName}
                      onChange={(e) => setQuickKhName(e.target.value)}
                      placeholder="e.g. អ៊ឹម ចន្ថា"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-slate-500 font-semibold">ឈ្មោះឡាតាំង</label>
                    <input 
                      type="text" 
                      value={quickEnName}
                      onChange={(e) => setQuickEnName(e.target.value)}
                      placeholder="e.g. IM CHANTHA"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-slate-500 font-semibold">លេខទូរស័ព្ទ *</label>
                    <input 
                      type="text" 
                      required={showQuickRegister}
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      placeholder="e.g. 010 778 899"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-slate-500 font-semibold">អត្តសញ្ញាណប័ណ្ណ</label>
                    <input 
                      type="text" 
                      value={quickIdCard}
                      onChange={(e) => setQuickIdCard(e.target.value)}
                      placeholder="020384731"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleQuickRegisterSubmit}
                  className="w-full mt-2 py-2 bg-indigo-600 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs"
                >
                  ចុះឈ្មោះ និងជ្រើសរើសអតិថិជននេះភ្លាម
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Loan Term Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200/85 p-6 shadow-xs space-y-4">
            <h3 className="text-slate-950 font-semibold text-sm flex items-center gap-2">
              <Hearts className="w-5 h-5 text-indigo-500 bg-indigo-50 p-1 rounded-full" /> ២. ព័ត៌មានកិច្ចសន្យា និងលក្ខខណ្ឌកម្ចី/បញ្ចាំ (Loan Terms)
            </h3>

            {/* Loan Type Tab selection */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: LoanType.STANDARD, title: 'កម្ចីទូទៅ', desc: 'ខ្ចីទុនអាជីវកម្ម' },
                { type: LoanType.PAWN, title: 'ហាងបញ្ចាំ', desc: 'មានទ្រព្យធានា' },
                { type: LoanType.INSTALLMENT, title: 'បង់រំលស់', desc: 'ទិញទំនិញរំលស់' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setLoanType(opt.type)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    loanType === opt.type 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-950/15' 
                      : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs">{opt.title}</span>
                  <span className={`text-[9px] font-normal ${loanType === opt.type ? 'text-slate-300' : 'text-slate-400'}`}>{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Numbers grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Principal ($) */}
              <div className="space-y-1">
                <label className="text-slate-600 text-[11px] flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" /> ទឹកប្រាក់ដើមស្នើសុំ (Principal Sum) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={10}
                    value={principal}
                    onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-xs focus:ring-1 focus:ring-indigo-500 pointer:bg-white"
                  />
                  <span className="absolute right-3 top-3 font-semibold text-[10px] text-slate-400">USD</span>
                </div>
              </div>

              {/* Interest Rate (%) */}
              <div className="space-y-1">
                <label className="text-slate-600 text-[11px] flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" /> អត្រាការប្រាក់គិតជា % ក្នុងមួយខែ *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0}
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-900 font-mono font-bold text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-3 font-semibold text-[10px] text-slate-400">%/ខែ</span>
                </div>
              </div>

              {/* Interest calculation type */}
              <div className="space-y-1">
                <label className="text-slate-600 text-[11px]">វិធីគណនាការប្រាក់ (Interest Type) *</label>
                <select
                  value={interestType}
                  onChange={(e) => setInterestType(e.target.value as InterestType)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-indigo-550 focus:bg-white"
                >
                  <option value={InterestType.FLAT}>ការប្រាក់ថេរ (Flat Rate)</option>
                  <option value={InterestType.DECREASING}>ការប្រាក់ថយចុះ (Declining Balance)</option>
                </select>
              </div>
            </div>

            {/* Term Period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Count */}
              <div className="space-y-1">
                <label className="text-slate-600 text-[11px]">ចំនួនដងត្រូវបង់ (Term Count) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={termCount}
                  onChange={(e) => setTermCount(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              {/* Term unit frequency */}
              <div className="space-y-1">
                <label className="text-slate-600 text-[11px]">ដងនៃការបង់ប្រចាំ (Frequency) *</label>
                <select
                  value={termUnit}
                  onChange={(e) => setTermUnit(e.target.value as PaymentTerm)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                >
                  <option value={PaymentTerm.MONTHLY}>រាល់ខែ (Monthly)</option>
                  <option value={PaymentTerm.WEEKLY}>រាល់សប្តាហ៍ (Weekly)</option>
                  <option value={PaymentTerm.DAILY}>រាល់ថ្ងៃ (Daily)</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-slate-600 text-[11px] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> ថ្ងៃចាប់ផ្តើមគិតប្រាក់ (Start Date) *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-mono text-slate-900 font-semibold"
                />
              </div>
            </div>

            {/* Optional contract note */}
            <div className="space-y-1">
              <label className="text-slate-600 text-[11px]">កំណត់ចំណាំកិច្ចសន្យាជាលាយលក្ខណ៍អក្សរ</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ឧ. បង់ប្រាក់យឺតយូរ ត្រូវផាកពិន័យ ២% នៃថ្ងៃយឺតយូរ..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          {/* Section 3: Collateral Form (Conditional) */}
          {(loanType === LoanType.PAWN || loanType === LoanType.INSTALLMENT) && (
            <div className="bg-white rounded-2xl border border-slate-200/85 p-6 shadow-xs space-y-4 animate-slideDown">
              <h3 className="text-slate-900 font-semibold text-sm flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-500 bg-amber-50 p-1 rounded-full" /> ៣. ព័ត៌មានលម្អិតរបស់ទ្រព្យបញ្ចាំ ឬទំនិញរំលស់ (Collateral Specs)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">ឈ្មោះទ្រព្យ/ផលិតផល (Item/Decsription) *</label>
                  <input
                    type="text"
                    required
                    value={colName}
                    onChange={(e) => setColName(e.target.value)}
                    placeholder="e.g. ម៉ូតូ Honda Dream 2025 ឬ iPhone 15 Pro Max"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">លេខគ្រឿង / លេខតួ / លេខម៉ាស៊ីន (Serial/IMEI)</label>
                  <input
                    type="text"
                    value={colSerial}
                    onChange={(e) => setColSerial(e.target.value)}
                    placeholder="e.g. NC125-102931 ឬ IMEI លេខកូដស្កេន"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Condition */}
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">ស្ថានភាពទ្រព្យសម្បត្តិ (Condition)</label>
                  <input
                    type="text"
                    value={colCondition}
                    onChange={(e) => setColCondition(e.target.value)}
                    placeholder="e.g. ថ្មី ៩៩%, ឆ្កូតបន្តិចបន្ទួច, ពេញលេញ"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                {/* Market value estimate */}
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">តម្លៃទីផ្សារប៉ាន់ស្មាន ($) *</label>
                  <input
                    type="number"
                    value={colValue}
                    onChange={(e) => setColValue(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 2500"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                {/* Storage Location */}
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">ឃ្លាំងផ្ទុកទំនិញ (Storage Location)</label>
                  <input
                    type="text"
                    value={colLocation}
                    onChange={(e) => setColLocation(e.target.value)}
                    placeholder="e.g. សោកុងត្រាឃ្លាំងសាខាទី២"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Extra Collateral remarks */}
              <div className="space-y-1">
                <label className="text-slate-600 text-[11px]">កំណត់ចំណាំបន្ថែមពីទ្រព្យសម្បត្តិ</label>
                <input
                  type="text"
                  value={colNotes}
                  onChange={(e) => setColNotes(e.target.value)}
                  placeholder="e.g. មានទុករួមទាំងកាតគ្រីច្បាស់លាស់ សោ២ផ្ទាំង..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="w-1/3 py-3 border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors text-center shadow-xs"
            >
              ត្រឡប់ក្រោយ
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-center shadow-indigo-600/10 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-xs"
            >
              បង្កើត និងរក្សាទុកគណនីបង់ប្រាក់
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN - Realtime Preview Schedule Table */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl sticky top-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h4 className="font-bold text-yellow-500 moul-heading text-xs tracking-wide">តារាងទូទាត់សាកល្បងមុនរក្សាទុក</h4>
              <p className="text-[10px] text-slate-400 mt-1 font-sans">Amortization Calendar Preview</p>
            </div>

            {/* Financial Overview stats */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-white/5 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px]">ប្រាក់ដើមស្នើសុំ:</span>
                <div className="text-lg font-bold font-mono text-white">{formatUSD(principal)}</div>
              </div>
              <div className="p-3.5 bg-white/5 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px]">សរុបការប្រាក់ត្រូវបង់:</span>
                <div className="text-lg font-bold font-mono text-emerald-400">+{formatUSD(scheduleSummary.interestSum)}</div>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-950 border border-indigo-900 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-300">ទឹកប្រាក់សរុបត្រូវសង (Total):</span>
              <span className="text-lg font-black text-yellow-500 font-mono">{formatUSD(scheduleSummary.totalPay)}</span>
            </div>

            {/* Scrollable Schedules Preview */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">បញ្ជីកាលវិភាគបង់ជាដំណាក់ៗ ({liveSchedules.length} ដង)</div>
              {liveSchedules.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs font-medium">
                  សូមបំពេញទិន្នន័យដើមទុន និងរយៈពេល...
                </div>
              ) : (
                liveSchedules.map((s, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-slate-200">លើកទី {s.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {s.dueDate} | {formatKhmerDate(s.dueDate).replace('ថ្ងៃទី', 'ថ្ងៃ')}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-bold text-white font-mono">{formatUSD(s.total)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ដើម: {formatUSD(s.principal)} | ការ: {formatUSD(s.interest)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Warnings or disclaimers */}
            <div className="flex gap-2.5 p-3.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-[11px] text-yellow-400">
              <Info className="w-4.5 h-4.5 shrink-0" />
              <p className="leading-relaxed">
                ផ្ទៀងផ្ទាត់តារាងបង់ប្រាក់សរុប និងកាលបរិច្ឆេទឱ្យបានត្រឹមត្រូវបំផុតជាមួយអតិថិជនជាមុនសិន មុននឹងចុចរក្សាទុកក្នុងទិន្នន័យ។
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Compact helper icon
function Hearts({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c-.195-.397-.507-.714-.882-.871A1.75 1.75 0 0 0 8.25 4c0 .412-.132.8-.363 1.127m9.593-.628c-.195-.397-.507-.714-.882-.871A1.75 1.75 0 0 0 13.92 4c0 .412-.132.8-.363 1.127m0 0a3.5 3.5 0 1 0-4.5 4.5m4.5-4.5a3.5 3.5 0 1 1-4.5 4.5M12 9v1.25M12 14.5v3m0 0 1.5-1.5m-1.5 1.5-1.5-1.5M12 12c-2.33 0-4.51.52-6.47 1.455M12 12c2.33 0 4.51.52 6.47 1.455M6.47 13.455c-.213.1-.383.257-.492.449A1.75 1.75 0 0 0 7.5 16.5h9a1.75 1.75 0 0 0 1.523-2.596c-.11-.192-.28-.35-.493-.45M6.47 13.455A12.019 12.019 0 0 0 12 14.5c2.1 0 4.09-.54 5.821-1.49" />
    </svg>
  );
}
