/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatUSD, formatKhmerDate } from '../utils/sampleData';
import { Search, History, Calendar, Printer, Eye, X, BadgeCent, ArrowDownLeft, Trash } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  onDeleteTransaction?: (id: string) => void; // Allow reversing transactions if needed
}

export default function Transactions({ transactions, onDeleteTransaction }: TransactionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  
  // Modal viewer state
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);

  // Filter lists
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.customerName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                          t.loanId.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase().trim());
      
      const matchMethod = paymentMethodFilter === 'ALL' || t.paymentMethod.includes(paymentMethodFilter);

      return matchSearch && matchMethod;
    }).sort((a, b) => b.date.localeCompare(a.date)); // newest first
  }, [transactions, searchQuery, paymentMethodFilter]);

  // Summaries
  const totals = useMemo(() => {
    let sumPrincipal = 0;
    let sumInterest = 0;
    let sumPenalty = 0;

    filteredTransactions.forEach(t => {
      sumPrincipal += t.paidPrincipal;
      sumInterest += t.paidInterest;
      sumPenalty += t.penaltyFee;
    });

    return {
      principal: sumPrincipal,
      interest: sumInterest,
      penalty: sumPenalty,
      grandTotal: sumPrincipal + sumInterest + sumPenalty
    };
  }, [filteredTransactions]);

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="transactions_view">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight moul-heading text-slate-900">
          កម្រងព័ត៌មានប្រតិបត្តិការ និងការប្រមូលចំណូល (Receipts History)
        </h2>
        <p className="text-xs text-slate-500">ស្វែងរកចម្រោះរាល់វិក្កយបត្រដែលបានប្រមូលប្រាក់រួចពីអតិថិជន និងបោះពុម្ពឡើងវិញជាផ្លូវការ។</p>
      </div>

      {/* Stats summaries */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">ប្រមូលប្រាក់ដើមសរុប</div>
          <div className="text-base font-bold text-slate-900 font-mono mt-0.5">{formatUSD(totals.principal)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">ប្រមូលការប្រាក់សរុប</div>
          <div className="text-base font-bold text-slate-950 font-mono mt-0.5 text-emerald-600">+{formatUSD(totals.interest)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">ប្រាក់ផាកពិន័យសរុប</div>
          <div className="text-base font-bold text-slate-900 font-mono mt-0.5 ">{formatUSD(totals.penalty)}</div>
        </div>
        <div className="bg-indigo-900 text-white p-4 rounded-xl border border-indigo-950 shadow-xs">
          <div className="text-[11px] text-yellow-400 font-bold uppercase">ចំណូលសរុបរួម (Income Collected)</div>
          <div className="text-lg font-black font-mono mt-0.5">{formatUSD(totals.grandTotal)}</div>
        </div>
      </div>

      {/* Table & filters box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        
        {/* Filtering inputs bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ កូដវិក្កយបត្រ ឬលេខកិច្ចសន្យា..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="w-full md:w-64 font-medium text-xs">
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-150 rounded-lg"
            >
              <option value="ALL">គ្រប់វិធីទូទាត់ប្រាក់</option>
              <option value="ABA Mobile">ABA Mobile</option>
              <option value="Cash">Cash (សាច់ប្រាក់)</option>
              <option value="Wing">Wing / TrueMoney</option>
              <option value="Acleda">Acleda ToanChet</option>
            </select>
          </div>
        </div>

        {/* Dynamic Receipts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-slate-400 font-medium text-[11px] pb-2">
                <th className="py-3 px-4">កូដវិក្កយបត្រ</th>
                <th className="py-3 px-4">កូដកិច្ចសន្យា</th>
                <th className="py-3 px-4">ឈ្មោះអតិថិជន</th>
                <th className="py-3 px-4">ដំណាក់កាល</th>
                <th className="py-3 px-4">ថ្ងៃទូទាត់</th>
                <th className="py-3 px-4 text-right">ដើមដែលបង់</th>
                <th className="py-3 px-4 text-right">ការប្រាក់</th>
                <th className="py-3 px-4 text-right text-indigo-700">សរុបរួម</th>
                <th className="py-3 px-4">វិធីទូទាត់</th>
                <th className="py-3 px-4 text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 leading-normal font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400 text-xs">
                    មិនមានទិន្នន័យប្រតិបត្តិការទូទាត់ប្រាក់ស្របគ្នានេះទេ!
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{tx.id}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{tx.loanId}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{tx.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-500">លើកទី {tx.scheduleId}</td>
                    <td className="py-3.5 px-4 font-mono white-space-nowrap">
                      {tx.date.slice(0, 10)}
                      <span className="block text-[10px] text-slate-400 font-sans">{formatKhmerDate(tx.date.slice(0, 10))}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatUSD(tx.paidPrincipal)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600">+{formatUSD(tx.paidInterest)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-indigo-700">{formatUSD(tx.totalAmount)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-150 text-[10px] text-slate-600 font-mono font-semibold">
                        {tx.paymentMethod.replace(' (Bank Transfer)', '')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setViewTransaction(tx)}
                        className="p-1.5 rounded-lg text-indigo-650 hover:text-indigo-900 hover:bg-indigo-50 transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                        title="មើលវិក្កយបត្រ"
                      >
                        <Eye className="w-3.5 h-3.5" /> មើល
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Double Overlay Receipt Viewer */}
      {viewTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 font-sans">
            <button
              onClick={() => setViewTransaction(null)}
              className="absolute right-4 top-4 hover:bg-slate-50 text-slate-400 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Friendly Block layout */}
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-200">
                <h4 className="font-bold moul-heading text-sm text-slate-900 tracking-wider">បង្កាន់ដៃទទួលទូទាត់ប្រាក់</h4>
                <p className="text-[11px] font-extrabold text-indigo-600 font-mono tracking-wide">PAWNSHOP & LOAN RECEIPT</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">Receipt ID: {viewTransaction.id}</p>
              </div>

              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">កិច្ចសន្យា (Contract ID):</span>
                  <span className="font-bold font-mono text-slate-900">{viewTransaction.loanId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">អតិថិជន (Client Label):</span>
                  <span className="font-bold text-slate-900">{viewTransaction.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ថ្ងៃទូទាត់ (Payment Date):</span>
                  <span className="font-mono">{viewTransaction.date.slice(0, 10)} {viewTransaction.date.slice(11, 16)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">បង់ដំណាក់កាលទី (Amortization Turn):</span>
                  <span className="font-bold text-slate-900">ដងទិ {viewTransaction.scheduleId}</span>
                </div>
                
                <hr className="border-slate-100" />
                
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-slate-500">
                    <span>ប្រាក់ដើមសង (Principal Received):</span>
                    <span className="font-mono">{formatUSD(viewTransaction.paidPrincipal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>ការប្រាក់សង (Interest Received):</span>
                    <span className="font-mono">{formatUSD(viewTransaction.paidInterest)}</span>
                  </div>
                  {viewTransaction.penaltyFee > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>ប្រាក់ពិន័យយឺតយូរ (Penalty):</span>
                      <span className="font-mono">+{formatUSD(viewTransaction.penaltyFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-indigo-700 font-bold text-sm pt-2 border-t border-dashed border-slate-205">
                    <span>សរុបប្រាក់ទាំងសង (Total Amount):</span>
                    <span className="font-mono text-base font-extrabold">{formatUSD(viewTransaction.totalAmount)}</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">វិធីបង់ប្រាក់ (Channel):</span>
                  <span className="font-bold text-slate-800">{viewTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">បុគ្គលិកទទួលប្រាក់ (Agent ID):</span>
                  <span className="font-bold text-slate-800">{viewTransaction.receiver}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4 font-semibold space-y-1">
                <p>សូមអរគុណសម្រាប់ការប្រើប្រាស់សេវាកម្ម!</p>
                <p className="font-normal text-[8px]">All digital ledger records are securely encrypted on devices.</p>
              </div>

              {/* print layout control inside modal */}
              <div className="flex gap-2 pt-2 border-t border-slate-150 justify-end">
                <button
                  onClick={() => setViewTransaction(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-xs"
                >
                  បិទវិញ
                </button>
                <button
                  onClick={triggerPrint}
                  className="px-4 py-2 bg-slate-900 hover:bg-indigo-950 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> <b>បោះពុម្ពឡើងវិញ</b>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
