/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PawnshopSettings, PaymentTerm } from '../types';
import { 
  Building, 
  Coins, 
  Percent, 
  Calendar, 
  Palette, 
  Languages, 
  Save, 
  RotateCcw, 
  Info, 
  Check, 
  ShieldAlert,
  Smartphone,
  MapPin
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsProps {
  settings: PawnshopSettings;
  onSaveSettings: (newSettings: PawnshopSettings) => void;
  onResetSettings: () => void;
}

export default function Settings({ settings, onSaveSettings, onResetSettings }: SettingsProps) {
  const [formState, setFormState] = useState<PawnshopSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Available theme color options
  const themeColors = [
    { label: 'ពណ៌លឿងមាស (Gold)', value: 'yellow', class: 'bg-yellow-500 ring-yellow-400' },
    { label: 'ពណ៌ខៀវខ្មៅ (Indigo)', value: 'indigo', class: 'bg-indigo-600 ring-indigo-500' },
    { label: 'ពណ៌បៃតងខ្ចី (Emerald)', value: 'emerald', class: 'bg-emerald-500 ring-emerald-400' },
    { label: 'ពណ៌ស្វាយ (Violet)', value: 'violet', class: 'bg-violet-600 ring-violet-500' },
    { label: 'ពណ៌ផ្កាឈូក (Rose)', value: 'rose', class: 'bg-rose-500 ring-rose-300' },
    { label: 'ពណ៌ប្រផេះត្បូង (Slate)', value: 'slate', class: 'bg-slate-700 ring-slate-500' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('តើអ្នកពិតជាចង់កំណត់ការកំណត់ប្រព័ន្ធឡើងវិញមែនទេ?')) {
      onResetSettings();
      // Since reset is async via App.tsx state, force setting current state fields
      setTimeout(() => {
        const localSettings = localStorage.getItem('pawnshop_settings');
        if (localSettings) {
          setFormState(JSON.parse(localSettings));
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-8" id="settings_panel">
      {/* Settings Header */}
      <div className="bg-gradient-to-r from-slate-940 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-400 via-indigo-500 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3.5xl font-bold tracking-tight moul-heading text-yellow-500 leading-relaxed">
              ការកំណត់ប្រព័ន្ធទាំងមូល (System Settings)
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl font-light font-sans">
              គ្រប់គ្រងព័ត៌មានយីហោអាជីវកម្ម កំណត់អត្រាការប្រាក់លំនាំដើម ថ្លៃសេវារដ្ឋបាល និងរចនាបថពណ៌របស់ប្រព័ន្ធ។
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3.5 shadow-xs"
        >
          <div className="p-1 rounded-full bg-emerald-500 text-white">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">រក្សាទុកដោយជោគជ័យ! (Saved Successfully)</p>
            <p className="text-xs text-emerald-600 mt-0.5">ការកំណត់ថ្មីត្រូវបានអនុវត្តទៅលើប្រព័ន្ធទាំងមូលភ្លាមៗ។</p>
          </div>
        </motion.div>
      )}

      {/* Main Settings Forms Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Double Columns: Settings configurations */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Business Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5" id="business_settings_card">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-indigo-600" />
              <span>ព័ត៌មានអាជីវកម្ម និងយីហោ (Business Brand Profile)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-800">
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="font-bold text-slate-700 block">ឈ្មោះហាង / អាជីវកម្ម (Business Name) *</label>
                <input 
                  type="text" 
                  value={formState.businessName}
                  onChange={(e) => setFormState({ ...formState, businessName: e.target.value })}
                  placeholder="ឧ. ហាងបញ្ចាំ វីផត គ្រុប" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:bg-white outline-hidden font-semibold transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="font-bold text-slate-700 block">ពាក្យស្លោក/យីហោ (Slogan/Shorthand Brand)</label>
                <input 
                  type="text" 
                  value={formState.businessSlogan}
                  onChange={(e) => setFormState({ ...formState, businessSlogan: e.target.value })}
                  placeholder="ឧ. កម្ចី បញ្ចាំ និងបង់រំលស់គ្រប់ប្រភេទ" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:bg-white outline-hidden font-semibold transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-slate-400" /> លេខទូរស័ព្ទអាជីវកម្ម (Phone Number)
                </label>
                <input 
                  type="text" 
                  value={formState.businessPhone}
                  onChange={(e) => setFormState({ ...formState, businessPhone: e.target.value })}
                  placeholder="ឧ. 012 345 678 / 098 765 432" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:bg-white outline-hidden font-semibold transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" /> អាសយដ្ឋានការិយាល័យ (Address)
                </label>
                <input 
                  type="text" 
                  value={formState.businessAddress}
                  onChange={(e) => setFormState({ ...formState, businessAddress: e.target.value })}
                  placeholder="ឧ. ផ្លូវលេខ ២៧១, សង្កាត់បឹងសាឡាង, ភ្នំពេញ" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:bg-white outline-hidden font-semibold transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial Defaults */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5" id="financial_settings_card">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Coins className="w-5 h-5 text-indigo-600" />
              <span>ការកំណត់អត្រាហិរញ្ញវត្ថុលំនាំដើម (Default Credit & Financial Terms)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-800">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-slate-400" /> អត្រាការប្រាក់ទូទៅប្រចាំខែ (Monthly Interest Rate %)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    value={formState.defaultInterestRate}
                    onChange={(e) => setFormState({ ...formState, defaultInterestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:bg-white outline-hidden font-mono font-semibold transition-all text-slate-900"
                  />
                  <span className="absolute right-4 top-3.5 font-bold text-slate-400">% / ​ខែ</span>
                </div>
                <p className="text-[10px] text-slate-400">អត្រាការប្រាក់លំនាំដើមពេលបង្កើតកិច្ចសន្យាថ្មី (កម្ចី ឬបញ្ចាំ)</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-slate-400" /> កម្រៃសេវារដ្ឋបាលលំនាំដើម (Default Admin Fee $)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 font-mono font-bold text-slate-400">$</span>
                  <input 
                    type="number" 
                    step="1"
                    value={formState.defaultAdminFee}
                    onChange={(e) => setFormState({ ...formState, defaultAdminFee: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:bg-white outline-hidden font-mono font-semibold transition-all text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-400">កម្រៃរៀបចំឯកសារ ឬថ្លៃសេវារៀបចំកិច្ចសន្យាដំបូង</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-slate-500 animate-pulse" /> អត្រាពិន័យយឺតយ៉ាវប្រចាំថ្ងៃ (Daily Overdue Penalty $)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 font-mono font-bold text-slate-400">$</span>
                  <input 
                    type="number" 
                    step="0.10"
                    value={formState.defaultPenaltyRate}
                    onChange={(e) => setFormState({ ...formState, defaultPenaltyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:bg-white outline-hidden font-mono font-semibold transition-all text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-400">ប្រាក់ផាកពិន័យក្នុង០១ថ្ងៃ ចំពោះការបង់ប្រាក់យឺតជាងកាលវិភាគ</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" /> ភិនភាគបង់ប្រាក់លំនាំដើម (Installment Frequency)
                </label>
                <select 
                  value={formState.defaultPaymentTerm}
                  onChange={(e) => setFormState({ ...formState, defaultPaymentTerm: e.target.value as PaymentTerm })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:bg-white outline-hidden font-semibold transition-all text-slate-900"
                >
                  <option value={PaymentTerm.MONTHLY}>រៀងរាល់ខែ (Monthly Repayment)</option>
                  <option value={PaymentTerm.WEEKLY}>រៀងរាល់សប្តាហ៍ (Weekly Repayment)</option>
                  <option value={PaymentTerm.DAILY}>រៀងរាល់ថ្ងៃ (Daily Repayment)</option>
                </select>
                <p className="text-[10px] text-slate-400">កាលកំណត់សងដែលជ្រើសរើសដោយស្វ័យប្រវត្តក្នុងទំព័របង្កើតថ្មី</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Style customization, Save options */}
        <div className="space-y-8">
          
          {/* Section 3: Color Style and Brand Personality */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5" id="system_theme_settings_card">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Palette className="w-5 h-5 text-violet-600" />
              <span>រចនាបថពណ៌ Accent প্রป័ន្ធ (Theme Accent)</span>
            </h3>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 leading-normal">
                ជ្រើសរើសពណ៌ចម្បងដែលចង់ឱ្យបង្ហាញនៅក្នុងប្រព័ន្ធទាំងមូល (ឧ. ប៊ូតុង រង្វង់ ស្លាកសញ្ញាផ្សេងៗ)៖
              </p>

              <div className="grid grid-cols-2 gap-3.5 text-xs text-slate-800">
                {themeColors.map((color) => {
                  const isSelected = formState.accentColor === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormState({ ...formState, accentColor: color.value })}
                      className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                        isSelected 
                          ? 'border-slate-900 bg-slate-50 font-bold ring-2 ring-slate-950/5' 
                          : 'border-slate-100 hover:bg-slate-50/50'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${color.class} ${isSelected ? 'ring-2' : ''}`}></span>
                      <span className="text-[11px] truncate">{color.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-slate-400" /> ភាសាបង្ហាញ (Language)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, language: 'kh' })}
                  className={`py-2 px-3 rounded-xl border transition-all text-center font-semibold ${
                    formState.language === 'kh' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  ភាសាខ្មែរ (Khmer)
                </button>
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, language: 'en' })}
                  className={`py-2 px-3 rounded-xl border transition-all text-center font-semibold ${
                    formState.language === 'en' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Actions Hub */}
          <div className="bg-slate-900 rounded-2xl text-white shadow-xl p-6 space-y-5" id="settings_actions_card">
            <h3 className="font-bold text-yellow-400 text-sm flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Info className="w-4 h-4 text-yellow-400" />
              <span>រក្សាទុក និងកំណត់ឡើងវិញ (Save Choices)</span>
            </h3>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              រាល់ការផ្លាស់ប្តូរការកំណត់ហិរញ្ញវត្ថុនឹងត្រូវបានអនុវត្តទៅលើកិច្ចសន្យាថ្មីៗដែលនឹងត្រូវបង្កើតបន្ទាប់ពីនេះ។ អ្នកអាចផ្លាស់ប្តូរវាម្តងទៀតនៅពេលណាក៏បាន។
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-yellow-500/15 flex items-center justify-center gap-2.5 active:scale-98 transition-all text-xs"
              >
                <Save className="w-4 h-4" />
                <span>រក្សាទុកការកំណត់ប្រព័ន្ធ (Save & Apply Settings)</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-300 hover:text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 active:scale-98 transition-all text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>កំណត់ការកំណត់លំនាំដើមឡើងវិញ</span>
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
