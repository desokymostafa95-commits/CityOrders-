import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlobalAnnouncement } from '../types';

interface Props {
    announcements: GlobalAnnouncement[];
}

export default function AnnouncementsBanner({ announcements }: Props) {
    const theme = useTheme();
    const [dismissedIds, setDismissedIds] = React.useState<number[]>([]);

    const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));

    if (visibleAnnouncements.length === 0) return null;

    const handleDismiss = (id: number) => {
        setDismissedIds(prev => [...prev, id]);
    };

    return (
        <View style={styles.container}>
            {visibleAnnouncements.map((item) => (
                <Surface 
                    key={item.id} 
                    style={[styles.banner, { backgroundColor: theme.colors.primaryContainer }]} 
                    elevation={1}
                >
                    <View style={styles.content}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                            <MaterialCommunityIcons name="bullhorn" color="#fff" size={20} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 }}>
                                Special Update
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, lineHeight: 18 }}>
                                {item.message}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => handleDismiss(item.id)}
                            style={styles.closeButton}
                        >
                            <MaterialCommunityIcons name="close" size={18} color={theme.colors.onPrimaryContainer} />
                        </TouchableOpacity>
                    </View>
                </Surface>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    banner: {
        marginTop: 12,
        borderRadius: 16,
        padding: 14,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    textContainer: {
        flex: 1,
        marginLeft: 14,
        marginRight: 8,
    },
    closeButton: {
        padding: 4,
        opacity: 0.7,
    }
});
