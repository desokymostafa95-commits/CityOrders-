import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Surface, Text, useTheme, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const Skeleton: React.FC<{ width?: any; height?: any; borderRadius?: number; style?: any }> = ({
    width = '100%',
    height = 20,
    borderRadius = 4,
    style,
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius, opacity },
                style,
            ]}
        />
    );
};

export const EmptyState: React.FC<{
    icon: string;
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}> = ({
    icon,
    title,
    message,
    actionLabel,
    onAction,
}) => {
        const theme = useTheme();

        return (
            <View style={styles.emptyContainer}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <MaterialCommunityIcons name={icon as any} size={48} color={theme.colors.outline} />
                </View>
                <Text variant="headlineSmall" style={styles.emptyTitle}>
                    {title}
                </Text>
                <Text variant="bodyMedium" style={styles.emptyMessage}>
                    {message}
                </Text>
                {actionLabel && onAction && (
                    <Button
                        mode="contained"
                        onPress={onAction}
                        style={styles.emptyAction}
                        labelStyle={styles.emptyActionLabel}
                    >
                        {actionLabel}
                    </Button>
                )}
            </View>
        );
    };

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E1E9EE',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyMessage: {
        color: '#757575',
        textAlign: 'center',
    },
    emptyAction: {
        marginTop: 24,
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    emptyActionLabel: {
        fontWeight: '700',
    },
});
