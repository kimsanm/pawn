/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PawnshopSettings } from '../types';
import { Coins, Lock, KeyRound, ArrowRight, ShieldCheck, Phone, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  settings: PawnshopSettings;
  onVerify: () => void;
}

export default function LoginScreen({ settings, onVerify }: LoginScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Dynamic system style accent color
  const accent = settings.accentColor === 'indigo' ? {
    text: 'text-indigo-500', bg: 'bg-indigo-600 hover:bg-indigo-700 bg-indigo-500/10 border-indigo-500/20', focusRef: 'focus:ring-indigo-500/20 focus:border-indigo-500'
  } : settings.accentColor === 'emerald' ? {
    text: 'text-emerald-500', bg: 'bg-emerald-600 hover:bg-emerald-700 bg-emerald-500/10 border-emerald-500/20', focusRef: 'focus:ring-emerald-500/20 focus:border-emerald-500'
  } : settings.accentColor === 'violet' ? {
    text: 'text-violet-600', bg: 'bg-violet-600 hover:bg-violet-700 bg-violet-600/10 border-violet-500/20', focusRef: 'focus:ring-violet-500/20 focus:border-violet-500'
  } : settings.accentColor === 'rose' ? {
    text: 'text-rose-500', bg: 'bg-rose-500 hover:bg-rose-600 bg-rose-500/10 border-rose-500/20', focusRef: 'focus:ring-rose-500/20 focus:border-rose-500'
  } : settings.accentColor === 'slate' ? {
    text: 'text-slate-400', bg: 'bg-slate-750 hover:bg-slate-800 bg-slate-750/10 border-slate-500/20', focusRef: 'focus:ring-slate-500/20 focus:border-slate-500'
  } : {
    text: 'text-yellow-500', bg: 'bg-yellow-500 hover:bg-yellow-400 bg-yellow-400/10 border-yellow-500/20', focusRef: 'focus:ring-yellow-500/20 focus:border-yellow-500'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedInput = passcode.trim();
    const correctPasscode = (settings.appPasscode || '1234').trim();

    if (trimmedInput === correctPasscode) {
      setIsSuccess(true);
      setTimeout(() => {
        onVerify();
      }, 750);
    } else {
      setErrorMsg('លេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ! (Incorrect passcode)');
      // Shake code feedback
      setPasscode('');
    }
  };

  const handleNumClick = (num: string) => {
    setErrorMsg('');
    if (passcode.length < 12) {
      setPasscode(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPasscode('');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute right-[-20%] top-[-20%] w-[60%] h-[60%] opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-purple-500 to-transparent pointer-events-none rounded-full blur-3xl"></div>
      <div className="absolute left-[-20%] bottom-[-20%] w-[60%] h-[60%] opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500 via-amber-500 to-transparent pointer-events-none rounded-full blur-3xl"></div>

      {/* Main Lock container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl space-y-6 relative"
      >
        {/* Branding header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
            <Coins className={`w-8 h-8 ${accent.text}`} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold font-mono text-white tracking-wide uppercase">
              {settings.businessName}
            </h1>
            <p className="text-[10px] text-slate-400 font-sans tracking-wide">
              {settings.businessSlogan || 'ប្រព័ន្ធគ្រប់គ្រងហាងបញ្ចាំជំនាន់ថ្មី'}
            </p>
          </div>
        </div>

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-center">
            <label className="text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>សូមបញ្ចូលលេខកូដចូលប្រើប្រាស់ (Enter Passcode)</span>
            </label>
            <div className="relative max-w-xs mx-auto pt-2">
              <div className="flex justify-center gap-3 py-2">
                {/* Visual dots feedback */}
                {Array.from({ length: Math.max(tokensCount(settings.appPasscode), 4) }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      i < passcode.length 
                        ? 'bg-yellow-500 border-yellow-400 scale-110 shadow-xs shadow-yellow-500/20' 
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  ></div>
                ))}
              </div>
              <input 
                type="password"
                value={passcode}
                onChange={(e) => {
                  setErrorMsg('');
                  setPasscode(e.target.value);
                }}
                placeholder="••••••"
                className="sr-only" // hidden input, focus handled
                autoFocus
              />
            </div>
          </div>

          {errorMsg && (
            <motion.p 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: [10, -10, 5, -5, 0], opacity: 1 }}
              className="text-center text-[10px] text-rose-500 font-semibold"
            >
              ⚠️ {errorMsg}
            </motion.p>
          )}

          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center items-center gap-1.5 text-[11px] text-emerald-400 font-semibold"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ផ្ទៀងផ្ទាត់ជោគជ័យ! (Authenticated...)
            </motion.div>
          )}

          {/* Quick Digit Panel */}
          <div className="grid grid-cols-3 gap-2 px-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumClick(num)}
                className="h-12 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-white font-mono text-sm font-bold flex items-center justify-center transition-all border border-slate-800/30 active:scale-95 text-center"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 text-slate-400 font-semibold text-[10px] flex items-center justify-center transition-all active:scale-95"
            >
              ล้าง (Clear)
            </button>
            <button
              type="button"
              onClick={() => handleNumClick('0')}
              className="h-12 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-white font-mono text-sm font-bold flex items-center justify-center transition-all border border-slate-800/30 active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 text-slate-400 text-xs flex items-center justify-center transition-all active:scale-95"
            >
              ⌫
            </button>
          </div>

          <div className="pt-2 px-2">
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 ${
                settings.accentColor === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
              }`}
            >
              <span>ចូលប្រើប្រាស់គណនី (Verify Lock)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Footer hints */}
        <div className="pt-3 border-t border-slate-800/60 text-center space-y-1.5 text-[10px] text-slate-500">
          <p className="flex items-center justify-center gap-1.5 tracking-wide">
            <Phone className="w-3 h-3 text-slate-600" />
            <span>ទំនាក់ទំនង៖ {settings.businessPhone}</span>
          </p>
          <p className="flex items-center justify-center gap-1.5 leading-normal">
            <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="truncate">{settings.businessAddress}</span>
          </p>
          <div className="pt-1.5 text-[9px] text-amber-500/80 font-mono">
            កំណត់សម្គាល់៖ អ្នកអាចប្រើលេខកូដលំនាំដើម <code className="bg-slate-800 px-1 py-0.5 rounded text-white font-bold">{settings.appPasscode || '1234'}</code> ដើម្បីសាកល្បង។
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Utility to limit password visual targets count
function tokensCount(passwordString: string | undefined): number {
  const count = (passwordString || '1234').length;
  return count > 8 ? 8 : count;
}
