import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Search, Send, Store, Paperclip } from 'lucide-react';
import { chatApi, ChatThreadSummary } from '@/api/chatApi';
import { cn } from '@/lib/utils';
import apiClient from '@/api/client';
import { useTranslation } from '@/context/LanguageContext';

const formatDate = (value?: string, lang?: string) => 
    value ? new Date(value).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') : '';

export const ChatsPage: React.FC = () => {
    const { t, language } = useTranslation();
    const queryClient = useQueryClient();
    const [search, setSearch] = React.useState('');
    const [selectedThreadId, setSelectedThreadId] = React.useState<number | null>(null);
    const [message, setMessage] = React.useState('');
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

    const { data: threads = [], isLoading: threadsLoading } = useQuery({
        queryKey: ['admin-chat-threads'],
        queryFn: chatApi.getThreads,
        refetchInterval: 6000,
    });

    const { data: merchants = [], isLoading: merchantsLoading } = useQuery({
        queryKey: ['admin-chat-merchants', search],
        queryFn: () => chatApi.getMerchants(search),
    });

    const { data: selectedThread, isLoading: threadLoading } = useQuery({
        queryKey: ['admin-chat-thread', selectedThreadId],
        queryFn: () => chatApi.getThread(selectedThreadId!),
        enabled: !!selectedThreadId,
        refetchInterval: 3000,
    });

    const createThread = useMutation({
        mutationFn: chatApi.getOrCreateMerchantThread,
        onSuccess: (thread) => {
            setSelectedThreadId(thread.id);
            queryClient.invalidateQueries({ queryKey: ['admin-chat-threads'] });
        },
    });

    const [uploading, setUploading] = React.useState(false);

    const getImageUrl = (path?: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const baseUrl = apiClient.defaults.baseURL || '';
        const serverRoot = baseUrl.replace('/api/', '').replace('/api', '');
        return `${serverRoot}${path}`;
    };

    const sendMessage = useMutation({
        mutationFn: ({ threadId, body, attachmentUrl }: { threadId: number; body: string; attachmentUrl?: string }) => 
            chatApi.sendMessage(threadId, body, attachmentUrl),
        onSuccess: (_, variables) => {
            setMessage('');
            queryClient.invalidateQueries({ queryKey: ['admin-chat-threads'] });
            queryClient.invalidateQueries({ queryKey: ['admin-chat-thread', variables.threadId] });
        },
    });

    const openThread = (thread: ChatThreadSummary) => {
        setSelectedThreadId(thread.id);
    };

    const handleSend = () => {
        const body = message.trim();
        if (!body || !selectedThreadId) return;
        sendMessage.mutate({ threadId: selectedThreadId, body });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedThreadId) return;

        setUploading(true);
        try {
            const uploadRes = await chatApi.uploadFile(file);
            sendMessage.mutate({ threadId: selectedThreadId, body: '', attachmentUrl: uploadRes.url });
        } catch (error) {
            console.error('Failed to upload file:', error);
            alert(t('chats.upload_failed'));
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [selectedThread?.messages.length, selectedThreadId]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">{t('chats.title')}</h1>
                <p className="text-slate-500 mt-1">{t('chats.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 min-h-[680px]">
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <p className="text-sm font-bold text-slate-900 mb-3">{t('chats.start_chat')}</p>
                            <div className="relative">
                                <Search className={cn("w-4 h-4 text-slate-400 absolute top-3", language === 'ar' ? "right-3" : "left-3")} />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={t('chats.search_placeholder')}
                                    className={cn(
                                        "w-full py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100",
                                        language === 'ar' ? "pl-3 pr-9" : "pl-9 pr-3"
                                    )}
                                />
                            </div>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {merchantsLoading ? (
                                <div className="p-4 text-sm text-slate-500">{t('chats.loading')}</div>
                            ) : merchants.length === 0 ? (
                                <div className="p-4 text-sm text-slate-500">{t('chats.no_merchants')}</div>
                            ) : (
                                merchants.map((merchant) => (
                                    <button
                                        key={merchant.userId}
                                        onClick={() => createThread.mutate(merchant.userId)}
                                        className={cn(
                                            "w-full px-4 py-3 text-start hover:bg-slate-50 border-b border-slate-50 transition-colors",
                                            language === 'ar' && "flex-row-reverse"
                                        )}
                                    >
                                        <div className={cn("flex items-center gap-3", language === 'ar' && "flex-row-reverse")}>
                                            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                <Store className="h-4 w-4 text-indigo-600" />
                                            </div>
                                            <div className={cn("min-w-0", language === 'ar' ? "text-right" : "text-left")}>
                                                <p className="text-sm font-bold text-slate-900 truncate">{merchant.brandName || merchant.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{merchant.email}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <p className="text-sm font-bold text-slate-900">{t('chats.current_chats')}</p>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {threadsLoading ? (
                                <div className="p-4 text-sm text-slate-500">{t('chats.loading')}</div>
                            ) : threads.length === 0 ? (
                                <div className="p-4 text-sm text-slate-500">{t('chats.no_chats')}</div>
                            ) : (
                                threads.map((thread) => (
                                    <button
                                        key={thread.id}
                                        onClick={() => openThread(thread)}
                                        className={cn(
                                            'w-full px-4 py-3 text-start border-b border-slate-50 hover:bg-slate-50 transition-colors',
                                            selectedThreadId === thread.id && 'bg-indigo-50 hover:bg-indigo-50'
                                        )}
                                    >
                                        <div className="flex justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{thread.brandName || thread.merchantName}</p>
                                                <p className="text-xs text-slate-500 truncate">{thread.lastMessage || thread.subject}</p>
                                            </div>
                                            {thread.unreadCount > 0 && (
                                                <span className="h-5 min-w-5 px-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                                                    {thread.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl min-h-[680px] flex flex-col overflow-hidden">
                    {selectedThreadId && selectedThread ? (
                        <>
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{selectedThread.thread.brandName || selectedThread.thread.merchantName}</h2>
                                    <p className="text-xs text-slate-500">{selectedThread.thread.subject}</p>
                                </div>
                                <MessageCircle className="w-5 h-5 text-indigo-500" />
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-3">
                                {threadLoading ? (
                                    <div className="text-sm text-slate-500">{t('chats.loading_messages')}</div>
                                ) : selectedThread.messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-center text-slate-500">
                                        <div>
                                            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                            <p className="font-bold text-slate-700">{t('chats.no_messages_title')}</p>
                                            <p className="text-sm">{t('chats.no_messages_desc')}</p>
                                        </div>
                                    </div>
                                ) : (
                                    selectedThread.messages.map((item) => (
                                        <div key={item.id} className={cn('flex', item.isMine ? 'justify-end' : 'justify-start')}>
                                            <div className={cn(
                                                'max-w-[72%] rounded-2xl px-4 py-3 shadow-sm',
                                                item.isMine ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-900'
                                            )}>
                                                {!item.isMine && (
                                                    <p className="text-[11px] font-bold text-slate-500 mb-1">{item.senderName}</p>
                                                )}
                                                {item.body && (
                                                    <p className="text-sm leading-6 whitespace-pre-wrap">{item.body}</p>
                                                )}
                                                {item.attachmentUrl && (
                                                    <img
                                                        src={getImageUrl(item.attachmentUrl)}
                                                        alt="Attachment"
                                                        className="mt-2 rounded-lg max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(getImageUrl(item.attachmentUrl), '_blank')}
                                                    />
                                                )}
                                                <p className={cn('text-[10px] mt-2', item.isMine ? 'text-indigo-100' : 'text-slate-400')}>
                                                    {formatDate(item.createdAt, language)}
                                                    {item.isMine ? ` - ${item.isRead ? t('chats.read') : t('chats.sent')}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 border-t border-slate-100 flex items-center gap-3">
                                <input
                                    type="file"
                                    id="admin-chat-file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <button
                                    onClick={() => document.getElementById('admin-chat-file')?.click()}
                                    className="h-12 w-12 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 disabled:opacity-50"
                                    disabled={uploading || sendMessage.isPending}
                                    title={t('chats.attachment_title')}
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <textarea
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder={t('chats.message_placeholder')}
                                    className="flex-1 min-h-12 max-h-32 resize-y border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={(!message.trim() && !uploading) || sendMessage.isPending || uploading}
                                    className="h-12 px-5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    {t('chats.send')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center text-slate-500">
                            <div>
                                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p className="font-bold text-slate-700">{t('chats.select_chat_title')}</p>
                                <p className="text-sm">{t('chats.select_chat_desc')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
