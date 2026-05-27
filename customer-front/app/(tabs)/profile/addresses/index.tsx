import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, FAB, ActivityIndicator, useTheme, IconButton, Chip, Button } from 'react-native-paper';
import { useAddresses, useSetDefaultAddress, useDeleteAddress } from '../../../../src/hooks/addresses';
import { Stack, router } from 'expo-router';
import { MapPin, Trash2, CheckCircle2 } from 'lucide-react-native';

export default function AddressesScreen() {
    const theme = useTheme();
    const { data: addresses, isLoading, error, refetch } = useAddresses();
    const { mutate: setDefault } = useSetDefaultAddress();
    const { mutate: deleteAddr } = useDeleteAddress();

    if (isLoading && !addresses) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'عناويني' }} />

            {error || addresses?.length === 0 ? (
                <View style={styles.centered}>
                    <MapPin size={64} color="#ccc" />
                    <Text variant="headlineSmall" style={styles.emptyText}>لا توجد عناوين بعد</Text>
                    <Text variant="bodyMedium">أضف عنوان توصيل لتبدأ الطلب</Text>
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refetch}
                    refreshing={isLoading}
                    renderItem={({ item }) => (
                        <Card style={[styles.card, item.isDefault && { borderColor: theme.colors.primary, borderWidth: 1 }]}>
                            <Card.Content>
                                <View style={styles.cardHeader}>
                                    <View style={styles.addressInfo}>
                                        <Text variant="titleMedium" style={styles.addressLine}>{item.addressLine}</Text>
                                        {item.notes ? <Text variant="bodySmall" style={styles.notes}>{item.notes}</Text> : null}
                                    </View>
                                    {item.isDefault && (
                                        <Chip compact icon={() => <CheckCircle2 size={14} color={theme.colors.primary} />}>
                                            أساسي
                                        </Chip>
                                    )}
                                </View>

                                <View style={styles.locationTag}>
                                    <MapPin size={12} color="#888" />
                                    <Text variant="labelSmall" style={styles.locationText}>
                                        {item.lat?.toFixed(5)}, {item.lng?.toFixed(5)}
                                    </Text>
                                </View>

                                <View style={styles.actions}>
                                    {!item.isDefault && (
                                        <Button compact mode="text" onPress={() => setDefault(item.id)}>
                                            اجعله أساسيا
                                        </Button>
                                    )}
                                    <Button compact mode="text" onPress={() => router.push(`/(tabs)/profile/addresses/${item.id}`)}>
                                        تعديل
                                    </Button>
                                    <IconButton
                                        icon={() => <Trash2 size={20} color={theme.colors.error} />}
                                        onPress={() => deleteAddr(item.id)}
                                    />
                                </View>
                            </Card.Content>
                        </Card>
                    )}
                />
            )}

            <FAB
                icon="plus"
                label="إضافة عنوان"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="#fff"
                onPress={() => router.push('/(tabs)/profile/addresses/new')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 16,
        marginBottom: 8,
        color: '#666',
    },
    listContent: {
        padding: 12,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    addressInfo: {
        flex: 1,
        marginRight: 8,
    },
    addressLine: {
        fontWeight: 'bold',
    },
    notes: {
        color: '#666',
        marginTop: 4,
    },
    locationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        opacity: 0.6,
    },
    locationText: {
        marginLeft: 4,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 12,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
