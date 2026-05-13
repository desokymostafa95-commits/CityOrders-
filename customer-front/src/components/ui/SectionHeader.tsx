import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface SectionHeaderProps {
    title: string;
    actionLabel?: string;
    onActionPress?: () => void;
    containerStyle?: any;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    actionLabel,
    onActionPress,
    containerStyle,
}) => {
    const theme = useTheme();

    return (
        <View style={[styles.container, containerStyle]}>
            <Text variant="titleMedium" style={styles.title}>
                {title}
            </Text>
            {actionLabel && (
                <TouchableOpacity onPress={onActionPress}>
                    <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                        {actionLabel}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontWeight: '700',
    },
});
