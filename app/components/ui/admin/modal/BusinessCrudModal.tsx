// BusinessProfileCrudModal.tsx
'use client';

import { BusinessProfileShort } from "@/types/store.types";
import { FieldConfig, FormModal } from "../../modal";

interface BusinessProfileUpdateData {
  legalName?: string;
  taxId?: string;
  type?: string;
  status?: 'active' | 'inactive';
  avatar?: string;
}

interface BusinessProfileCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BusinessProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
  mode?: 'create' | 'edit';
  initialValues?: Partial<BusinessProfileShort>;
}

const BUSINESS_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Business' },
];


const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const BusinessProfileCrudModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialValues,
}: BusinessProfileCrudModalProps) => {
  const fields: FieldConfig[] = [
    {
      name: 'avatar',
      label: 'Avatar URL',
      type: 'image-url',
      initialValue: initialValues?.avatar || '',
      placeholder: 'https://example.com/avatar.png',
      meta: { fallbackName: initialValues?.legalName || '' },
    },
    {
      name: 'legalName',
      label: 'Legal name',
      type: 'text',
      required: mode === 'create',
      initialValue: initialValues?.legalName || '',
    },
    {
      name: 'taxId',
      label: 'Tax ID',
      type: 'text',
      required: mode === 'create',
      initialValue: initialValues?.taxId || '',
    },
    {
      name: 'type',
      label: 'Business type',
      type: 'select',
      required: mode === 'create',
      initialValue: initialValues?.type || '',
      options: BUSINESS_TYPES,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      initialValue: initialValues?.status || 'active',
      options: STATUS_OPTIONS,
    },
  ];

  const handleFormSubmit = async (data: Record<string, string>) => {
    const filtered = mode === 'edit'
      ? Object.fromEntries(Object.entries(data).filter(([, v]) => v.trim() !== ''))
      : data;

    return onSubmit(filtered as BusinessProfileUpdateData);
  };

  return (
    <FormModal
      key={initialValues ? JSON.stringify(initialValues) : 'new'}
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create business profile' : 'Edit business profile'}
      description={mode === 'edit' ? 'Leave fields empty to keep current values' : 'Fill in business details'}
      fields={fields}
      onSubmit={handleFormSubmit}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
      mode={mode}
    />
  );
};