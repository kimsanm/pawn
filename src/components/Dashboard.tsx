/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Customer, Loan, LoanStatus, Transaction, LoanType } from '../types';
import { formatUSD, formatKhmerDate } from '../utils/sampleData';
import { 
  DollarSign, 
  Users, 
  FileText, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles,
  TrendingUp,
  Award,
  CalendarDays
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  customers: Customer[];
  loans: Loan[];
  transactions: Transaction[];
  onNavigate: (tab: string, arg?: any) => void;
}

export default function Dashboard({ customers, loans, transactions, onNavigate }: DashboardProps) {
  // 1. Calculate stats
  const stats = useMemo(() => {
    let totalLent = 0;
    let totalCollectedPrincipal = 0;
    let totalCollectedInterest = 0;
    let totalOverdueCount = 0;
    let activeLoansCount = 0;

    loans.forEach(loan => {
      totalLent += loan.principal;
      
      if (loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.OVERDUE) {
        activeLoansCount++;
      }

      loan.schedules.forEach(sched => {
        if (sched.status === 'PAID') {
          totalCollectedPrincipal += sched.principal;
          totalCollectedInterest += sched.interest;
        } else {
          // Check if overdue: status is OVERDUE, or dueDate is in the past and not paid
          const today = new Date().toISOString().split('T')[0];
          if (sched.dueDate < today) {
            totalOverdueCount++;
          }
        }
      });
    });

    const outstandingBalance = totalLent - totalCollectedPrincipal;

    return {
      totalLent,
      outstandingBalance,
      totalCollectedInterest,
      totalOverdueCount,
      activeLoansCount,
      totalCustomers: customers.length
    };
  }, [loans, customers]);

  // 2. Near-due installments (Next 7 days or overdue)
  const incomingPayments = useMemo(() => {
    const list: Array<{
      loanId: string;
      customerName: string;
      dueDate: string;
      amount: number;
      termId: number;
      type: LoanType;
      status: 'OVERDUE' | 'PENDING';
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    loans.forEach(loan => {
      if (loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.OVERDUE) {
        loan.schedules.forEach(sched => {
          if (sched.status !== 'PAID') {
            const isOverdue = sched.dueDate < todayStr;
            const diffDays = Math.ceil((new Date(sched.dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
            
            // Overdue OR due within the next 10 days
            if (isOverdue || (diffDays >= 0 && diffDays <= 14)) {
              list.push({
                loanId: loan.id,
                customerName: loan.customerName,
                dueDate: sched.dueDate,
                amount: sched.total,
                termId: sched.id,
                type: loan.type,
                status: isOverdue ? 'OVERDUE' : 'PENDING'
              });
            }
          }
        });
      }
    });

    // Sort by due date (overdue first, then closest first)
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);
  }, [loans]);

  // 3. Custom SVG Bar Chart calculation (MoM Payments Collected)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySummary: Record<string, { principal: number; interest: number }> = {};
    
    // Initialize current year months
    const currentYear = new Date().getFullYear();
    months.forEach((m, idx) => {
      const key = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      monthlySummary[key] = { principal: 0, interest: 0 };
    });

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === currentYear) {
        const key = `${currentYear}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlySummary[key]) {
          monthlySummary[key].principal += tx.paidPrincipal;
          monthlySummary[key].interest += tx.paidInterest;
        }
      }
    });

    // Map to simple list
    return Object.entries(monthlySummary).map(([key, value]) => {
      const monthIndex = parseInt(key.split('-')[1]) - 1;
      return {
        month: months[monthIndex],
        total: value.principal + value.interest,
        interest: value.interest,
        principal: value.principal
      };
    });
  }, [transactions]);

  // Maximum value for scaling the chart
  const maxChartValue = useMemo(() => {
    const values = chartData.map(d => d.total);
    const maxVal = Math.max(...values, 500); // at least 500 for scale
    return Math.ceil(maxVal * 1.15); // with some padding
  }, [chartData]);

  // Simple statistics counters for visual flair
  const loanTypeCounts = useMemo(() => {
    let standard = 0;
    let pawn = 0;
    let installment = 0;
    loans.forEach(l => {
      if (l.type === LoanType.STANDARD) standard++;
      if (l.type === LoanType.PAWN) pawn++;
      if (l.type === LoanType.INSTALLMENT) installment++;
    });
    return { standard, pawn, installment };
  }, [loans]);

  return (
    <div className="space-y-8" id="dashboard_view">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-400 via-indigo-500 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-400/20 text-yellow-300 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> មុខងារគ្រប់គ្រងសរុប
              </span>
            </div>
            <h1 className="text-2xl md:text-3.5xl font-bold tracking-tight moul-heading text-yellow-500 leading-relaxed">
              ប្រព័ន្ធគ្រប់គ្រងហាងបញ្ចាំ កម្ចី និងរំលស់
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl font-light">
              ទិដ្ឋភាពទូទៅនៃប្រតិបត្តិការហិរញ្ញវត្ថុ ការប្រមូលប្រាក់ និងការតាមដានស្ថានភាពកិច្ចសន្យាអតិថិជនទាំងអស់។
            </p>
          </div>
          <button 
            onClick={() => onNavigate('loans_new')}
            className="self-start md:self-center bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-medium px-5 py-3 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" /> <b>បង្កើតកិច្ចសន្យាថ្មី</b>
          </button>
        </div>
      </div>

      {/* Grid STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Lent */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between" id="stat_total_lent">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-medium">ប្រាក់បញ្ចេញសរុប (Issued)</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{formatUSD(stats.totalLent)}</div>
            <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> ដើមទុនបញ្ចេញទាំងអស់
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Outstanding Balance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between" id="stat_outstanding">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-medium">សមតុល្យប្រាក់ដើមសល់ (Outstanding)</span>
            <div className="text-2xl font-bold text-indigo-600 tracking-tight">{formatUSD(stats.outstandingBalance)}</div>
            <span className="text-indigo-500 text-[11px] font-medium flex items-center gap-0.5">
              <Clock className="w-3.5 h-3.5" /> កំពុងមានដំណើរការ
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Interest Collected */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between" id="stat_interest">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-medium">ការប្រាក់ប្រមូលបាន (Interest Collected)</span>
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">{formatUSD(stats.totalCollectedInterest)}</div>
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-0.5">
              <ArrowDownLeft className="w-3.5 h-3.5" /> ចំណេញពីការប្រាក់សរុប
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Overdue counts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between" id="stat_overdue">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-medium">ការទូទាត់យឺតយ៉ាវ (Overdue Payments)</span>
            <div className={`text-2xl font-bold tracking-tight ${stats.totalOverdueCount > 0 ? 'text-red-500' : 'text-slate-900'}`}>{stats.totalOverdueCount} ដង</div>
            <span className={`text-[11px] font-medium flex items-center gap-0.5 ${stats.totalOverdueCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              <AlertTriangle className="w-3.5 h-3.5" /> {stats.totalOverdueCount > 0 ? 'ត្រូវការតាមដានប្រញាប់' : 'រៀបរយល្អឥតខ្ចោះ'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.totalOverdueCount > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-700'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main split: Charts vs. Quick Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Monthly Income Graph (SVG Based) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4" id="income_chart_card">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-semibold text-slate-900 text-sm">និន្នាការប្រមូលចំណូលប្រចាំខែ (ឆ្នាំ {new Date().getFullYear()})</h3>
              <p className="text-xs text-slate-500">គិតជាដុល្លារ ($) រាប់បញ្ចូលទាំងប្រាក់ដើម និងការប្រាក់</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span>
                <span>ប្រាក់ដើម</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400 inline-block"></span>
                <span>ការប្រាក់</span>
              </div>
            </div>
          </div>

          {/* SVG Custom Chart Drawing */}
          <div className="w-full h-80 pt-4 flex items-end">
            <div className="w-full h-full flex flex-col justify-between">
              {/* Plot area */}
              <div className="relative flex-1 flex items-end justify-between border-b gap-1 sm:gap-2 pb-1 border-slate-200">
                
                {/* Background horizontal lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map(line => (
                    <div key={line} className="w-full border-t border-dashed border-slate-100 h-0"></div>
                  ))}
                </div>

                {/* Render bars */}
                {chartData.map((data, index) => {
                  const hasData = data.total > 0;
                  const totalHeightPct = hasData ? (data.total / maxChartValue) * 100 : 2; // min height
                  const interestHeightPct = hasData ? (data.interest / data.total) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      {/* Bar Stack */}
                      <div 
                        className="w-8 sm:w-10 rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:ring-2 group-hover:ring-slate-950/10 cursor-pointer shadow-xs"
                        style={{ height: `${totalHeightPct}%` }}
                      >
                        {/* Interest part */}
                        <div 
                          className="w-full bg-amber-400" 
                          style={{ height: `${interestHeightPct}%` }}
                        ></div>
                        {/* Principal part */}
                        <div 
                          className="w-full bg-indigo-600 flex-1"
                        ></div>
                      </div>

                      {/* Hover Tooltip tooltip */}
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[11px] p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 shadow-lg whitespace-nowrap">
                        <p className="font-semibold text-yellow-400 mb-0.5">{data.month}</p>
                        <p>ដើម: {formatUSD(data.principal)}</p>
                        <p>ការ: {formatUSD(data.interest)}</p>
                        <hr className="border-slate-700 my-1" />
                        <p className="font-bold">សរុប: {formatUSD(data.total)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-2 px-1">
                {chartData.map((data, idx) => (
                  <span key={idx} className="flex-1 text-center truncate">{data.month}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Briefing Summary & Quick Launch */}
        <div className="space-y-6" id="quick_overview_card">
          {/* Quick Metrics */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h4 className="font-semibold text-slate-900 text-sm">ប្រភេទកិច្ចសន្យាសរុប</h4>
            <div className="space-y-3">
              {/* Pawns count */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-medium text-slate-700">ហាងបញ្ចាំ (Pawn / Collateral)</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">{loanTypeCounts.pawn} កុងត្រា</span>
              </div>
              
              {/* Loans count */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="text-xs font-medium text-slate-700">កម្ចីទូទៅ (Standard Loans)</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">{loanTypeCounts.standard} កុងត្រា</span>
              </div>

              {/* Installments count */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-xs font-medium text-slate-700">បង់រំលស់ (Installments)</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">{loanTypeCounts.installment} ករណី</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 text-center border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="text-xs text-slate-500 font-medium">អតិថិជនសរុប</div>
                <div className="text-xl font-bold text-slate-900">{stats.totalCustomers} នាក់</div>
              </div>
              <div className="p-3 text-center border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="text-xs text-slate-500 font-medium">កិច្ចសន្យាសកម្ម</div>
                <div className="text-xl font-bold text-slate-900">{stats.activeLoansCount} ក្បាល</div>
              </div>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4">
            <h4 className="font-semibold text-sm text-yellow-500">ជំនួយការរហ័ស</h4>
            <div className="grid grid-cols-1 gap-2.5">
              <button 
                onClick={() => onNavigate('loans_new')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium text-left flex items-center justify-between group transition-colors"
              >
                <span>បង្កើតកិច្ចសន្យាថ្មី</span>
                <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
              <button 
                onClick={() => onNavigate('customers')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium text-left flex items-center justify-between group transition-colors"
              >
                <span>បន្ថែម/គ្រប់គ្រងអតិថិជន</span>
                <Users className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </button>
              <button 
                onClick={() => onNavigate('transactions')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium text-left flex items-center justify-between group transition-colors"
              >
                <span>ប្រវត្តិទទួលការទូទាត់</span>
                <FileText className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Near-Term / Overdue payments panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6" id="near_due_schedule_panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-500" /> កាលវិភាគត្រូវប្រមូលប្រាក់បន្ទាន់ និងឆាប់ៗនេះ (Overdue & Near-Term)
            </h3>
            <p className="text-xs text-slate-500">បញ្ជីដែលត្រូវបង់ ឬហួសកាលកំណត់ក្នុងរយៈពេល ១៤ ថ្ងៃកន្លងមក</p>
          </div>
        </div>

        {incomingPayments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <CheckBadge className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
            មិនមានគណនីយឺតយ៉ាវ ឬត្រូវបង់ក្នុងសប្តាហ៍នេះទេ!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="py-3 px-4">កូដកិច្ចសន្យា</th>
                  <th className="py-3 px-4">ឈ្មោះអតិថិជន</th>
                  <th className="py-3 px-4">ប្រភេទ</th>
                  <th className="py-3 px-4 text-center">លើករៀង</th>
                  <th className="py-3 px-4">ថ្ងៃត្រូវបង់</th>
                  <th className="py-3 px-4 text-right">ទឹកប្រាក់សរុប</th>
                  <th className="py-3 px-4 text-center">ស្ថានភាព</th>
                  <th className="py-3 px-4 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomingPayments.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td 
                      onClick={() => onNavigate('loans', item.loanId)}
                      className="py-3 px-4 font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      {item.loanId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.customerName}</td>
                    <td className="py-3 px-4">
                      {item.type === LoanType.PAWN && <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-medium border border-amber-200/50">បញ្ចាំ</span>}
                      {item.type === LoanType.STANDARD && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px] font-medium border border-indigo-200/50">កម្ចី</span>}
                      {item.type === LoanType.INSTALLMENT && <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full text-[10px] font-medium border border-purple-200/50">បង់រំលស់</span>}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">លើកទី {item.termId}</td>
                    <td className="py-3 px-4 font-mono">
                      {item.dueDate}
                      <span className="block text-[10px] text-slate-400 font-sans">
                        {formatKhmerDate(item.dueDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatUSD(item.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'OVERDUE' ? (
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">ហួសកាលកំណត់</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">ជិតដល់ថ្ងៃបង់</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => onNavigate('loans', item.loanId)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
                      >
                        ទូទាត់ប្រាក់
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline fallback icon for check mark
function CheckBadge({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
  );
}
