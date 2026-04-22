// components/ui/admin/modal/StokCrudModal.tsx
'use client';

import { StokeShort, ProductShort, WarehouseShort } from "@/types/store.types";
import { FieldConfig, FieldOption, FormModal } from "../../modal";
interface StockUpdateData {
  batchNumber?: string;
  productId?: string;
  warehouseId?: string;
  quantity?: number;
  available?: number;
  reserved?: number;
  expiryDate?: string;
}

interface StockCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StockUpdateData) => Promise<{ success: boolean; error?: string }>;
  mode?: 'create' | 'edit';
  initialValues?: Partial<StokeShort>;
  products: ProductShort[]; // 🔧 Добавляем список продуктов
  warehouses: WarehouseShort[]; // 🔧 Добавляем список складов
}

export const StockCrudModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialValues,
  products,
  warehouses,
}: StockCrudModalProps) => {
  // 🔧 Создаем опции для селекта продуктов
  const productOptions: FieldOption[] = products.map(p => ({
    value: p._id,
    label: `${p.name} (${p.sku})`,
  }));

  // 🔧 Создаем опции для селекта складов
  const warehouseOptions: FieldOption[] = warehouses.map(w => ({
    value: w._id,
    label: `${w.name} (${w.code})`,
  }));

  const fields: FieldConfig[] = [
    {
      name: 'batchNumber',
      label: 'Batch number',
      type: 'text',
      required: mode === 'create',
      initialValue: initialValues?.batchNumber || '',
      placeholder: 'BATCH-001',
    },
    {
      name: 'productId',
      label: 'Product',
      type: 'select', // 🔧 Меняем на select
      required: true,
      initialValue: initialValues?.productId || '',
      options: productOptions,
    },
    {
      name: 'warehouseId',
      label: 'Warehouse',
      type: 'select', // 🔧 Меняем на select
      required: true,
      initialValue: initialValues?.warehouseId || '',
      options: warehouseOptions,
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: 'number',
      required: mode === 'create',
      initialValue: initialValues?.quantity?.toString() || '',
      placeholder: '0',
    },
    {
      name: 'available',
      label: 'Available',
      type: 'number',
      initialValue: initialValues?.available?.toString() || '',
      placeholder: '0',
    },
    {
      name: 'reserved',
      label: 'Reserved',
      type: 'number',
      initialValue: initialValues?.reserved?.toString() || '',
      placeholder: '0',
    },
    {
      name: 'expiryDate',
      label: 'Expiry date',
      type: 'text',
      initialValue: initialValues?.expiryDate || '',
      placeholder: 'YYYY-MM-DD',
    },
  ];

  const handleFormSubmit = async (data: Record<string, string>) => {
    // В режиме edit отправляем только заполненные поля
    const filtered = mode === 'edit'
      ? Object.fromEntries(Object.entries(data).filter(([, v]) => v.trim() !== ''))
      : data;

    // 🔁 Конвертируем числовые значения
    const payload: StockUpdateData = { ...filtered };
    
    // Явно преобразуем строки в числа или undefined
    if (payload.quantity !== undefined && String(payload.quantity).trim() !== '') {
      payload.quantity = Number(payload.quantity);
    }
    if (payload.available !== undefined && String(payload.available).trim() !== '') {
      payload.available = Number(payload.available);
    }
    if (payload.reserved !== undefined && String(payload.reserved).trim() !== '') {
      payload.reserved = Number(payload.reserved);
    }

    return onSubmit(payload);
  };

  return (
    <FormModal
      key={initialValues ? JSON.stringify(initialValues) : 'new'}
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create stock item' : 'Edit stock item'}
      description={mode === 'edit' ? 'Leave fields empty to keep current values' : 'Fill in stock details'}
      fields={fields}
      onSubmit={handleFormSubmit}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
      mode={mode}
    />
  );
};