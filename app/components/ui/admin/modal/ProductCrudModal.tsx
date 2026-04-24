// components/providers/CrudProductModal.tsx
'use client';

import { ProductShort } from "@/types/store.types";
import { FieldConfig, FormModal } from "../../modal";

interface ProductUpdateData {
  name?: string;
  sku?: string;
  categoryId?: string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  loadCapacity?: number;
  isHeatTreated?: boolean;
  isIPPC_Certified?: boolean;
  avatarUrl?: string; // Придёт как Base64 строка
}

interface CrudProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductUpdateData) => Promise<{ success: boolean; error?: string }>;
  mode?: 'create' | 'edit';
  initialValues?: Partial<ProductShort>;
}

export const CrudProductModal = ({
  isOpen, onClose, onSubmit, mode = 'create', initialValues,
}: CrudProductModalProps) => {
  const fields: FieldConfig[] = [
    {
      name: 'avatarUrl',
      label: 'Product image',
      type: 'file',
      accept: 'image/png,image/jpeg,image/webp',
      placeholder: 'PNG, JPG or WebP up to 5MB',
      meta: { fallbackName: initialValues?.name || 'Product' },
    },

    { name: 'name', label: 'Product name', type: 'text', required: mode === 'create', initialValue: initialValues?.name || '', placeholder: 'Enter product name' },
    { name: 'sku', label: 'SKU', type: 'text', required: mode === 'create', initialValue: initialValues?.sku || '', placeholder: 'e.g. PAL-EU-001' },
    { name: 'categoryId', label: 'Category ID', type: 'text', initialValue: initialValues?.categoryId || '', placeholder: 'Enter category ID' },
    
    // size width x height
    {
      name: 'size',
      label: 'Size',
      type: 'group',
      gridCols: 3,
      children: [
        { name: 'width', label: 'Width (mm)', type: 'number', initialValue: initialValues?.width?.toString() || '', placeholder: '800', min: '0', step: '0.1' },
        { name: 'height', label: 'Height (mm)', type: 'number', initialValue: initialValues?.height?.toString() || '', placeholder: '144', min: '0', step: '0.1' },
        { name: 'length', label: 'Length (mm)', type: 'number', initialValue: initialValues?.length?.toString() || '', placeholder: '1200', min: '0', step: '0.1' },
      ],
    },
    
    { name: 'weight', label: 'Weight (kg)', type: 'number', initialValue: initialValues?.weight?.toString() || '', placeholder: '25', min: '0', step: '0.1' },

    {
      name: 'certifications',
      label: 'Certifications',
      type: 'group',
      gridCols: 2,
      children: [
        { name: 'isHeatTreated', label: 'Heat treated', type: 'checkbox', initialValue: initialValues?.isHeatTreated ? 'true' : '' },
        { name: 'isIPPC_Certified', label: 'IPPC certified', type: 'checkbox', initialValue: initialValues?.isIPPC_Certified ? 'true' : '' },
      ],
    },
  ];


  const handleFormSubmit = async (data: Record<string, string>) => {
    const filtered = mode === 'edit'
      ? Object.fromEntries(Object.entries(data).filter(([, v]) => {
        if (['isHeatTreated', 'isIPPC_Certified'].includes(data.name)) return true;
        return v.trim() !== '';
      }))
      : data;

    const typedData: ProductUpdateData = { ...filtered };

    ['length', 'width', 'height', 'weight'].forEach((field) => {
      if (filtered[field] && filtered[field].trim() !== '') {
        typedData[field as keyof ProductUpdateData] = parseFloat(filtered[field]) as never;
      }
    });

    if (filtered.isHeatTreated !== undefined) typedData.isHeatTreated = filtered.isHeatTreated === 'true';
    if (filtered.isIPPC_Certified !== undefined) typedData.isIPPC_Certified = filtered.isIPPC_Certified === 'true';

    return onSubmit(typedData);
  };

  return (
    <FormModal
      key={initialValues ? JSON.stringify(initialValues) : 'new'}
      isOpen={isOpen} onClose={onClose}
      title={mode === 'create' ? 'Create product' : 'Edit product'}
      description={mode === 'edit' ? 'Leave fields empty to keep current values' : 'Fill in product details'}
      fields={fields} onSubmit={handleFormSubmit}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'} mode={mode}
    />
  );
};