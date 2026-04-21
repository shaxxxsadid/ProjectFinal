// components/ui/FormModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Image from 'next/image';
import { useDebounce } from '@/app/hooks/debounce';

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'password' | 'email' | 'number' | 'textarea' | 'select' | 'image-url';
  required?: boolean;
  autoComplete?: string;
  initialValue?: string;
  placeholder?: string;
  options?: FieldOption[];
  meta?: Record<string, string>; // доп данные, например fallbackName для аватара
}

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: FieldConfig[];
  onSubmit: (data: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  submitLabel?: string;
  mode?: 'create' | 'edit';
  className?: string;
}

const PasswordField = ({
  label, value, onChange, show, onToggle, autoComplete, required, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
  autoComplete?: string; required?: boolean; placeholder?: string;
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {!required && <span className="text-muted-foreground font-normal"> (optional)</span>}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          className={cn(
            "w-full px-4 py-3 rounded-lg",
            "bg-muted/50 border border-border/50",
            "text-foreground text-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent",
            "transition-all duration-200",
            "placeholder:text-muted-foreground/50",
            "pr-12"
          )}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/80"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

const FloatingField = ({
  label, value, onChange, type = 'text', autoComplete, required, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; autoComplete?: string; required?: boolean; placeholder?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative pt-6 pb-2">
      <label className={cn(
        "absolute left-3 pointer-events-none transition-all duration-200 ease-out",
        "text-sm font-medium",
        lifted ? "top-2 text-xs text-primary -translate-y-1" : "top-3.5 text-muted-foreground"
      )}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-3 bg-muted/30 rounded-lg",
          "text-sm text-foreground outline-none border-2",
          "border-transparent focus:border-primary/50",
          "transition-all duration-200",
          "placeholder:text-muted-foreground/50"
        )}
      />
    </div>
  );
};

const ImageUrlField = ({
  label, value, onChange, required, placeholder, fallbackName
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; fallbackName?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const [imgError, setImgError] = useState(false);
  const lifted = focused || value.length > 0;

  const debouncedValue = useDebounce(value, 500);

  const isValidUrl = (str: string): boolean => {
    if (!str.trim()) return false;
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleChange = (v: string) => {
    setImgError(false);
    onChange(v);
  };

  const showImage = debouncedValue.trim().length > 0 && !imgError && isValidUrl(debouncedValue);

  const initials = fallbackName
    ? fallbackName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="flex items-center gap-4">
      {/* Живой превью — обновляется только по debouncedValue */}
      <div className="shrink-0">
        <div className="relative w-25 h-25 rounded-full shrink-0 overflow-hidden border-2 border-border/50">
          {showImage ? (
            <Image
              src={debouncedValue}
              alt="Avatar preview"
              fill
              sizes="100px"
              className="rounded-full object-cover shrink-0" 
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Поле ввода — реагирует мгновенно */}
      <div className="flex-1 relative pt-6 pb-2">
        <label className={cn(
          "absolute left-3 pointer-events-none transition-all duration-200 ease-out",
          "text-sm font-medium",
          lifted ? "top-2 text-xs text-primary -translate-y-1" : "top-3.5 text-muted-foreground"
        )}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full px-3 py-3 bg-muted/30 rounded-lg",
            "text-sm text-foreground outline-none border-2",
            "border-transparent focus:border-primary/50",
            "transition-all duration-200",
            "placeholder:text-muted-foreground/50"
          )}
        />

        {/* Подсказка если введён невалидный URL — показываем по debouncedValue */}
        {value.trim().length > 0 && debouncedValue.trim().length > 0 && !isValidUrl(debouncedValue) && (
          <p className="text-xs text-amber-500 mt-1 ml-1">
            Enter a valid URL (https://...)
          </p>
        )}

        {imgError && isValidUrl(debouncedValue) && (
          <p className="text-xs text-destructive mt-1 ml-1">Failed to load image</p>
        )}
      </div>
    </div>
  );
};

const SelectField = ({
  label, value, onChange, options, required
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: FieldOption[]; required?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative pt-6 pb-2">
      <label className={cn(
        "absolute left-3 pointer-events-none transition-all duration-200 ease-out",
        "text-sm font-medium",
        lifted ? "top-2 text-xs text-primary -translate-y-1" : "top-3.5 text-muted-foreground"
      )}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className={cn(
          "w-full px-3 py-3 bg-muted/30 rounded-lg",
          "text-sm text-foreground outline-none border-2",
          "border-transparent focus:border-primary/50",
          "transition-all duration-200",
          "appearance-none cursor-pointer",
          "pr-10"
        )}
      >
        <option value="" className="bg-background text-muted-foreground">Выберите...</option>
        {options.map(o => (
          <option key={o.value} value={o.value} disabled={o.disabled} className="bg-background text-foreground">
            {o.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

const TextareaField = ({
  label, value, onChange, required, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative pt-6 pb-2">
      <label className={cn(
        "absolute left-3 pointer-events-none transition-all duration-200 ease-out",
        "text-sm font-medium",
        lifted ? "top-2 text-xs text-primary -translate-y-1" : "top-3.5 text-muted-foreground"
      )}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        placeholder={placeholder}
        rows={3}
        className={cn(
          "w-full px-3 py-3 bg-muted/30 rounded-lg resize-none",
          "text-sm text-foreground outline-none border-2",
          "border-transparent focus:border-primary/50",
          "transition-all duration-200",
          "placeholder:text-muted-foreground/50"
        )}
      />
    </div>
  );
};

export const FormModal = ({
  isOpen, onClose, title, description, fields, onSubmit, submitLabel = 'Сохранить', mode = 'create', className
}: FormModalProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setLoading(false);
      const initForm: Record<string, string> = {};
      const initVis: Record<string, boolean> = {};
      fields.forEach(f => {
        initForm[f.name] = f.initialValue ?? '';
        if (f.type === 'password') initVis[f.name] = false;
      });
      setFormData(initForm);
      setVisibility(initVis);
    }
  }, [isOpen, fields]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    for (const f of fields) {
      if (f.required && !formData[f.name]?.trim()) {
        setError(`Поле "${f.label}" обязательно для заполнения`);
        return;
      }
    }

    setLoading(true);
    try {
      const result = await onSubmit(formData);
      if (!result.success) throw new Error(result.error || 'Ошибка сервера');
      setSuccess(mode === 'create' ? 'Создано успешно' : 'Изменения сохранены');
      setTimeout(onClose, 1500);
    } catch (err: any) { // eslint-disable-line
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative w-full max-w-md max-h-[90vh] overflow-hidden",
              "bg-background rounded-2xl shadow-2xl",
              "border border-border/50",
              className
            )}
          >
            <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <motion.h2
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="text-xl font-semibold text-foreground tracking-tight"
                  >
                    {title}
                  </motion.h2>
                  {description && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                      className="text-sm text-muted-foreground mt-1"
                    >
                      {description}
                    </motion.p>
                  )}
                </div>
                <motion.button
                  onClick={onClose}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.1, rotate: 90, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.9, rotate: 45 }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  aria-label="Закрыть"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <form onSubmit={handleSubmit} className="space-y-5">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  >
                    {field.type === 'image-url' ? (
                      <ImageUrlField
                        label={field.label}
                        value={formData[field.name] || ''}
                        onChange={(v) => setFormData(prev => ({ ...prev, [field.name]: v }))}
                        required={field.required}
                        placeholder={field.placeholder}
                        fallbackName={field.meta?.fallbackName}
                      />
                    ) : field.type === 'select' ? (
                      <SelectField
                        label={field.label}
                        value={formData[field.name] || ''}
                        onChange={(v) => setFormData(prev => ({ ...prev, [field.name]: v }))}
                        options={field.options || []}
                        required={field.required}
                      />
                    ) : field.type === 'textarea' ? (
                      <TextareaField
                        label={field.label}
                        value={formData[field.name] || ''}
                        onChange={(v) => setFormData(prev => ({ ...prev, [field.name]: v }))}
                        required={field.required}
                        placeholder={field.placeholder}
                      />
                    ) : field.type === 'password' ? (
                      <PasswordField
                        label={field.label}
                        value={formData[field.name] || ''}
                        onChange={(v) => setFormData(prev => ({ ...prev, [field.name]: v }))}
                        show={visibility[field.name] || false}
                        onToggle={() => setVisibility(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                        autoComplete={field.autoComplete}
                        required={field.required}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <FloatingField
                        label={field.label}
                        value={formData[field.name] || ''}
                        onChange={(v) => setFormData(prev => ({ ...prev, [field.name]: v }))}
                        type={field.type}
                        autoComplete={field.autoComplete}
                        required={field.required}
                        placeholder={field.placeholder}
                      />
                    )}
                  </motion.div>
                ))}

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                      role="alert"
                    >
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </p>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                      role="status"
                    >
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {success}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-border/50 bg-muted/30">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || !!success}
                  className={cn(
                    "flex-2 px-4 py-2.5 rounded-lg text-sm font-semibold",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90 active:scale-[0.98]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
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
                      <span>{submitLabel}</span>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};