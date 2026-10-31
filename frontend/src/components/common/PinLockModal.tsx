import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldCheck, X, Loader2 } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { AuthService } from '../../services/authService';

interface PinLockModalProps {
  isOpen: boolean;
  mode: 'unlock' | 'set' | 'disable';
  onSuccess: () => void;
  onCancel?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  mode,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPin('');
    setConfirmPin('');
    setStep('enter');
    setError('');
    setIsLoading(false);
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleKeyPress = async (num: string) => {
    if (isLoading) return;
    triggerHaptic('light');
    setError('');

    if (mode === 'unlock') {
      const nextPin = pin + num;
      if (nextPin.length <= 4) {
        setPin(nextPin);
        if (nextPin.length === 4) {
          try {
            setIsLoading(true);
            const res = await AuthService.verifyPin(nextPin);
            if (res.verified) {
              triggerHaptic('success');
              onSuccess();
            } else {
              triggerHaptic('warning');
              setError('รหัส PIN ไม่ถูกต้อง');
              setTimeout(() => setPin(''), 500);
            }
          } catch (err: any) {
            triggerHaptic('warning');
            setError(err.response?.data?.message || 'รหัส PIN ไม่ถูกต้อง');
            setTimeout(() => setPin(''), 500);
          } finally {
            setIsLoading(false);
          }
        }
      }
    } else if (mode === 'set') {
      if (step === 'enter') {
        const nextPin = pin + num;
        if (nextPin.length <= 4) {
          setPin(nextPin);
          if (nextPin.length === 4) {
            setStep('confirm');
          }
        }
      } else {
        const nextConfirm = confirmPin + num;
        if (nextConfirm.length <= 4) {
          setConfirmPin(nextConfirm);
          if (nextConfirm.length === 4) {
            if (nextConfirm === pin) {
              try {
                setIsLoading(true);
                await AuthService.setPin(pin);
                triggerHaptic('success');
                onSuccess();
              } catch (err: any) {
                triggerHaptic('warning');
                setError(err.response?.data?.message || 'ไม่สามารถตั้งรหัส PIN ได้');
                setTimeout(() => {
                  setConfirmPin('');
                  setPin('');
                  setStep('enter');
                }, 800);
              } finally {
                setIsLoading(false);
              }
            } else {
              triggerHaptic('warning');
              setError('รหัสยืนยันไม่ตรงกัน โปรดลองใหม่');
              setTimeout(() => {
                setConfirmPin('');
                setPin('');
                setStep('enter');
              }, 800);
            }
          }
        }
      }
    } else if (mode === 'disable') {
      const nextPin = pin + num;
      if (nextPin.length <= 4) {
        setPin(nextPin);
        if (nextPin.length === 4) {
          try {
            setIsLoading(true);
            await AuthService.disablePin(nextPin);
            triggerHaptic('success');
            onSuccess();
          } catch (err: any) {
            triggerHaptic('warning');
            setError(err.response?.data?.message || 'รหัส PIN เดิมไม่ถูกต้อง');
            setTimeout(() => setPin(''), 500);
          } finally {
            setIsLoading(false);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (isLoading) return;
    triggerHaptic('light');
    if (mode === 'set' && step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const activeDisplayPin = mode === 'set' && step === 'confirm' ? confirmPin : pin;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
      {onCancel && mode !== 'unlock' && (
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      <div className="w-full max-w-xs text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-950">
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          ) : mode === 'set' ? (
            <ShieldCheck className="w-8 h-8" />
          ) : (
            <Lock className="w-8 h-8" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold">
            {mode === 'unlock'
              ? 'ปลดล็อก Personal Organizer'
              : mode === 'set'
              ? step === 'enter'
                ? 'ตั้งรหัส PIN 4 หลัก'
                : 'ยืนยันรหัส PIN อีกครั้ง'
              : 'ใส่รหัส PIN เดิมเพื่อยกเลิก'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'unlock'
              ? 'กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน'
              : 'ใช้สำหรับปกป้องข้อมูลส่วนตัวของคุณบนเซิร์ฟเวอร์'}
          </p>
        </div>

        {/* 4 Dots PIN Display */}
        <div className="flex items-center justify-center gap-4 py-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                activeDisplayPin.length > idx
                  ? 'bg-indigo-500 scale-110 shadow-md shadow-indigo-500/50'
                  : 'border-2 border-slate-700 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-semibold animate-pulse">{error}</p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isLoading}
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-slate-900 border border-slate-800 text-xl font-bold text-white hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setPin('');
              setConfirmPin('');
              setError('');
            }}
            className="h-16 rounded-2xl bg-slate-900/40 text-slate-400 text-xs font-semibold hover:bg-slate-800 flex items-center justify-center"
          >
            ล้าง
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-slate-900 border border-slate-800 text-xl font-bold text-white hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center active:scale-95 disabled:opacity-50 transition-all"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
