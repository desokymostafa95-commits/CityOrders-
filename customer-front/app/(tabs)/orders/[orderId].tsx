import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl, Pressable } from 'react-native';
import { Text, ActivityIndicator, useTheme, Button, Divider, Surface, TextInput, Snackbar } from 'react-native-paper';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import { useOrderDetails, useCancelOrder, useSubmitOrderReview } from '../../../src/hooks/orders';
import { useCustomerOrderChatThread } from '../../../src/hooks/chat';
import { formatDate, formatCurrency, getStatusColor } from '../../../src/utils/format';
import { translateStatus } from '../../../src/utils/messages';
import { Calendar, CheckCircle2, Circle, Info, MapPin, Package, Star } from 'lucide-react-native';

export default function OrderDetailsScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const id = parseInt(orderId);
    const theme = useTheme();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewMessage, setReviewMessage] = useState('');

    const { data: order, isLoading, refetch } = useOrderDetails(id);
    const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();
    const submitReview = useSubmitOrderReview();
    const orderChat = useCustomerOrderChatThread();

    useFocusEffect(
        useCallback(() => {
            const interval = setInterval(() => refetch(), 10000);
            return () => clearInterval(interval);
        }, [refetch])
    );

    const handleCancel = () => {
        Alert.alert(
            'إلغاء الطلب',
            'هل أنت متأكد أنك تريد إلغاء هذا الطلب؟',
            [
                { text: 'لا', style: 'cancel' },
                {
                    text: 'نعم، إلغاء',
                    style: 'destructive',
                    onPress: () => cancelOrder(id),
                },
            ]
        );
    };

    const handleSubmitReview = () => {
        submitReview.mutate(
            {
                orderId: id,
                rating,
                comment: comment.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setReviewMessage('تم إرسال تقييمك بنجاح');
                    setComment('');
                },
                onError: (error: any) => {
                    const message = error.response?.data?.message || error.response?.data || 'تعذر إرسال التقييم. حاول مرة أخرى.';
                    setReviewMessage(message);
                },
            }
        );
    };

    const handleOpenChat = () => {
        orderChat.mutate(id, {
            onSuccess: (thread) => router.push({ pathname: '/chat/[threadId]', params: { threadId: String(thread.id) } }),
            onError: () => setReviewMessage('تعذر فتح المحادثة. حاول مرة أخرى.'),
        });
    };

    if (isLoading && !order) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.centered}>
                <Text variant="titleLarge">الطلب غير موجود</Text>
            </View>
        );
    }

    const isPending = order.status.toLowerCase() === 'pending';

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: `طلب #${order.orderNumber}`,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#F8FAFC' },
            }} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isLoading && !!order} onRefresh={refetch} />}
            >
                <Surface style={styles.statusCard} elevation={0}>
                    <View style={styles.statusRow}>
                        <View style={{ flex: 1 }}>
                            <Text variant="labelSmall" style={styles.statusLabel}>الحالة</Text>
                            <Text variant="titleLarge" style={[styles.statusValue, { color: getStatusColor(order.status) }]}>
                                {translateStatus(order.status)}
                            </Text>
                            {!!order.nextStep && <Text variant="bodySmall" style={styles.nextStep}>{order.nextStep}</Text>}
                        </View>
                        <View style={[styles.brandIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Package size={24} color={theme.colors.primary} />
                        </View>
                    </View>

                    <Divider style={styles.statusDivider} />

                    <View style={styles.metaInfo}>
                        <View style={styles.metaItem}>
                            <Calendar size={14} color="#757575" />
                            <Text variant="bodySmall" style={styles.metaText}>{formatDate(order.createdAt)}</Text>
                        </View>
                        <Text variant="bodySmall" style={styles.metaText}>-</Text>
                        <Text variant="bodySmall" style={styles.metaText}>{order.brandName}</Text>
                    </View>
                </Surface>

                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>متابعة الطلب</Text>
                    <Surface style={styles.contentCard} elevation={0}>
                        {(order.timeline || []).map((step, index) => (
                            <View key={step.key} style={styles.timelineRow}>
                                <View style={styles.timelineIconWrap}>
                                    {step.completed ? (
                                        <CheckCircle2 size={22} color={theme.colors.primary} />
                                    ) : (
                                        <Circle size={22} color="#CFCFCF" />
                                    )}
                                    {index < (order.timeline?.length || 0) - 1 && <View style={styles.timelineLine} />}
                                </View>
                                <View style={styles.timelineText}>
                                    <Text variant="titleSmall" style={styles.timelineLabel}>{step.label}</Text>
                                    <Text variant="bodySmall" style={styles.timelineDescription}>{step.description}</Text>
                                    {step.at ? <Text variant="bodySmall" style={styles.timelineDate}>{formatDate(step.at)}</Text> : null}
                                </View>
                            </View>
                        ))}
                    </Surface>
                </View>

                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>محتويات الطلب</Text>
                    <Surface style={styles.contentCard} elevation={0}>
                        {order.items.map((item, idx) => (
                            <View key={idx} style={styles.itemRow}>
                                <View style={styles.itemMain}>
                                    <View style={styles.itemHeader}>
                                        <Text variant="bodyLarge" style={styles.productName}>{item.productName}</Text>
                                        <Text variant="bodyLarge" style={styles.itemTotal}>{formatCurrency(item.lineTotal)}</Text>
                                    </View>
                                    <Text variant="bodySmall" style={styles.itemMeta}>
                                        {formatCurrency(item.unitPrice)} × {item.quantity}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        <View style={styles.costsContainer}>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>قيمة المنتجات</Text>
                                <Text style={styles.costValue}>{formatCurrency(order.subtotal)}</Text>
                            </View>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>رسوم التوصيل</Text>
                                <Text style={styles.costValue}>{formatCurrency(order.deliveryFee)}</Text>
                            </View>
                            {!!order.discountAmount && order.discountAmount > 0 && (
                                <View style={styles.costRow}>
                                    <Text style={styles.costLabel}>الخصم</Text>
                                    <Text style={styles.discountValue}>-{formatCurrency(order.discountAmount)}</Text>
                                </View>
                            )}
                            <View style={[styles.costRow, styles.totalRow]}>
                                <Text variant="titleLarge" style={styles.totalLabel}>الإجمالي</Text>
                                <Text variant="titleLarge" style={[styles.totalValue, { color: theme.colors.primary }]}>
                                    {formatCurrency(order.total)}
                                </Text>
                            </View>
                        </View>
                    </Surface>
                </View>

                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>بيانات التوصيل</Text>
                    <Surface style={styles.contentCard} elevation={0}>
                        <View style={styles.detailItem}>
                            <MapPin size={18} color={theme.colors.primary} />
                            <View style={styles.detailTextContainer}>
                                <Text variant="titleSmall" style={styles.detailLabel}>العنوان</Text>
                                <Text variant="bodyMedium" style={styles.detailValue}>{order.deliveryAddress}</Text>
                            </View>
                        </View>

                        {order.notes && (
                            <View style={[styles.detailItem, { marginTop: 16 }]}>
                                <Info size={18} color="#757575" />
                                <View style={styles.detailTextContainer}>
                                    <Text variant="titleSmall" style={styles.detailLabel}>ملاحظات الطلب</Text>
                                    <Text variant="bodyMedium" style={styles.detailValue}>{order.notes}</Text>
                                </View>
                            </View>
                        )}
                    </Surface>
                </View>

                {(order.canReview || order.review) && (
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>تقييم المتجر</Text>
                        <Surface style={styles.contentCard} elevation={0}>
                            {order.review ? (
                                <View style={styles.reviewBox}>
                                    <View style={styles.reviewHeader}>
                                        <Text variant="titleSmall" style={styles.reviewTitle}>تقييمك لهذا الطلب</Text>
                                        <View style={styles.reviewStars}>
                                            {Array.from({ length: order.review.rating }).map((_, index) => (
                                                <Star key={index} size={16} color="#F59E0B" fill="#F59E0B" />
                                            ))}
                                        </View>
                                    </View>
                                    {!!order.review.comment && (
                                        <Text variant="bodyMedium" style={styles.reviewComment}>
                                            {order.review.comment}
                                        </Text>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.reviewBox}>
                                    <Text variant="bodyMedium" style={styles.reviewPrompt}>
                                        الطلب اتسلم؟ قيّم المتجر عشان تساعد باقي العملاء.
                                    </Text>
                                    <View style={styles.ratingRow}>
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <Pressable
                                                key={value}
                                                onPress={() => setRating(value)}
                                                style={styles.starButton}
                                                accessibilityRole="button"
                                                accessibilityLabel={`تقييم ${value} من 5`}
                                            >
                                                <Star
                                                    size={28}
                                                    color="#F59E0B"
                                                    fill={value <= rating ? '#F59E0B' : 'transparent'}
                                                />
                                            </Pressable>
                                        ))}
                                    </View>
                                    <TextInput
                                        mode="outlined"
                                        label="تعليق اختياري"
                                        value={comment}
                                        onChangeText={setComment}
                                        multiline
                                        numberOfLines={3}
                                        style={styles.reviewInput}
                                    />
                                    <Button
                                        mode="contained"
                                        onPress={handleSubmitReview}
                                        loading={submitReview.isPending}
                                        disabled={submitReview.isPending}
                                        style={styles.reviewButton}
                                    >
                                        إرسال التقييم
                                    </Button>
                                </View>
                            )}
                        </Surface>
                    </View>
                )}

                <View style={styles.actionSection}>
                    <Button
                        mode="outlined"
                        onPress={handleOpenChat}
                        loading={orderChat.isPending}
                        disabled={orderChat.isPending}
                        style={styles.chatBtn}
                        icon="message-text-outline"
                    >
                        مراسلة التاجر
                    </Button>
                    {!isPending && (
                        <View style={styles.infoBox}>
                            <Info size={16} color="#757575" />
                            <Text variant="bodySmall" style={styles.infoText}>
                                يمكن إلغاء الطلب فقط قبل قبول التاجر له.
                            </Text>
                        </View>
                    )}
                    <Button
                        mode="contained"
                        onPress={handleCancel}
                        disabled={!isPending || isCancelling}
                        loading={isCancelling}
                        style={[styles.cancelBtn, isPending ? { backgroundColor: theme.colors.error } : { backgroundColor: '#F0F0F0' }]}
                        labelStyle={[styles.cancelBtnLabel, !isPending && { color: '#BDBDBD' }]}
                        icon="close-circle-outline"
                    >
                        إلغاء الطلب
                    </Button>
                </View>
            </ScrollView>
            <Snackbar
                visible={!!reviewMessage}
                onDismiss={() => setReviewMessage('')}
                duration={3500}
            >
                {reviewMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        width: '100%',
        maxWidth: 760,
        alignSelf: 'center',
        padding: 16,
        paddingBottom: 40,
    },
    statusCard: {
        padding: 20,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        fontWeight: '900',
        color: '#BDBDBD',
        letterSpacing: 1,
    },
    statusValue: {
        fontWeight: '900',
        marginTop: 2,
    },
    nextStep: {
        color: '#757575',
        marginTop: 4,
    },
    brandIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusDivider: {
        marginVertical: 16,
        backgroundColor: '#F7F7F7',
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        marginLeft: 6,
        marginRight: 6,
        color: '#757575',
        fontWeight: '500',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontWeight: '800',
        marginBottom: 12,
        marginLeft: 4,
    },
    contentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    timelineRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    timelineIconWrap: {
        alignItems: 'center',
        marginRight: 12,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        minHeight: 30,
        backgroundColor: '#E5E5E5',
        marginTop: 4,
    },
    timelineText: {
        flex: 1,
        paddingBottom: 16,
    },
    timelineLabel: {
        fontWeight: '800',
    },
    timelineDescription: {
        color: '#757575',
        marginTop: 2,
    },
    timelineDate: {
        color: '#9E9E9E',
        marginTop: 4,
    },
    itemRow: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#FAFAFA',
    },
    itemMain: {
        width: '100%',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    productName: {
        fontWeight: '700',
        flex: 1,
    },
    itemTotal: {
        fontWeight: '800',
        marginLeft: 12,
    },
    itemMeta: {
        color: '#757575',
    },
    costsContainer: {
        padding: 16,
        backgroundColor: '#F8FAFC',
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    costLabel: {
        color: '#757575',
    },
    costValue: {
        fontWeight: '600',
    },
    discountValue: {
        fontWeight: '700',
        color: '#2E7D32',
    },
    totalRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    totalLabel: {
        fontWeight: '900',
    },
    totalValue: {
        fontWeight: '900',
    },
    detailItem: {
        flexDirection: 'row',
        padding: 16,
    },
    detailTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    detailLabel: {
        fontWeight: '800',
        color: '#757575',
        marginBottom: 4,
    },
    detailValue: {
        lineHeight: 20,
    },
    reviewBox: {
        padding: 16,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    reviewTitle: {
        fontWeight: '800',
        flex: 1,
    },
    reviewStars: {
        flexDirection: 'row',
        gap: 3,
    },
    reviewComment: {
        marginTop: 10,
        color: '#424242',
        lineHeight: 20,
    },
    reviewPrompt: {
        color: '#424242',
        lineHeight: 20,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 12,
    },
    starButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    reviewInput: {
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
    },
    reviewButton: {
        borderRadius: 12,
    },
    actionSection: {
        marginTop: 8,
    },
    chatBtn: {
        borderRadius: 16,
        marginBottom: 12,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    infoText: {
        marginLeft: 8,
        color: '#757575',
        flex: 1,
    },
    cancelBtn: {
        borderRadius: 16,
        height: 50,
        justifyContent: 'center',
    },
    cancelBtnLabel: {
        fontWeight: '800',
        fontSize: 15,
    },
});
