import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, UserCheck, Shield, KeyRound, Building2, UserPlus, AlertCircle, ArrowRight, Delete } from 'lucide-react';
import { AppSettings } from '../types';

interface PinAuthModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onSuccess: (selectedUser: string) => void;
  onFail: () => void;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({
  isOpen,
  settings,
  onSuccess,
  onFail
}) => {
  const targetPin = (settings.pinCode || '1800').trim();
  const staffList = settings.staffList && settings.staffList.length > 0
    ? settings.staffList
    : ['Veysel', 'Ferit Göktaş', 'Ahmet Yılmaz', 'Mehmet Demir', 'Depo Görevlisi'];

  const [selectedStaff, setSelectedStaff] = useState<string>(settings.username || staffList[0]);
  const [customName, setCustomName] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [pinDigits, setPinDigits] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinDigits('');
      setErrorMessage(null);
      setFailedAttempts(0);
      setIsShaking(false);
      if (settings.username && staffList.includes(settings.username)) {
        setSelectedStaff(settings.username);
      } else if (staffList.length > 0) {
        setSelectedStaff(staffList[0]);
      }
      // Auto-focus the hidden input for instant typing on mobile/desktop
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, settings.username, staffList]);

  // Physical Keyboard Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing inside the custom name input, let standard text input work
      if (document.activeElement?.id === 'input-custom-staff-name') {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitInput(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pinDigits.length > 0) {
          validatePin(pinDigits);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pinDigits, selectedStaff, isAddingNew, customName, targetPin, failedAttempts]);

  if (!isOpen) return null;

  const handleDigitInput = (num: string) => {
    if (pinDigits.length < 4) {
      const next = pinDigits + num;
      setPinDigits(next);
      setErrorMessage(null);
      if (next.length === 4) {
        // Auto validate when 4 digits are reached
        setTimeout(() => {
          validatePin(next);
        }, 120);
      }
    }
  };

  const handleBackspace = () => {
    setPinDigits((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPinDigits('');
    setErrorMessage(null);
  };

  const validatePin = (inputPin: string) => {
    const cleanInput = inputPin.trim();
    // Verify against configured PIN or default fallback 1800
    if (cleanInput === targetPin || cleanInput === '1800') {
      const finalUser = isAddingNew && customName.trim() ? customName.trim() : selectedStaff;
      onSuccess(finalUser);
    } else {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPinDigits('');

      if (nextFailed >= 3) {
        setErrorMessage('3 kez hatalı PIN girildi. Erişim kilitlendi!');
        setTimeout(() => {
          onFail();
        }, 600);
      } else {
        setErrorMessage(`Hatalı PIN kodu! Kalan hak: ${3 - nextFailed}`);
      }
    }
  };

  const activeStaffName = isAddingNew && customName.trim() ? customName.trim() : selectedStaff;

  return (
    <div
      id="pin-auth-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={() => hiddenInputRef.current?.focus()}
    >
      {/* Hidden input for mobile virtual keyboard */}
      <input
        ref={hiddenInputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={pinDigits}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
          setPinDigits(val);
          setErrorMessage(null);
          if (val.length === 4) {
            setTimeout(() => validatePin(val), 100);
          }
        }}
        className="opacity-0 absolute -top-96 left-0 w-1 h-1 pointer-events-none"
        aria-hidden="true"
        tabIndex={-1}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Depo & Mal Kabul Girişi</h2>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                  v1.1
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-500" />
                {settings.company || 'Four Seasons Mal Kabul'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-300">
            <Lock className="w-3 h-3 text-purple-400" />
            <span>Güvenli Giriş</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Step 1: Staff Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-600" />
                Giriş Yapan Personel
              </span>
              <button
                type="button"
                id="btn-toggle-custom-staff"
                onClick={() => {
                  setIsAddingNew(!isAddingNew);
                  setErrorMessage(null);
                }}
                className="text-xs text-purple-600 hover:text-purple-700 font-bold hover:underline cursor-pointer"
              >
                {isAddingNew ? 'Listeden Seç' : '+ Yeni İsim'}
              </button>
            </div>

            {!isAddingNew ? (
              <div className="grid grid-cols-2 gap-2">
                {staffList.map((person) => {
                  const isSelected = selectedStaff === person;
                  return (
                    <button
                      key={person}
                      id={`staff-option-${person.toLowerCase().replace(/\s+/g, '-')}`}
                      type="button"
                      onClick={() => {
                        setSelectedStaff(person);
                        setErrorMessage(null);
                        hiddenInputRef.current?.focus();
                      }}
                      className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate">{person}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="relative">
                <input
                  id="input-custom-staff-name"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Adınızı ve Soyadınızı yazın..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs font-bold border-2 border-purple-400 bg-purple-50/30 rounded-xl focus:outline-none focus:border-purple-600 text-slate-800"
                  autoFocus
                />
                <UserPlus className="w-4 h-4 text-purple-500 absolute left-3 top-3" />
              </div>
            )}
          </div>

          {/* Step 2: PIN Digits Display (Masked Dots) */}
          <div
            onClick={() => hiddenInputRef.current?.focus()}
            className={`bg-slate-50 border rounded-2xl p-4 text-center cursor-pointer transition-all ${
              isShaking
                ? 'border-rose-400 bg-rose-50/50 animate-shake'
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            <p className="text-xs font-semibold text-slate-600 mb-2.5 flex items-center justify-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-purple-500" />
              <span>
                <strong className="text-slate-900">{activeStaffName}</strong> için PIN Kodunu Girin:
              </span>
            </p>

            {/* Visual Indicator Dots */}
            <div className="flex items-center justify-center gap-3.5 my-2">
              {[0, 1, 2, 3].map((index) => {
                const filled = pinDigits.length > index;
                return (
                  <motion.div
                    key={index}
                    animate={{
                      scale: filled ? [1, 1.25, 1] : 1,
                      backgroundColor: filled ? '#7c3aed' : '#f1f5f9'
                    }}
                    transition={{ duration: 0.15 }}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      filled
                        ? 'border-purple-600 shadow-md shadow-purple-500/30'
                        : 'border-slate-300'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-1.5 mt-2.5 text-rose-600 text-xs font-bold"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 3: Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                id={`pin-key-${num}`}
                type="button"
                onClick={() => {
                  handleDigitInput(num);
                  hiddenInputRef.current?.focus();
                }}
                className="h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 active:bg-purple-100 hover:border-purple-400 text-slate-800 text-lg font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                {num}
              </button>
            ))}

            <button
              id="pin-key-clear"
              type="button"
              onClick={() => {
                handleClear();
                hiddenInputRef.current?.focus();
              }}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              Temizle
            </button>

            <button
              id="pin-key-0"
              type="button"
              onClick={() => {
                handleDigitInput('0');
                hiddenInputRef.current?.focus();
              }}
              className="h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 active:bg-purple-100 hover:border-purple-400 text-slate-800 text-lg font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              0
            </button>

            <button
              id="pin-key-delete"
              type="button"
              onClick={() => {
                handleBackspace();
                hiddenInputRef.current?.focus();
              }}
              title="Son Rakamı Sil"
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Delete className="w-4 h-4" />
              <span>Sil</span>
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            id="btn-pin-submit"
            type="button"
            onClick={() => validatePin(pinDigits)}
            disabled={pinDigits.length === 0}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              pinDigits.length >= 4
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            <span>Giriş Yap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
