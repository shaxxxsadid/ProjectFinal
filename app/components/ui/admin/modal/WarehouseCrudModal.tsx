// components/ui/admin/modal/WarehouseCrudModal.tsx
'use client';

import { WarehouseShort, UserShort } from "@/types/store.types";
import { FieldConfig, FieldOption, FormModal } from "../../modal";

interface WarehouseUpdateData {
    name?: string;
    code?: string;
    type?: string;
    managerId?: string;
    phone?: string;
    email?: string;
    maxPallets?: number;
    totalAreaSqm?: number;
    isActive?: boolean;
}

interface WarehouseCrudModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: WarehouseUpdateData) => Promise<{ success: boolean; error?: string }>;
    mode?: 'create' | 'edit';
    initialValues?: Partial<WarehouseShort>;
    managers?: UserShort[];
}

const WAREHOUSE_TYPES = [
    { value: 'main', label: 'Main store' },
    { value: 'regional', label: 'Regional store' },
];

const STATUS_OPTIONS = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
];

export const WarehouseCrudModal = ({
    isOpen,
    onClose,
    onSubmit,
    mode = 'create',
    initialValues,
    managers = [],
}: WarehouseCrudModalProps) => {
    // Формируем опции для менеджеров
    const managerOptions: FieldOption[] = managers.map(m => ({
        value: String(m._id), // 👈 Ключевое исправление
        label: `${m.firstName || ''} ${m.lastName || ''} (${m.email})`.trim(),
    }));

    const fields: FieldConfig[] = [
        {
            name: 'name',
            label: 'Warehouse Name',
            type: 'text',
            required: true,
            initialValue: initialValues?.name || '',
            placeholder: 'Main Warehouse',
        },
        {
            name: 'code',
            label: 'Code',
            type: 'text',
            required: true,
            initialValue: initialValues?.code || '',
            placeholder: 'WH-001',
        },
        {
            name: 'type',
            label: 'Type',
            type: 'select',
            required: true,
            initialValue: initialValues?.type || '',
            options: WAREHOUSE_TYPES,
        },
        {
            name: 'managerId',
            label: 'Manager',
            type: 'select',
            required: false,
            initialValue: initialValues?.managerId ? String(initialValues.managerId) : '',
            options: managerOptions.length > 0 ? managerOptions : [{ value: '', label: 'No managers available' }],
        },
        {
            name: 'phone',
            label: 'Phone',
            type: 'text',
            initialValue: initialValues?.phone || '',
            placeholder: '+1234567890',
        },
        {
            name: 'email',
            label: 'Email',
            type: 'email',
            initialValue: initialValues?.email || '',
            placeholder: 'warehouse@example.com',
        },
        {
            name: 'maxPallets',
            label: 'Max Pallets',
            type: 'number',
            initialValue: initialValues?.maxPallets?.toString() || '',
            placeholder: '1000',
        },
        {
            name: 'totalAreaSqm',
            label: 'Total Area (sq.m)',
            type: 'number',
            initialValue: initialValues?.totalAreaSqm?.toString() || '',
            placeholder: '5000',
        },
        {
            name: 'isActive',
            label: 'Status',
            type: 'select',
            initialValue: initialValues?.isActive !== undefined
                ? String(initialValues.isActive)
                : 'true',
            options: STATUS_OPTIONS,
        },
    ];

    return (
        <FormModal
            key={initialValues ? JSON.stringify(initialValues) : 'new'}
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'create' ? 'Create Warehouse' : 'Edit Warehouse'}
            description={mode === 'edit' ? 'Leave fields empty to keep current values' : 'Fill in warehouse details'}
            fields={fields}
            onSubmit={onSubmit} // Конвертацию делаем в родительском компоненте
            submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
            mode={mode}
        />
    );
};