import React, { useState } from 'react';
import { StyleSheet, FlatList, View, ScrollView } from 'react-native';
import {
    Text,
    Card,
    Button,
    ActivityIndicator,
    Chip,
    MD3Colors,
    Divider,
    Portal,
    Dialog,
    Paragraph,
    useTheme as usePaperTheme
} from 'react-native-paper';
import { useMyOrder, useMyOrders, useSubscriptionStatus } from '@/src/hooks/useMerchantData';
import { useMerchantOrderChatThread } from '@/src/hooks/useMerchantData';
import apiClient from '@/src/api/client';
import { MessageCircle } from 'lucide-react-native';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';
import { router } from 'expo-router';

const STATUSES = ['All', 'Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'];

const statusLabels: Record<string, string> = {
    All: 'الكل',
    Pending: 'قيد الانتظار',
    Accepted: 'مقبول',
    Preparing: 'جاري التجهيز',
    OutForDelivery: 'خرج للتوصيل',
    Delivered: 'تم التوصيل',
    Cancelled: 'ملغي',
};

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('ar-EG')} جنيه`;
const formatDate = (value?: string) => value ? new Date(value).toLocaleString('ar-EG') : '';

export default function OrdersScreen() {
    const theme = usePaperTheme();
    const { isDark } = useTheme();
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [page, setPage] = useState(1);
    const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>();
    const { data, isLoading, refetch } = useMyOrders(
        selectedStatus === 'All' ? undefined : selectedStatus,
        page
    );
    const { data: selectedOrder, isLoading: detailLoading, refetch: refetchSelectedOrder } = useMyOrder(selectedOrderId, { enabled: !!selectedOrderId });
    const { data: sub } = useSubscriptionStatus();

    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const isExpired = sub?.state === 'Expired' || sub?.state === 'None';
    const orderChat = useMerchantOrderChatThread();

    const handleAction = async (id: number, action: string) => {
        if (isExpired) return;
        setActionLoading(id);
        try {
            await apiClient.put(`/Merchant/orders/${id}/status`, null, {
                params: { action },
            });
            await refetch();
            if (selectedOrderId === id) {
                await refetchSelectedOrder();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return MD3Colors.error50;
            case 'Accepted': return MD3Colors.primary50;
            case 'Preparing': return MD3Colors.tertiary50;
            case 'OutForDelivery': return MD3Colors.secondary50;
            case 'Delivered': return MD3Colors.neutral50;
            default: return '#ccc';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Card.Title
                title={t('orders.order_number', { number: item.orderNumber })}
                titleStyle={{ color: theme.colors.onSurface }}
                subtitle={new Date(item.createdAt).toLocaleString()}
                subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
                right={() => (
                    <Chip style={{ backgroundColor: getStatusColor(item.status), marginRight: 12 }} textStyle={{ color: '#fff' }}>
                        {statusLabels[item.status] ?? item.status}
                    </Chip>
                )}
            />
            <Card.Content>
                <View style={styles.orderSummary}>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>{item.itemCount} أصناف</Text>
                    <Text variant="titleMedium" style={[styles.total, { color: theme.colors.primary }]}>{t('orders.egp', { amount: item.total })}</Text>
                </View>
            </Card.Content>
            <Divider style={styles.divider} />
            <Card.Actions style={styles.actions}>
                <Button
                    mode="text"
                    onPress={() => setSelectedOrderId(item.id)}
                >
                    التفاصيل
                </Button>
                <Button
                    mode="outlined"
                    icon={() => <MessageCircle size={16} color={theme.colors.primary} />}
                    onPress={() => orderChat.mutate(item.id, {
                        onSuccess: (thread) => router.push({ pathname: '/chat/[threadId]', params: { threadId: String(thread.id) } }),
                    })}
                    loading={orderChat.isPending}
                    disabled={orderChat.isPending}
                >
                    محادثة العميل
                </Button>
                {!isExpired && item.status === 'Pending' && (
                    <Button
                        mode="contained"
                        buttonColor="#4caf50"
                        onPress={() => handleAction(item.id, 'accept')}
                        loading={actionLoading === item.id}
                    >
                        قبول الطلب
                    </Button>
                )}
                {!isExpired && item.status === 'Accepted' && (
                    <Button
                        mode="contained"
                        onPress={() => handleAction(item.id, 'prepare')}
                        loading={actionLoading === item.id}
                    >
                        بدء التجهيز
                    </Button>
                )}
                {!isExpired && item.status === 'Preparing' && (
                    <Button
                        mode="contained"
                        onPress={() => handleAction(item.id, 'out-for-delivery')}
                        loading={actionLoading === item.id}
                    >
                        خرج للتوصيل
                    </Button>
                )}
                {!isExpired && item.status === 'OutForDelivery' && (
                    <Button
                        mode="contained"
                        onPress={() => handleAction(item.id, 'delivered')}
                        loading={actionLoading === item.id}
                    >
                        تم التوصيل
                    </Button>
                )}
                {!isExpired && item.status !== 'Delivered' && item.status !== 'Cancelled' && (
                    <Button
                        mode="text"
                        textColor={theme.colors.error}
                        onPress={() => handleAction(item.id, 'cancel')}
                        disabled={actionLoading === item.id}
                    >
                        إلغاء
                    </Button>
                )}
                {isExpired && <Text variant="bodySmall" style={{ color: theme.colors.error }}>انتهى الاشتراك، الإجراءات متوقفة</Text>}
            </Card.Actions>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {STATUSES.map(s => (
                        <Chip
                            key={s}
                            selected={selectedStatus === s}
                            onPress={() => {
                                setSelectedStatus(s);
                                setPage(1);
                            }}
                            style={styles.filterChip}
                            showSelectedOverlay
                            selectedColor={theme.colors.primary}
                            textStyle={{ color: selectedStatus === s ? theme.colors.primary : theme.colors.onSurfaceVariant }}
                        >
                            {statusLabels[s] ?? s}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <FlatList
                    data={data?.items || []}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refetch}
                    refreshing={isLoading}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>لا توجد طلبات حاليا</Text>
                        </View>
                    }
                />
            )}

            <Portal>
                <Dialog visible={!!selectedOrderId} onDismiss={() => setSelectedOrderId(undefined)} style={styles.dialog}>
                    <Dialog.Title>
                        {selectedOrder ? t('orders.order_number', { number: selectedOrder.orderNumber }) : 'تفاصيل الطلب'}
                    </Dialog.Title>
                    <Dialog.ScrollArea style={styles.dialogScrollArea}>
                        <ScrollView contentContainerStyle={styles.dialogContent}>
                            {detailLoading && !selectedOrder ? (
                                <ActivityIndicator style={{ marginVertical: 24 }} />
                            ) : selectedOrder ? (
                                <>
                                    <View style={styles.detailHeader}>
                                        <View>
                                            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>الحالة</Text>
                                            <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: '800' }}>
                                                {statusLabels[selectedOrder.status] ?? selectedOrder.status}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>الإجمالي</Text>
                                            <Text variant="titleMedium" style={{ fontWeight: '800' }}>{formatCurrency(selectedOrder.total)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text variant="titleSmall" style={styles.detailTitle}>بيانات العميل</Text>
                                        <Paragraph>{selectedOrder.customerName}</Paragraph>
                                        <Paragraph>{selectedOrder.customerEmail}</Paragraph>
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text variant="titleSmall" style={styles.detailTitle}>عنوان التوصيل</Text>
                                        <Paragraph>{selectedOrder.deliveryAddress}</Paragraph>
                                        {!!selectedOrder.addressNotes && <Paragraph>ملاحظات العنوان: {selectedOrder.addressNotes}</Paragraph>}
                                        {!!selectedOrder.notes && <Paragraph>ملاحظات الطلب: {selectedOrder.notes}</Paragraph>}
                                        {!!selectedOrder.distanceMeters && (
                                            <Paragraph>المسافة التقريبية: {(selectedOrder.distanceMeters / 1000).toFixed(2)} كم</Paragraph>
                                        )}
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text variant="titleSmall" style={styles.detailTitle}>مراحل الطلب</Text>
                                        {selectedOrder.timeline.map((step, index) => (
                                            <View key={step.key} style={styles.timelineRow}>
                                                <View style={[styles.timelineDot, step.completed && { backgroundColor: theme.colors.primary }]} />
                                                <View style={{ flex: 1 }}>
                                                    <Text variant="bodyMedium" style={{ fontWeight: '700' }}>{step.label}</Text>
                                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{step.description}</Text>
                                                    {!!step.at && <Text variant="labelSmall" style={{ color: theme.colors.outline }}>{formatDate(step.at)}</Text>}
                                                </View>
                                                {index < selectedOrder.timeline.length - 1 && <View style={styles.timelineConnector} />}
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text variant="titleSmall" style={styles.detailTitle}>الأصناف</Text>
                                        {selectedOrder.items.map((line) => (
                                            <View key={`${line.productId}-${line.productName}`} style={styles.lineItem}>
                                                <View style={{ flex: 1 }}>
                                                    <Text variant="bodyMedium" style={{ fontWeight: '700' }}>{line.productName}</Text>
                                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                        {formatCurrency(line.unitPrice)} × {line.quantity}
                                                    </Text>
                                                </View>
                                                <Text variant="bodyMedium" style={{ fontWeight: '800' }}>{formatCurrency(line.lineTotal)}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.costBox}>
                                        <View style={styles.costRow}>
                                            <Text>قيمة المنتجات</Text>
                                            <Text>{formatCurrency(selectedOrder.subtotal)}</Text>
                                        </View>
                                        <View style={styles.costRow}>
                                            <Text>رسوم التوصيل</Text>
                                            <Text>{formatCurrency(selectedOrder.deliveryFee)}</Text>
                                        </View>
                                        {selectedOrder.discountAmount > 0 && (
                                            <View style={styles.costRow}>
                                                <Text>الخصم</Text>
                                                <Text style={{ color: theme.colors.primary }}>-{formatCurrency(selectedOrder.discountAmount)}</Text>
                                            </View>
                                        )}
                                    </View>
                                </>
                            ) : (
                                <Paragraph>تعذر تحميل تفاصيل الطلب.</Paragraph>
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button onPress={() => setSelectedOrderId(undefined)}>إغلاق</Button>
                        {!!selectedOrder && !isExpired && selectedOrder.availableActions.map((action) => (
                            <Button
                                key={action.action}
                                mode={action.destructive ? 'text' : 'contained'}
                                textColor={action.destructive ? theme.colors.error : undefined}
                                onPress={() => handleAction(selectedOrder.id, action.action)}
                                loading={actionLoading === selectedOrder.id}
                                disabled={actionLoading === selectedOrder.id}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    filterContainer: {
        backgroundColor: '#fff',
        elevation: 2,
        paddingVertical: 12,
    },
    filterScroll: {
        paddingHorizontal: 16,
    },
    filterChip: {
        marginRight: 8,
    },
    listContent: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    orderSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    total: {
        fontWeight: 'bold',
        color: '#6200ee',
    },
    divider: {
        marginVertical: 4,
    },
    actions: {
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        alignItems: 'center',
        marginTop: 64,
    },
    dialog: {
        maxHeight: '92%',
    },
    dialogScrollArea: {
        paddingHorizontal: 0,
    },
    dialogContent: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        paddingBottom: 24,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        paddingBottom: 16,
    },
    detailSection: {
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 14,
        marginTop: 14,
    },
    detailTitle: {
        fontWeight: '800',
        marginBottom: 8,
    },
    timelineRow: {
        flexDirection: 'row',
        gap: 10,
        paddingBottom: 12,
        position: 'relative',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#D1D5DB',
        marginTop: 5,
    },
    timelineConnector: {
        position: 'absolute',
        left: 5,
        top: 20,
        bottom: 0,
        width: 2,
        backgroundColor: '#E5E7EB',
    },
    lineItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    costBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        gap: 8,
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    dialogActions: {
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
});
