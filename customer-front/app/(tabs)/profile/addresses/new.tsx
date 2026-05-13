import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Switch, HelperText, useTheme, Card, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Location from 'expo-location';
import { useCreateAddress } from '../../../../src/hooks/addresses';
import { Stack, router } from 'expo-router';
import { MapPin, Target } from 'lucide-react-native';

const addressSchema = z.object({
    addressLine: z.string().min(5, 'Address is too short'),
    notes: z.string().optional(),
    isDefault: z.boolean().default(false),
    lat: z.number().refine(v => v !== 0, 'Latitude is required'),
    lng: z.number().refine(v => v !== 0, 'Longitude is required'),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function NewAddressScreen() {
    const theme = useTheme();
    const [localLoading, setLocalLoading] = useState(false);
    const { mutate: createAddress, isPending } = useCreateAddress();

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<AddressForm>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            addressLine: '',
            notes: '',
            isDefault: false,
            lat: 0,
            lng: 0,
        },
    });

    const lat = watch('lat');
    const lng = watch('lng');

    const getCurrentLocation = async () => {
        setLocalLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required to fetch your current position.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setValue('lat', location.coords.latitude);
            setValue('lng', location.coords.longitude);

            // Optionally reverse geocode to fill addressLine
            const [place] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (place) {
                const addr = `${place.streetNumber || ''} ${place.street || ''}, ${place.district || ''}, ${place.city || ''}`.trim();
                if (addr.length > 5) setValue('addressLine', addr);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not fetch your location. Please enter manually.');
        } finally {
            setLocalLoading(false);
        }
    };

    const onSubmit = (data: AddressForm) => {
        createAddress(data, {
            onSuccess: () => router.back(),
        });
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Add New Address' }} />
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
                            Get Current Location
                        </Button>

                        {lat !== 0 && (
                            <View style={styles.coordsRow}>
                                <MapPin size={16} color={theme.colors.primary} />
                                <Text variant="labelMedium" style={styles.coordsText}>
                                    GPS Captured: {lat.toFixed(6)}, {lng.toFixed(6)}
                                </Text>
                            </View>
                        )}

                        {(errors.lat || errors.lng) && (
                            <HelperText type="error">Please capture your GPS location using the button above.</HelperText>
                        )}

                        <Controller
                            control={control}
                            name="addressLine"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        label="Full Address (House, Street, etc.)"
                                        value={value}
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
                                        label="Notes for delivery (Optional)"
                                        placeholder="e.g. Apartment 5, 2nd floor"
                                        value={value || ''}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        mode="outlined"
                                    />
                                </View>
                            )}
                        />

                        <View style={styles.switchRow}>
                            <Text variant="bodyMedium">Set as default address</Text>
                            <Controller
                                control={control}
                                name="isDefault"
                                render={({ field: { onChange, value } }) => (
                                    <Switch value={value} onValueChange={onChange} color={theme.colors.primary} />
                                )}
                            />
                        </View>
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={handleSubmit(onSubmit)}
                    loading={isPending}
                    disabled={isPending || localLoading}
                    style={styles.submitBtn}
                >
                    Save Address
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
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingVertical: 8,
    },
    submitBtn: {
        paddingVertical: 8,
        borderRadius: 8,
    },
});
