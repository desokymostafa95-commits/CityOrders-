import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Animated } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Category } from '../../types';
import { resolveImageUrl } from '../../api/http';

interface CategoryCardProps {
    category: Category;
    onPress: () => void;
}

const ICON_MAP: Record<string, string> = {
    'pizza': 'pizza',
    'burger': 'food-apple',
    'sushi': 'food-variant',
    'coffee': 'coffee',
    'dessert': 'cupcake',
    'grocery': 'cart',
    'pharmacy': 'medical-bag',
    'fashion': 'tshirt-crew-outline',
    'clothes': 'tshirt-crew-outline',
    'mobile': 'cellphone',
    'mobiles': 'cellphone',
    'computer': 'laptop',
    'computers': 'laptop',
    'appliances': 'washing-machine',
};

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress }) => {
    const theme = useTheme();
    const scale = React.useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const sectorIcon = category.marketSectorSlug && ICON_MAP[category.marketSectorSlug.toLowerCase()];
    const iconName = (category.iconKey && ICON_MAP[category.iconKey.toLowerCase()]) || sectorIcon || 'shape-outline';
    const imageUrl = resolveImageUrl(category.imageUrl);

    return (
        <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                accessibilityRole="button"
                accessibilityLabel={`${category.name} category`}
                style={styles.touchable}
            >
                <Surface style={styles.surface} elevation={0}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={styles.image} />
                        ) : (
                            <MaterialCommunityIcons
                                name={iconName as any}
                                size={28}
                                color={theme.colors.onPrimaryContainer}
                            />
                        )}
                    </View>
                    <Text variant="labelLarge" style={styles.name} numberOfLines={1}>
                        {category.name}
                    </Text>
                    {!!category.marketSectorName && (
                        <Text variant="labelSmall" style={styles.sectorName} numberOfLines={1}>
                            {category.marketSectorName}
                        </Text>
                    )}
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
        borderRadius: 18,
        padding: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 132,
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    image: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    name: {
        textAlign: 'center',
        fontWeight: '900',
        color: '#0F172A',
    },
    sectorName: {
        color: '#64748B',
        marginTop: 2,
    },
});
