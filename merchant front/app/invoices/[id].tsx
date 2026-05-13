import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform } from 'react-native';
import {
    Text,
    Card,
    Button,
    ActivityIndicator,
    Divider,
    DataTable,
    Appbar,
    Snackbar,
    useTheme as usePaperTheme,
} from 'react-native-paper';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { FileText, Download, Package, ShoppingBag, Store } from 'lucide-react-native';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useInvoiceDetails, formatInvoiceDate, formatCurrency } from '@/src/hooks/useInvoices';
import { getAuth } from '@/src/auth/storage';
import apiClient from '@/src/api/client';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';

export default function InvoiceDetailsScreen() {
    const { isDark, language } = useTheme();
    const theme = usePaperTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const invoiceId = id ? parseInt(id, 10) : null;

    const { data: invoice, isLoading, isError } = useInvoiceDetails(invoiceId);
    const [downloading, setDownloading] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const showToast = (message: string) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    };

    const handleDownloadPdf = async () => {
        if (!invoice || !invoiceId) return;

        setDownloading(true);
        try {
            const { token } = await getAuth();
            const baseUrl = apiClient.defaults.baseURL || '';
            // Pass the current app language to the backend
            const pdfUrl = `${baseUrl}/merchant/invoices/${invoiceId}/pdf?lang=${language}`;

            // Create filename from invoice data
            const brandName = invoice.brand?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Invoice';
            const date = new Date(invoice.closedAt).toISOString().split('T')[0];
            const filename = `${brandName}_${invoice.invoiceNumber}_${date}.pdf`;

            // Fetch the PDF with auth header
            const response = await fetch(pdfUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Download failed with status ${response.status}`);
            }

            const blob = await response.blob();

            if (Platform.OS === 'web') {
                // Web-specific download logic
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                showToast(t('invoices.pdf_success'));
            } else {
                // Native-specific logic (iOS/Android)
                const reader = new FileReader();
                const arrayBufferPromise = new Promise<ArrayBuffer>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as ArrayBuffer);
                    reader.onerror = reject;
                });
                reader.readAsArrayBuffer(blob);

                const arrayBuffer = await arrayBufferPromise;

                const file = new File(Paths.cache, filename);
                await file.write(new Uint8Array(arrayBuffer));

                const isSharingAvailable = await Sharing.isAvailableAsync();

                if (isSharingAvailable) {
                    await Sharing.shareAsync(file.uri, {
                        mimeType: 'application/pdf',
                        dialogTitle: `${t('invoices.download_pdf')} ${invoice.invoiceNumber}`,
                        UTI: 'com.adobe.pdf',
                    });
                    showToast(t('invoices.pdf_ready'));
                } else {
                    showToast(t('invoices.pdf_sharing_unavailable'));
                }
            }
        } catch (error: any) {
            console.error('PDF download error:', error);
            const message = error.message || t('invoices.pdf_error');

            if (Platform.OS === 'web') {
                alert(`Error: ${message}`);
            } else {
                Alert.alert(t('common.error'), message, [
                    { text: t('common.ok') },
                    { text: t('common.retry'), onPress: handleDownloadPdf },
                ]);
            }
        } finally {
            setDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (isError || !invoice) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <FileText size={48} color={theme.colors.outline} />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                    {t('invoices.invoice_not_found')}
                </Text>
                <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 16 }}>
                    {t('common.back')}
                </Button>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack.Screen
                options={{
                    title: invoice.invoiceNumber,
                }}
            />

            <ScrollView style={styles.scrollView}>
                {/* Invoice Header */}
                <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        {invoice.brand && (
                            <View style={styles.brandInfo}>
                                <Store size={20} color={theme.colors.primary} />
                                <View style={styles.brandDetails}>
                                    <Text variant="titleMedium" style={[styles.brandName, { color: theme.colors.onSurface }]}>
                                        {invoice.brand.name}
                                    </Text>
                                    {invoice.brand.address && (
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                            {invoice.brand.address}
                                        </Text>
                                    )}
                                    {invoice.brand.phone && (
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                            {invoice.brand.phone}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}

                        <Divider style={styles.divider} />

                        <View style={styles.invoiceInfo}>
                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>{t('invoices.invoice_number')}</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>{invoice.invoiceNumber}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>{t('invoices.period')}</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                                    {formatInvoiceDate(invoice.startAt)}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>{t('invoices.to')}</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                                    {formatInvoiceDate(invoice.endAt)}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>{t('invoices.closed_at')}</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                                    {formatInvoiceDate(invoice.closedAt)}
                                </Text>
                            </View>
                        </View>

                        <Divider style={styles.divider} />

                        {/* Totals */}
                        <View style={styles.totals}>
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: theme.colors.onSurface }]}>{t('common.orders')}</Text>
                                <Text style={[styles.totalValue, { color: theme.colors.onSurface }]}>{invoice.deliveredOrdersCount}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, styles.grossLabel, { color: theme.colors.onSurface }]}>{t('invoices.gross_sales')}</Text>
                                <Text style={[styles.totalValue, styles.grossValue, { color: '#4caf50' }]}>
                                    {formatCurrency(invoice.grossSales, invoice.currency)}
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Item Lines Section */}
                <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <Package size={20} color={theme.colors.primary} />
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                {t('invoices.items', { count: invoice.lines?.length || 0 })}
                            </Text>
                        </View>

                        {invoice.lines && invoice.lines.length > 0 ? (
                            <DataTable>
                                <DataTable.Header>
                                    <DataTable.Title style={styles.productColumn}>{t('invoices.product')}</DataTable.Title>
                                    <DataTable.Title numeric>{t('invoices.qty')}</DataTable.Title>
                                    <DataTable.Title numeric>{t('invoices.price')}</DataTable.Title>
                                    <DataTable.Title numeric>{t('invoices.total')}</DataTable.Title>
                                </DataTable.Header>

                                {invoice.lines.map((line, index) => (
                                    <DataTable.Row key={index}>
                                        <DataTable.Cell style={styles.productColumn}>
                                            <Text numberOfLines={2} style={{ color: theme.colors.onSurface, fontSize: 13 }}>
                                                {line.productName}
                                            </Text>
                                        </DataTable.Cell>
                                        <DataTable.Cell numeric><Text style={{ color: theme.colors.onSurface }}>{line.quantity}</Text></DataTable.Cell>
                                        <DataTable.Cell numeric><Text style={{ color: theme.colors.onSurface }}>{line.unitPrice.toFixed(2)}</Text></DataTable.Cell>
                                        <DataTable.Cell numeric>
                                            <Text style={[styles.lineTotal, { color: theme.colors.onSurface }]}>
                                                {line.lineTotal.toFixed(2)}
                                            </Text>
                                        </DataTable.Cell>
                                    </DataTable.Row>
                                ))}
                            </DataTable>
                        ) : (
                            <Text style={[styles.emptySection, { color: theme.colors.outline }]}>{t('common.no_data')}</Text>
                        )}
                    </Card.Content>
                </Card>

                {/* Orders Section */}
                <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <ShoppingBag size={20} color={theme.colors.primary} />
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                {t('invoices.orders', { count: invoice.orders?.length || 0 })}
                            </Text>
                        </View>

                        {invoice.orders && invoice.orders.length > 0 ? (
                            <DataTable>
                                <DataTable.Header>
                                    <DataTable.Title style={styles.orderColumn}>{t('invoices.order_hash')}</DataTable.Title>
                                    <DataTable.Title>{t('invoices.delivered')}</DataTable.Title>
                                    <DataTable.Title numeric>{t('invoices.total')}</DataTable.Title>
                                </DataTable.Header>

                                {invoice.orders.map((order, index) => (
                                    <DataTable.Row key={index}>
                                        <DataTable.Cell style={styles.orderColumn}>
                                            <Text numberOfLines={1} style={{ color: theme.colors.onSurface, fontSize: 12 }}>
                                                {order.orderNumber}
                                            </Text>
                                        </DataTable.Cell>
                                        <DataTable.Cell>
                                            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                                                {new Date(order.deliveredAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </Text>
                                        </DataTable.Cell>
                                        <DataTable.Cell numeric>
                                            <Text style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                                                {order.orderTotal.toFixed(2)}
                                            </Text>
                                        </DataTable.Cell>
                                    </DataTable.Row>
                                ))}
                            </DataTable>
                        ) : (
                            <Text style={[styles.emptySection, { color: theme.colors.outline }]}>{t('common.no_data')}</Text>
                        )}
                    </Card.Content>
                </Card>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Download Button */}
            <View style={styles.fabContainer}>
                <Button
                    mode="contained"
                    icon={() => <Download size={20} color="#fff" />}
                    onPress={handleDownloadPdf}
                    loading={downloading}
                    disabled={downloading}
                    style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]}
                    contentStyle={styles.downloadButtonContent}
                >
                    {t('invoices.download_pdf')}
                </Button>
            </View>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{ backgroundColor: theme.colors.inverseSurface }}
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    headerCard: {
        margin: 16,
        marginBottom: 8,
        elevation: 2,
    },
    brandInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    brandDetails: {
        flex: 1,
    },
    brandName: {
        fontWeight: 'bold',
    },
    divider: {
        marginVertical: 16,
    },
    invoiceInfo: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    totals: {
        gap: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    grossLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    grossValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionCard: {
        marginHorizontal: 16,
        marginBottom: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontWeight: 'bold',
    },
    productColumn: {
        flex: 2,
    },
    lineTotal: {
        fontWeight: '600',
    },
    orderColumn: {
        flex: 1.5,
    },
    emptySection: {
        textAlign: 'center',
        paddingVertical: 16,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
    },
    downloadButton: {
        borderRadius: 12,
    },
    downloadButtonContent: {
        paddingVertical: 8,
    },
});
