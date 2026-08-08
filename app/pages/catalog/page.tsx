'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader } from '@/app/components/ui/loader';
import { BackgroundBeams } from '@/app/components/ui/BackgroundBeams';
import { Pagination } from '@/app/components/ui/pagination';
import { useDebounce } from '@/app/hooks/debounce';
import { useProductsStore } from '@/app/store/productStore';
import { ProductShort } from '@/types/store.types';
import ProductAvatar from '@/app/components/ui/ProductAvatar';
import { ProductDetailModal } from '@/app/components/ui/product/modal/ProductDetailModal';

export default function ProductsCatalogPage() {
  const {
    products,
    isLoading,
    searchProducts,
    setProductPage,
    fetchProducts,
    selectedProduct,
    setSelectedProduct,
    avatarVersions,
  } = useProductsStore();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchInput = useDebounce(searchInput, 500);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
  const currentItems = useMemo(
    () => products.filteredItems.slice(startIndex, startIndex + products.pagination.limit),
    [products.filteredItems, startIndex, products.pagination.limit]
  );

  // Мемоизируем обработчик клика
  const handleProductClick = useCallback((product: ProductShort) => {
    setSelectedProduct(product);
  }, [setSelectedProduct]);

  if (isLoading) return <Loader text="Загружаем каталог..." />;

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
      'overflow-hidden flex flex-col',
      "bg-background text-foreground",
    )}>
      <BackgroundBeams className='bg-background h-screen text-foreground' intensity="medium" />
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 max-h-screen">

        {/* Header */}
        <motion.div
          className="mb-6 flex w-full flex-col justify-center sm:flex-row sm:items-end gap-4 shrink-0"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className='w-full sm:w-2/3 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4'>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Warehouse / Каталог
              </p>
              <h1 className="text-4xl font-semibold tracking-tight">Товары</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-sm border backdrop-blur-sm bg-background/5 border-background/10'
                )}>
                  {products.pagination.page} / {products.pagination.totalPages} стр.
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          className="w-full flex justify-center mb-6 shrink-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className='w-full sm:w-2/3 flex'>
            <div className="relative w-full">
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
        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-4 flex-1 overflow-hidden lg:min-h-160 sm:min-h-120">
          {currentItems.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20 gap-3 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <svg className="w-10 h-10 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <p className="text-sm text-muted-foreground">Ничего не найдено</p>
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); searchProducts(''); }}
                  className={cn(
                    'text-sm underline underline-offset-4 transition-colors text-muted-foreground hover:text-foreground'
                  )}
                >
                  Сбросить поиск
                </button>
              )}
            </motion.div>
          ) : (
            <div className='flex w-full justify-center min-h-120 sm:min-h-80 lg:min-h-90'>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full sm:w-2/3 max-w-7xl">
                {currentItems.map((product: ProductShort) => (
                  <motion.div
                    key={String(product._id)}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => handleProductClick(product)}
                    className={cn(
                      'group relative rounded-3xl p-6 cursor-pointer transition-all duration-300',
                      'border backdrop-blur-sm bg-foreground/5 border-foreground/10',
                      'hover:bg-foreground/10 hover:border-foreground/25 hover:shadow-xl',
                      'min-h-72 flex flex-col justify-between'
                    )}
                  >
                    {/* Верх: Аватар + Имя + Цена */}
                    <div className="flex items-start gap-5">
                      <ProductAvatar
                        name={product.name}
                        productId={product._id}
                        avatarVersion={avatarVersions[String(product._id)]}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h2 className="text-lg font-semibold leading-snug truncate text-foreground/90">
                            {product.name}
                          </h2>
                          {product.price != null && (
                            <span className="shrink-0 font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                              {product.price.toLocaleString('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          )}
                        </div>
                        {/* Габариты и Вес в одну строку */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground/80">
                          {product.width && product.height && product.length && (
                            <span className="font-mono">
                              {product.width}×{product.height}×{product.length} см
                            </span>
                          )}
                          {product.weight != null && (
                            <span className="font-mono">{product.weight} кг</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Низ: SKU + Сертификаты */}
                    <div className="mb-4 pt-3 border-t border-foreground/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-md text-muted-foreground">Код товара:</span>
                        <span className="font-mono text-xs px-2 py-1 rounded-md bg-foreground/5 text-foreground/60 border border-foreground/10">
                          {product.sku || '—'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {product.isIPPC_Certified && (
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                            'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                          )}>
                            IPPC
                          </span>
                        )}
                        {product.isHeatTreated && (
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                            'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400'
                          )}>
                            HT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover hint */}
                    <div className={cn(
                      'absolute bottom-4 right-4 flex items-center gap-1.5 text-xs text-muted-foreground/50',
                      'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                    )}>
                      Подробнее
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
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

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        avatarVersion={selectedProduct ? (avatarVersions[String(selectedProduct._id)] ?? 0) : 0}
      />
    </div>
  );
}