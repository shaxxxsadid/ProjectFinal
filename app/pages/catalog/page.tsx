'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader } from '@/app/components/ui/loader';
import { BackgroundBeams } from '@/app/components/ui/BackgroundBeams';
import { Pagination } from '@/app/components/ui/pagination';
import { useDebounce } from '@/app/hooks/debounce';
import { useProductsStore } from '@/app/store/productStore';
import { useCategoryStore } from '@/app/store/categoryStore';
import { CategoryParentRef, CategoryShort, ProductShort } from '@/types/store.types';
import { FaCartPlus, FaCartShopping } from 'react-icons/fa6';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/app/store/cartStore';

import ProductAvatar from '@/app/components/ui/ProductAvatar';
import { ProductDetailModal } from '@/app/components/ui/product/modal/ProductDetailModal';
import { CartDrawer } from '@/app/components/ui/Cart/CartDrawer';
import { CheckoutModal } from '@/app/components/ui/Cart/CheckoutModal';

export default function ProductsCatalogPage() {
  const {
    products,
    isLoading,
    searchProducts,
    setProductPage,
    fetchProducts,
    avatarVersions,
    categoryFilter, // Теперь это string[] | null
    setCategoryFilter,
  } = useProductsStore();

  const { categories, fetchCategories } = useCategoryStore();

  const { items: cartItems, addProduct } = useCartStore();

  const [searchInput, setSearchInput] = useState('');
  const [catalogSelectedProduct, setCatalogSelectedProduct] = useState<ProductShort | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const debouncedSearchInput = useDebounce(searchInput, 500);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    searchProducts(debouncedSearchInput);
  }, [debouncedSearchInput, searchProducts]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  // В товаре хранится полный путь categoryId: [level1, level2, ..., leaf].
  // Поэтому для фильтра достаточно передать только выбранную категорию:
  // совпадение с любым элементом product.categoryId автоматически включает её потомков.
  const handleCategoryClick = useCallback((categoryId: string | null) => {
    setProductPage(1);

    if (!categoryId) {
      setCategoryFilter(null);
      return;
    }

    setCategoryFilter([String(categoryId)]);
  }, [setCategoryFilter, setProductPage]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    (categories ?? []).forEach((c) => map.set(String(c._id), c.name));
    return map;
  }, [categories]);

  // Подсветка родителей в сайдбаре
  const activeParentIds = useMemo(() => {
    if (!categoryFilter || categoryFilter.length === 0 || !categories) return [];
    const parents = new Set<string>();

    categoryFilter.forEach((filterId) => {
      let currentId: string | null = filterId;
      while (currentId) {
        const cat = categories.find((c) => String(c._id) === String(currentId));
        if (cat && cat.parent) {
          const parentId = typeof cat.parent === 'string'
            ? cat.parent
            : (cat.parent as CategoryParentRef)._id;

          if (parentId) {
            parents.add(parentId);
            currentId = parentId;
          } else {
            break;
          }
        } else {
          break;
        }
      }
    });

    return Array.from(parents);
  }, [categoryFilter, categories]);

  // Иерархия для сайдбара
  const hierarchicalCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    const childrenMap = new Map<string, typeof categories>();
    const roots: typeof categories = [];

    categories.forEach((cat) => {
      const parentId = typeof cat.parent === 'string'
        ? cat.parent
        : (cat.parent && typeof cat.parent === 'object' ? (cat.parent as CategoryParentRef)._id : null);

      if (!parentId) {
        roots.push(cat);
      } else {
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push(cat);
      }
    });

    const result: Array<typeof categories[0] & { indent: number }> = [];

    const traverse = (nodes: typeof categories, level: number) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      for (const node of nodes) {
        result.push({ ...node, indent: level });
        const children = childrenMap.get(node._id) || [];
        if (children.length > 0) {
          traverse(children, level + 1);
        }
      }
    };

    traverse(roots, 0);
    return result;
  }, [categories]);

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

  const handleProductClick = useCallback((product: ProductShort) => {
    setCatalogSelectedProduct(product);
  }, []);

  const cartQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const handleAddToCart = useCallback((product: ProductShort) => {
    const result = addProduct(product);

    if (!result.success) {
      toast.error(result.error || 'Не удалось добавить товар');
      return;
    }

    toast.success('Товар добавлен в корзину');
  }, [addProduct]);

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

  const isAllCategoriesActive = !categoryFilter || categoryFilter.length === 0;

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
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className={cn(
                  'relative inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium',
                  'cursor-pointer border-foreground/15 bg-foreground/5 text-foreground',
                  'hover:bg-foreground/10 transition-colors'
                )}
              >
                <FaCartShopping />
                <span className="hidden sm:inline">Корзина</span>
                {cartQuantity > 0 && (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-teal-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {cartQuantity > 99 ? '99+' : cartQuantity}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-sm border backdrop-blur-sm bg-background/5 border-background/10'
                )}>
                  {products.pagination.page} / {actualTotalPages} стр.
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

        {/* Categories sidebar + Products Grid */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Categories Sidebar */}
          {(categories?.length ?? 0) > 0 && (
            <motion.div
              className="w-full lg:w-64 shrink-0 lg:sticky lg:top-6"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
            >
              <div className="group/categories relative rounded-2xl border border-foreground/10 bg-foreground/5 backdrop-blur-md overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-foreground/10 bg-background/30">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Категории
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground/60">
                    {(categories?.length ?? 0) + 1}
                  </span>
                </div>

                <div
                  className={cn(
                    'relative overflow-y-auto overflow-x-auto lg:overflow-x-hidden',
                    'max-h-[50vh] lg:max-h-[calc(100vh-10rem)] scroll-smooth',
                    'p-3',
                    '[&::-webkit-scrollbar]:hidden [scrollbar-width:none]'
                  )}
                >
                  <div className="flex lg:flex-col gap-2">
                    <button
                      onClick={() => handleCategoryClick(null)}
                      className={cn(
                        'shrink-0 lg:shrink lg:w-full text-left px-3 py-2 rounded-xl text-sm font-medium border transition-colors duration-200',
                        isAllCategoriesActive
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-foreground/5 text-muted-foreground border-foreground/10 hover:border-foreground/25'
                      )}
                    >
                      Все категории
                    </button>

                    {hierarchicalCategories.map((category) => {
                      const indentPx = category.indent * 16;
                      const isDirectlyActive = categoryFilter?.includes(category._id) ?? false;
                      const isParentOfActive = activeParentIds.includes(category._id);

                      return (
                        <button
                          key={category._id}
                          onClick={() => handleCategoryClick(category._id)}
                          className={cn(
                            'shrink-0 lg:shrink lg:w-full text-left py-2 rounded-xl text-sm font-medium border transition-colors duration-200 flex items-center gap-2',
                            isDirectlyActive
                              ? 'bg-foreground text-background border-foreground'
                              : isParentOfActive
                                ? 'bg-foreground/20 text-foreground border-foreground/30 font-semibold'
                                : 'bg-foreground/5 text-muted-foreground border-foreground/10 hover:border-foreground/25'
                          )}
                          style={{ paddingLeft: `${12 + indentPx}px` }}
                        >
                          {category.indent > 0 && (
                            <span className={cn(
                              "text-xs select-none shrink-0 font-mono",
                              (isDirectlyActive || isParentOfActive) ? "text-background/50" : "text-foreground/30"
                            )}>
                              └─
                            </span>
                          )}
                          <span className="truncate">{category.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Grid */}
          <div className="relative w-full flex-1 min-w-0 py-4 lg:min-h-160 sm:min-h-120">
            {currentItems.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center py-20 gap-3 text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
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
              <div className='flex w-full min-h-120 sm:min-h-80 lg:min-h-90'>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${products.pagination.page}-${products.searchQuery}`}
                    initial={{ opacity: 1, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 w-full"
                  >
                    {currentItems.map((product: ProductShort, index) => {
                      //  Получаем самую конкретную категорию (последний элемент массива)
                      const productCategoryIds = Array.isArray(product.categoryId)
                        ? product.categoryId
                        : [product.categoryId];
                      const mostSpecificCategoryId = productCategoryIds[productCategoryIds.length - 1];
                      const categoryName = categoryNameById.get(String(mostSpecificCategoryId));

                      return (
                        <motion.div
                          key={String(product._id)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.04,
                            ease: 'easeOut',
                          }}
                          onClick={() => handleProductClick(product)}
                          className={cn(
                            'group relative rounded-3xl p-6 cursor-pointer',
                            'transition-[background-color,border-color,box-shadow] duration-300',
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
                                <div className="min-w-0">
                                  {categoryName && (
                                    <span className="inline-block mb-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-400">
                                      {categoryName}
                                    </span>
                                  )}
                                  <h2 className="text-lg font-semibold leading-snug truncate text-foreground/90">
                                    {product.name}
                                  </h2>
                                </div>
                                {!!product.price && (
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
                                {!!product.weight && (
                                  <span className="font-mono">{product.weight} кг</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Низ: SKU + Сертификаты */}
                          <div className="mb-2 pt-3 border-t border-foreground/10 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-md text-muted-foreground">Код товара:</span>
                              <span className="font-mono text-xs px-2 py-1 rounded-md bg-foreground/5 text-foreground/60 border border-foreground/10">
                                {product.sku || '—'}
                              </span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
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
                              {product.certifications
                                ?.filter((c) => c.value)
                                .map((c) => (
                                  <span
                                    key={c.name}
                                    className={cn(
                                      'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                                      'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400'
                                    )}
                                  >
                                    {c.name}
                                  </span>
                                ))}
                            </div>
                          </div>

                          {/* Логистика */}
                          {(product.storageType || !!product.loadCapacity || !!product.volumeM3 || !!product.palletQuantity || product.expiryDate) && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground/70 mb-2">
                              {product.storageType && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-foreground/5 border border-foreground/10 capitalize">
                                  {product.storageType}
                                </span>
                              )}
                              {!!product.loadCapacity && (
                                <span className="font-mono">до {product.loadCapacity} кг</span>
                              )}
                              {!!product.volumeM3 && (
                                <span className="font-mono">{product.volumeM3} м³</span>
                              )}
                              {!!product.palletQuantity && (
                                <span className="font-mono">{product.palletQuantity} шт/паллет</span>
                              )}
                              {product.expiryDate && (
                                <span className="font-mono text-amber-600 dark:text-amber-400">
                                  годен до {new Date(product.expiryDate).toLocaleDateString('ru-RU')}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Упаковка */}
                          {(product.packaging?.unit || !!product.packaging?.quantityPerUnit) && (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground/70 mb-2">
                              <span className="text-muted-foreground/50">Упаковка:</span>
                              {!!product.packaging?.quantityPerUnit && (
                                <span className="font-mono">{product.packaging.quantityPerUnit}</span>
                              )}
                              {product.packaging?.unit && (
                                <span className="font-mono">{product.packaging.unit}</span>
                              )}
                            </div>
                          )}

                          {/* Условия хранения */}
                          {(product.storageConditions?.temperatureMin != null || product.storageConditions?.temperatureMax != null || product.storageConditions?.humidityMax != null) && (
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {(product.storageConditions?.temperatureMin != null || product.storageConditions?.temperatureMax != null) && (
                                <span className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border',
                                  'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400'
                                )}>
                                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9a3 3 0 00-3 3v5.25a3 3 0 106 0V12a3 3 0 00-3-3zm0 0V4.5" />
                                  </svg>
                                  {product.storageConditions?.temperatureMin ?? '…'}…{product.storageConditions?.temperatureMax ?? '…'}°C
                                </span>
                              )}
                              {product.storageConditions?.humidityMax != null && (
                                <span className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border',
                                  'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
                                )}>
                                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5s6 6.4 6 10.5a6 6 0 11-12 0c0-4.1 6-10.5 6-10.5z" />
                                  </svg>
                                  ≤{product.storageConditions.humidityMax}%
                                </span>
                              )}
                            </div>
                          )}

                          {/* Корзина */}
                          <div className="mt-auto pt-2">
                            <button
                              type="button"
                              disabled={!Number.isFinite(Number(product.price))}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleAddToCart(product);
                              }}
                              className={cn(
                                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                                Number.isFinite(Number(product.price))
                                  ? 'cursor-pointer border-teal-500/20 bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 dark:text-teal-400'
                                  : 'cursor-not-allowed border-foreground/10 bg-foreground/5 text-muted-foreground/50'
                              )}
                            >
                              <FaCartPlus />
                              В корзину
                            </button>
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
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
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

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onBackToCart={() => {
          setIsCheckoutOpen(false);
          setIsCartOpen(true);
        }}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={catalogSelectedProduct}
        onClose={() => setCatalogSelectedProduct(null)}
        avatarVersion={
          catalogSelectedProduct
            ? (avatarVersions[String(catalogSelectedProduct._id)] ?? 0)
            : 0
        }
      />
    </div>
  );
}