import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Appbar, ActivityIndicator, Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import ProductForm from '@/src/components/ProductForm';
import { productsApi } from '@/src/api/productsApi';
import { useQueryClient } from '@tanstack/react-query';
import { useMyProducts } from '@/src/hooks/useMerchantData';
import { useTheme } from '@/src/theme/ThemeContext';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { t } from '@/src/i18n';
import { Stack } from 'expo-router';

export default function EditProductScreen() {
    const { isDark } = useTheme();
    const theme = usePaperTheme();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const { data: products, isLoading } = useMyProducts();

    const product = products?.find(p => p.id === Number(id));

    const handleSubmit = async (data: any, imageUri: string | null) => {
        setLoading(true);
        try {
            await productsApi.update(Number(id), {
                name: data.name,
                description: data.description,
                price: Number(data.price),
                categoryId: data.categoryId,
                unitType: data.unitType,
                quantityStep: Number(data.quantityStep),
                allowFractionalQuantity: data.allowFractionalQuantity,
                photoUrl: imageUri ?? undefined
            });

            queryClient.invalidateQueries({ queryKey: ['my-products'] });
            router.back();
        } catch (err: any) {
            Alert.alert(t('common.error'), err.response?.data || t('products.error_update'));
        } finally {
            setLoading(false);
        }
    };

    const initialData = React.useMemo(() => {
        if (!product) return undefined;
        return {
            name: product.name,
            description: product.description || '',
            price: product.price,
            primaryImageUrl: product.primaryImageUrl,
            unitType: product.unitType,
            quantityStep: product.quantityStep,
            allowFractionalQuantity: product.allowFractionalQuantity
        };
    }, [product]);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>{t('common.no_data')}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack.Screen options={{ title: t('products.edit_product') }} />
            <ProductForm
                onSubmit={handleSubmit}
                loading={loading}
                initialData={initialData}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
