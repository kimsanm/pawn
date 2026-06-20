/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Customer, 
  Loan, 
  LoanType, 
  PaymentTerm, 
  InstallmentSchedule,
  LoanStatus
} from '../types';
import { 
  formatUSD, 
  formatKHR, 
  EXCHANGE_RATE_USD_TO_KHR, 
  formatKhmerDate 
} from '../utils/sampleData';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  User, 
  Phone, 
  FileText, 
  Briefcase, 
  ArrowRight, 
  TrendingUp, 
  Filter, 
  Info,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoanCalendarProps {
  loans: Loan[];
  customers: Customer[];
  onNavigate: (tab: string, arg?: any) => void;
  accentColor: string;
}

interface FlattenedInstallment {
  loanId: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  loanType: LoanType;
  installment: InstallmentSchedule;
}

// Khmer month names representation
const KHMER_MONTHS_FULL = [
  'មករា (January)', 'កុម្ភៈ (February)', 'មីនា (March)', 'មេសា (April)',
  'ឧសភា (May)', 'មិថុនា (June)', 'កក្កដា (July)', 'សីហា (August)',
  'កញ្ញា (September)', 'តុលា (October)', 'វិច្ឆិកា (November)', 'ធ្នូ (December)'
];

const KHMER_WEEKDAYS = [
  { enShort: 'Sun', kh: 'អាទិត្យ', isWeekend: true },
  { enShort: 'Mon', kh: 'ចន្ទ', isWeekend: false },
  { enShort: 'Tue', kh: 'អង្គារ', isWeekend: false },
  { enShort: 'Wed', kh: 'ពុធ', isWeekend: false },
  { enShort: 'Thu', kh: 'ព្រហស្បតិ៍', isWeekend: false },
  { enShort: 'Fri', kh: 'សុក្រ', isWeekend: false },
  { enShort: 'Sat', kh: 'សៅរ៍', isWeekend: true }
];

export default function LoanCalendar({ loans, customers, onNavigate, accentColor }: LoanCalendarProps) {
  // Current visible calendar month & year
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Default to June 20, 2026 based on the provided metadata context
    return new Date('2026-06-20');
  });

  // Selected date for displaying details in the sidebar (Default to today's date format)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-06-20');

  // Interactive filtering states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | LoanType.STANDARD | LoanType.PAWN | LoanType.INSTALLMENT>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Accent styles configuration
  const accent = useMemo(() => {
    const isYellow = accentColor === 'yellow';
    return {
      text: isYellow ? 'text-yellow-600' : `text-${accentColor}-600`,
      bg: isYellow ? 'bg-yellow-500' : `bg-${accentColor}-650`,
      bgLight: isYellow ? 'bg-yellow-100/40 border-yellow-500/20 text-yellow-800' : `bg-${accentColor}-50 border-${accentColor}-100 text-${accentColor}-800`,
      bgPill: isYellow ? 'bg-yellow-500 text-slate-950 hover:bg-yellow-400' : `bg-${accentColor}-600 text-white hover:bg-${accentColor}-500`,
      focusRing: isYellow ? 'focus:ring-yellow-500/20 focus:border-yellow-500' : `focus:ring-${accentColor}-500/20 focus:border-${accentColor}-500`,
      borderFocus: isYellow ? 'border-yellow-400' : `border-${accentColor}-450`,
      hoverText: isYellow ? 'hover:text-yellow-600' : `hover:text-${accentColor}-600`,
    };
  }, [accentColor]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Handle month steps
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    // Jump straight back to June 2026 as that aligns with our simulated data calendar timezone
    setCurrentDate(new Date('2026-06-20'));
    setSelectedCalendarDate('2026-06-20');
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(year, parseInt(e.target.value), 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value), month, 1));
  };

  // Build key mapping helper
  const getLocalDateString = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  // Flatten installments into a single queried collection matching filters
  const allFlattenedInstallments = useMemo(() => {
    const flat: FlattenedInstallment[] = [];
    
    loans.forEach(loan => {
      // Find matching customer details
      const client = customers.find(c => c.id === loan.customerId);
      const phone = client ? client.phone : '012 345 678';
      
      loan.schedules.forEach(sched => {
        flat.push({
          loanId: loan.id,
          customerId: loan.customerId,
          customerName: loan.customerName || (client ? client.nameKh : 'មិនស្គាល់'),
          customerPhone: phone,
          loanType: loan.type,
          installment: sched
        });
      });
    });

    return flat;
  }, [loans, customers]);

  // Map of date string -> installments for very fast O(1) cell grid rendering
  const dateInstallmentsMap = useMemo(() => {
    const map: Record<string, FlattenedInstallment[]> = {};
    
    allFlattenedInstallments.forEach(item => {
      // Apply search query and status/type filters if applicable before plotting on cells
      const matchesSearch = searchQuery.trim() === '' || 
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.loanId.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesType = typeFilter === 'ALL' || item.loanType === typeFilter;
      
      // Determine computed check status
      // Note: A PENDING schedule whose due date is before today is implicitly OVERDUE
      const todayStr = '2026-06-20'; // Reference simulation date
      let computedStatus = item.installment.status;
      if (item.installment.status === 'PENDING' && item.installment.dueDate < todayStr) {
        computedStatus = 'OVERDUE';
      }

      const matchesStatus = statusFilter === 'ALL' || computedStatus === statusFilter;

      if (matchesSearch && matchesType && matchesStatus) {
        const key = item.installment.dueDate;
        if (!map[key]) {
          map[key] = [];
        }
        map[key].push(item);
      }
    });

    return map;
  }, [allFlattenedInstallments, searchQuery, typeFilter, statusFilter]);

  // Generate 42 calendar grid day cells
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon ...
    
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();
    
    const cells: { date: Date; dateStr: string; isCurrentMonth: boolean; dayNum: number }[] = [];
    
    // Previous month filler days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = totalDaysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      cells.push({
        date: d,
        dateStr: getLocalDateString(d),
        isCurrentMonth: false,
        dayNum
      });
    }
    
    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      cells.push({
        date: d,
        dateStr: getLocalDateString(d),
        isCurrentMonth: true,
        dayNum: i
      });
    }
    
    // Next month filler days to complete grid rows
    const totalRowsCells = 42;
    const remainingCount = totalRowsCells - cells.length;
    for (let i = 1; i <= remainingCount; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({
        date: d,
        dateStr: getLocalDateString(d),
        isCurrentMonth: false,
        dayNum: i
      });
    }
    
    return cells;
  }, [year, month]);

  // Statistics summaries for the visible month!
  const monthStats = useMemo(() => {
    let totals = 0;
    let paid = 0;
    let pending = 0;
    let overdueVal = 0;
    let overdueCount = 0;
    
    // Process all flat installments for current calendar month
    allFlattenedInstallments.forEach(item => {
      const dueDate = item.installment.dueDate;
      const parseDate = new Date(dueDate);
      
      // Check if matches visible month and year
      if (parseDate.getFullYear() === year && parseDate.getMonth() === month) {
        totals += item.installment.total;
        paid += item.installment.paidAmount || 0;
        
        const isPaid = item.installment.status === 'PAID';
        const isOverdue = item.installment.status === 'OVERDUE' || 
          (item.installment.status === 'PENDING' && dueDate < '2026-06-20');
        
        if (isPaid) {
          // Paid logic verified
        } else if (isOverdue) {
          overdueVal += (item.installment.total - item.installment.paidAmount);
          overdueCount++;
        } else {
          pending += (item.installment.total - item.installment.paidAmount);
        }
      }
    });

    return {
      totals,
      paid,
      pending: totals - paid - overdueVal,
      overdueVal,
      overdueCount
    };
  }, [allFlattenedInstallments, year, month]);

  // List of installments for the active selected calendar cell
  const selectedDateInstallments = useMemo(() => {
    return dateInstallmentsMap[selectedCalendarDate] || [];
  }, [dateInstallmentsMap, selectedCalendarDate]);

  // All installments for the current month for sidebar list scroll
  const currentMonthInstallmentsList = useMemo(() => {
    const list: FlattenedInstallment[] = [];
    allFlattenedInstallments.forEach(item => {
      const d = new Date(item.installment.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        list.push(item);
      }
    });

    // Sort by due date
    return list.sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate));
  }, [allFlattenedInstallments, year, month]);

  // Dynamic label helpers for colors
  const getBadgeStyle = (status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL', dueDate: string) => {
    const todayStr = '2026-06-20';
    const isOverdue = status === 'OVERDUE' || (status === 'PENDING' && dueDate < todayStr);
    
    if (status === 'PAID') {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
        dot: 'bg-emerald-500',
        label: 'បានបង់ប្រាក់ (Paid)'
      };
    } else if (isOverdue) {
      return {
        bg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
        dot: 'bg-rose-500',
        label: 'ហួសកំណត់ (Overdue)'
      };
    } else {
      return {
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
        dot: 'bg-amber-500',
        label: 'រង់ចាំការបង់ (Pending)'
      };
    }
  };

  const currentYearSelectorOptions = useMemo(() => {
    const options = [];
    for (let y = 2024; y <= 2028; y++) {
      options.push(y);
    }
    return options;
  }, []);

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="loan_calendar_view">
      
      {/* 1. Header with Breadcrumbs & Digital Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full font-bold tracking-wide uppercase inline-flex items-center gap-1.5 mb-2 shadow-xs">
            <CalendarIcon className="w-3 h-3" />
            <span>កាលវិភាគឥណទានទូទៅ</span>
          </span>
          <h1 className="text-xl md:text-2xl font-bold font-sans text-slate-900 flex items-center gap-2">
            <span>តារាងប្រតិទិនបង់ប្រាក់ឥណទាន</span>
            <span className="text-slate-400 font-normal">/ Installments Calendar Calendar</span>
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl mt-0.5">
            ពិនិត្យមើលកាលវិភាគបង់រំលស់ ការបង់ការប្រាក់ និងការបញ្ចាំប្រចាំខែ ដែលដល់កំណត់តាមថ្ងៃជាក់ស្ដែងលើប្រតិទិន ព្រមទាំងគ្រប់គ្រងការប្រមូលប្រាក់រហ័ស។
          </p>
        </div>

        {/* Quick Month Jump Select Options & Today */}
        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl shadow-xs self-start md:self-center">
          <select 
            value={month} 
            onChange={handleMonthChange}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {KHMER_MONTHS_FULL.map((mName, idx) => (
              <option key={idx} value={idx}>{mName}</option>
            ))}
          </select>

          <select 
            value={year} 
            onChange={handleYearChange}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {currentYearSelectorOptions.map(yNum => (
              <option key={yNum} value={yNum}>{yNum}</option>
            ))}
          </select>

          <button
            onClick={handleJumpToToday}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-xs cursor-pointer ${accent.bgPill}`}
          >
            ខែនេះ (June 2026)
          </button>
        </div>
      </div>

      {/* 2. Visual Metric Analytics Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Month Scheduled total card */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-xs">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-indigo-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">ត្រូវប្រមូលសរុប (Month Demand)</div>
            <div className="text-base font-black text-slate-950 font-mono mt-0.5">{formatUSD(monthStats.totals)}</div>
            <div className="text-[9px] text-indigo-600 font-semibold font-sans">≈ {formatKHR(monthStats.totals * EXCHANGE_RATE_USD_TO_KHR)}</div>
          </div>
        </div>

        {/* Month Collected card */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-xs">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-emerald-600 animate-pulse">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">ប្រមូលបានរួច (Paid Received)</div>
            <div className="text-base font-black text-emerald-600 font-mono mt-0.5">{formatUSD(monthStats.paid)}</div>
            <div className="text-[9px] text-emerald-500 font-semibold font-sans">
              ≈ {formatKHR(monthStats.paid * EXCHANGE_RATE_USD_TO_KHR)} 
              <span className="ml-1 text-[8px] bg-emerald-50 px-1 py-0.2 rounded font-bold border border-emerald-200">
                {monthStats.totals > 0 ? Math.round((monthStats.paid / monthStats.totals) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Month Pending card */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-xs">
          <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-xl text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">រង់ចាំបង់បន្ត (Est. Pending)</div>
            <div className="text-base font-black text-slate-900 font-mono mt-0.5">{formatUSD(monthStats.pending)}</div>
            <div className="text-[9px] text-slate-500 font-sans">≈ {formatKHR(monthStats.pending * EXCHANGE_RATE_USD_TO_KHR)}</div>
          </div>
        </div>

        {/* Month Overdue card */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-xs">
          <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl text-rose-500">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">យឺតយ៉ាវសរុប (Overdue Outstanding)</div>
            <div className="text-base font-black text-rose-600 font-mono mt-0.5">{formatUSD(monthStats.overdueVal)}</div>
            <div className="text-[9px] text-rose-500 font-sans font-bold">
              {monthStats.overdueCount} កាលវិភាគហួសពេលកំណត់
            </div>
          </div>
        </div>

      </div>

      {/* 3. Filter Utilities Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm text-xs font-semibold leading-relaxed">
        
        {/* Active Filters Selection */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <Filter className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>ចម្រោះទិន្នន័យ (Filters)៖</span>
          </div>

          {/* Status Tabs Pills */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[
              { id: 'ALL', kh: 'ទាំងអស់', color: 'none' },
              { id: 'PAID', kh: 'បង់រួច', color: 'bg-emerald-500' },
              { id: 'PENDING', kh: 'រង់ចាំ', color: 'bg-amber-500' },
              { id: 'OVERDUE', kh: 'ហួសកំណត់', color: 'bg-rose-500' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id as any)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  statusFilter === pill.id 
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-950'
                }`}
              >
                {pill.color !== 'none' && <span className={`w-1.5 h-1.5 rounded-full ${pill.color}`} />}
                <span>{pill.kh}</span>
              </button>
            ))}
          </div>

          {/* Type Selector Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg cursor-pointer focus:outline-hidden"
          >
            <option value="ALL">គ្រប់កិច្ចសន្យាទាំងអស់</option>
            <option value={LoanType.STANDARD}>កម្ចីទូទៅ (Standard)</option>
            <option value={LoanType.PAWN}>បញ្ចាំទ្រព្យ (Pawn)</option>
            <option value={LoanType.INSTALLMENT}>បង់រំលស់ (Installment)</option>
          </select>
        </div>

        {/* Search Search Box Input */}
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="ស្វែងរកឈ្មោះ ឬលេខកុងត្រា..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3.5 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 ml-1 text-slate-400 hover:text-slate-600 focus:outline-hidden text-xs"
            >
              ✕
            </button>
          )}
        </div>

      </div>

      {/* 4. Core Layout Panel (Main Grid left + Details Scroll Bar right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: THE MONTHLY GRID (col-span-12 or col-span-8) */}
        <div className="lg:col-span-8 flex flex-col bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative">
          
          {/* Calendar Controller Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            
            {/* Quick Title of visible month */}
            <div className="flex items-center gap-2">
              <CalendarDays className={`w-5 h-5 ${accent.text}`} />
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight uppercase">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  ប្រតិទិន ខែ {KHMER_MONTHS_FULL[month]} ឆ្នាំ {year}
                </span>
              </div>
            </div>

            {/* Stepper Month buttons */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
              <button 
                onClick={handlePrevMonth}
                className="p-1 px-2 hover:bg-white rounded-lg text-slate-500 hover:text-slate-900 transition-all cursor-pointer focus:outline-hidden"
                title="Previous Month"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <button 
                onClick={handleNextMonth}
                className="p-1 px-2 hover:bg-white rounded-lg text-slate-500 hover:text-slate-900 transition-all cursor-pointer focus:outline-hidden"
                title="Next Month"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>

          {/* Weekday headers layout */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-450 uppercase tracking-widest pb-2">
            {KHMER_WEEKDAYS.map(day => (
              <div 
                key={day.enShort} 
                className={`py-1 rounded-md ${day.isWeekend ? 'text-rose-500 bg-rose-50/20' : 'text-slate-500 bg-slate-50'}`}
              >
                <span className="block sm:hidden">{day.enShort}</span>
                <span className="hidden sm:block">{day.kh} ({day.enShort})</span>
              </div>
            ))}
          </div>

          {/* Calendar 42 Day Cells Layout */}
          <div className="grid grid-cols-7 gap-1 mt-1 flex-1 min-h-[460px]">
            {calendarCells.map((cell, idx) => {
              const dayInstallments = dateInstallmentsMap[cell.dateStr] || [];
              const hasInstallments = dayInstallments.length > 0;
              const isSelected = selectedCalendarDate === cell.dateStr;
              
              const isToday = cell.dateStr === '2026-06-20'; // Reference date simulation

              // Sort cell installments status priorities: Overdue first, Pending second, Paid third
              const sortedDayInstallments = [...dayInstallments].sort((a,b) => {
                const aOver = a.installment.status === 'PENDING' && a.installment.dueDate < '2026-06-20';
                const bOver = b.installment.status === 'PENDING' && b.installment.dueDate < '2026-06-20';
                if (aOver && !bOver) return -1;
                if (!aOver && bOver) return 1;
                if (a.installment.status === 'PENDING' && b.installment.status === 'PAID') return -1;
                return 0;
              });

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCalendarDate(cell.dateStr)}
                  className={`min-h-[75px] max-h-[110px] p-1.5 border rounded-xl flex flex-col justify-between transition-all select-none cursor-pointer hover:border-indigo-400 group relative ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-300'
                  } ${
                    isSelected 
                      ? 'border-indigo-600 ring-2 ring-indigo-600/10 shadow-sm' 
                      : 'border-slate-100'
                  } ${
                    isToday ? `bg-amber-50/30 border-2 ${accent.borderFocus}` : ''
                  }`}
                >
                  
                  {/* Day number cell card */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                      isToday 
                        ? `${accent.bg} text-white` 
                        : isSelected 
                        ? 'bg-slate-900 text-white' 
                        : cell.isCurrentMonth 
                        ? 'text-slate-800' 
                        : 'text-slate-350'
                    }`}>
                      {cell.dayNum}
                    </span>

                    {/* Today indicator label banner */}
                    {isToday && (
                      <span className="text-[7.5px] bg-red-500 text-white px-1 rounded-sm font-sans font-bold leading-normal uppercase">
                        Today
                      </span>
                    )}

                    {/* Small stats badges count */}
                    {hasInstallments && (
                      <span className="text-[8px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-full font-mono">
                        {dayInstallments.length}
                      </span>
                    )}
                  </div>

                  {/* Bullet badges listed in each day cell (max 3 for visual limits) */}
                  <div className="flex-1 flex flex-col justify-end space-y-0.8 mt-1 overflow-hidden">
                    {sortedDayInstallments.slice(0, 3).map((item, idIndex) => {
                      const badge = getBadgeStyle(item.installment.status, item.installment.dueDate);
                      const isMiniOverdue = item.installment.status === 'PENDING' && item.installment.dueDate < '2026-06-20';
                      
                      return (
                        <div 
                          key={idIndex}
                          className={`flex items-center justify-between text-[8px] font-semibold px-1 py-0.5 rounded-md border truncate leading-none ${badge.bg}`}
                          title={`${item.customerName}: $${item.installment.total.toLocaleString()}`}
                        >
                          <div className="flex items-center gap-0.8 truncate">
                            <span className={`w-1 h-1 rounded-full shrink-0 ${badge.dot}`} />
                            <span className="truncate max-w-[50px]">{item.customerName.split(' ')[0] || item.customerName}</span>
                          </div>
                          <span className="font-mono text-[7px]" style={{ color: isMiniOverdue ? 'red' : 'inherit' }}>
                            ${Math.round(item.installment.total)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Overflow dots count for too many schedules */}
                    {dayInstallments.length > 3 && (
                      <div className="text-[7px] text-indigo-600 text-center font-bold font-sans">
                        + {dayInstallments.length - 3} ទៀត...
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Quick instructions hints */}
          <div className="pt-4 border-t border-slate-100 mt-4 flex flex-wrap items-center justify-between gap-4 text-[10px] text-slate-450">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>បានបង់ប្រាក់រួច (Paid)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>រង់ចាំការបង់ (Pending)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>ហួសកំណត់ (Overdue/Unpaid before June 20)</span>
              </span>
            </div>
            
            <div className="italic text-slate-500 bg-indigo-50/40 px-2.5 py-1 rounded-lg border border-indigo-200/20">
              💡 ចំណាំ៖ ចុចលើប្រអប់ថ្ងៃជាក់លាក់ ដើម្បីពិនិត្យ ឬគ្រប់គ្រងការបង់ប្រាក់នៅផ្នែកខាងស្តាំ។
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE SELECTED DAY DETAILED PANEL */}
        <div className="lg:col-span-4 flex flex-col bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative min-h-[500px]">
          
          {/* Day selection visual header */}
          <div className="border-b border-slate-800 pb-4 mb-4 text-left">
            <div className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest block">កាលបរិច្ឆេទជ្រើសរើស (Selected Date)</div>
            <h3 className="text-yellow-400 font-bold m-0 font-sans text-sm mt-0.5">
              {formatKhmerDate(selectedCalendarDate) || selectedCalendarDate}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">Date ISO: {selectedCalendarDate}</p>
          </div>

          {/* Display active cell items list */}
          <div className="flex-1 flex flex-col justify-start">
            
            {/* If there are installments booked for this day */}
            {selectedDateInstallments.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>កាលវិភាគបង់ប្រាក់ ({selectedDateInstallments.length})</span>
                  <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.2 rounded-full font-mono">
                    ${selectedDateInstallments.reduce((sum, s) => sum + s.installment.total, 0).toLocaleString()} Due
                  </span>
                </div>

                {/* Listing elements */}
                {selectedDateInstallments.map((item, idx) => {
                  const bStyle = getBadgeStyle(item.installment.status, item.installment.dueDate);
                  const isOver = item.installment.status === 'PENDING' && item.installment.dueDate < '2026-06-20';
                  
                  return (
                    <div 
                      key={idx}
                      className="bg-slate-850 border border-slate-800 rounded-xl p-3.5 space-y-3.5 hover:bg-slate-800/80 transition-all hover:border-slate-700 hover:shadow-md relative overflow-hidden"
                    >
                      {/* Left side label strip decoration */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1 ${isOver ? 'bg-red-500' : item.installment.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                      {/* Header row details */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="space-y-0.5 text-left pl-1">
                          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">លេខកិច្ចសន្យា Contract ID</span>
                          <h4 className="font-mono text-[12px] font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{item.loanId}</span>
                          </h4>
                          
                          {/* Loan type badge label */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {item.loanType === LoanType.PAWN ? (
                              <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/10 px-1.5 py-0.2 rounded font-bold uppercase">Pawn (បញ្ចាំ)</span>
                            ) : item.loanType === LoanType.INSTALLMENT ? (
                              <span className="text-[8px] bg-sky-500/20 text-sky-400 border border-sky-500/10 px-1.5 py-0.2 rounded font-bold uppercase">Lease (រំលស់)</span>
                            ) : (
                              <span className="text-[8px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/10 px-1.5 py-0.2 rounded font-bold uppercase">Standard (កម្ចី)</span>
                            )}
                            <span className="text-[9px] text-slate-400 font-bold block">លើកទី៖ #{item.installment.id}</span>
                          </div>
                        </div>

                        {/* Status Label Pill */}
                        <span className={`text-[8.5px] px-2 py-1 rounded-full border font-bold ${bStyle.bg}`}>
                          {bStyle.label}
                        </span>
                      </div>

                      {/* Client Profiles info */}
                      <div className="space-y-1.5 text-xs text-slate-300 border-t border-b border-slate-800/80 py-2.5 text-left pl-1">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-bold text-white text-[12px]">{item.customerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="font-mono">{item.customerPhone}</span>
                        </div>
                      </div>

                      {/* Ledger calculations */}
                      <div className="grid grid-cols-3 gap-2 py-1 leading-normal font-mono text-[10px] text-left pl-1">
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-500 block uppercase font-sans">ប្រាក់ដើមមេ</span>
                          <span className="text-white font-bold">{formatUSD(item.installment.principal)}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-500 block uppercase font-sans">ការប្រាក់រួម</span>
                          <span className="text-amber-500 font-bold">+{formatUSD(item.installment.interest)}</span>
                        </div>
                        <div className="space-y-0.5 text-right pr-1">
                          <span className="text-[8px] text-slate-500 block uppercase font-sans">សរុបត្រូវបង់</span>
                          <span className="text-indigo-400 font-extrabold">{formatUSD(item.installment.total)}</span>
                        </div>
                      </div>

                      {/* Paid dates indicators if completed */}
                      {item.installment.status === 'PAID' && item.installment.paidDate && (
                        <div className="bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-lg flex items-center justify-between text-[10px] text-emerald-400 font-semibold pl-1">
                          <span className="font-sans">✓ ទូទាត់រួចនៅថ្ងៃ៖</span>
                          <span className="font-mono">{item.installment.paidDate}</span>
                        </div>
                      )}

                      {/* Overdue alert text */}
                      {isOver && (
                        <div className="bg-red-950/20 border border-red-900/30 p-2 rounded-lg text-[9px] text-red-400 leading-normal pl-1">
                          ⚠️ យឺតយ៉ាវការបង់ប្រាក់ចំនួន <b>{Math.ceil((new Date('2026-06-20').getTime() - new Date(item.installment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} ថ្ងៃ</b>។ សូមទំនាក់ទំនងអតិថិជនដើម្បីសួរនាំ។
                        </div>
                      )}

                      {/* Dynamic CTA button */}
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            // Select contract in main view
                            onNavigate('loans', { loanId: item.loanId });
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-97 cursor-pointer"
                        >
                          <span>គ្រប់គ្រងធនដែន / View & Collect</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              // Empty selection feedback
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                <div className="p-3.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-500">
                  <CalendarDays className="w-8 h-8 rotate-3" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-slate-350 font-bold text-xs">គ្មានកាលវិភាគត្រូវបង់ប្រាក់ទេ</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs px-2">
                    មិនមានកាលវិភាគបង់រំលស់ ឬបង់ការប្រាក់ណាមួយដែលបានកំណត់នៅថ្ងៃនេះឡើយ។ អ្នកអាចជ្រើសរើសថ្ងៃផ្សេងទៀតនៅលើប្រតិទិន។
                  </p>
                </div>
              </div>
            )}
            
            {/* Divider */}
            <div className="border-t border-slate-800 my-4" />

            {/* Quick summary of all month's lists */}
            <div className="space-y-2.5 text-left">
              <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-widest block">បញ្ជីការបង់រំលស់ក្នុងខែនេះ (This Month List)</span>
              
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 text-[11px] leading-relaxed">
                {currentMonthInstallmentsList.slice(0, 10).map((inst, index) => {
                  const todayStr = '2026-06-20';
                  const isOver = inst.installment.status === 'PENDING' && inst.installment.dueDate < todayStr;
                  const isPaid = inst.installment.status === 'PAID';
                  
                  return (
                    <div 
                      key={index} 
                      onClick={() => {
                        setSelectedCalendarDate(inst.installment.dueDate);
                        // Optional scroll to day
                      }}
                      className={`p-2 rounded-lg flex items-center justify-between border cursor-pointer hover:bg-slate-800 transition-all ${
                        selectedCalendarDate === inst.installment.dueDate 
                          ? 'border-yellow-500 bg-slate-800/50' 
                          : 'border-slate-850 bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPaid ? 'bg-emerald-500' : isOver ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className="text-slate-400 font-mono text-[9px] shrink-0">{inst.installment.dueDate.substring(5)}</span>
                        <span className="font-bold text-white truncate max-w-[80px]">{inst.customerName}</span>
                      </div>
                      <span className="font-mono font-bold text-yellow-500">${inst.installment.total.toLocaleString()}</span>
                    </div>
                  );
                })}

                {currentMonthInstallmentsList.length === 0 && (
                  <div className="text-slate-500 text-center py-4 text-[10px] italic">
                    គ្មានបញ្ជីកាលវិភាគបង់ក្នុងខែនេះឡើយ។
                  </div>
                )}

                {currentMonthInstallmentsList.length > 10 && (
                  <div className="text-[9.5px] text-slate-450 text-center font-semibold pt-1">
                    នៅមានកាលវិភាគចំនួន {currentMonthInstallmentsList.length - 10} ទៀត...
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer branding details */}
          <div className="border-t border-slate-850 pt-3.5 mt-auto flex items-center justify-between text-[9px] text-slate-500">
            <span>&copy; V4U Calendar Suite </span>
            <span className="font-mono">VERIFIED DATA</span>
          </div>

        </div>

      </div>

    </div>
  );
}
