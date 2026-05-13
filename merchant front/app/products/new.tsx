import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Appbar } from 'react-native-paper';
import { router } from 'expo-router';
import ProductForm from '@/src/components/ProductForm';
import { productsApi } from '@/src/api/productsApi';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/src/theme/ThemeContext';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { t } from '@/src/i18n';
import { Stack } from 'expo-router';

export default function NewProductScreen() {
    const { isDark } = useTheme();
    const theme = usePaperTheme();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (data: any, imageUri: string | null) => {
        setLoading(true);
        try {
            // NOTE: Backend currently expects JSON with PhotoUrl string.
            // Since there's no general upload endpoint, we'll send the data as is.
            // If the backend was multipart, we would use FormData here.
            await productsApi.create({
                name: data.name,
                description: data.description,
                price: data.price,
                categoryId: data.categoryId,
                unitType: data.unitType,
                quantityStep: data.quantityStep,
                allowFractionalQuantity: data.allowFractionalQuantity,
                photoUrl: imageUri || undefined
            });

            queryClient.invalidateQueries({ queryKey: ['my-products'] });
            router.back();
        } catch (err: any) {
            Alert.alert(t('common.error'), err.response?.data || t('products.error_create'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack.Screen options={{ title: t('products.new_product') }} />
            <ProductForm onSubmit={handleSubmit} loading={loading} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
