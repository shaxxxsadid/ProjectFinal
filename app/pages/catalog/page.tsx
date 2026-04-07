'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader } from '@/app/components/ui/loader';
import { BackgroundBeams } from '@/app/components/ui/BackgroundBeams';
import { Pagination } from '@/app/components/ui/pagination';

import { useDebounce } from '@/app/hooks/debounce';
import { useTheme } from 'next-themes';
import { useProductsStore } from '@/app/store/productStore';
import { ProductShort } from '@/types/store.types';
import ProductAvatar from '@/app/components/ui/ProductAvatar';



export default function ProductsCatalogPage() {
    const {
        products,
        productIsLoading,
        searchProducts,
        setProductPage,
        fetchProducts
    } = useProductsStore();

    const [searchInput, setSearchInput] = useState('');
    const debouncedSearchInput = useDebounce(searchInput, 500);
    const theme = useTheme();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);
    useEffect(() => {
        console.log('📊 items.length:', products.items.length);
        console.log('🔍 filteredItems.length:', products.filteredItems.length);
        console.log('📄 pagination:', products.pagination);
        console.log('🔎 searchQuery:', products.searchQuery);
    }, [products.items, products.filteredItems, products.pagination, products.searchQuery]);
    useEffect(() => {
        searchProducts(debouncedSearchInput);
    }, [debouncedSearchInput, searchProducts]);

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    }, []);

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

    if (productIsLoading) return <Loader text="Загружаем каталог..." />;

    if (products.error) return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className={cn(
                'border px-6 py-4 rounded-xl text-sm max-w-md text-center backdrop-blur-sm',
                'border-red-900/50 bg-red-950/30 text-red-400'
            )}>
                <p className="font-medium mb-1">⚠️ Ошибка</p>
                <p className="text-xs opacity-80">{products.error}</p>
                <button
                    onClick={() => fetchProducts()}
                    className="mt-3 text-xs underline hover:text-red-300 transition-colors"
                >
                    Попробовать снова
                </button>
            </div>
        </div>
    );

    return (
        <div className={cn(
            'h-screen overflow-hidden flex flex-col',
            "bg-background text-foreground",
        )}>
            <BackgroundBeams className='bg-background' theme={theme ? 'light' : 'dark'} intensity="medium" />

            <div className="relative w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 overflow-y-auto">
                {/* Header */}
                <motion.div
                    className="mb-6 flex w-full flex-col justify-center sm:flex-row sm:items-end gap-4 shrink-0"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className='w-2/3 flex justify-between items-center flex-col sm:flex-row'>
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
                                    'px-1.5 py-0.5 rounded text-xs border backdrop-blur-sm bg-background/5 border-background/10'
                                )}>
                                    {products.pagination.page} / {products.pagination.totalPages} стр.
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Search */}
                <motion.div
                    className="w-full flex justify-center items-center mb-6 shrink-0"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                >
                    <div className='w-2/3 flex'>
                        <div className="relative w-full max-sm:w-full">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={handleSearch}
                                placeholder="Поиск по названию или SKU..."
                                className={cn(
                                    'w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border backdrop-blur-md',
                                    'focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30',
                                    'placeholder:text-muted-foreground/60 transition-all duration-200 bg-background/50 border-muted-foreground/30',
                                )}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Products Grid */}
                {currentItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                            'flex flex-col items-center justify-center py-32 gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/30',
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
                                    'text-xs underline underline-offset-4 transition-colors text-muted-foreground hover:text-foreground'
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
                                {currentItems.map((product: ProductShort, i) => (
                                    <motion.div
                                        key={product._id}  // ✅ ИСПРАВЛЕНО: было product.id
                                        layout
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.25, delay: i * 0.04 }}
                                        className={cn(
                                            'group relative rounded-3xl p-6 cursor-pointer transition-all duration-300',
                                            'border backdrop-blur-sm',
                                            'min-h-60 sm:min-h-70 h-auto',
                                            'flex flex-col bg-foreground/5 border-foreground/10 hover:bg-foreground/15 hover:border-foreground/30'
                                        )}
                                    >
                                        <div className="flex flex-col h-full">
                                            {/* Avatar + Название */}
                                            <div className="flex items-start gap-5 mb-4">
                                                <ProductAvatar
                                                    name={product.name}
                                                    productId={product._id}  // ✅ ИСПРАВЛЕНО: было String(product.id)
                                                    size="lg"
                                                />
                                                <div className="flex-1 min-w-0 w-full">
                                                    <h2 className="text-lg sm:text-xl font-semibold leading-tight pr-6 truncate text-white">
                                                        {product.name}
                                                    </h2>

                                                    {/* Размеры — простая проверка */}
                                                    {product.width && product.height && product.length && (
                                                        <div className="mt-2">
                                                            <span className={cn(
                                                                "inline-flex items-center text-foreground gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all backdrop-blur-xl cursor-default select-none",
                                                                "bg-foreground/10 border-foreground/10",
                                                                "hover:bg-foreground/20 hover:border-foreground/20"
                                                            )}>
                                                                <span className="font-mono text-foreground tracking-wide">
                                                                    {product.width}
                                                                    <span className="text-foreground/30 px-0.5">×</span>
                                                                    {product.height}
                                                                    <span className="text-foreground/30 px-0.5">×</span>
                                                                    {product.length}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* SKU */}
                                            <div className="flex-1 flex flex-col gap-3">
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <span className={cn(
                                                        'font-mono px-2.5 py-1 rounded-lg text-xs tracking-wide border bg-foreground/5 border-foreground/10'
                                                    )}>
                                                        {product.sku || '—'}
                                                    </span>
                                                </p>

                                                {/* Категория */}
                                                {product.categoryId && (
                                                    <p className={cn(
                                                        'text-xs px-2 py-1 rounded-md inline-block w-fit bg-foreground/5 text-foreground/70'
                                                    )}>
                                                        {product.categoryId}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {product.isIPPC_Certified && (
                                                    <span className={cn(
                                                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide border backdrop-blur-md transition-all',
                                                        'bg-emerald-500/10 text-emerald-700 border-emerald-200/60 hover:bg-emerald-500/20',
                                                        'dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                                                    )}>
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        IPPC Certified
                                                    </span>
                                                )}
                                                {product.isHeatTreated && (
                                                    <span className={cn(
                                                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide border backdrop-blur-md transition-all',
                                                        'bg-orange-500/10 text-orange-700 border-orange-200/60 hover:bg-orange-500/20',
                                                        'dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30'
                                                    )}>
                                                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                                                        Heat Treated
                                                    </span>
                                                )}
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