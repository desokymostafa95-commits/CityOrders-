import React, { useState, useMemo } from 'react';
import { Users, Plus, Trash2, Shield, Search, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '@/api/adminUsersApi';
import { adminRolesApi } from '@/api/adminRolesApi';
import { toast } from 'sonner';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/auth/auth-context';

export const AdminUsersPage = () => {
    const { t, language } = useTranslation();
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Form states
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');

    const { data: users = [], isLoading: isLoadingUsers } = useQuery({
        queryKey: ['admin-users'],
        queryFn: adminUsersApi.getAdmins
    });

    const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: adminRolesApi.getRoles
    });

    const assignableRoles = useMemo(() => {
        return roles.filter(role => role.name === 'Admin' || role.isCustom);
    }, [roles]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.name.toLowerCase().includes(search.toLowerCase()) || 
            u.email.toLowerCase().includes(search.toLowerCase())
        );
    }, [users, search]);

    const createMutation = useMutation({
        mutationFn: () => adminUsersApi.createAdmin({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            roleId: Number(selectedRoleId)
        }),
        onSuccess: () => {
            toast.success(t('staff.success.create'));
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setIsCreating(false);
            setFormData({ name: '', email: '', password: '' });
            setSelectedRoleId('');
        },
        onError: (error: any) => toast.error(error.response?.data || t('staff.error.create'))
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, roleId }: { id: number; roleId: number }) => adminUsersApi.updateAdminRole(id, roleId),
        onSuccess: () => {
            toast.success(t('roles.success.update'));
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error: any) => toast.error(error.response?.data || t('roles.error.update'))
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminUsersApi.deleteAdmin(id),
        onSuccess: () => {
            toast.success(t('staff.success.delete'));
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error: any) => toast.error(error.response?.data || t('staff.error.delete'))
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isCreating) {
            if (!selectedRoleId) {
                toast.error('Please select a role');
                return;
            }
            createMutation.mutate();
        }
    };

    if (isLoadingUsers || isLoadingRoles) return <div className="p-8 text-center text-slate-500">{t('staff.loading')}</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-64px)]">
            <div className="mb-6 flex items-center justify-between shadow-sm bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{t('staff.title')}</h1>
                        <p className="text-sm text-slate-500">{t('staff.subtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsCreating(true);
                        setFormData({ name: '', email: '', password: '' });
                        setSelectedRoleId(assignableRoles[0]?.id ?? '');
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t('staff.add')}
                </button>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Main List */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="relative w-64">
                            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                            <input
                                type="text"
                                placeholder={t('staff.search')}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className={`w-full ${language === 'ar' ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                        </div>
                        <div className="text-xs font-medium text-slate-500 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                            {t('staff.total').replace('{count}', filteredUsers.length.toString())}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredUsers.map(user => {
                                return (
                                    <div key={user.id} className="border border-slate-200 rounded-xl p-4 flex flex-col hover:border-indigo-300 transition-colors shadow-sm bg-white relative group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-slate-800 text-white">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 line-clamp-1 text-sm">{user.name}</h3>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">{t('staff.assignedRole')}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <Shield className="w-3.5 h-3.5 text-slate-700" />
                                                    <span className="text-xs font-medium text-slate-800">
                                                        {user.roles?.[0]?.name || t('staff.superAdmin')}
                                                    </span>
                                                </div>
                                                <select
                                                    value={user.roles?.[0]?.id || ''}
                                                    onChange={(event) => updateRoleMutation.mutate({ id: user.id, roleId: Number(event.target.value) })}
                                                    disabled={updateRoleMutation.isPending}
                                                    className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    {assignableRoles.map(role => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.name}{role.isCustom ? '' : ' (Full)'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div className={`flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity ${language === 'ar' ? 'mr-auto' : 'ml-auto'}`}>
                                                {user.id !== Number(currentUser?.id) && (
                                                    <button 
                                                        onClick={() => { if(confirm(t('staff.confirmDelete').replace('{name}', user.name))) deleteMutation.mutate(user.id); }} 
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title={t('staff.confirmDelete').replace(' {name}?', '')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Create Form */}
                {isCreating && (
                    <div className="w-80 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="font-bold text-slate-800">{t('staff.newStaff')}</h2>
                            <button onClick={() => { setIsCreating(false); }} className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600">{t('staff.fullName')}</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600">{t('staff.email')}</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600">{t('staff.password')}</label>
                                <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600">{t('staff.assignedRole')}</label>
                                <select
                                    required
                                    value={selectedRoleId}
                                    onChange={e => setSelectedRoleId(Number(e.target.value))}
                                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    {assignableRoles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}{role.isCustom ? '' : ' (Full access)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg mt-2">
                                <div className="flex gap-2">
                                    <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-indigo-900 mb-0.5">{t('staff.assignedRole')}</p>
                                        <p className="text-[11px] text-indigo-700 leading-snug">
                                            اختار رول مخصص بصلاحيات محددة أو Admin للوصول الكامل.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={createMutation.isPending} className="mt-2 w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                                {t('staff.createBtn')}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsersPage;
