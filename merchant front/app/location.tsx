import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Linking } from 'react-native';
import { Text, Card, Button, ActivityIndicator, useTheme as usePaperTheme, IconButton, List } from 'react-native-paper';
import * as Location from 'expo-location';
import { useBrandLocation, useUpdateBrandLocation } from '@/src/hooks/useMerchantData';
import { t } from '@/src/i18n';
import { MapPin, Navigation, Save, RefreshCw } from 'lucide-react-native';
import { MapLocationPicker } from '@/src/components/MapLocationPicker';

export default function StoreLocationScreen() {
    const theme = usePaperTheme();
    const { data: savedLocation, isLoading: isFetching, refetch } = useBrandLocation();
    const updateLocation = useUpdateBrandLocation();

    const [draftLocation, setDraftLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (savedLocation && !draftLocation) {
            setDraftLocation({ lat: savedLocation.lat, lng: savedLocation.lng });
        }
    }, [savedLocation]);

    const handleUseCurrentLocation = async () => {
        setIsLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('common.error'), t('location.permission_denied'));
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setDraftLocation({
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            });
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('location.fetch_error'));
        } finally {
            setIsLocating(false);
        }
    };

    const handleSave = () => {
        if (!draftLocation) return;
        updateLocation.mutate({
            lat: draftLocation.lat,
            lng: draftLocation.lng,
        });
    };

    const handleOpenMap = () => {
        if (!savedLocation) return;
        const url = `https://www.openstreetmap.org/?mlat=${savedLocation.lat}&mlon=${savedLocation.lng}#map=17/${savedLocation.lat}/${savedLocation.lng}`;
        Linking.openURL(url);
    };

    if (isFetching && !savedLocation) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const hasChanges = draftLocation && (
        draftLocation.lat !== savedLocation?.lat ||
        draftLocation.lng !== savedLocation?.lng
    );

    const formattedDate = savedLocation?.updatedAt
        ? new Date(savedLocation.updatedAt).toLocaleString()
        : t('location.not_set');

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.header}>
                            <MapPin size={24} color={theme.colors.primary} />
                            <Text variant="titleLarge" style={styles.title}>
                                {t('location.current_location')}
                            </Text>
                            <IconButton
                                icon={() => <RefreshCw size={20} color={theme.colors.outline} />}
                                onPress={() => refetch()}
                                disabled={isFetching}
                            />
                        </View>

                        <List.Item
                            title={t('location.lat')}
                            description={savedLocation?.lat?.toFixed(6) || t('location.not_set')}
                            left={props => <List.Icon {...props} icon="latitude" />}
                        />
                        <List.Item
                            title={t('location.lng')}
                            description={savedLocation?.lng?.toFixed(6) || t('location.not_set')}
                            left={props => <List.Icon {...props} icon="longitude" />}
                        />
                        <List.Item
                            title={t('location.last_updated')}
                            description={formattedDate}
                            left={props => <List.Icon {...props} icon="clock-outline" />}
                        />

                        {savedLocation && savedLocation.lat !== 0 && (
                            <Button
                                mode="text"
                                onPress={handleOpenMap}
                                icon="map-outline"
                                style={{ marginTop: 8 }}
                            >
                                {t('location.open_on_map')}
                            </Button>
                        )}
                    </Card.Content>
                </Card>

                <Card style={[styles.card, { marginTop: 16 }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ marginBottom: 16 }}>
                            {t('location.use_current')}
                        </Text>

                        {draftLocation && (
                            <View style={styles.draftBox}>
                                <Text variant="labelMedium" style={{ color: theme.colors.secondary }}>
                                    {t('location.lat')}: {draftLocation.lat.toFixed(6)}
                                </Text>
                                <Text variant="labelMedium" style={{ color: theme.colors.secondary }}>
                                    {t('location.lng')}: {draftLocation.lng.toFixed(6)}
                                </Text>
                            </View>
                        )}

                        <MapLocationPicker
                            latitude={draftLocation?.lat ?? savedLocation?.lat}
                            longitude={draftLocation?.lng ?? savedLocation?.lng}
                            onChange={setDraftLocation}
                        />

                        <Button
                            mode="outlined"
                            onPress={handleUseCurrentLocation}
                            loading={isLocating}
                            disabled={isLocating || updateLocation.isPending}
                            icon={() => <Navigation size={18} color={theme.colors.primary} />}
                            style={styles.button}
                        >
                            {t('location.use_current')}
                        </Button>

                        <Button
                            mode="contained"
                            onPress={handleSave}
                            loading={updateLocation.isPending}
                            disabled={!draftLocation || !hasChanges || isLocating || updateLocation.isPending}
                            icon={() => <Save size={18} color="#fff" />}
                            style={[styles.button, { marginTop: 12 }]}
                        >
                            {t('location.save_location')}
                        </Button>
                    </Card.Content>
                </Card>

                <Text variant="bodySmall" style={styles.footerNote}>
                    * {t('brand.profile_subtitle')}
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        flex: 1,
        marginLeft: 12,
        fontWeight: 'bold',
    },
    draftBox: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    button: {
        borderRadius: 8,
    },
    footerNote: {
        marginTop: 24,
        textAlign: 'center',
        opacity: 0.6,
        paddingHorizontal: 32,
    }
});
