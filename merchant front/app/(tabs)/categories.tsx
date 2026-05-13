import React, { useState } from 'react';
import { StyleSheet, View, FlatList, Alert, RefreshControl, Platform } from 'react-native';
import {
    Text,
    List,
    FAB,
    Portal,
    Dialog,
    TextInput,
    Button,
    ActivityIndicator,
    IconButton,
    useTheme as usePaperTheme
} from 'react-native-paper';
import { useCategories } from '@/src/hooks/useCategories';
import { useSubscriptionStatus } from '@/src/hooks/useMerchantData';
import { useRenewOnly } from '@/src/hooks/useRenewOnly';
import { CategoryDto } from '@/src/types';
import { Tag, Edit2, Trash2, Plus } from 'lucide-react-native';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';

export default function CategoriesScreen() {
    const { isDark } = useTheme();
    const theme = usePaperTheme();
    const {
        categories,
        isLoading,
        refetch,
        createCategory,
        updateCategory,
        deleteCategory,
    } = useCategories();
    const { data: sub } = useSubscriptionStatus();

    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { isRenewOnly } = useRenewOnly();

    const showDialog = (category?: CategoryDto) => {
        if (isRenewOnly) {
            const title = t('common.subscription_expired');
            const message = t('common.renew_subscription_message');
            if (Platform.OS === 'web') {
                alert(`${title}: ${message}`);
            } else {
                Alert.alert(title, message);
            }
            return;
        }
        if (category) {
            setEditingCategory(category);
            setCategoryName(category.name);
        } else {
            setEditingCategory(null);
            setCategoryName('');
        }
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
        setCategoryName('');
        setEditingCategory(null);
    };

    const handleSave = async () => {
        if (!categoryName.trim()) return;

        setSubmitting(true);
        try {
            if (editingCategory) {
                await updateCategory({ id: editingCategory.id, name: categoryName.trim() });
            } else {
                await createCategory(categoryName.trim());
            }
            hideDialog();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: number, name: string, productsCount: number) => {
        if (isRenewOnly) {
            const title = t('common.subscription_expired');
            const message = t('common.renew_subscription_message');
            if (Platform.OS === 'web') {
                alert(`${title}: ${message}`);
            } else {
                Alert.alert(title, message);
            }
            return;
        }

        const title = t('categories.delete_category_title');
        const message = t('categories.delete_category_warning', { name });

        if (Platform.OS === 'web') {
            if (window.confirm(`${title}\n\n${message}`)) {
                deleteCategory(id);
            }
        } else {
            Alert.alert(
                title,
                message,
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('common.delete'),
                        style: 'destructive',
                        onPress: () => deleteCategory(id),
                    },
                ]
            );
        }
    };

    if (isLoading && !categories.length) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const getProductsCountText = (count: number) => {
        if (count === 1) return t('categories.products_count', { count });
        return t('categories.products_count_plural', { count });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.name}
                        titleStyle={{ color: theme.colors.onSurface }}
                        description={getProductsCountText(item.productsCount)}
                        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                        left={(props) => <List.Icon {...props} icon={() => <Tag size={20} color={theme.colors.onSurfaceVariant} />} />}
                        right={(props) => (
                            <View style={styles.actions}>
                                <IconButton
                                    icon={() => <Edit2 size={20} color={theme.colors.primary} />}
                                    onPress={() => showDialog(item)}
                                    disabled={isRenewOnly}
                                />
                                <IconButton
                                    icon={() => <Trash2 size={20} color={theme.colors.error} />}
                                    onPress={() => handleDelete(item.id, item.name, item.productsCount)}
                                    disabled={isRenewOnly}
                                />
                            </View>
                        )}
                        style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Tag size={48} color={theme.colors.outline} />
                        <Text variant="titleMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                            {t('categories.no_categories_found')}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {t('categories.add_categories_organize')}
                        </Text>
                    </View>
                }
            />

            {!isRenewOnly && (
                <FAB
                    icon={() => <Plus color={theme.colors.onPrimary} size={24} />}
                    style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    onPress={() => showDialog()}
                />
            )}

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={hideDialog} style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
                    <Dialog.Title style={{ color: theme.colors.onSurface }}>
                        {editingCategory ? t('categories.edit_category') : t('categories.new_category')}
                    </Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label={t('categories.category_name')}
                            value={categoryName}
                            onChangeText={setCategoryName}
                            mode="outlined"
                            autoFocus
                            textColor={theme.colors.onSurface}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog}>{t('common.cancel')}</Button>
                        <Button
                            onPress={handleSave}
                            loading={submitting}
                            disabled={!categoryName.trim() || submitting}
                            mode="contained"
                        >
                            {t('common.save')}
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listItem: {
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 8,
        elevation: 1,
    },
    actions: {
        flexDirection: 'row',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
    },
    dialog: {},
});
