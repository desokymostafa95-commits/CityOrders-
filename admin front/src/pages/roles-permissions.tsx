import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Plus, Save, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS, type Endpoint } from '@/data/endpoint-permissions';
import { adminRolesApi, type AdminRole } from '@/api/adminRolesApi';
import { toast } from 'sonner';

export const RolesPermissionsPage = () => {
    const queryClient = useQueryClient();
    const [selectedRoleId, setSelectedRoleId] = useState<number | 'new' | null>(null);
    const [newRoleName, setNewRoleName] = useState('');
    const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    // Fetch Roles
    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: adminRolesApi.getRoles
    });

    // We only care about endpoints normally accessible to "Admin"
    const adminEndpoints = useMemo(() => {
        return ENDPOINTS.filter(ep => ep.roles.includes('Admin'));
    }, []);

    const groupedEndpoints = useMemo(() => {
        const groups: Record<string, Endpoint[]> = {};
        adminEndpoints.forEach(ep => {
            if (!groups[ep.group]) groups[ep.group] = [];
            groups[ep.group].push(ep);
        });
        return groups;
    }, [adminEndpoints]);

    const activeRole = useMemo(() => {
        if (selectedRoleId === 'new') return { id: 'new', name: 'New Custom Role', isCustom: true, permissions: '[]' };
        return roles.find(r => r.id === selectedRoleId) || null;
    }, [selectedRoleId, roles]);

    // Handle initial selection
    useEffect(() => {
        if (!isLoading && roles.length > 0 && !selectedRoleId) {
            setSelectedRoleId(roles[0].id);
        }
    }, [roles, isLoading, selectedRoleId]);

    // When role changes, decode permissions to state
    useEffect(() => {
        if (!activeRole) {
            setSelectedEndpoints([]);
            setIsEditing(false);
            return;
        }

        if (activeRole.id === 'new') {
            setSelectedEndpoints([]);
            setIsEditing(true);
            return;
        }

        try {
            const perms = JSON.parse(activeRole.permissions || '[]');
            setSelectedEndpoints(Array.isArray(perms) ? perms : []);
            setIsEditing(false);
        } catch {
            setSelectedEndpoints([]);
            setIsEditing(false);
        }
    }, [activeRole]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: () => adminRolesApi.createRole(newRoleName, selectedEndpoints),
        onSuccess: (newRole) => {
            toast.success('Role created successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            setSelectedRoleId(newRole.id);
            setNewRoleName('');
            setIsEditing(false);
        },
        onError: (error: any) => toast.error(error.response?.data || 'Failed to create role')
    });

    const updateMutation = useMutation({
        mutationFn: () => adminRolesApi.updateRole(activeRole!.id as number, activeRole!.name, selectedEndpoints),
        onSuccess: () => {
            toast.success('Role updated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            setIsEditing(false);
        },
        onError: (error: any) => toast.error(error.response?.data || 'Failed to update role')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminRolesApi.deleteRole(id),
        onSuccess: () => {
            toast.success('Role deleted');
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            setSelectedRoleId(null);
        },
        onError: (error: any) => toast.error(error.response?.data || 'Failed to delete role')
    });

    const handleSave = () => {
        if (activeRole?.id === 'new') {
            if (!newRoleName.trim()) {
                toast.error('Role name is required');
                return;
            }
            createMutation.mutate();
        } else {
            updateMutation.mutate();
        }
    };

    const toggleEndpoint = (epStr: string) => {
        if (!isEditing) return;
        setSelectedEndpoints(prev => 
            prev.includes(epStr) ? prev.filter(p => p !== epStr) : [...prev, epStr]
        );
    };

    const toggleGroup = (group: string) => {
        if (!isEditing) return;
        const groupEps = groupedEndpoints[group].map(ep => `${ep.method}:${ep.path}`);
        const allSelected = groupEps.every(ep => selectedEndpoints.includes(ep));

        if (allSelected) {
            setSelectedEndpoints(prev => prev.filter(ep => !groupEps.includes(ep)));
        } else {
            setSelectedEndpoints(prev => {
                const s = new Set([...prev, ...groupEps]);
                return Array.from(s);
            });
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading roles...</div>;

    const systemRoles = roles.filter(r => !r.isCustom);
    const customRoles = roles.filter(r => r.isCustom);

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
            <div className="mb-6 flex items-center justify-between shadow-sm bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Role Permissions</h1>
                        <p className="text-sm text-slate-500">Configure access control for admin staff</p>
                    </div>
                </div>
                <button
                    onClick={() => setSelectedRoleId('new')}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Custom Role
                </button>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left Sidebar - Roles List */}
                <div className="w-64 flex flex-col gap-4 bg-white border border-slate-200 rounded-xl p-4 overflow-y-auto shadow-sm">
                    {/* System Roles */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">System Roles</h3>
                        <div className="flex flex-col gap-1">
                            {systemRoles.map(role => (
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

                    {/* Custom Roles */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Custom Roles</h3>
                        {customRoles.length === 0 ? (
                            <p className="text-xs text-slate-500 px-3 italic">No custom roles created yet.</p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {customRoles.map(role => (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRoleId(role.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRoleId === role.id ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        {role.name}
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{JSON.parse(role.permissions || '[]').length}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Area - Editor */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
                    {activeRole ? (
                        <>
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    {activeRole.id === 'new' ? (
                                        <input
                                            type="text"
                                            placeholder="Role Name (e.g. Support)"
                                            value={newRoleName}
                                            onChange={e => setNewRoleName(e.target.value)}
                                            className="text-lg font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                        />
                                    ) : (
                                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            {activeRole.name}
                                            {!activeRole.isCustom && <span className="text-xs font-normal bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">System - Full Access</span>}
                                        </h2>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {activeRole.isCustom && !isEditing && (
                                        <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 text-sm font-medium border border-slate-200 text-slate-700 bg-white rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
                                            Edit Permissions
                                        </button>
                                    )}
                                    {isEditing && (
                                        <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors">
                                            <Save className="w-4 h-4" /> Save
                                        </button>
                                    )}
                                    {isEditing && activeRole.id !== 'new' && (
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                            Cancel
                                        </button>
                                    )}
                                    {activeRole.isCustom && activeRole.id !== 'new' && !isEditing && (
                                        <button onClick={() => { if(confirm('Are you sure you want to delete this role?')) deleteMutation.mutate(activeRole.id as number) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2" title="Delete Role">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 pb-20 p-bg">
                                {!activeRole.isCustom ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 mb-10">
                                        <Shield className="w-16 h-16 text-slate-200 mb-4" />
                                        <h3 className="text-lg font-medium text-slate-700 mb-1">System Role</h3>
                                        <p className="text-sm max-w-sm text-center tracking-wide">System roles have predefined behaviors inside the core application. You cannot modify their individual endpoints here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {Object.entries(groupedEndpoints).map(([group, endpoints]) => {
                                            const groupEps = endpoints.map(ep => `${ep.method}:${ep.path}`);
                                            const selectedCount = groupEps.filter(ep => selectedEndpoints.includes(ep)).length;
                                            const allSelected = selectedCount === groupEps.length;
                                            const someSelected = selectedCount > 0 && !allSelected;

                                            return (
                                                <div key={group} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                    <div 
                                                        className={`px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between ${isEditing ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                                                        onClick={() => toggleGroup(group)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                                ${allSelected ? 'bg-blue-600 border-blue-600 text-white' : 
                                                                  someSelected ? 'bg-blue-100 border-blue-500 text-blue-600' : 
                                                                  'bg-white border-slate-300'}`}
                                                            >
                                                                {allSelected && <Check className="w-3.5 h-3.5" />}
                                                                {someSelected && <div className="w-2 h-0.5 bg-current rounded-full" />}
                                                            </div>
                                                            <h3 className="font-semibold text-slate-800">{group}</h3>
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                                                            {selectedCount} / {endpoints.length}
                                                        </span>
                                                    </div>
                                                    <div className="divide-y divide-slate-100 bg-white">
                                                        {endpoints.map((ep, i) => {
                                                            const epStr = `${ep.method}:${ep.path}`;
                                                            const isSelected = selectedEndpoints.includes(epStr);
                                                            return (
                                                                <div 
                                                                    key={i} 
                                                                    onClick={() => toggleEndpoint(epStr)}
                                                                    className={`px-4 py-3 flex items-start gap-4 transition-colors ${isEditing ? 'cursor-pointer hover:bg-slate-50' : ''} ${!isEditing && !isSelected ? 'opacity-50 grayscale' : ''}`}
                                                                >
                                                                    <div className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                                                                        ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}
                                                                    >
                                                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className={`text-[10px] uppercase font-bold py-0.5 px-1.5 rounded bg-slate-100 text-slate-600`}>{ep.method}</span>
                                                                            <span className="text-sm font-mono text-slate-700">{ep.path}</span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-500">{ep.description}</p>
                                                                    </div>
                                                                </div>
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
                            Select a role to view or edit permissions
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RolesPermissionsPage;
