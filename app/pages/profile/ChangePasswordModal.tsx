// components/ui/ChangePasswordModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onSubmit: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
  className?: string;
}

interface FloatInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
  required?: boolean;
}

const FloatInput = ({ label, value, onChange, show, onToggle, autoComplete, required }: FloatInputProps) => {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative pt-5 pb-1 transition-all duration-200">
      <label
        className="absolute left-0 text-sm text-muted-foreground pointer-events-none origin-left top-5 transition-all duration-200 ease-in-out"
        style={{
          transform: lifted ? 'translateY(-20px) scale(0.9)' : 'translateY(0) scale(1)',
          color: lifted ? (focused ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))') : 'hsl(var(--muted-foreground))',
          transition: 'transform 0.2s ease, color 0.2s ease',
          fontFamily: 'inherit',
          letterSpacing: lifted ? '0.05em' : '0',
        }}
      >
        {label}
      </label>

      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required={required}
        style={{ fontFamily: 'inherit' }}
        className="w-full pb-2 pr-8 bg-transparent text-sm text-foreground outline-none border-none ring-0 placeholder:text-muted-foreground/50"
      />
      <div className="absolute bottom-0 left-0 w-full h-px bg-foreground/15" />
      <div
        className="absolute bottom-0 left-0 h-px bg-primary"
        style={{
          width: focused ? '100%' : '0%',
          transition: 'width 0.25s ease',
        }}
      />

      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute right-0 bottom-2.25 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle visibility"
      >
        {show ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
      </button>
    </div>
  );
};


export const ChangePasswordModal = ({
  isOpen,
  onClose,
  userEmail,
  onSubmit,
  className,
}: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Валидация
    if (newPassword.length < 6) {
      setError('Минимум 6 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (!currentPassword) {
      setError('Введите текущий пароль');
      return;
    }

    setLoading(true);
    try {
      const result = await onSubmit({ currentPassword, newPassword });
      if (!result.success) throw new Error(result.error || 'Ошибка сервера');
      
      setSuccess('Пароль успешно изменён');
      setTimeout(onClose, 1600);
    } catch (err: any) {//eslint-disable-line
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn('relative w-full max-w-sm', className)}
          >
            <div className={cn(
              'relative rounded-2xl overflow-hidden',
              'bg-background border border-foreground/10',
              'shadow-2xl shadow-black/40',
            )}>
              
              {/* Top accent line */}
              <div className="h-px w-full bg-linear-to-r from-transparent via-primary/60 to-transparent" />

              <div className="p-8">
                
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex flex-col">
                    <motion.h2
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="text-xl font-bold text-foreground tracking-tight"
                    >
                      Смена пароля
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                      className="text-xs text-muted-foreground mt-1 truncate max-w-55"
                    >
                      {userEmail}
                    </motion.p>
                  </div>

                  {/* Close button with animation */}
                  <motion.button
                    onClick={onClose}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.1, rotate: 90, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.9, rotate: 45 }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/20 cursor-pointer"
                    aria-label="Закрыть"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <FloatInput
                    label="Текущий пароль"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    show={showCurrent}
                    onToggle={() => setShowCurrent(!showCurrent)}
                    autoComplete="current-password"
                    required
                  />
                  
                  <FloatInput
                    label="Новый пароль"
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showNew}
                    onToggle={() => setShowNew(!showNew)}
                    autoComplete="new-password"
                    required
                  />
                  
                  <FloatInput
                    label="Подтвердите пароль"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showConfirm}
                    onToggle={() => setShowConfirm(!showConfirm)}
                    autoComplete="new-password"
                    required
                  />

                  {/* Status Messages */}
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.p
                        key="error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-400 flex items-center gap-1.5"
                        role="alert"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </motion.p>
                    )}
                    {success && (
                      <motion.p
                        key="success"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-emerald-400 flex items-center gap-1.5"
                        role="status"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {success}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !!success}
                    style={{ fontFamily: 'inherit' }}
                    className={cn(
                      'relative w-full h-11 rounded-xl text-sm font-semibold',
                      'bg-primary text-primary-foreground',
                      'hover:opacity-90 active:scale-[0.98]',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      'transition-all duration-150',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer',
                    )}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          <span>Сохранение...</span>
                        </>
                      ) : success ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Готово</span>
                        </>
                      ) : (
                        <span>Изменить пароль</span>
                      )}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};