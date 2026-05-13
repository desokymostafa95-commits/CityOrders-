import React, { useState } from 'react';
import { StyleSheet, SectionList, View, ScrollView, Alert } from 'react-native';
import {
    Text,
    Searchbar,
    FAB,
    Card,
    IconButton,
    ActivityIndicator,
    Switch,
    Portal,
    Dialog,
    Button,
    Paragraph,
    Chip,
    useTheme as usePaperTheme
} from 'react-native-paper';
import { useMyProducts, useSubscriptionStatus } from '@/src/hooks/useMerchantData';
import { useRenewOnly } from '@/src/hooks/useRenewOnly';
import { useCategories } from '@/src/hooks/useCategories';
import { productsApi } from '@/src/api/productsApi';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit } from 'lucide-react-native';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';

export default function ProductsScreen() {
    const { isDark } = useTheme();
    const theme = usePaperTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const { data: products, isLoading, refetch } = useMyProducts();
    const { data: sub } = useSubscriptionStatus();
    const { categories } = useCategories();
    const queryClient = useQueryClient();

    const [deleteVisible, setDeleteVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { isRenewOnly } = useRenewOnly();

    const handleToggle = async (id: number) => {
        if (isRenewOnly) return;
        try {
            await productsApi.toggle(id);
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
        } catch (err) {
            console.error(err);
        }
    };

    const confirmDelete = (id: number) => {
        if (isRenewOnly) return;
        setSelectedProduct(id);
        setDeleteVisible(true);
    };

    const handleDelete = async () => {
        if (!selectedProduct) return;
        setIsDeleting(true);
        try {
            await productsApi.delete(selectedProduct);
            setDeleteVisible(false);
            // Success feedback
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
        } catch (err: any) {
            console.error(err);
            Alert.alert(t('common.error'), err.response?.data || t('products.error_delete'));
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredProducts = products?.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;
        return matchesSearch && matchesCategory;
    }) || [];

    // Grouping logic for SectionList
    const sections = React.useMemo(() => {
        const groups: { [key: string]: typeof filteredProducts } = {};

        filteredProducts.forEach(p => {
            const catName = p.categoryName || t('products.uncategorized');
            if (!groups[catName]) groups[catName] = [];
            groups[catName].push(p);
        });

        const uncategorizedLabel = t('products.uncategorized');

        return Object.keys(groups).sort((a, b) => {
            if (a === uncategorizedLabel) return 1;
            if (b === uncategorizedLabel) return -1;
            return a.localeCompare(b);
        }).map(name => ({
            title: name,
            data: groups[name]
        }));
    }, [filteredProducts]);

    const renderItem = ({ item }: { item: any }) => (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Cover source={(item.primaryImageUrl && item.primaryImageUrl !== 'string') ? { uri: item.primaryImageUrl } : require('../../assets/images/icon.png')} />
            <Card.Title
                title={item.name}
                titleStyle={{ color: theme.colors.onSurface }}
                subtitle={`${item.price} ${t('orders.egp', { amount: '' }).trim()} ${item.categoryName ? `• ${item.categoryName}` : ''}`}
                subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
                right={(props) => (
                    <View style={styles.cardActions}>
                        <Switch
                            value={item.isActive}
                            onValueChange={() => handleToggle(item.id)}
                            disabled={isRenewOnly}
                        />
                        <IconButton
                            icon={() => <Edit size={20} color={theme.colors.onSurfaceVariant} />}
                            onPress={() => router.push(`/products/${item.id}`)}
                            disabled={isRenewOnly}
                        />
                    </View>
                )}
            />
            <Card.Content>
                <Paragraph numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.description || t('products.no_description')}
                </Paragraph>
            </Card.Content>
            <Card.Actions>
                <Button
                    icon={() => <Trash2 size={16} color={theme.colors.error} />}
                    onPress={() => confirmDelete(item.id)}
                    textColor={theme.colors.error}
                    disabled={isRenewOnly}
                >
                    {t('common.delete')}
                </Button>
            </Card.Actions>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Searchbar
                placeholder={t('products.search_placeholder')}
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
                iconColor={theme.colors.onSurfaceVariant}
                inputStyle={{ color: theme.colors.onSurface }}
                placeholderTextColor={theme.colors.onSurfaceVariant}
            />

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <Chip
                        selected={selectedCategoryId === null}
                        onPress={() => setSelectedCategoryId(null)}
                        style={[styles.chip, { backgroundColor: selectedCategoryId === null ? theme.colors.primaryContainer : theme.colors.surface }]}
                        mode="outlined"
                        selectedColor={theme.colors.primary}
                    >
                        {t('products.all_categories')}
                    </Chip>
                    {categories.map(cat => (
                        <Chip
                            key={cat.id}
                            selected={selectedCategoryId === cat.id}
                            onPress={() => setSelectedCategoryId(cat.id)}
                            style={[styles.chip, { backgroundColor: selectedCategoryId === cat.id ? theme.colors.primaryContainer : theme.colors.surface }]}
                            mode="outlined"
                            selectedColor={theme.colors.primary}
                        >
                            {cat.name}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    renderItem={renderItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
                            <Text variant="titleMedium" style={[styles.sectionText, { color: theme.colors.primary }]}>{title}</Text>
                        </View>
                    )}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                                {t('products.no_products_found')}
                            </Text>
                        </View>
                    }
                    onRefresh={refetch}
                    refreshing={isLoading}
                />
            )}

            {!isRenewOnly && (
                <FAB
                    icon={() => <Plus color={theme.colors.onPrimary} size={24} />}
                    style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    onPress={() => router.push('/products/new')}
                />
            )}

            <Portal>
                <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)} style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
                    <Dialog.Title style={{ color: theme.colors.onSurface }}>{t('products.delete_confirm_title')}</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                            {t('products.delete_confirm_body')}
                        </Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteVisible(false)}>{t('common.cancel')}</Button>
                        <Button onPress={handleDelete} loading={isDeleting} textColor={theme.colors.error}>
                            {t('common.delete')}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchbar: {
        margin: 16,
        marginBottom: 8,
        elevation: 2,
    },
    filterContainer: {
        marginBottom: 8,
    },
    filterScroll: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    chip: {
        marginRight: 8,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 16,
        elevation: 2,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionHeader: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    sectionText: {
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
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
    dialog: {},
});
