import React, { useState } from 'react';
import { useAdminCategories, useDeleteCategory, useMarketSectors, useReorderCategories, useToggleCategory, useToggleMarketSector } from '@/hooks/useCategories';
import { AdminCategory, AdminMarketSector, ReorderAdminCategoryDto } from '@/types/category';
import { CategoryModal } from './category-modal';
import { SectorModal } from './sector-modal';
import { Plus, Search, Edit2, Archive, CheckCircle, Save, Trash2, Layers3 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export const CategoriesPage: React.FC = () => {
    const { t, language } = useTranslation();
    const [search, setSearch] = useState('');
    const [includeInactive, setIncludeInactive] = useState(true);
    const [sort, setSort] = useState('sortOrder');
    const [selectedSectorId, setSelectedSectorId] = useState<number | undefined>(undefined);

    // Local state for reordering
    const [reorderMap, setReorderMap] = useState<Record<number, number>>({});

    const { data: sectors = [] } = useMarketSectors(true);
    const { data: categories, isLoading } = useAdminCategories({ includeInactive, search, sort, marketSectorId: selectedSectorId });
    const toggleMutation = useToggleCategory();
    const toggleSectorMutation = useToggleMarketSector();
    const reorderMutation = useReorderCategories();
    const deleteMutation = useDeleteCategory();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<AdminCategory | undefined>(undefined);
    const [selectedSector, setSelectedSector] = useState<AdminMarketSector | undefined>(undefined);

    const handleEdit = (category: AdminCategory) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCategory(undefined);
        setIsModalOpen(true);
    };

    const handleAddSector = () => {
        setSelectedSector(undefined);
        setIsSectorModalOpen(true);
    };

    const handleEditSector = (sector: AdminMarketSector) => {
        setSelectedSector(sector);
        setIsSectorModalOpen(true);
    };

    const handleSortChange = (id: number, newOrder: string) => {
        const order = parseInt(newOrder);
        if (!isNaN(order)) {
            setReorderMap(prev => ({ ...prev, [id]: order }));
        }
    };

    const handleSaveOrder = () => {
        const updates: ReorderAdminCategoryDto[] = Object.entries(reorderMap).map(([id, order]) => ({
            id: parseInt(id),
            sortOrder: order
        }));

        if (updates.length === 0) return;

        reorderMutation.mutate(updates, {
            onSuccess: () => setReorderMap({})
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (window.confirm(t('categories.confirmDelete').replace('{name}', name))) {
            deleteMutation.mutate(id);
        }
    };

    const hasReorderChanges = Object.keys(reorderMap).length > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{t('categories.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('categories.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    {hasReorderChanges && (
                        <button
                            onClick={handleSaveOrder}
                            disabled={reorderMutation.isPending}
                            className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors shadow-sm"
                        >
                            <Save className="w-4 h-4 mr-2 ml-2" />
                            {t('categories.saveOrder')} ({Object.keys(reorderMap).length})
                        </button>
                    )}
                    <button
                        onClick={handleAdd}
                        className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2 ml-2" />
                        {t('categories.add')}
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-900">Market sectors</div>
                        <div className="text-xs text-slate-500">Top-level marketplace areas above master categories.</div>
                    </div>
                    <button
                        onClick={handleAddSector}
                        className="inline-flex items-center px-3 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2 ml-2" />
                        Add sector
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedSectorId(undefined)}
                        className={cn(
                            "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors",
                            selectedSectorId === undefined
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        <Layers3 className="w-4 h-4" />
                        All sectors
                    </button>
                    {sectors.map((sector) => (
                        <div
                            key={sector.id}
                            className={cn(
                                "inline-flex items-center rounded-md border overflow-hidden",
                                selectedSectorId === sector.id ? "border-primary bg-primary/10" : "border-slate-200 bg-white"
                            )}
                        >
                            <button
                                onClick={() => setSelectedSectorId(sector.id)}
                                className={cn(
                                    "px-3 py-2 text-sm transition-colors",
                                    selectedSectorId === sector.id ? "text-primary font-semibold" : "text-slate-700 hover:bg-slate-50"
                                )}
                            >
                                {sector.name}
                                <span className="text-xs text-slate-400 ml-2 mr-2">({sector.categoriesCount})</span>
                            </button>
                            <button
                                onClick={() => handleEditSector(sector)}
                                className="px-2 py-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                title="Edit sector"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => toggleSectorMutation.mutate(sector.id)}
                                className={cn(
                                    "px-2 py-2 border-s border-slate-200",
                                    sector.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-50"
                                )}
                                title={sector.isActive ? "Active" : "Inactive"}
                            >
                                {sector.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400", language === 'ar' ? "right-3" : "left-3")} />
                        <input
                            type="text"
                            placeholder={t('categories.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={cn(
                                "w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
                                language === 'ar' ? "pl-4 pr-10" : "pl-10 pr-4"
                            )}
                        />
                    </div>

                    <label className={cn("flex items-center text-sm text-slate-600 cursor-pointer", language === 'ar' ? "flex-row-reverse" : "")}>
                        <input
                            type="checkbox"
                            checked={includeInactive}
                            onChange={(e) => setIncludeInactive(e.target.checked)}
                            className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className={cn(language === 'ar' ? "mr-2" : "ml-2")}>{t('categories.showInactive')}</span>
                    </label>

                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="sortOrder">{t('categories.sortByOrder')}</option>
                        <option value="name">{t('categories.sortByName')}</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-start">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase w-16 text-start">{t('categories.icon')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('categories.nameSlug')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">Sector</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('categories.status')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase w-32 text-start">{t('categories.sortOrder')}</th>
                            <th className={cn("px-6 py-3 text-xs font-semibold text-slate-500 uppercase", language === 'ar' ? "text-left" : "text-right")}>{t('categories.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-500">{t('categories.loading')}</td></tr>
                        ) : categories?.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">{t('categories.noCategories')}</td></tr>
                        ) : (
                            categories?.map((cat) => (
                                <tr key={cat.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400">
                                            {cat.imageUrl ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')}/${cat.imageUrl.replace(/^\//, '')}`}
                                                    alt={cat.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-[10px]">{t('categories.noImg')}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-start">
                                        <div className="font-medium text-slate-900">{cat.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{cat.slug}</div>
                                        {cat.description && <div className="text-xs text-slate-500 mt-1">{cat.description}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-start">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            {cat.marketSectorName || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-start">
                                        <button
                                            onClick={() => toggleMutation.mutate(cat.id)}
                                            disabled={toggleMutation.isPending}
                                            className={cn(
                                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border transition-colors",
                                                cat.isActive
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200',
                                                language === 'ar' ? "flex-row-reverse" : ""
                                            )}
                                        >
                                            {cat.isActive ? <CheckCircle className={cn("w-3 h-3", language === 'ar' ? "ml-1" : "mr-1")} /> : <Archive className={cn("w-3 h-3", language === 'ar' ? "ml-1" : "mr-1")} />}
                                            {cat.isActive ? t('categories.active') : t('categories.inactive')}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-start">
                                        <input
                                            type="number"
                                            value={reorderMap[cat.id] ?? cat.sortOrder}
                                            onChange={(e) => handleSortChange(cat.id, e.target.value)}
                                            className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-center"
                                        />
                                    </td>
                                    <td className={cn("px-6 py-4 space-x-2", language === 'ar' ? "text-left" : "text-right")}>
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                                            title={t('categories.edit')}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id, cat.name)}
                                            disabled={deleteMutation.isPending}
                                            className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                category={selectedCategory}
                sectors={sectors}
            />
            <SectorModal
                isOpen={isSectorModalOpen}
                onClose={() => setIsSectorModalOpen(false)}
                sector={selectedSector}
            />
        </div>
    );
};
