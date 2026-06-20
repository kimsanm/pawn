/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Customer, Loan, Transaction } from '../types';
import { Download, Upload, Trash2, Database, ShieldAlert, Sparkles, RefreshCcw, FileSpreadsheet } from 'lucide-react';

interface BackupRestoreProps {
  customers: Customer[];
  loans: Loan[];
  transactions: Transaction[];
  onImportData: (data: { customers: Customer[]; loans: Loan[]; transactions: Transaction[] }) => void;
  onLoadSample: () => void;
  onResetAll: () => void;
}

interface AutoBackupItem {
  key: string;
  dateStr: string;
  timestamp: string;
  customerCount: number;
  loanCount: number;
  transactionCount: number;
}

export default function BackupRestore({ customers, loans, transactions, onImportData, onLoadSample, onResetAll }: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoBackups, setAutoBackups] = useState<AutoBackupItem[]>([]);

  const loadAutoBackups = () => {
    const list: AutoBackupItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pawnshop_backup_')) {
        try {
          const valStr = localStorage.getItem(key);
          if (valStr) {
            const parsed = JSON.parse(valStr);
            const db = parsed.database || parsed;
            if (db && db.customers && db.loans && db.transactions) {
              const datePart = key.replace('pawnshop_backup_', '');
              list.push({
                key,
                dateStr: datePart,
                timestamp: parsed.timestamp || datePart,
                customerCount: db.customers.length || 0,
                loanCount: db.loans.length || 0,
                transactionCount: db.transactions.length || 0
              });
            }
          }
        } catch (e) {
          // ignore corrupted keys
        }
      }
    }
    setAutoBackups(list.sort((a, b) => b.dateStr.localeCompare(a.dateStr)));
  };

  useEffect(() => {
    loadAutoBackups();
  }, [customers, loans, transactions]);

  const handleCreateManualBackup = () => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const key = `pawnshop_backup_${todayStr}`;
    
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        customers,
        loans,
        transactions
      }
    };
    
    localStorage.setItem(key, JSON.stringify(backupData));
    localStorage.setItem('pawnshop_last_auto_backup_date', todayStr);
    setSuccessMessage(`បានបង្កើតច្បាប់ចម្លងសម្រាប់ថ្ងៃទី ${todayStr} ជោគជ័យ!`);
    setTimeout(() => setSuccessMessage(null), 4000);
    loadAutoBackups();
  };

  const handleRestoreAutoBackup = (item: AutoBackupItem) => {
    if (confirm(`⚠️ តើអ្នកពិតជាចង់ស្តារទិន្នន័យពីថ្ងៃទី ${item.dateStr} ឡើងវិញមែនទេ? រាល់ទិន្នន័យបច្ចុប្បន្ននឹងត្រូវជាន់ពីលើ។`)) {
      try {
        const valStr = localStorage.getItem(item.key);
        if (valStr) {
          const parsed = JSON.parse(valStr);
          const db = parsed.database || parsed;
          if (db && db.customers && db.loans && db.transactions) {
            onImportData({
              customers: db.customers,
              loans: db.loans,
              transactions: db.transactions
            });
            setSuccessMessage(`បានស្តារទិន្នន័យពីថ្ងៃទី ${item.dateStr} ដោយជោគជ័យ!`);
            setTimeout(() => setSuccessMessage(null), 4000);
          }
        }
      } catch (e) {
        alert('ការស្តារទិន្នន័យបរាជ័យ!');
      }
    }
  };

  const handleDeleteAutoBackup = (item: AutoBackupItem) => {
    if (confirm(`តើអ្នកពិតជាចង់លុបច្បាប់ចម្លងថ្ងៃទី ${item.dateStr} នេះមែនទេ?`)) {
      localStorage.removeItem(item.key);
      setSuccessMessage('បានលុបច្បាប់ចម្លងជាជោគជ័យ!');
      setTimeout(() => setSuccessMessage(null), 3000);
      loadAutoBackups();
    }
  };

  // Export database as JSON download
  const handleExportDB = () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      database: {
        customers,
        loans,
        transactions
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pawnshop_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessMessage('ការនាំចេញទិន្នន័យ (Backup JSON) បានសម្រេចដោយជោគជ័យ!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Export transactions history as CSV
  const handleExportTransactionsCSV = () => {
    if (transactions.length === 0) {
      alert('គ្មានទិន្នន័យប្រតិបត្តិការដើម្បីនាំចេញទេ! (No transaction history to export)');
      return;
    }

    const escapeCSV = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const csvRows: string[] = [];

    // Headers with bilingual format
    const headers = [
      "Receipt ID (លេខវិក្កយបត្រ)",
      "Contract ID (លេខកិច្ចសន្យា)",
      "Customer Name (ឈ្មោះអតិថិជន)",
      "Payment Date (ថ្ងៃទទួលប្រាក់)",
      "Installment No (លើកទី)",
      "Principal Paid (ប្រាក់ដើមបានបង់ $)",
      "Interest Paid (ការប្រាក់បានបង់ $)",
      "Penalty Fee (ផាកពិន័យ/យឺតយ៉ាវ $)",
      "Total Amount (សរុបប្រាក់បានទទួល $)",
      "Payment Method (វិធីសាស្រ្តទូទាត់)",
      "Receiver (អ្នកទទួលប្រាក់)",
      "Notes (ចំណាំ)"
    ];
    csvRows.push(headers.map(escapeCSV).join(","));

    // Population of transactions
    transactions.forEach(tx => {
      const row = [
        tx.id,
        tx.loanId,
        tx.customerName,
        tx.date,
        tx.scheduleId,
        tx.paidPrincipal,
        tx.paidInterest,
        tx.penaltyFee,
        tx.totalAmount,
        tx.paymentMethod,
        tx.receiver,
        tx.notes || ""
      ];
      csvRows.push(row.map(escapeCSV).join(","));
    });

    const BOM = "\uFEFF";
    const csvContent = BOM + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pawnshop_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessMessage('ការនាំចេញប្រវត្តិប្រតិបត្តិការជាឯកសារ CSV បានសម្រេចដោយជោគជ័យ!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Import database handler
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.database && parsed.database.customers && parsed.database.loans && parsed.database.transactions) {
          onImportData({
            customers: parsed.database.customers,
            loans: parsed.database.loans,
            transactions: parsed.database.transactions
          });
          setSuccessMessage('ការបញ្ចូលទិន្នន័យពីឯកសារ JSON បានសម្រេចដោយជោគជ័យ!');
          setTimeout(() => setSuccessMessage(null), 4000);
        } else {
          alert('ទម្រង់ឯកសារ JSON មិនត្រឹមត្រូវទេ! សូមពិនិត្យឯកសារឡើងវិញ។');
        }
      } catch (e) {
        alert('ការអានឯកសារបរាជ័យ! សូមប្រាកដថាឯកសារនេះគឺស្តង់ដារ JSON។');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  // Drag-and-drop support
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerResetAll = () => {
    if (confirm('⚠️ ប្រុងប្រយ័ត្ន៖ តើអ្នកពិតជាចង់លុបទិន្នន័យទាំងអស់ពីប្រព័ន្ធមែនទេ? រាល់ព័ត៌មានអតិថិជន កិច្ចសន្យា និងវិក្កយបត្រនឹងត្រូវបាត់បង់ទាំងស្រុងពីម៉ាស៊ីននេះមិនអាចស្តារឡើងវិញបានឡើយ!')) {
      onResetAll();
      setSuccessMessage('ប្រព័ន្ធទាំងមូលត្រូវបានលុប និងដំឡើងស្អាតឡើងវិញ!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const triggerLoadSample = () => {
    if (confirm('តើអ្នកចង់ទាញយកទិន្នន័យគំរូជនជាតិខ្មែរ (៥នាក់ និងកិច្ចសន្យាសកម្ម) មករួមបញ្ចូលក្នុងប្រព័ន្ធសម្រាប់សាកល្បងមែនទេ? ទិន្នន័យចាស់នឹងត្រូវជាន់ពីលើ។')) {
      onLoadSample();
      setSuccessMessage('ទិន្នន័យគំរូត្រូវបានទាញយក និងដំឡើងដោយជោគជ័យ!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="database_backup_view">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight moul-heading text-slate-900">
          ការគ្រប់គ្រង និងថែទាំទិន្នន័យ (Database & Diagnostics)
        </h2>
        <p className="text-xs text-slate-500">ការធ្វើជាម្ចាស់លើទិន្នន័យ៖ នាំចេញទិន្នន័យ (Backups) រក្សាទុក នាំចូលឡើងវិញ ឬទាញយកទិន្នន័យគំរូមកសាកល្បង។</p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn shadow-xs">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Card: Database Status & Operations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            ស្ថានភាពទិន្នន័យឧបករណ៍ (Client-Side Storage Ledger)
          </h3>

          {/* Database counts table details */}
          <div className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            <div className="flex justify-between py-3">
              <span className="text-slate-500">ចំនួនអតិថិជនបានចុះឈ្មោះ៖</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{customers.length} នាក់</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-slate-500">ចំនួនកិច្ចសន្យាសរុប (កម្ចី/បញ្ចាំ/រំលស់)៖</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{loans.length} ក្បាល</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-slate-500 font-bold">ចំនួនវិក្កយបត្រទទួលប្រាក់សរុប៖</span>
              <span className="font-bold text-indigo-600 font-mono text-sm">{transactions.length} ច្បាប់</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">សកម្មភាពរហ័ស</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Load Sample Data */}
              <button
                onClick={triggerLoadSample}
                className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 text-xs flex flex-col items-center justify-center gap-2 text-center transition-all group font-bold"
              >
                <RefreshCcw className="w-5 h-5 text-indigo-500 group-hover:rotate-12 transition-transform" />
                <span>បញ្ចូលទិន្នន័យគំរូសាកល្បង</span>
                <span className="font-normal text-[9.5px] text-slate-400 mt-0.5">Loads Cambodian sample cases</span>
              </button>

              {/* Reset Everything */}
              <button
                onClick={triggerResetAll}
                className="p-4 rounded-xl border border-red-100 bg-red-50/40 hover:bg-red-50 text-red-700 text-xs flex flex-col items-center justify-center gap-2 text-center transition-all group font-bold"
              >
                <Trash2 className="w-5 h-5 text-red-500 group-hover:scale-105 transition-transform" />
                <span>លុបទិន្នន័យទាំងអស់</span>
                <span className="font-normal text-[9.5px] text-slate-400 mt-0.5">Wipe clean slate (Warning!)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Upload & Download Operations */}
        <div className="space-y-6">
          
          {/* Export JSON Download card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <Download className="w-4.5 h-4.5 text-emerald-500" />
              នាំចេញទិន្នន័យ (Database Backup Export)
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              រក្សាទុកច្បាប់ចម្លងនៃមូលទិន្នន័យរបស់អ្នកទៅកាន់កុំព្យូទ័រជាឯកសារ JSON។ អ្នកអាចប្រើប្រាស់ឯកសារនេះដើម្បីផ្ទេរទៅឧបករណ៍ផ្សេងទៀត ឬរក្សាទុកប្រចាំសប្តាហ៍ដើម្បីការពារហានិភ័យពីការបាត់បង់ទិន្នន័យដោយចៃដន្យ។
            </p>
            <button
              onClick={handleExportDB}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer mt-2"
            >
              <Download className="w-4 h-4 text-emerald-400" /> <b>នាំចេញជាឯកសារ JSON BACKUP</b>
            </button>
          </div>

          {/* Export Transactions CSV (Accounting) Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4" id="export_csv_accounting_card">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-500" />
              នាំចេញប្រវត្តិប្រតិបត្តិការជា CSV (Export Accounting CSV)
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              ទាញយកបញ្ជីប្រវត្តិប្រតិបត្តិការទទួលប្រាក់ទាំងអស់ជាទម្រង់ CSV (Excel) សម្រាប់ការវិភាគក្រៅប្រព័ន្ធ ឬធ្វើសេចក្តីរាយការណ៍គណនេយ្យបន្ទាប់បន្សំ។ ទទួលបានការបំបែកធាតុចំណូលការប្រាក់ និងប្រាក់ដើម។
            </p>
            <button
              onClick={handleExportTransactionsCSV}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer mt-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" /> <b>នាំចេញជាឯកសារ CSV (EXCEL)</b>
            </button>
          </div>

          {/* Import JSON Upload trigger Card */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`bg-white rounded-2xl border-2 border-dashed p-6 text-center space-y-4 transition-all relative cursor-pointer ${
              dragActive ? 'border-indigo-650 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />

            <Upload className="w-8 h-8 text-indigo-500 mx-auto opacity-75" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-xs">នាំចូលទិន្នន័យមកវិញ (Restore Backup JSON)</h4>
              <p className="text-[10px] text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
                ចុចទីនេះ ឬអូសទម្លាក់ឯកសារ `.json` ធ្លាប់ដែលបាននាំចេញ (Backup) ដើម្បីដំឡើងទិន្នន័យឡើងវិញភ្លាមៗ។
              </p>
            </div>
            
            <span className="inline-block text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold px-2.5 py-1 rounded-sm uppercase tracking-wide">
              ជ្រើសរើសឯកសារដំឡើង
            </span>
          </div>

          {/* Secure details disclaimer alert box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-yellow-500/20 flex gap-2.5 text-xs text-yellow-800 font-semibold leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>សេចក្តីជូនដំណឹងការពារសន្តិសុខគ្រួសារ (Device Storage notice):</span>
              <p className="text-[11px] text-slate-600 font-medium">
                ប្រព័ន្ធនេះដំណើរការលឿន និងរក្សាទុកទិន្នន័យទាំងស្រុងនៅក្នុង Local Storage នៃកម្មវិធីរុករក (Browser) របស់លោកអ្នក។ ការសម្អាតម៉ាស៊ីន (Clear Browsing Cache/History) អាចលុបចោលទិន្នន័យនេះបាន។ ហេតុនេះសូមលោកអ្នកចងចាំនាំចេញទិន្នន័យចម្លង (Backup JSON) ជាប្រចាំរៀងរាល់ល្ងាច!
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Section 3: Browser Backups Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5" id="auto_backups_list_section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="space-y-1 text-left">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              <span>ច្បាប់ចម្លងប្រព័ន្ធស្វ័យប្រវត្តក្នុងឧបករណ៍ (Automated Browser Backups)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              បញ្ជីច្បាប់ចម្លងទិន្នន័យដែលបានរក្សាទុកក្នុងម៉ាស៊ីននេះដោយប្រើសោ Timestamp ស្វ័យប្រវត្ត។
            </p>
          </div>
          
          <button
            onClick={handleCreateManualBackup}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer shrink-0"
          >
            <Database className="w-4 h-4 text-indigo-300" />
            <span>បង្កើតច្បាប់ចម្លងបច្ចុប្បន្ន (Backup Now)</span>
          </button>
        </div>

        {autoBackups.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <Database className="w-8 h-8 text-slate-350 mx-auto" />
            <p className="font-bold text-xs text-slate-500">មិនទាន់មានច្បាប់ចម្លងស្វ័យប្រវត្តនៅឡើយទេ! (No backups recorded)</p>
            <p className="text-[10px] text-slate-400">ប្រព័ន្ធនឹងរក្សាទុកច្បាប់ចម្លងរៀងរាល់ថ្ងៃនៅពេលមានការប្រើប្រាស់ ឬពេលអ្នកចុចរក្សាទុកខាងលើ។</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold">
                  <th className="py-3 px-4 font-bold text-left">កាលបរិច្ឆេទចម្លង (Backup Date)</th>
                  <th className="py-3 px-4 font-bold text-center">អតិថិជន (Clients)</th>
                  <th className="py-3 px-4 font-bold text-center">កិច្ចសន្យា (Contracts)</th>
                  <th className="py-3 px-4 font-bold text-center">វិក្កយបត្រ (Invoices)</th>
                  <th className="py-3 px-4 font-bold text-right">សកម្មភាព (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {autoBackups.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-left">
                      <div className="font-bold text-slate-900 font-mono">{item.dateStr}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-light">
                        {new Date(item.timestamp).toLocaleTimeString('kh-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">{item.customerCount} នាក់</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">{item.loanCount} ក្បាល</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">{item.transactionCount} ច្បាប់</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2.5 text-right w-full">
                        <button
                          onClick={() => handleRestoreAutoBackup(item)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-all font-bold text-[11px] active:scale-97 cursor-pointer"
                        >
                          ស្តារឡើងវិញ (Restore)
                        </button>
                        <button
                          onClick={() => handleDeleteAutoBackup(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100/50 transition-all cursor-pointer"
                          title="លុបច្បាប់ចម្លងនេះ"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
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
