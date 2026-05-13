import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { Text, Surface, useTheme, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Brand } from '../../types';
import { resolveImageUrl } from '../../api/http';

interface BrandCardProps {
    brand: Brand;
    onPress: () => void;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand, onPress }) => {
    const theme = useTheme();
    const logoUrl = resolveImageUrl(brand.logoUrl);

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
            <Surface style={styles.container} elevation={0}>
                <View style={styles.logoContainer}>
                    {logoUrl ? (
                        <Image source={{ uri: logoUrl }} style={styles.logo} />
                    ) : (
                        <Avatar.Text
                            size={48}
                            label={brand.name?.[0] || 'B'}
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                            labelStyle={{ color: theme.colors.onPrimaryContainer }}
                        />
                    )}
                </View>
                <View style={styles.content}>
                    <Text variant="titleMedium" style={styles.name}>
                        {brand.name}
                    </Text>
                    <View style={styles.meta}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.onSurfaceVariant} />
                        <Text variant="bodySmall" style={styles.metaText}>
                            25-30 min
                        </Text>
                        <View style={styles.dot} />
                        <MaterialCommunityIcons name="star" size={14} color="#FFB800" />
                        <Text variant="bodySmall" style={styles.metaText}>
                            4.5
                        </Text>
                    </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </Surface>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    logoContainer: {
        marginRight: 16,
    },
    logo: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    content: {
        flex: 1,
    },
    name: {
        fontWeight: '700',
        marginBottom: 4,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        marginLeft: 4,
        color: '#757575',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#757575',
        marginHorizontal: 8,
    },
});
