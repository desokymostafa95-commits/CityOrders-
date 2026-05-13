import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi, AnnouncementTarget, type GlobalAnnouncement, type CreateAnnouncementDto } from '@/api/announcementsApi';
import { toast } from 'sonner';
import { Megaphone, Send, Trash2, Power, Users, Layout, Store } from 'lucide-react';

export const GlobalAnnouncementsPage = () => {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<CreateAnnouncementDto>({
        message: '',
        targetAudience: AnnouncementTarget.All,
        expiresAt: ''
    });

    const { data: announcements = [], isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: announcementsApi.getAnnouncements
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateAnnouncementDto) => announcementsApi.createAnnouncement(data),
        onSuccess: () => {
            toast.success('Announcement sent successfully');
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            setIsCreating(false);
            setFormData({ message: '', targetAudience: AnnouncementTarget.All, expiresAt: '' });
        },
        onError: (error: any) => toast.error(error.response?.data || 'Failed to send announcement')
    });

    const toggleMutation = useMutation({
        mutationFn: (id: number) => announcementsApi.toggleAnnouncement(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement status updated');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => announcementsApi.deleteAnnouncement(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement deleted');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submissionData = {
            ...formData,
            expiresAt: formData.expiresAt === '' ? undefined : formData.expiresAt
        };
        createMutation.mutate(submissionData);
    };

    const getTargetBadge = (target: AnnouncementTarget) => {
        switch (target) {
            case AnnouncementTarget.Customer:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Users className="w-3 h-3 mr-1" /> Customers
                    </span>
                );
            case AnnouncementTarget.Merchant:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Store className="w-3 h-3 mr-1" /> Merchants
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        <Layout className="w-3 h-3 mr-1" /> Everyone
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <Megaphone className="mr-3 text-primary" />
                        Global Chat / Announcements
                    </h1>
                    <p className="text-slate-500 mt-1">Broadcast messages and ads to all platform users.</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                    <Send className="w-4 h-4 mr-2" />
                    New Announcement
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Broadcast Message</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                required
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                placeholder="Enter your global message or advertisement details here..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Audience</label>
                                <select
                                    value={formData.targetAudience}
                                    onChange={(e) => setFormData({ ...formData, targetAudience: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                >
                                    <option value={AnnouncementTarget.All}>Everyone</option>
                                    <option value={AnnouncementTarget.Customer}>Customers Only</option>
                                    <option value={AnnouncementTarget.Merchant}>Merchants Only</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Expiry Date (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'Sending...' : 'Broadcast Now'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">Recent Broadcast History</h3>
                    <span className="text-xs text-slate-500">{announcements.length} Total</span>
                </div>

                <div className="divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500 animate-pulse">Loading history...</div>
                    ) : announcements.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 italic">No broadcast logs found.</div>
                    ) : (
                        announcements.map((item) => (
                            <div key={item.id} className={`p-6 transition-colors ${!item.isActive ? 'bg-slate-50 opacity-60' : ''}`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getTargetBadge(item.targetAudience)}
                                            <span className="text-xs text-slate-400">
                                                {new Date(item.createdAt).toLocaleString()}
                                            </span>
                                            {item.expiresAt && (
                                                <span className="text-xs text-red-500 font-medium whitespace-nowrap">
                                                    Expires: {new Date(item.expiresAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-800 font-medium leading-relaxed">{item.message}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleMutation.mutate(item.id)}
                                            title={item.isActive ? "Deactivate" : "Activate"}
                                            className={`p-2 rounded-md ${item.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this broadcast log?')) {
                                                    deleteMutation.mutate(item.id);
                                                }
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
