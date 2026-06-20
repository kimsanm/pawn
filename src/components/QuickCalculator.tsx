/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { X, Calculator, Percent, DollarSign, Calendar, Eye, Receipt, Info } from 'lucide-react';
import { PaymentTerm, InterestType } from '../types';
import { generateSchedule, formatUSD, formatKHR, EXCHANGE_RATE_USD_TO_KHR, formatKhmerDate } from '../utils/sampleData';
import { motion, AnimatePresence } from 'motion/react';

interface QuickCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

export default function QuickCalculator({ isOpen, onClose, accentColor }: QuickCalculatorProps) {
  const [principal, setPrincipal] = useState<number>(1000);
  const [interestRate, setInterestRate] = useState<number>(2.0); // % per month
  const [termCount, setTermCount] = useState<number>(6);
  const [termUnit, setTermUnit] = useState<PaymentTerm>(PaymentTerm.MONTHLY);
  const [interestType, setInterestType] = useState<InterestType>(InterestType.FLAT);
  const [startDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Accent mapping
  const activeColorText = 
    accentColor === 'indigo' ? 'text-indigo-600' :
    accentColor === 'emerald' ? 'text-emerald-500' :
    accentColor === 'violet' ? 'text-violet-600' :
    accentColor === 'rose' ? 'text-rose-500' :
    accentColor === 'slate' ? 'text-slate-600' :
    'text-yellow-500';

  const activeColorBg = 
    accentColor === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-505' :
    accentColor === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-505' :
    accentColor === 'violet' ? 'bg-violet-600 hover:bg-violet-505' :
    accentColor === 'rose' ? 'bg-rose-500 hover:bg-rose-505' :
    accentColor === 'slate' ? 'bg-slate-700 hover:bg-slate-605' :
    'bg-yellow-500 hover:bg-yellow-400';

  const activeFocusRing = 
    accentColor === 'indigo' ? 'focus:ring-indigo-500/20 focus:border-indigo-500' :
    accentColor === 'emerald' ? 'focus:ring-emerald-500/20 focus:border-emerald-500' :
    accentColor === 'violet' ? 'focus:ring-violet-500/20 focus:border-violet-500' :
    accentColor === 'rose' ? 'focus:ring-rose-500/20 focus:border-rose-500' :
    accentColor === 'slate' ? 'focus:ring-slate-500/20 focus:border-slate-500' :
    'focus:ring-yellow-500/20 focus:border-yellow-500';

  // Generate mock schedule based on values
  const schedule = useMemo(() => {
    return generateSchedule(
      principal,
      interestRate,
      interestType,
      termCount,
      termUnit,
      startDate
    );
  }, [principal, interestRate, interestType, termCount, termUnit, startDate]);

  const summary = useMemo(() => {
    const interestSum = schedule.reduce((sum, s) => sum + s.interest, 0);
    const totalPay = principal + interestSum;
    const firstMonthTotal = schedule[0]?.total || 0;
    return {
      interestSum,
      totalPay,
      firstMonthTotal
    };
  }, [schedule, principal]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" id="quick_calculator_modal">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-250 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 border border-white/5 text-yellow-400">
                <Calculator className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold moul-heading text-yellow-500">គណនាឥណទានរហ័ស (Quick Credit Calculator)</h3>
                <p className="text-[10px] text-slate-400 font-sans">គណនាប្រាក់បង់ប្រចាំខែ អត្រាការប្រាក់ និងរៀបចំតារាងសងប្រាក់ភ្លាមៗនៅលើអាកាស</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/12 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content - Split Panels */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
            
            {/* Left Panel: Inputs (col-span-12 or col-span-5) */}
            <div className="lg:col-span-5 space-y-5 text-xs text-slate-800 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-6">
              <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl flex gap-2.5 text-[11px] leading-relaxed text-amber-900">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>ម៉ាស៊ីនគណនានេះប្រើប្រាស់សម្រាប់វិភាគបឋម ឬពន្យល់អតិថិជនរហ័ស ដោយមិនប៉ះពាល់ដល់ទិន្នន័យជាក់ស្តែងឡើយ។</p>
              </div>

              {/* 1. Principal Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">ប្រាក់ដើមស្នើសុំ (Principal Loan Amount) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 font-bold font-mono text-slate-450">$</span>
                  <input 
                    type="number" 
                    value={principal || ''}
                    onChange={(e) => setPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={`w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold text-slate-900 text-sm outline-hidden transition-all ${activeFocusRing}`}
                    placeholder="e.g. 1000"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 px-1 font-semibold">
                  <span>≈ {formatKHR(principal * EXCHANGE_RATE_USD_TO_KHR)}</span>
                  <div className="flex gap-1.5">
                    {[500, 1000, 3000, 5000].map(val => (
                      <button 
                        key={val} 
                        type="button" 
                        onClick={() => setPrincipal(val)}
                        className="text-[9px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded transition-all font-mono"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Monthly Interest Rate */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block gap-1">អត្រាការប្រាក់ប្រចាំខែ (Monthly Interest Rate) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400 font-semibold"><Percent className="w-3.5 h-3.5" /></span>
                  <input 
                    type="number" 
                    step="0.1"
                    value={interestRate || ''}
                    onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={`w-full pl-9 pr-14 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold text-slate-900 text-sm outline-hidden transition-all ${activeFocusRing}`}
                    placeholder="e.g. 2.0"
                  />
                  <span className="absolute right-3.5 top-3.5 font-bold text-slate-400 text-[10px]">% / ខែ</span>
                </div>
                <div className="flex gap-1.5 justify-end text-[9px] px-1">
                  {[1.0, 1.5, 2.0, 2.5, 3.0].map(val => (
                    <button 
                      key={val} 
                      type="button" 
                      onClick={() => setInterestRate(val)}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded transition-all font-mono font-semibold"
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Duration Code */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">រយៈពេលសង (Term Duration)</label>
                  <input 
                    type="number" 
                    value={termCount || ''}
                    onChange={(e) => setTermCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold text-slate-900 text-sm outline-hidden transition-all ${activeFocusRing}`}
                    placeholder="e.g. 6"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">ឯកតាគិត (Payment Term)</label>
                  <select
                    value={termUnit}
                    onChange={(e) => setTermUnit(e.target.value as PaymentTerm)}
                    className={`w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold text-slate-900 text-xs outline-hidden transition-all ${activeFocusRing}`}
                  >
                    <option value={PaymentTerm.MONTHLY}>រៀងរាល់ខែ (Months)</option>
                    <option value={PaymentTerm.WEEKLY}>រៀងរាល់សប្តាហ៍ (Weeks)</option>
                    <option value={PaymentTerm.DAILY}>រៀងរាល់ថ្ងៃ (Days)</option>
                  </select>
                </div>
              </div>

              {/* 4. Calculation Type Flat vs Declining */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">ប្រភេទការគណនាការប្រាក់ (Interest Formula)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInterestType(InterestType.FLAT)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      interestType === InterestType.FLAT 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-xs' 
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-650'
                    }`}
                  >
                    <div className="font-bold">ការប្រាក់ថេរ (Flat)</div>
                    <div className="text-[9px] font-normal opacity-75">Flat calculations rate</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterestType(InterestType.DECREASING)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      interestType === InterestType.DECREASING 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-xs' 
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-650'
                    }`}
                  >
                    <div className="font-bold">ការថយចុះ (Declining)</div>
                    <div className="text-[9px] font-normal opacity-75">Reducing balance rate</div>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Panel: Output & Schedules Preview (col-span-12 or col-span-7) */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              
              {/* Output Quick Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1 border border-slate-800 shadow-sm">
                  <div className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">បង់ខែដំបូង (1st Est. Payment)</div>
                  <div className="text-sm font-black text-amber-400 font-mono">{formatUSD(summary.firstMonthTotal)}</div>
                  <div className="text-[8px] text-slate-400 font-mono">≈ {formatKHR(summary.firstMonthTotal * EXCHANGE_RATE_USD_TO_KHR)}</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-205 rounded-xl space-y-1">
                  <div className="text-slate-450 text-[9px] font-bold uppercase tracking-wider">ការប្រាក់សរុប (Total Interest)</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">{formatUSD(summary.interestSum)}</div>
                  <div className="text-[8px] text-emerald-600 font-mono font-semibold">≈ {formatKHR(summary.interestSum * EXCHANGE_RATE_USD_TO_KHR)}</div>
                </div>

                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                  <div className="text-indigo-600 text-[9px] font-bold uppercase tracking-wider">សរុបត្រូវសង (Total Payback)</div>
                  <div className="text-sm font-black text-indigo-900 font-mono">{formatUSD(summary.totalPay)}</div>
                  <div className="text-[8px] text-indigo-500 font-mono font-semibold">≈ {formatKHR(summary.totalPay * EXCHANGE_RATE_USD_TO_KHR)}</div>
                </div>
              </div>

              {/* Dynamic Schedule List Table preview */}
              <div className="flex-1 flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200/80 p-4 min-h-[300px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3 text-slate-800">
                  <h4 className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
                    <Receipt className="w-4 h-4 text-indigo-500" />
                    <span>តារាងគម្រោងសងប្រាក់លម្អិត (First Payment Breakdown Plan)</span>
                  </h4>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {schedule.length} ដំណាក់កាល
                  </span>
                </div>

                {/* Table wrapper */}
                <div className="flex-1 overflow-y-auto max-h-[280px] text-left">
                  <table className="w-full text-xs text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold text-[9px] bg-slate-100">
                        <th className="py-2 px-3 text-center">ល.រ (Term)</th>
                        <th className="py-2 px-3">កាលបរិច្ឆេទ (Due Date)</th>
                        <th className="py-2 px-3 text-right">ប្រាក់ត្រូវបង់សរុប (Total Payment)</th>
                        <th className="py-2 px-3 text-right">ប្រាក់ដើមមេ (Principal)</th>
                        <th className="py-2 px-3 text-right">ការប្រាក់ (Interest)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 font-mono text-[11px]">
                      {schedule.map((row, index) => (
                        <tr key={index} className="hover:bg-slate-100/60 transition-all">
                          <td className="py-2.5 px-3 text-center text-[10px] text-slate-400 font-sans font-bold">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            <span className="block font-semibold text-slate-800">{row.dueDate}</span>
                            <span className="block text-[8px] text-slate-400 font-sans font-medium">{formatKhmerDate(row.dueDate)}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-indigo-700 font-black">
                            {formatUSD(row.total)}
                            <span className="block text-[8px] text-slate-400 font-normal font-sans">≈ {formatKHR(row.total * EXCHANGE_RATE_USD_TO_KHR)}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800">
                            {formatUSD(row.principal)}
                            <span className="block text-[8px] text-slate-400 font-normal font-sans">≈ {formatKHR(row.principal * EXCHANGE_RATE_USD_TO_KHR)}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-600 font-bold">
                            +{formatUSD(row.interest)}
                            <span className="block text-[8px] text-slate-400 font-normal font-sans">≈ {formatKHR(row.interest * EXCHANGE_RATE_USD_TO_KHR)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-450">
              <span>រូបមន្តគណនា៖</span>
              <span className="font-bold text-slate-800">សងការប្រាក់ និងរំលស់ដើម ({interestType === InterestType.FLAT ? 'Flat Interest Amount' : 'Reducing Balance Principle'})</span>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl text-white font-bold tracking-wide transition-all active:scale-97 cursor-pointer text-xs ${activeColorBg}`}
            >
              បិទការគណនា (Dismiss)
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
