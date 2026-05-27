import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Button, Surface, Text, TextInput, useTheme, IconButton } from 'react-native-paper';
import { useChatThread, useSendChatMessage, useBlockChatThread, useUnblockChatThread } from '../../src/hooks/chat';
import { formatDate } from '../../src/utils/format';
import * as ImagePicker from 'expo-image-picker';
import http, { resolveImageUrl } from '../../src/api/http';
import { Ban, Lock } from 'lucide-react-native';

export default function CustomerChatScreen() {
    const { threadId } = useLocalSearchParams<{ threadId: string }>();
    const id = Number(threadId);
    const theme = useTheme();
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const { data, isLoading } = useChatThread(id);
    const sendMessage = useSendChatMessage(id);
    const blockThread = useBlockChatThread();
    const unblockThread = useUnblockChatThread();

    const thread = data?.thread;
    const isBlockedByMe = thread?.isBlockedByCustomer;
    const isBlockedByOther = thread?.isBlockedByMerchant;
    const isBlocked = isBlockedByMe || isBlockedByOther;

    const title = useMemo(() => {
        if (!data?.thread) return 'المحادثة';
        return data.thread.brandName || data.thread.subject || 'المحادثة';
    }, [data]);

    const handleSend = () => {
        const body = message.trim();
        if (!body) return;
        sendMessage.mutate({ body }, {
            onSuccess: () => setMessage(''),
        });
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                setUploading(true);
                const asset = result.assets[0];
                const formData = new FormData();

                if (Platform.OS === 'web') {
                    const response = await fetch(asset.uri);
                    const blob = await response.blob();
                    const file = new File([blob], 'chat_image.jpg', { type: blob.type || 'image/jpeg' });
                    formData.append('file', file);
                } else {
                    // @ts-ignore
                    formData.append('file', {
                        uri: asset.uri,
                        type: asset.mimeType || 'image/jpeg',
                        name: 'chat_image.jpg',
                    });
                }

                const { data: uploadRes } = await http.post<{ url: string }>('/Chat/upload', formData, {
                    headers: { 'Content-Type': undefined },
                });

                sendMessage.mutate({ body: '', attachmentUrl: uploadRes.url });
            }
        } catch (error) {
            console.error('Failed to pick or upload image:', error);
        } finally {
            setUploading(false);
        }
    };

    if (isLoading && !data) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Stack.Screen options={{
                title,
                headerShadowVisible: false,
                headerRight: () => thread ? (
                    <IconButton
                        icon={() => isBlockedByMe ? <Lock size={20} color={theme.colors.primary} /> : <Ban size={20} color={theme.colors.error} />}
                        onPress={isBlockedByMe ? () => unblockThread.mutate(id) : () => blockThread.mutate(id)}
                        disabled={blockThread.isPending || unblockThread.isPending}
                    />
                ) : null
            }} />
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.messages}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
                {(data?.messages || []).length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="titleMedium" style={styles.emptyTitle}>ابدأ المحادثة</Text>
                        <Text variant="bodySmall" style={styles.emptyText}>
                            اكتب رسالتك للتاجر بخصوص هذا الطلب.
                        </Text>
                    </View>
                ) : (
                    data?.messages.map((item) => (
                        <View
                            key={item.id}
                            style={[
                                styles.messageRow,
                                item.isMine ? styles.messageRowMine : styles.messageRowOther,
                            ]}
                        >
                            <Surface
                                elevation={0}
                                style={[
                                    styles.bubble,
                                    item.isMine
                                        ? { backgroundColor: theme.colors.primary }
                                        : styles.otherBubble,
                                ]}
                            >
                                {!item.isMine && (
                                    <Text variant="labelSmall" style={styles.senderName}>
                                        {item.senderName}
                                    </Text>
                                )}
                                {item.body ? (
                                    <Text
                                        variant="bodyMedium"
                                        style={item.isMine ? styles.mineText : styles.otherText}
                                    >
                                        {item.body}
                                    </Text>
                                ) : null}
                                {item.attachmentUrl ? (
                                    <Image
                                        source={{ uri: resolveImageUrl(item.attachmentUrl) }}
                                        style={styles.messageImage}
                                        resizeMode="cover"
                                    />
                                ) : null}
                                <Text
                                    variant="labelSmall"
                                    style={item.isMine ? styles.mineTime : styles.otherTime}
                                >
                                    {formatDate(item.createdAt)}
                                    {item.isMine ? ` - ${item.isRead ? 'تمت القراءة' : 'تم الإرسال'}` : ''}
                                </Text>
                            </Surface>
                        </View>
                    ))
                )}
            </ScrollView>
            {isBlocked ? (
                <Surface style={styles.blockedBanner} elevation={1}>
                    {isBlockedByMe ? (
                        <View style={styles.blockedContent}>
                            <Text variant="bodyMedium" style={styles.blockedText}>لقد قمت بحظر هذه المحادثة.</Text>
                            <Button
                                mode="outlined"
                                compact
                                onPress={() => unblockThread.mutate(id)}
                                loading={unblockThread.isPending}
                                style={styles.unblockBtn}
                                textColor="#991B1B"
                            >
                                إلغاء الحظر
                            </Button>
                        </View>
                    ) : (
                        <Text variant="bodyMedium" style={styles.blockedText}>
                            تم حظر هذه المحادثة من قبل المتجر.
                        </Text>
                    )}
                </Surface>
            ) : (
                <Surface style={styles.composer} elevation={2}>
                    <IconButton
                        icon="image"
                        mode="contained-tonal"
                        onPress={handlePickImage}
                        loading={uploading}
                        disabled={uploading || sendMessage.isPending}
                        style={styles.attachButton}
                    />
                    <TextInput
                        mode="outlined"
                        value={message}
                        onChangeText={setMessage}
                        placeholder="اكتب رسالة..."
                        style={styles.input}
                        multiline
                        maxLength={1000}
                    />
                    <Button
                        mode="contained"
                        onPress={handleSend}
                        loading={sendMessage.isPending}
                        disabled={(!message.trim() && !uploading) || sendMessage.isPending || uploading}
                        style={styles.sendButton}
                    >
                        إرسال
                    </Button>
                </Surface>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    messages: {
        padding: 16,
        paddingBottom: 24,
        gap: 10,
    },
    messageRow: {
        flexDirection: 'row',
    },
    messageRowMine: {
        justifyContent: 'flex-end',
    },
    messageRowOther: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '82%',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    otherBubble: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    senderName: {
        color: '#757575',
        marginBottom: 4,
        fontWeight: '800',
    },
    mineText: {
        color: '#FFFFFF',
        lineHeight: 21,
    },
    otherText: {
        color: '#212121',
        lineHeight: 21,
    },
    mineTime: {
        color: 'rgba(255,255,255,0.72)',
        marginTop: 6,
        textAlign: 'right',
    },
    otherTime: {
        color: '#9E9E9E',
        marginTop: 6,
    },
    composer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    input: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        maxHeight: 120,
    },
    sendButton: {
        borderRadius: 12,
        marginBottom: 6,
    },
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: 10,
        marginTop: 6,
        marginBottom: 4,
    },
    attachButton: {
        margin: 0,
        marginBottom: 6,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontWeight: '900',
    },
    emptyText: {
        color: '#757575',
        marginTop: 6,
        textAlign: 'center',
    },
    blockedBanner: {
        padding: 16,
        backgroundColor: '#FEE2E2',
        borderTopWidth: 1,
        borderTopColor: '#FCA5A5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    blockedContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
    },
    blockedText: {
        color: '#991B1B',
        fontWeight: '700',
        textAlign: 'center',
    },
    unblockBtn: {
        borderColor: '#FCA5A5',
        borderRadius: 8,
    },
});
