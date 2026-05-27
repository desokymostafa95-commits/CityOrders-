import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AdminMarketSector } from '@/types/category';
import { useCreateMarketSector, useUpdateMarketSector } from '@/hooks/useCategories';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    iconKey: z.string().optional(),
    image: z.instanceof(File).optional(),
    sortOrder: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
});

type SectorFormInput = z.input<typeof schema>;
type SectorFormValues = z.output<typeof schema>;

interface SectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    sector?: AdminMarketSector;
}

export const SectorModal: React.FC<SectorModalProps> = ({ isOpen, onClose, sector }) => {
    const { language } = useTranslation();
    const createMutation = useCreateMarketSector();
    const updateMutation = useUpdateMarketSector();

    const { control, handleSubmit, reset, formState: { errors } } = useForm<SectorFormInput, unknown, SectorFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            description: '',
            iconKey: '',
            sortOrder: 0,
            isActive: true,
        },
    });

    useEffect(() => {
        reset({
            name: sector?.name || '',
            description: sector?.description || '',
            iconKey: sector?.iconKey || '',
            sortOrder: sector?.sortOrder || 0,
            isActive: sector?.isActive ?? true,
        });
    }, [sector, isOpen, reset]);

    const onSubmit = (data: SectorFormValues) => {
        if (sector) {
            updateMutation.mutate({ id: sector.id, data }, { onSuccess: onClose });
        } else {
            createMutation.mutate(data, { onSuccess: onClose });
        }
    };

    if (!isOpen) return null;

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold">{sector ? 'Edit sector' : 'Add sector'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 text-start">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Name</label>
                        <Controller
                            control={control}
                            name="name"
                            render={({ field }) => (
                                <input
                                    {...field}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Fashion / Electronics"
                                />
                            )}
                        />
                        {errors.name && <p className="text-xs text-red-500">Name is required</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <Controller
                            control={control}
                            name="description"
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="What kind of stores belong here?"
                                />
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Icon key</label>
                            <Controller
                                control={control}
                                name="iconKey"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="tshirt"
                                    />
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Sort order</label>
                            <Controller
                                control={control}
                                name="sortOrder"
                                render={({ field }) => (
                                    <input
                                        name={field.name}
                                        ref={field.ref}
                                        onBlur={field.onBlur}
                                        onChange={field.onChange}
                                        value={typeof field.value === 'number' || typeof field.value === 'string' ? field.value : ''}
                                        type="number"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Image</label>
                        <Controller
                            control={control}
                            name="image"
                            render={({ field: { value, onChange, ...field } }) => (
                                <div className="flex items-center gap-4">
                                    {sector?.imageUrl && !value && (
                                        <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                            <img
                                                src={`${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')}/${sector.imageUrl.replace(/^\//, '')}`}
                                                alt={sector.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <input
                                        {...field}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) onChange(file);
                                        }}
                                        className={cn(
                                            "block w-full text-sm text-slate-500 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20",
                                            language === 'ar' ? "file:ml-4" : "file:mr-4"
                                        )}
                                    />
                                </div>
                            )}
                        />
                    </div>

                    <Controller
                        control={control}
                        name="isActive"
                        render={({ field: { value, onChange } }) => (
                            <label className={cn("flex items-center cursor-pointer", language === 'ar' ? "flex-row-reverse" : "")}>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${value ? 'bg-primary' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? (language === 'ar' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                                </div>
                                <span className={cn("text-sm font-medium text-slate-700", language === 'ar' ? "mr-3" : "ml-3")}>
                                    {value ? 'Active' : 'Inactive'}
                                </span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={value}
                                    onChange={(e) => onChange(e.target.checked)}
                                />
                            </label>
                        )}
                    />

                    <div className={cn("pt-4 flex justify-end gap-3", language === 'ar' ? "flex-row-reverse" : "")}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm disabled:opacity-50 transition-colors"
                        >
                            {isPending ? 'Saving...' : 'Save sector'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
