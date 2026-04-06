'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader } from '../components/ui/loader';
import { BackgroundBeams } from '../components/ui/BackgroundBeams';
import { Pagination } from '../components/ui/pagination';
import { useAdminStore } from '../store/adminStore';

/* ─────────────────────────────────────────────
   🖼️ Product Avatar (заглушка или изображение)
───────────────────────────────────────────── */
const ProductAvatar = ({
    name,
    productId,
    size = 'lg' // По умолчанию lg вместо md
}: {
    name: string;
    productId?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' // Добавил xl
}) => {
    const [avatar, setAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const hue = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 360;
    }, [name]);

    // УВЕЛИЧЕННЫЕ РАЗМЕРЫ
    const sizeClasses = {
        sm: 'w-12 h-12 text-sm',    // было w-10 h-10
        md: 'w-16 h-16 text-base',   // было w-12 h-12
        lg: 'w-20 h-20 text-lg',     // было w-16 h-16
        xl: 'w-24 h-24 text-xl'      // новый размер
    };

    // 🔹 useEffect — тоже вверху
    useEffect(() => {
        let mounted = true;

        if (productId) {
            fetchProductAvatar(productId)
                .then(result => {
                    if (!mounted) return;
                    if (result?.success && result?.data) {
                        setAvatar(result.data);
                    } else {
                        setAvatar(null);
                    }
                })
                .catch(err => {
                    console.error('Avatar fetch error:', err);
                    if (mounted) setAvatar(null);
                })
                .finally(() => { if (mounted) setLoading(false); });
        } else {
            setLoading(false); // eslint-disable-line
        }

        return () => { mounted = false; };
    }, [productId]);

    // 🔹 ТОЛЬКО ПОСЛЕ ВСЕХ ХУКОВ — логика и return

    // Показываем заглушку во время загрузки
    if (loading) {
        return <div className={cn('rounded-xl bg-muted animate-pulse', sizeClasses[size])} />;
    }

    // Если аватар загрузился — показываем картинку
    if (avatar) {
        return (
            <img// eslint-disable-line
                src={avatar}
                alt={name}
                className={cn('rounded-xl object-cover border border-border/50', sizeClasses[size])}
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
            />
        );
    }

    const initials = name.split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div
            className={cn(
                'rounded-xl flex items-center justify-center font-semibold border border-border/50',
                sizeClasses[size],
                'text-white'
            )}
            style={{
                background: `linear-gradient(135deg, hsl(${hue} 70% 50%), hsl(${(hue + 40) % 360} 70% 45%))`
            }}
        >
            {initials}
        </div>
    );
};

async function fetchProductAvatar(productId: string) {
    if (!productId) return { success: true, data: null };

    const url = `/api/avatar/product?id=${encodeURIComponent(productId)}`;

    const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
    });

    // 404 — только если продукта нет вообще
    if (res.status === 404) {
        return { success: false, error: 'Product not found' };
    }

    // Любые другие ошибки
    if (!res.ok) {
        console.error(`Avatar fetch failed: ${res.status}`);
        return { success: false, error: `HTTP ${res.status}` };
    }

    return await res.json();
}
/* ─────────────────────────────────────────────
   📦 Catalog Page
───────────────────────────────────────────── */
export default function ProductsCatalogPage() {
    const { products, setProducts, setProductsLoading, setProductsError, searchProducts, setProductPage } = useAdminStore();
    const [searchInput, setSearchInput] = useState('');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    useEffect(() => {
        const saved = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(saved as 'light' | 'dark')
    }, []);

    useEffect(() => {
        let mounted = true;
        const fetchProducts = async () => {
            setProductsLoading(true);
            try {
                const res = await fetch('/api/products');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (mounted) setProducts(Array.isArray(data) ? data : [], data.length);
            } catch (err) {
                if (mounted) setProductsError(err instanceof Error ? err.message : 'Ошибка загрузки');
            } finally {
                if (mounted) setProductsLoading(false);
            }
        };
        fetchProducts();
        return () => { mounted = false; };
    }, [setProducts, setProductsLoading, setProductsError]);

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchInput(value);
        searchProducts(value);
    }, [searchProducts]);

    const handlePageChange = useCallback((page: number) => {
        setProductPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [setProductPage]);

    const actualTotalPages = useMemo(
        () => Math.max(1, Math.ceil(products.filteredItems.length / products.pagination.limit)),
        [products.filteredItems.length, products.pagination.limit]
    );

    const startIndex = (products.pagination.page - 1) * products.pagination.limit;
    const currentItems = products.filteredItems.slice(startIndex, startIndex + products.pagination.limit);
    const isDark = theme === 'dark';

    if (products.loading) return <Loader text="Загружаем каталог..." />;
    if (products.error) return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className={cn(
                'border px-6 py-4 rounded-xl text-sm max-w-md text-center backdrop-blur-sm',
                isDark
                    ? 'border-red-900/50 bg-red-950/30 text-red-400'
                    : 'border-red-200 bg-red-50 text-red-600'
            )}>
                <p className="font-medium mb-1">⚠️ Ошибка</p>
                <p className="text-xs opacity-80">{products.error}</p>
            </div>
        </div>
    );

    return (
        <div className={cn(
            'h-screen overflow-hidden flex flex-col',
            "bg-background text-foreground",
        )}>
            <BackgroundBeams className='bg-background' theme={theme} intensity="medium" />

            {/* Убрали max-w-7xl, добавили h-full */}
            <div className="relative w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 overflow-y-auto">
                {/* Header */}
                <motion.div
                    className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div>
                        <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
                            Warehouse / Каталог
                        </p>
                        <h1 className="text-4xl font-semibold tracking-tight">Товары</h1>
                    </div>
                    <div className="flex items-center gap-3 pb-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{products.filteredItems.length} из {products.items.length}</span>
                            <span className={cn(
                                'px-1.5 py-0.5 rounded text-xs border backdrop-blur-sm',
                                isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                            )}>
                                {products.pagination.page} / {products.pagination.totalPages} стр.
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Search */}
                <motion.div
                    className="mb-6 shrink-0"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                >
                    <div className="relative max-w-sm">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={handleSearch}
                            placeholder="Поиск по названию или SKU..."
                            className={cn(
                                'w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border backdrop-blur-md',
                                'focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30',
                                'placeholder:text-muted-foreground/60 transition-all duration-200',
                                isDark
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                    : 'bg-black/5 border-black/10 hover:bg-black/10'
                            )}
                        />
                    </div>
                </motion.div>

                {/* Products Grid - улучшенная сетка */}
                {currentItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                            'flex flex-col items-center justify-center py-32 gap-3 rounded-2xl border-2 border-dashed',
                            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
                        )}
                    >
                        <svg className="w-12 h-12 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                        <p className="text-sm text-muted-foreground">Ничего не найдено</p>
                        {searchInput && (
                            <button
                                onClick={() => { setSearchInput(''); searchProducts(''); }}
                                className={cn(
                                    'text-xs underline underline-offset-4 transition-colors',
                                    isDark ? 'text-muted-foreground hover:text-white' : 'text-muted-foreground hover:text-black'
                                )}
                            >
                                Сбросить поиск
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className='flex w-full justify-center min-h-2/3'>
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-2 gap-4 w-2/3 min-h-2/3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.15 }}
                        >
                            <AnimatePresence mode="popLayout">
                                {currentItems.map((product: any, i) => (//eslint-disable-line
                                    <motion.div
                                        key={product._id}
                                        layout
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.25, delay: i * 0.04 }}
                                        className={cn(
                                            'group relative rounded-3xl p-6 cursor-pointer transition-all duration-300',
                                            'border backdrop-blur-sm',
                                            'min-h-60 sm:min-h-70 h-auto',
                                            'flex flex-col',
                                            isDark
                                                ? 'bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/30'
                                                : 'bg-black/5 border-black/10 hover:bg-black/10 hover:border-black/20'
                                        )}
                                    >
                                        <div className="flex flex-col h-full">
                                            {/* Верхняя часть: Avatar + Название */}
                                            <div className="flex items-start gap-5 mb-4">
                                                {/* УВЕЛИЧЕННЫЙ AVATAR */}
                                                <ProductAvatar
                                                    name={product.name}
                                                    productId={product._id}
                                                    size="lg" // было md
                                                />

                                                {/* Название */}
                                                <div className="flex-1 min-w-0">
                                                    <h2 className="text-lg sm:text-xl font-semibold leading-tight pr-6">
                                                        {product.name}
                                                    </h2>
                                                </div>
                                            </div>

                                            {/* Средняя часть: SKU и описание */}
                                            <div className="flex-1 flex flex-col gap-3">
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <span className={cn(
                                                        'font-mono px-2.5 py-1 rounded-lg text-xs tracking-wide border',
                                                        isDark
                                                            ? 'bg-white/5 border-white/10'
                                                            : 'bg-black/5 border-black/10'
                                                    )}>
                                                        {product.sku}
                                                    </span>
                                                </p>

                                                {/* Категория или описание (если есть) */}
                                                {product.category && (
                                                    <p className={cn(
                                                        'text-xs px-2 py-1 rounded-md inline-block w-fit',
                                                        isDark
                                                            ? 'bg-white/5 text-white/70'
                                                            : 'bg-black/5 text-black/70'
                                                    )}>
                                                        {product.category}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Нижняя часть: Цена */}
                                            <div className="mt-auto pt-4 flex items-center justify-between">
                                                {product.price && (
                                                    <p className={cn(
                                                        'text-xl sm:text-2xl font-bold',
                                                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                                                    )}>
                                                        {product.price.toLocaleString('ru-RU')} ₽
                                                    </p>
                                                )}

                                                {/* Hover arrow - больше и заметнее */}
                                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                                                    <svg
                                                        className={cn('w-6 h-6', isDark ? 'text-white/50' : 'text-black/50')}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}

                {/* Pagination */}
                {actualTotalPages > 1 && (
                    <motion.div
                        className="mt-8 mb-4 flex justify-center shrink-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Pagination
                            currentPage={products.pagination.page}
                            totalPages={actualTotalPages}
                            onPageChange={handlePageChange}
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
}