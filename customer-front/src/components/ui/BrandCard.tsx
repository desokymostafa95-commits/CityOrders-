import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Brand } from '../../types';
import { resolveImageUrl } from '../../api/http';
import { formatCurrency, formatDistance } from '../../utils/format';

interface BrandCardProps {
    brand: Brand;
    onPress: () => void;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand, onPress }) => {
    const theme = useTheme();
    const logoUrl = resolveImageUrl(brand.logoUrl);
    const deliveryLabel = brand.estimatedDeliveryFee != null ? formatCurrency(brand.estimatedDeliveryFee) : 'Set address';

    return (
        <TouchableOpacity
            activeOpacity={0.82}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${brand.name} store`}
        >
            <Surface style={styles.container} elevation={0}>
                <View style={styles.logoContainer}>
                    {logoUrl ? (
                        <Image source={{ uri: logoUrl }} style={styles.logo} />
                    ) : (
                        <Avatar.Text
                            size={58}
                            label={brand.name?.[0] || 'B'}
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                            labelStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '900' }}
                        />
                    )}
                </View>

                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
                            {brand.name}
                        </Text>
                        {!!brand.marketSectorName && (
                            <View style={styles.sectorPill}>
                                <Text variant="labelSmall" style={styles.sectorText} numberOfLines={1}>
                                    {brand.marketSectorName}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.metaGrid}>
                        {(brand.reviewsCount || 0) > 0 && (
                            <MetaItem icon="star" color="#A16207" text={`${brand.averageRating?.toFixed(1)} (${brand.reviewsCount})`} />
                        )}
                        <MetaItem icon="clock-outline" color="#64748B" text="25-30 min" />
                        <MetaItem icon="truck-delivery-outline" color="#64748B" text={deliveryLabel} />
                        {brand.distanceMeters != null && (
                            <MetaItem icon="map-marker-distance" color="#64748B" text={formatDistance(brand.distanceMeters)} />
                        )}
                    </View>
                </View>

                <View style={styles.chevron}>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.primary} />
                </View>
            </Surface>
        </TouchableOpacity>
    );
};

function MetaItem({ icon, color, text }: { icon: string; color: string; text: string }) {
    return (
        <View style={styles.metaItem}>
            <MaterialCommunityIcons name={icon as any} size={14} color={color} />
            <Text variant="labelSmall" style={styles.metaText} numberOfLines={1}>
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        marginHorizontal: 16,
        marginVertical: 7,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 7 },
    },
    logoContainer: {
        marginRight: 14,
    },
    logo: {
        width: 58,
        height: 58,
        borderRadius: 18,
    },
    content: {
        flex: 1,
        minWidth: 0,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    name: {
        flex: 1,
        color: '#0F172A',
        fontWeight: '900',
    },
    sectorPill: {
        maxWidth: 116,
        minHeight: 24,
        borderRadius: 12,
        paddingHorizontal: 8,
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
    },
    sectorText: {
        color: '#1E40AF',
        fontWeight: '900',
    },
    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
    },
    metaItem: {
        minHeight: 26,
        borderRadius: 13,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F8FAFC',
    },
    metaText: {
        color: '#475569',
        fontWeight: '700',
    },
    chevron: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF7ED',
        marginLeft: 10,
    },
});
