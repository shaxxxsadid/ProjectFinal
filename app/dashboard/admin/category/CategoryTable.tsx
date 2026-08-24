'use client';
import { useMemo, useState, useCallback } from "react";
import { Pagination } from "@/app/components/ui/pagination";
import { CategoryParentRef, CategoryShort } from "@/types/store.types";
import { useCategoryStore } from "@/app/store/categoryStore";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 7;

export const CategoryTable = () => {
    const { categories, setSelectedCategory, selectedCategory } = useCategoryStore();
    const [page, setPage] = useState(1);

    // 1. Преобразуем плоский список в иерархический порядок
    const hierarchicalCategories = useMemo(() => {
        if (!categories || categories.length === 0) return [];

        const childrenMap = new Map<string, CategoryShort[]>();
        const roots: CategoryShort[] = [];

        categories.forEach(cat => {
            // Безопасно извлекаем ID родителя (строка или объект)
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

        const result: CategoryShort[] = [];

        const traverse = (nodes: CategoryShort[]) => {
            // Сортируем элементы одного уровня по коду для стабильного отображения
            nodes.sort((a, b) => a.code.localeCompare(b.code));
            for (const node of nodes) {
                result.push(node);
                const children = childrenMap.get(node._id) || [];
                if (children.length > 0) {
                    traverse(children);
                }
            }
        };

        traverse(roots);
        return result;
    }, [categories]);

    const totalPages = Math.max(1, Math.ceil(hierarchicalCategories.length / PAGE_SIZE));
    
    // 2. Применяем пагинацию уже к иерархически отсортированному списку
    const currentCategories = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return hierarchicalCategories.slice(start, start + PAGE_SIZE);
    }, [hierarchicalCategories, page]);

    const handlePageChange = useCallback((p: number) => setPage(p), []);

    return (
        <div className="w-full flex flex-col justify-between min-h-134 gap-4">
            <div className="w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/2">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-foreground/10 bg-foreground/5">
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Level</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Attributes</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                        No categories found
                                    </td>
                                </tr>
                            ) : (
                                currentCategories.map((category: CategoryShort) => {
                                    const isActive = selectedCategory
                                        ? String(selectedCategory._id) === String(category._id)
                                        : false;
                                    
                                    // Вычисляем отступ: level 1 = 0px, level 2 = 24px, level 3 = 48px
                                    const indentPx = (category.level - 1) * 24;

                                    return (
                                        <tr
                                            key={String(category._id)}
                                            onClick={() => setSelectedCategory(category)}
                                            className={cn(
                                                'cursor-pointer border-b border-foreground/5 last:border-0 transition-colors duration-150',
                                                isActive ? 'bg-foreground/10' : 'hover:bg-foreground/5'
                                            )}
                                        >
                                            <td className="px-4 py-3">
                                                <div 
                                                    className="flex items-center gap-3 min-w-0"
                                                    style={{ paddingLeft: `${indentPx}px` }}
                                                >
                                                    {/* Визуальный маркер для подкатегорий */}
                                                    {category.level > 1 && (
                                                        <span className="text-foreground/30 text-xs select-none shrink-0 font-mono">
                                                            └─
                                                        </span>
                                                    )}
                                                    
                                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center overflow-hidden">
                                                        <span className="text-sm font-bold text-foreground/40 uppercase">
                                                            {category.name?.slice(0, 2) || '??'}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium truncate leading-tight text-foreground">
                                                            {category.name}
                                                        </span>
                                                        <span className="font-mono text-[10px] tracking-wide text-foreground/50 truncate">
                                                            {category.code || '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/80">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                                    {category.level}
                                                </span>
                                            </td>
                                            
                                            <td className="px-4 py-3">
                                                <span className="text-foreground/60">
                                                    {category.attributes?.length ? `${category.attributes.length} attr.` : '—'}
                                                </span>
                                            </td>
                                            
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border whitespace-nowrap',
                                                    category.isActive
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                )}>
                                                    <span className={cn(
                                                        'w-1.5 h-1.5 rounded-full',
                                                        category.isActive ? 'bg-emerald-500' : 'bg-red-500'
                                                    )} />
                                                    {category.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center pt-4 border-t border-foreground/10">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
            )}
        </div>
    );
};