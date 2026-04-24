'use client';
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProductShort } from "@/types/store.types";
import { useProductsStore } from "@/app/store/productStore";
import ProductAvatar from "@/app/components/ui/ProductAvatar";
import toast from "react-hot-toast";
import { CrudProductModal } from "@/app/components/ui/admin/modal/ProductCrudModal";

export const ProductDetails = () => {
    const { selectedProduct, setSelectedProduct, deleteProduct, updateProduct, avatarVersions } = useProductsStore();
    const activeProduct: ProductShort | null = selectedProduct ?? null;
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!activeProduct) {
        return <div className="w-full h-90 rounded-3xl border border-transparent" />;
    }

    return (
        <AnimatePresence mode="popLayout">
            <motion.div
                key="details-panel"
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex flex-col gap-5 p-6 bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl shadow-2xl w-full shrink-0 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</span>
                    <button
                        onClick={() => setSelectedProduct(null)}
                        className="p-1 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
                    >✕</button>
                </div>

                {/* Avatar + Name */}
                <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-foreground/5 flex items-center justify-center">
                        <ProductAvatar
                            name={activeProduct.name}
                            productId={activeProduct._id}
                            avatarVersion={avatarVersions[String(activeProduct._id)] ?? 0}
                            size="lg"
                        />
                    </div>

                    <div className="text-center">
                        <h3 className="font-bold text-lg leading-tight">{activeProduct.name}</h3>
                        <span className="font-mono px-2.5 py-1 rounded-lg text-xs tracking-wide border bg-foreground/5 border-foreground/10 text-foreground/50 mt-1 inline-block">
                            {activeProduct.sku}
                        </span>
                    </div>

                    {/* Бейджи */}
                    <div className="flex gap-2">
                        {activeProduct.isIPPC_Certified && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                IPPC Certified
                            </span>
                        )}
                        {activeProduct.isHeatTreated && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border bg-orange-500/10 text-orange-400 border-orange-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                Heat Treated
                            </span>
                        )}
                    </div>
                </div>

                {/* Info Fields */}
                <div className="space-y-1 pt-2">
                    {[
                        { label: 'Product ID', value: activeProduct._id.toString() },
                        { label: 'Category', value: activeProduct.categoryId || 'Unknown' },
                        { label: 'Price', value: activeProduct.price ? `${activeProduct.price.toLocaleString()} ₽` : 'Unknown' },
                        { label: 'Dimensions', value: (activeProduct.length && activeProduct.width && activeProduct.height) ? `${activeProduct.length} × ${activeProduct.width} × ${activeProduct.height} cm` : '—' },
                        { label: 'Weight', value: activeProduct.weight ? `${activeProduct.weight} kg` : '—' },
                        { label: 'Created At', value: activeProduct.createdAt ? new Date(activeProduct.createdAt).toLocaleString() : '—' },
                        { label: 'Updated At', value: activeProduct.updatedAt ? new Date(activeProduct.updatedAt).toLocaleString() : '—' },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-foreground/5 last:border-0">
                            <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider shrink-0">{label}</span>
                            <span className="text-sm text-right truncate font-medium text-foreground/80" title={value}>{value}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-foreground/10">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-teal-500/20 text-teal-500 text-sm font-medium hover:bg-foreground/5 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4.5 1.125 1.125-4.5L16.862 3.487z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={() => {
                            toast.promise(deleteProduct(activeProduct._id), {
                                loading: 'Deleting product...',
                                success: 'Product deleted successfully.',
                                error: 'Failed to delete product.',
                            })
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Delete
                    </button>
                </div>
            </motion.div>
            <CrudProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialValues={activeProduct}
                mode="edit"
                onSubmit={async (data) => {
                    if (!activeProduct?._id) {
                        return { success: false, error: 'Product ID is missing' };
                    }

                    try {
                        const res = await updateProduct(
                            activeProduct._id,
                            data as Omit<ProductShort, '_id' | 'createdAt' | 'updatedAt'>
                        );

                        if (!res.success) {
                            throw new Error(res.error || 'Failed to update product');
                        }

                        toast.success('Product updated successfully');
                        setIsModalOpen(false);
                        return { success: true };

                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Unknown error';
                        toast.error(message);
                        return { success: false, error: message };
                    }
                }}
            />
        </AnimatePresence>
    );
};