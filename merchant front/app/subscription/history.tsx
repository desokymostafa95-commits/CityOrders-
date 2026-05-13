import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import {
    Text,
    Card,
    ActivityIndicator,
    Chip,
    MD3Colors,
    useTheme as usePaperTheme,
} from 'react-native-paper';
import apiClient from '@/src/api/client';
import { useQuery } from '@tanstack/react-query';
import { PaymentRequestHistoryDto } from '@/src/types';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';

export default function SubscriptionHistoryScreen() {
    const { isDark } = useTheme();
    const theme = usePaperTheme();
    const { data, isLoading, refetch } = useQuery<PaymentRequestHistoryDto[]>({
        queryKey: ['subscription-history'],
        queryFn: async () => {
            const response = await apiClient.get('/merchant/subscription/payment-requests');
            return response.data;
        },
        refetchInterval: 10000, // Check for updates every 10s
        staleTime: 0,
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return MD3Colors.error50;
            case 'Approved': return MD3Colors.primary50;
            case 'Rejected': return theme.colors.outline;
            default: return theme.colors.surfaceVariant;
        }
    };

    const renderItem = ({ item }: { item: PaymentRequestHistoryDto }) => (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Title
                title={item.planName}
                titleStyle={{ color: theme.colors.onSurface }}
                subtitle={t('subscription.submitted_on', { date: new Date(item.createdAt).toLocaleDateString() })}
                subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
                right={() => (
                    <Chip style={{ backgroundColor: getStatusColor(item.status), marginRight: 12 }}>
                        <Text style={{ fontSize: 12, color: '#fff' }}>{t(`statuses.${item.status.toLowerCase()}`)}</Text>
                    </Chip>
                )}
            />
            <Card.Content>
                <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    {item.planPriceEgp} {t('subscription.egp')}
                </Text>
                {item.adminNotes && (
                    <View style={[styles.notesContainer, { backgroundColor: isDark ? theme.colors.surfaceVariant : '#fff3e0' }]}>
                        <Text variant="bodySmall" style={[styles.notesTitle, { color: theme.colors.onSurface }]}>
                            {t('subscription.admin_note')}
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {item.adminNotes}
                        </Text>
                    </View>
                )}
                {item.reviewedAt && (
                    <Text variant="bodySmall" style={[styles.reviewedText, { color: theme.colors.outline }]}>
                        {t('subscription.reviewed_on', { date: new Date(item.reviewedAt).toLocaleDateString() })}
                    </Text>
                )}
            </Card.Content>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refetch}
                    refreshing={isLoading}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('subscription.no_history')}</Text>
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
    },
    listContent: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        elevation: 1,
    },
    notesContainer: {
        marginTop: 12,
        padding: 8,
        borderRadius: 4,
    },
    notesTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    reviewedText: {
        marginTop: 12,
        fontStyle: 'italic',
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
