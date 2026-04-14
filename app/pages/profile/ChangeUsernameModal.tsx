// components/ui/ChangeUsernameModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface ChangeUsernameModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialUsername: string;
    onSubmit: (data: { firstname: string; lastname: string }) => Promise<{ success: boolean; error?: string }>;
    className?: string;
}

const FloatingInput = ({
    label,
    value,
    onChange,
    type = 'text',
    autoComplete,
    required,
    placeholder
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    autoComplete?: string;
    required?: boolean;
    placeholder?: string;
}) => {
    const [focused, setFocused] = useState(false);
    const lifted = focused || value.length > 0;

    return (
        <div className="relative pt-5 pb-1 transition-all duration-200">
            <label className="absolute left-0 text-sm text-muted-foreground pointer-events-none origin-left top-5 transition-all duration-200 ease-in-out"
                style={{ transform: lifted ? 'translateY(-20px) scale(0.9)' : 'translateY(0) scale(1)', color: lifted ? (focused ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))') : 'hsl(var(--muted-foreground))', transition: 'transform 0.2s ease, color 0.2s ease', fontFamily: 'inherit', letterSpacing: lifted ? '0.05em' : '0' }}>
                {label}
            </label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoComplete={autoComplete} required={required} placeholder={placeholder} style={{ fontFamily: 'inherit' }} className="w-full pb-2 bg-transparent text-sm text-foreground outline-none border-none ring-0 placeholder:text-muted-foreground/50" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-foreground/15" />
            <div className="absolute bottom-0 left-0 h-px bg-primary" style={{ width: focused ? '100%' : '0%', transition: 'width 0.25s ease' }} />
        </div>
    );
};

export const ChangeUsernameModal = ({ isOpen, onClose, initialUsername, onSubmit, className }: ChangeUsernameModalProps) => {
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError(''); setSuccess('');
            // Безопасный сплит по пробелам или подчеркиваниям
            const parts = initialUsername.trim().split(/[\s_]+/).filter(Boolean);
            setLastname(parts[0] || '');
            setFirstname(parts.slice(1).join(' ') || '');
        }
    }, [isOpen, initialUsername]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess('');

        const f = firstname.trim();
        const l = lastname.trim();
        if (!f || !l) { setError('Заполните оба поля'); return; }

        setLoading(true);
        try {
            const result = await onSubmit({ firstname: f, lastname: l });
            if (!result.success) throw new Error(result.error || 'Ошибка сервера');
            setSuccess('Имя успешно обновлено');
            setTimeout(onClose, 1500);
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className={cn('relative w-full max-w-sm', className)}>
                        <div className="relative rounded-2xl overflow-hidden bg-background border border-foreground/10 shadow-2xl shadow-black/40">
                            <div className="h-px w-full bg-linear-to-r from-transparent via-primary/60 to-transparent" />
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex flex-col">
                                        <motion.h2 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="text-xl font-bold text-foreground tracking-tight">Изменить имя</motion.h2>
                                        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="text-xs text-muted-foreground mt-1 truncate max-w-55">Фамилия и имя отображаются в профиле</motion.p>
                                    </div>
                                    <motion.button onClick={onClose} initial={{ opacity: 0, rotate: -90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} transition={{ duration: 0.3, delay: 0.2, type: "spring", stiffness: 200 }} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9, rotate: 45 }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/20 cursor-pointer" aria-label="Закрыть">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </motion.button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <FloatingInput label="Фамилия" value={lastname} onChange={setLastname} required placeholder="Иванов" />
                                    <FloatingInput label="Имя" value={firstname} onChange={setFirstname} required placeholder="Иван" />

                                    <AnimatePresence mode="wait">
                                        {error && <motion.p key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-400 flex items-center gap-1.5"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</motion.p>}
                                        {success && <motion.p key="succ" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-emerald-400 flex items-center gap-1.5"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{success}</motion.p>}
                                    </AnimatePresence>

                                    <button type="submit" disabled={loading || !!success} className={cn('relative w-full h-11 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer')}>
                                        <span className="flex items-center justify-center gap-2">
                                            {loading ? <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /><span>Сохранение...</span></> : success ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span>Готово</span></> : <span>Обновить данные</span>}
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