import React, { useEffect, useMemo, useState } from 'react';
import { Check, Layers3, Plus, Save, Shield, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminRolesApi, type AdminRole } from '@/api/adminRolesApi';
import { ADMIN_PAGE_PERMISSIONS } from '@/data/admin-page-permissions';
import { useTranslation } from '@/context/LanguageContext';

const parsePermissions = (role?: { permissions?: string } | null) => {
    if (!role?.permissions) return [];
    try {
        const value = JSON.parse(role.permissions);
        return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
    } catch {
        return [];
    }
};

type EditableRole = Omit<AdminRole, 'id'> & { id: number | 'new' };

export const RolesPermissionsPage = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [selectedRoleId, setSelectedRoleId] = useState<number | 'new' | null>(null);
    const [roleName, setRoleName] = useState('');
    const [selectedPages, setSelectedPages] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: adminRolesApi.getRoles,
    });

    const groupedPages = useMemo(() => {
        return ADMIN_PAGE_PERMISSIONS.reduce<Record<string, typeof ADMIN_PAGE_PERMISSIONS>>((acc, page) => {
            acc[page.group] = acc[page.group] || [];
            acc[page.group].push(page);
            return acc;
        }, {});
    }, []);

    const activeRole = useMemo<EditableRole | null>(() => {
        if (selectedRoleId === 'new') {
            return { id: 'new', name: roleName, isCustom: true, permissions: '[]' };
        }

        return (roles.find((role) => role.id === selectedRoleId) as EditableRole | undefined) || null;
    }, [roleName, roles, selectedRoleId]);

    useEffect(() => {
        if (!isLoading && roles.length > 0 && !selectedRoleId) {
            setSelectedRoleId(roles[0].id);
        }
    }, [isLoading, roles, selectedRoleId]);

    useEffect(() => {
        if (!activeRole) {
            setRoleName('');
            setSelectedPages([]);
            setIsEditing(false);
            return;
        }

        if (activeRole.id === 'new') {
            setRoleName('');
            setSelectedPages([]);
            setIsEditing(true);
            return;
        }

        setRoleName(activeRole.name);
        setSelectedPages(parsePermissions(activeRole));
        setIsEditing(false);
    }, [activeRole?.id]);

    const createMutation = useMutation({
        mutationFn: () => adminRolesApi.createRole(roleName.trim(), selectedPages),
        onSuccess: (newRole) => {
            toast.success(t('roles.success.create'));
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            setSelectedRoleId(newRole.id);
            setIsEditing(false);
        },
        onError: (error: any) => toast.error(error.response?.data || t('roles.error.create')),
    });

    const updateMutation = useMutation({
        mutationFn: () => adminRolesApi.updateRole(activeRole!.id as number, roleName.trim(), selectedPages),
        onSuccess: () => {
            toast.success(t('roles.success.update'));
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            setIsEditing(false);
        },
        onError: (error: any) => toast.error(error.response?.data || t('roles.error.update')),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminRolesApi.deleteRole(id),
        onSuccess: () => {
            toast.success(t('roles.success.delete'));
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            setSelectedRoleId(null);
        },
        onError: (error: any) => toast.error(error.response?.data || t('roles.error.delete')),
    });

    const systemRoles = roles.filter((role) => !role.isCustom);
    const customRoles = roles.filter((role) => role.isCustom);
    const totalPages = ADMIN_PAGE_PERMISSIONS.length;

    const togglePage = (key: string) => {
        if (!isEditing) return;
        setSelectedPages((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
    };

    const toggleGroup = (group: string) => {
        if (!isEditing) return;
        const groupKeys = groupedPages[group].map((page) => page.key);
        const allSelected = groupKeys.every((key) => selectedPages.includes(key));
        setSelectedPages((prev) => {
            if (allSelected) return prev.filter((key) => !groupKeys.includes(key));
            return Array.from(new Set([...prev, ...groupKeys]));
        });
    };

    const handleSave = () => {
        if (!roleName.trim()) {
            toast.error(t('categories.nameRequired'));
            return;
        }

        if (activeRole?.id === 'new') {
            createMutation.mutate();
            return;
        }

        updateMutation.mutate();
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">{t('roles.loading')}</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
            <div className="mb-6 flex items-center justify-between shadow-sm bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{t('roles.title')}</h1>
                        <p className="text-sm text-slate-500">{t('roles.subtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={() => setSelectedRoleId('new')}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {t('roles.create')}
                </button>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                <div className="w-72 flex flex-col gap-4 bg-white border border-slate-200 rounded-xl p-4 overflow-y-auto shadow-sm">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">{t('roles.systemRoles')}</h3>
                        <div className="flex flex-col gap-1">
                            {systemRoles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRoleId(role.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRoleId === role.id ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                                >
                                    {role.name}
                                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 mx-2" />

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">{t('roles.customRoles')}</h3>
                        {customRoles.length === 0 ? (
                            <p className="text-xs text-slate-500 px-3 italic">{t('roles.noCustomRoles')}</p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {customRoles.map((role) => {
                                    const count = parsePermissions(role).filter((key) => key.startsWith('page:')).length;
                                    return (
                                        <button
                                            key={role.id}
                                            onClick={() => setSelectedRoleId(role.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRoleId === role.id ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                                        >
                                            {role.name}
                                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{count}/{totalPages}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
                    {activeRole ? (
                        <>
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    {activeRole.isCustom ? (
                                        <input
                                            type="text"
                                            placeholder={t('roles.roleNamePlaceholder')}
                                            value={roleName}
                                            onChange={(event) => setRoleName(event.target.value)}
                                            disabled={!isEditing}
                                            className="text-lg font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent"
                                            autoFocus={activeRole.id === 'new'}
                                        />
                                    ) : (
                                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            {activeRole.name}
                                            <span className="text-xs font-normal bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{t('roles.systemRoleLabel')}</span>
                                        </h2>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {activeRole.isCustom && !isEditing && (
                                        <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 text-sm font-medium border border-slate-200 text-slate-700 bg-white rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
                                            {t('roles.editBtn')}
                                        </button>
                                    )}
                                    {isEditing && (
                                        <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors">
                                            <Save className="w-4 h-4" /> {t('roles.save')}
                                        </button>
                                    )}
                                    {isEditing && activeRole.id !== 'new' && (
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                            {t('roles.cancel')}
                                        </button>
                                    )}
                                    {activeRole.isCustom && activeRole.id !== 'new' && !isEditing && (
                                        <button onClick={() => { if (confirm(t('roles.confirmDelete'))) deleteMutation.mutate(activeRole.id as number); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors mx-2">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 pb-20">
                                {!activeRole.isCustom ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 mb-10">
                                        <Shield className="w-16 h-16 text-slate-200 mb-4" />
                                        <h3 className="text-lg font-medium text-slate-700 mb-1">{t('roles.systemRoleInfoTitle')}</h3>
                                        <p className="text-sm max-w-sm text-center tracking-wide">{t('roles.systemRoleInfoDesc')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                                            اختر الصفحات التي يستطيع هذا الدور فتحها. الباك إند سيمنع API الخاص بالصفحات غير المسموح بها.
                                        </div>

                                        {Object.entries(groupedPages).map(([group, pages]) => {
                                            const groupKeys = pages.map((page) => page.key);
                                            const selectedCount = groupKeys.filter((key) => selectedPages.includes(key)).length;
                                            const allSelected = selectedCount === groupKeys.length;
                                            const someSelected = selectedCount > 0 && !allSelected;

                                            return (
                                                <div key={group} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                    <button
                                                        type="button"
                                                        className={`w-full px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between ${isEditing ? 'cursor-pointer hover:bg-slate-100 transition-colors' : 'cursor-default'}`}
                                                        onClick={() => toggleGroup(group)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${allSelected ? 'bg-blue-600 border-blue-600 text-white' : someSelected ? 'bg-blue-100 border-blue-500 text-blue-600' : 'bg-white border-slate-300'}`}>
                                                                {allSelected && <Check className="w-3.5 h-3.5" />}
                                                                {someSelected && <div className="w-2 h-0.5 bg-current rounded-full" />}
                                                            </div>
                                                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                                                <Layers3 className="w-4 h-4 text-slate-400" />
                                                                {group}
                                                            </h3>
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                                                            {selectedCount} / {pages.length}
                                                        </span>
                                                    </button>

                                                    <div className="divide-y divide-slate-100 bg-white">
                                                        {pages.map((page) => {
                                                            const isSelected = selectedPages.includes(page.key);
                                                            return (
                                                                <button
                                                                    key={page.key}
                                                                    type="button"
                                                                    onClick={() => togglePage(page.key)}
                                                                    className={`w-full text-start px-4 py-3 flex items-start gap-4 transition-colors ${isEditing ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'} ${!isEditing && !isSelected ? 'opacity-50 grayscale' : ''}`}
                                                                >
                                                                    <div className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                                                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-sm font-bold text-slate-800">{t(page.labelKey)}</span>
                                                                            <span className="text-[10px] uppercase font-bold py-0.5 px-1.5 rounded bg-slate-100 text-slate-500">{page.path}</span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-500">{page.description}</p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            {t('roles.selectRolePlaceholder')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RolesPermissionsPage;
