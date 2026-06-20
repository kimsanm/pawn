/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Customer, Loan, Transaction } from '../types';
import { Download, Upload, Trash2, Database, ShieldAlert, Sparkles, RefreshCcw } from 'lucide-react';

interface BackupRestoreProps {
  customers: Customer[];
  loans: Loan[];
  transactions: Transaction[];
  onImportData: (data: { customers: Customer[]; loans: Loan[]; transactions: Transaction[] }) => void;
  onLoadSample: () => void;
  onResetAll: () => void;
}

export default function BackupRestore({ customers, loans, transactions, onImportData, onLoadSample, onResetAll }: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
              className="w-full py-2.5 bg-slate-900 hover:bg-indigo-950 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md mt-2"
            >
              <Download className="w-4 h-4 text-emerald-400" /> <b>នាំចេញជាឯកសារ JSON BACKUP</b>
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
    </div>
  );
}
