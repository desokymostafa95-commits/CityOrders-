import React from 'react';
import { Animated, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Text } from 'react-native-paper';
import { resolveImageUrl } from '../../api/http';
import { MarketSector } from '../../types';

interface SectorCardProps {
    sector: MarketSector;
    onPress: () => void;
}

const ICON_MAP: Record<string, string> = {
    food: 'silverware-fork-knife',
    restaurant: 'silverware-fork-knife',
    fashion: 'tshirt-crew-outline',
    clothes: 'tshirt-crew-outline',
    mobiles: 'cellphone',
    mobile: 'cellphone',
    smartphone: 'cellphone',
    computers: 'laptop',
    computer: 'laptop',
    appliances: 'washing-machine',
    appliance: 'washing-machine',
    pharmacy: 'medical-bag',
    medical: 'medical-bag',
    health: 'medical-bag',
};

const SECTOR_COLORS: Record<string, { bg: string; fg: string; soft: string }> = {
    food: { bg: '#EA580C', fg: '#FFFFFF', soft: '#FFF7ED' },
    fashion: { bg: '#BE123C', fg: '#FFFFFF', soft: '#FFF1F2' },
    mobiles: { bg: '#2563EB', fg: '#FFFFFF', soft: '#EFF6FF' },
    computers: { bg: '#0F766E', fg: '#FFFFFF', soft: '#F0FDFA' },
    appliances: { bg: '#7C3AED', fg: '#FFFFFF', soft: '#F5F3FF' },
    'pharmacy-health': { bg: '#16A34A', fg: '#FFFFFF', soft: '#F0FDF4' },
};

export const SectorCard: React.FC<SectorCardProps> = ({ sector, onPress }) => {
    const scale = React.useRef(new Animated.Value(1)).current;
    const imageUrl = resolveImageUrl(sector.imageUrl);
    const iconKey = `${sector.iconKey || sector.slug || ''}`.toLowerCase();
    const iconName = ICON_MAP[iconKey] || ICON_MAP[sector.slug?.toLowerCase?.() || ''] || 'shape-outline';
    const colors = SECTOR_COLORS[sector.slug] || { bg: '#0F172A', fg: '#FFFFFF', soft: '#F8FAFC' };

    const animateTo = (toValue: number) => {
        Animated.spring(scale, {
            toValue,
            friction: 6,
            tension: 95,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
            <TouchableOpacity
                activeOpacity={0.82}
                onPress={onPress}
                onPressIn={() => animateTo(0.98)}
                onPressOut={() => animateTo(1)}
                accessibilityRole="button"
                accessibilityLabel={`${sector.name}, ${sector.brandsCount} stores`}
                style={styles.touchable}
            >
                <Surface style={[styles.surface, { backgroundColor: colors.soft }]} elevation={0}>
                    <View style={styles.topRow}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
                            {imageUrl ? (
                                <Image source={{ uri: imageUrl }} style={styles.image} />
                            ) : (
                                <MaterialCommunityIcons
                                    name={iconName as any}
                                    size={28}
                                    color={colors.fg}
                                />
                            )}
                        </View>
                        <MaterialCommunityIcons name="arrow-top-right" size={20} color={colors.bg} />
                    </View>

                    <View>
                        <Text variant="titleMedium" style={styles.name} numberOfLines={2}>
                            {sector.name}
                        </Text>
                        <View style={styles.metaRow}>
                            <Text variant="labelSmall" style={[styles.metaPill, { color: colors.bg }]}>
                                {sector.brandsCount} stores
                            </Text>
                            <Text variant="labelSmall" style={styles.metaText}>
                                {sector.categoriesCount} categories
                            </Text>
                        </View>
                    </View>
                </Surface>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 6,
    },
    touchable: {
        flex: 1,
    },
    surface: {
        minHeight: 154,
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: 54,
        height: 54,
        borderRadius: 17,
    },
    name: {
        color: '#0F172A',
        fontWeight: '900',
        minHeight: 44,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 7,
        marginTop: 8,
    },
    metaPill: {
        minHeight: 24,
        borderRadius: 12,
        overflow: 'hidden',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#FFFFFF',
        fontWeight: '900',
    },
    metaText: {
        color: '#64748B',
        fontWeight: '700',
    },
});
