import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Switch, HelperText, useTheme, Card, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Location from 'expo-location';
import { useAddresses, useUpdateAddress } from '../../../../src/hooks/addresses';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MapPin, Target } from 'lucide-react-native';
import { MapLocationPicker } from '../../../../src/components/MapLocationPicker';

const addressSchema = z.object({
    addressLine: z.string().min(5, 'العنوان قصير جدا'),
    notes: z.string().optional(),
    lat: z.number().refine(v => v !== 0, 'اختيار الموقع مطلوب'),
    lng: z.number().refine(v => v !== 0, 'اختيار الموقع مطلوب'),
});

type AddressFormInput = z.input<typeof addressSchema>;
type AddressForm = z.output<typeof addressSchema>;

export default function EditAddressScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const addressId = parseInt(id);
    const theme = useTheme();
    const [localLoading, setLocalLoading] = useState(false);

    const { data: addresses } = useAddresses();
    const address = addresses?.find(a => a.id === addressId);

    const { mutate: updateAddress, isPending } = useUpdateAddress();

    const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AddressFormInput, unknown, AddressForm>({
        resolver: zodResolver(addressSchema),
    });

    useEffect(() => {
        if (address) {
            reset({
                addressLine: address.addressLine,
                notes: address.notes || '',
                lat: address.lat || 0,
                lng: address.lng || 0,
            });
        }
    }, [address, reset]);

    const lat = watch('lat');
    const lng = watch('lng');

    const handleMapLocationChange = (location: { lat: number; lng: number }) => {
        setValue('lat', location.lat, { shouldDirty: true, shouldValidate: true });
        setValue('lng', location.lng, { shouldDirty: true, shouldValidate: true });
    };

    const getCurrentLocation = async () => {
        setLocalLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('إذن الموقع مرفوض', 'فعّل إذن الموقع أو اختار المكان من الخريطة.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setValue('lat', location.coords.latitude, { shouldDirty: true, shouldValidate: true });
            setValue('lng', location.coords.longitude, { shouldDirty: true, shouldValidate: true });

            const [place] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (place) {
                const addr = `${place.streetNumber || ''} ${place.street || ''}, ${place.district || ''}, ${place.city || ''}`.trim();
                if (addr.length > 5) setValue('addressLine', addr);
            }
        } catch (error) {
            Alert.alert('تعذر تحديد الموقع', 'اختار المكان من الخريطة أو اكتب العنوان يدويا.');
        } finally {
            setLocalLoading(false);
        }
    };

    const onSubmit = (data: AddressForm) => {
        updateAddress({ id: addressId, address: data }, {
            onSuccess: () => router.back(),
        });
    };

    if (!address) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'تعديل العنوان' }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Card style={styles.card}>
                    <Card.Content>
                        <Button
                            mode="contained-tonal"
                            icon={() => <Target size={20} color={theme.colors.primary} />}
                            onPress={getCurrentLocation}
                            loading={localLoading}
                            disabled={localLoading}
                            style={styles.locationBtn}
                        >
                            تحديث موقعي الحالي
                        </Button>

                        {lat !== 0 && (
                            <View style={styles.coordsRow}>
                                <MapPin size={16} color={theme.colors.primary} />
                                <Text variant="labelMedium" style={styles.coordsText}>
                                    الموقع: {lat.toFixed(6)}, {lng.toFixed(6)}
                                </Text>
                            </View>
                        )}

                        <Text variant="labelLarge" style={styles.mapLabel}>
                            اختار المكان من الخريطة
                        </Text>
                        <MapLocationPicker
                            latitude={lat}
                            longitude={lng}
                            onChange={handleMapLocationChange}
                        />

                        <Controller
                            control={control}
                            name="addressLine"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        label="العنوان بالتفصيل"
                                        value={value || ''}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        mode="outlined"
                                        multiline
                                        error={!!errors.addressLine}
                                    />
                                    {errors.addressLine && <HelperText type="error">{errors.addressLine.message}</HelperText>}
                                </View>
                            )}
                        />

                        <Controller
                            control={control}
                            name="notes"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        label="ملاحظات للتوصيل"
                                        value={value || ''}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        mode="outlined"
                                    />
                                </View>
                            )}
                        />
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={handleSubmit(onSubmit)}
                    loading={isPending}
                    disabled={isPending || localLoading}
                    style={styles.submitBtn}
                >
                    تحديث العنوان
                </Button>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        elevation: 2,
        marginBottom: 20,
    },
    locationBtn: {
        marginBottom: 16,
    },
    coordsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
    },
    coordsText: {
        marginLeft: 8,
        color: '#2E7D32',
    },
    mapLabel: {
        marginBottom: 8,
    },
    inputContainer: {
        marginBottom: 12,
    },
    submitBtn: {
        paddingVertical: 8,
        borderRadius: 8,
    },
});
