import React, { useState } from 'react';
import { useAdminCategories, useToggleCategory, useReorderCategories, useDeleteCategory } from '@/hooks/useCategories';
import { AdminCategory, ReorderAdminCategoryDto } from '@/types/category';
import { CategoryModal } from './category-modal';
import { Plus, Search, Edit2, Archive, CheckCircle, Save, Trash2 } from 'lucide-react';
// Helper to render icon by key - I'll need to import the MAP or duplicate it? 
// Better to export the Icon component or a helper from icon-picker.
// Use a small helper here for now or just text if icon is missing.
// Actually, I can just use the Lucide icons if I import them.
// Let's modify IconPicker to export the map or a component to render icon.
// For now, I'll just rely on text or simple placeholder if I can't easily get the icon component.
// Wait, I can't import ICON_MAP easily if it's not exported.
// I should have exported `ICON_MAP` or a `CategoryIcon` component.
// I will update `icon-picker.tsx` to export a `CategoryIcon` component first to make this clean.



export const CategoriesPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [includeInactive, setIncludeInactive] = useState(true);
    const [sort, setSort] = useState('sortOrder');

    // Local state for reordering
    const [reorderMap, setReorderMap] = useState<Record<number, number>>({});

    const { data: categories, isLoading } = useAdminCategories({ includeInactive, search, sort });
    const toggleMutation = useToggleCategory();
    const reorderMutation = useReorderCategories();
    const deleteMutation = useDeleteCategory();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<AdminCategory | undefined>(undefined);

    const handleEdit = (category: AdminCategory) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCategory(undefined);
        setIsModalOpen(true);
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
        if (window.confirm(`Are you sure you want to delete "${name}"? This will also remove its link from any brands.`)) {
            deleteMutation.mutate(id);
        }
    };

    const hasReorderChanges = Object.keys(reorderMap).length > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Master Categories</h1>
                    <p className="text-slate-500 mt-1">Manage global product categories and icons.</p>
                </div>
                <div className="flex gap-2">
                    {hasReorderChanges && (
                        <button
                            onClick={handleSaveOrder}
                            disabled={reorderMutation.isPending}
                            className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors shadow-sm"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Order ({Object.keys(reorderMap).length})
                        </button>
                    )}
                    <button
                        onClick={handleAdd}
                        className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeInactive}
                            onChange={(e) => setIncludeInactive(e.target.checked)}
                            className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span>Show Inactive</span>
                    </label>

                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="sortOrder">Sort by Order</option>
                        <option value="name">Sort by Name</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase w-16">Icon</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Name / Slug</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase w-32">Sort Order</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading categories...</td></tr>
                        ) : categories?.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">No categories found.</td></tr>
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
                                                <div className="text-xs">No Img</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{cat.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{cat.slug}</div>
                                        {cat.description && <div className="text-xs text-slate-500 mt-1">{cat.description}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleMutation.mutate(cat.id)}
                                            disabled={toggleMutation.isPending}
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border transition-colors ${cat.isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                                }`}
                                        >
                                            {cat.isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <Archive className="w-3 h-3 mr-1" />}
                                            {cat.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            value={reorderMap[cat.id] ?? cat.sortOrder}
                                            onChange={(e) => handleSortChange(cat.id, e.target.value)}
                                            className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-center"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                                            title="Edit Category"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id, cat.name)}
                                            disabled={deleteMutation.isPending}
                                            className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                                            title="Delete Category"
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
            />
        </div>
    );
};
