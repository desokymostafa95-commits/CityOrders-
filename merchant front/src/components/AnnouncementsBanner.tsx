import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, useTheme as usePaperTheme } from 'react-native-paper';
import { Megaphone, X } from 'lucide-react-native';
import { GlobalAnnouncement } from '../types';

interface Props {
    announcements: GlobalAnnouncement[];
}

export default function AnnouncementsBanner({ announcements }: Props) {
    const theme = usePaperTheme();
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
                    style={[styles.banner, { backgroundColor: theme.colors.secondaryContainer }]} 
                    elevation={1}
                >
                    <View style={styles.content}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondary }]}>
                            <Megaphone color="#fff" size={20} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text variant="titleSmall" style={{ color: theme.colors.onSecondaryContainer, fontWeight: 'bold' }}>
                                Announcement
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
                                {item.message}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => handleDismiss(item.id)}
                            style={styles.closeButton}
                        >
                            <X size={18} color={theme.colors.onSecondaryContainer} />
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
    },
    banner: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 12,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    closeButton: {
        padding: 4,
    }
});
