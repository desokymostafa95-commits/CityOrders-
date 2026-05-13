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

const addressSchema = z.object({
    addressLine: z.string().min(5, 'Address is too short'),
    notes: z.string().optional(),
    lat: z.number().refine(v => v !== 0, 'Latitude is required'),
    lng: z.number().refine(v => v !== 0, 'Longitude is required'),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function EditAddressScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const addressId = parseInt(id);
    const theme = useTheme();
    const [localLoading, setLocalLoading] = useState(false);

    const { data: addresses } = useAddresses();
    const address = addresses?.find(a => a.id === addressId);

    const { mutate: updateAddress, isPending } = useUpdateAddress();

    const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AddressForm>({
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

    const getCurrentLocation = async () => {
        setLocalLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setValue('lat', location.coords.latitude);
            setValue('lng', location.coords.longitude);

            const [place] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (place) {
                const addr = `${place.streetNumber || ''} ${place.street || ''}, ${place.district || ''}, ${place.city || ''}`.trim();
                if (addr.length > 5) setValue('addressLine', addr);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not fetch your location.');
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
            <Stack.Screen options={{ title: 'Edit Address' }} />
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
                            Update GPS Location
                        </Button>

                        {lat !== 0 && (
                            <View style={styles.coordsRow}>
                                <MapPin size={16} color={theme.colors.primary} />
                                <Text variant="labelMedium" style={styles.coordsText}>
                                    GPS: {lat.toFixed(6)}, {lng.toFixed(6)}
                                </Text>
                            </View>
                        )}

                        <Controller
                            control={control}
                            name="addressLine"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        label="Full Address"
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
                                        label="Notes for delivery"
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
                    Update Address
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
    inputContainer: {
        marginBottom: 12,
    },
    submitBtn: {
        paddingVertical: 8,
        borderRadius: 8,
    },
});
