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
import { useMyOrders, useSubscriptionStatus } from '@/src/hooks/useMerchantData';
import apiClient from '@/src/api/client';
import { Clock, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';

const STATUSES = ['All', 'Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'];

export default function OrdersScreen() {
    const theme = usePaperTheme();
    const { isDark } = useTheme();
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [page, setPage] = useState(1);
    const { data, isLoading, refetch } = useMyOrders(
        selectedStatus === 'All' ? undefined : selectedStatus,
        page
    );
    const { data: sub } = useSubscriptionStatus();

    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const isExpired = sub?.state === 'Expired' || sub?.state === 'None';

    const handleAction = async (id: number, action: string) => {
        if (isExpired) return;
        setActionLoading(id);
        try {
            await apiClient.put(`/Merchant/orders/${id}/${action}`);
            refetch();
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
                        {t(`orders.${item.status.toLowerCase()}`)}
                    </Chip>
                )}
            />
            <Card.Content>
                <View style={styles.orderSummary}>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>{t('orders.items_count', { count: item.itemCount })}</Text>
                    <Text variant="titleMedium" style={[styles.total, { color: theme.colors.primary }]}>{t('orders.egp', { amount: item.total })}</Text>
                </View>
            </Card.Content>
            <Divider style={styles.divider} />
            <Card.Actions style={styles.actions}>
                {!isExpired && (
                    <>
                        {item.status === 'Pending' && (
                            <Button
                                mode="contained"
                                buttonColor="#4caf50"
                                onPress={() => handleAction(item.id, 'accept')}
                                loading={actionLoading === item.id}
                            >
                                {t('orders.accept')}
                            </Button>
                        )}
                        {item.status === 'Accepted' && (
                            <Button
                                mode="contained"
                                onPress={() => handleAction(item.id, 'prepare')}
                                loading={actionLoading === item.id}
                            >
                                {t('orders.prepare')}
                            </Button>
                        )}
                        {item.status === 'Preparing' && (
                            <Button
                                mode="contained"
                                onPress={() => handleAction(item.id, 'out-for-delivery')}
                                loading={actionLoading === item.id}
                            >
                                {t('orders.dispatch')}
                            </Button>
                        )}
                        {item.status === 'OutForDelivery' && (
                            <Button
                                mode="contained"
                                onPress={() => handleAction(item.id, 'delivered')}
                                loading={actionLoading === item.id}
                            >
                                {t('orders.delivered_btn')}
                            </Button>
                        )}
                        {item.status !== 'Delivered' && item.status !== 'Cancelled' && (
                            <Button
                                mode="text"
                                textColor={theme.colors.error}
                                onPress={() => handleAction(item.id, 'cancel')}
                                disabled={actionLoading === item.id}
                            >
                                {t('orders.cancel_order')}
                            </Button>
                        )}
                    </>
                )}
                {isExpired && <Text variant="bodySmall" style={{ color: theme.colors.error }}>{t('orders.status_expired')}</Text>}
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
                            {t(`orders.${s.toLowerCase()}`)}
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
                            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>{t('orders.no_orders_found')}</Text>
                        </View>
                    }
                />
            )}
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
    }
});
