/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Coins, Lock, Delete, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface PasscodeLockProps {
  expectedPasscode: string;
  onSuccess: () => void;
  businessName: string;
  businessSlogan: string;
  accentColor: string;
}

export default function PasscodeLock({
  expectedPasscode,
  onSuccess,
  businessName,
  businessSlogan,
  accentColor
}: PasscodeLockProps) {
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Accent theme colors mapping
  const activeColorClass = 
    accentColor === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' :
    accentColor === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-400 text-white' :
    accentColor === 'violet' ? 'bg-violet-600 hover:bg-violet-500 text-white' :
    accentColor === 'rose' ? 'bg-rose-500 hover:bg-rose-400 text-white' :
    accentColor === 'slate' ? 'bg-slate-700 hover:bg-slate-600 text-white' :
    'bg-yellow-500 hover:bg-yellow-400 text-slate-950';

  const accentTextClass = 
    accentColor === 'indigo' ? 'text-indigo-500' :
    accentColor === 'emerald' ? 'text-emerald-500' :
    accentColor === 'violet' ? 'text-violet-500' :
    accentColor === 'rose' ? 'text-rose-500' :
    accentColor === 'slate' ? 'text-slate-400' :
    'text-yellow-500';

  const accentBorderClass = 
    accentColor === 'indigo' ? 'border-indigo-500/20' :
    accentColor === 'emerald' ? 'border-emerald-500/20' :
    accentColor === 'violet' ? 'border-violet-500/20' :
    accentColor === 'rose' ? 'border-rose-500/20' :
    accentColor === 'slate' ? 'border-slate-500/20' :
    'border-yellow-500/20';

  const activeBgClass = 
    accentColor === 'indigo' ? 'bg-indigo-500/10' :
    accentColor === 'emerald' ? 'bg-emerald-500/10' :
    accentColor === 'violet' ? 'bg-violet-500/10' :
    accentColor === 'rose' ? 'bg-rose-500/10' :
    accentColor === 'slate' ? 'bg-slate-500/10' :
    'bg-yellow-400/10';

  // Support native physical keyboard digits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      } else if (/^[0-9a-zA-Z]$/.test(e.key)) {
        handlePressDigit(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pin, expectedPasscode]);

  const handlePressDigit = (char: string) => {
    if (pin.length >= 8) return; // limit
    const nextPin = pin + char;
    setPin(nextPin);
    setErrorMessage('');

    // If matches passcode, unlock
    if (nextPin === expectedPasscode) {
      onSuccess();
    } else if (nextPin.length >= expectedPasscode.length && expectedPasscode.length > 0) {
      // If same length but not matching
      if (nextPin.length === expectedPasscode.length) {
        setTimeout(() => {
          setErrorShake(true);
          setErrorMessage('លេខកូដមិនត្រឹមត្រូវទេ! (Incorrect pass code)');
          setTimeout(() => setErrorShake(false), 500);
          setPin('');
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  // Determine indicator count
  const items = Array.from({ length: Math.max(expectedPasscode.length, 4) });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-100 font-sans" id="passcode_lock_screen">
      {/* Decorative ambient spots */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointing-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-yellow-400/5 blur-[100px] rounded-full pointing-events-none"></div>

      <div className="w-full max-w-sm flex flex-col items-center space-y-8 z-10">
        
        {/* Brand branding */}
        <div className="text-center space-y-2.5">
          <div className="flex justify-center">
            <div className={`p-4 rounded-3xl ${activeBgClass} border ${accentBorderClass} shadow-xl animate-pulse`}>
              <Coins className={`w-10 h-10 ${accentTextClass}`} />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-wide">{businessName}</h1>
            <p className="text-xs text-slate-400 font-medium">{businessSlogan}</p>
          </div>
        </div>

        {/* Lock Icon & Instruction */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-500 font-bold tracking-wider">
            <Lock className="w-4.5 h-4.5" />
            <span>ប្រព័ន្ធចាក់សោរសុវត្ថិភាព</span>
          </div>
          <p className="text-[11px] text-slate-400">សូមបញ្ចូលលេខកូដសម្ងាត់ដើម្បីចូលប្រើប្រាស់</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex flex-col items-center space-y-4 w-full">
          <div 
            className={`flex justify-center items-center gap-4 py-2 px-6 rounded-2xl bg-white/5 border border-white/10 ${
              errorShake ? 'animate-bounce border-red-500/50' : ''
            }`}
          >
            {items.map((_, idx) => {
              const active = idx < pin.length;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    active 
                      ? `${accentTextClass} ${activeColorClass} scale-110 shadow-md` 
                      : 'bg-slate-800 border-2 border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {errorMessage ? (
            <div className="text-red-400 text-[10px] font-semibold flex items-center gap-1.5 animate-pulse bg-red-950/40 px-3 py-1 rounded-full border border-red-900/40">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 h-5 italic">
              {pin.length > 0 ? `បានវាយបញ្ចូល៖ ${pin.replace(/./g, '●')}` : 'រង់ចាំលេខកូដពីក្តារចុច...'}
            </div>
          )}
        </div>

        {/* Custom Dial Keypad */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handlePressDigit(digit)}
              className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-bold font-mono text-xl flex items-center justify-center transition-all active:scale-90 shadow-md cursor-pointer select-none"
            >
              {digit}
            </button>
          ))}
          
          {/* Clear Key */}
          <button
            type="button"
            onClick={handleClear}
            className="w-16 h-16 rounded-full hover:bg-red-500/10 text-red-400 font-bold text-xs flex items-center justify-center transition-all active:scale-90 cursor-pointer select-none"
          >
            ជម្រះ
          </button>

          {/* 0 Key */}
          <button
            key="0"
            type="button"
            onClick={() => handlePressDigit('0')}
            className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-bold font-mono text-xl flex items-center justify-center transition-all active:scale-90 shadow-md cursor-pointer select-none"
          >
            0
          </button>

          {/* Backspace Key */}
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full hover:bg-amber-500/10 text-amber-500 flex items-center justify-center transition-all active:scale-90 cursor-pointer select-none"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Credit */}
        <p className="text-[9px] text-slate-600 font-sans tracking-tight">
          &copy; V4U Pawn Group Securitized Network
        </p>

      </div>
    </div>
  );
}
