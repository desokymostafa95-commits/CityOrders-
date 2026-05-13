import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, Button, useTheme as usePaperTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { AlertCircle, AlertTriangle } from 'lucide-react-native';
import { t } from '@/src/i18n';

interface Props {
    state: 'Grace' | 'Expired' | 'None';
    graceEndDate?: string;
}

export default function SubscriptionBanner({ state, graceEndDate }: Props) {
    const theme = usePaperTheme();

    if (state === 'None') {
        return (
            <Surface style={[styles.container, { backgroundColor: theme.colors.error }]} elevation={1}>
                <View style={styles.content}>
                    <AlertCircle color="#fff" size={24} />
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{t('subscription.none')}</Text>
                        <Text style={styles.description}>{t('subscription.no_subscription_msg')}</Text>
                    </View>
                </View>
                <Button
                    mode="contained"
                    onPress={() => router.push('/subscription')}
                    style={styles.button}
                    buttonColor="#fff"
                    textColor={theme.colors.error}
                >
                    {t('subscription.choose_plan')}
                </Button>
            </Surface>
        );
    }

    if (state === 'Expired') {
        return (
            <Surface style={[styles.container, { backgroundColor: theme.colors.error }]} elevation={1}>
                <View style={styles.content}>
                    <AlertCircle color="#fff" size={24} />
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{t('subscription.expired')}</Text>
                        <Text style={styles.description}>{t('subscription.expired_msg')}</Text>
                    </View>
                </View>
                <Button
                    mode="contained"
                    onPress={() => router.push('/subscription')}
                    style={styles.button}
                    buttonColor="#fff"
                    textColor={theme.colors.error}
                >
                    {t('common.refresh')}
                </Button>
            </Surface>
        );
    }

    if (state === 'Grace') {
        return (
            <Surface style={[styles.container, { backgroundColor: '#f59e0b' }]} elevation={1}>
                <View style={styles.content}>
                    <AlertTriangle color="#fff" size={24} />
                    <View style={styles.textContainer}>
                        <Text style={[styles.title, { color: '#fff' }]}>{t('subscription.grace')}</Text>
                        <Text style={[styles.description, { color: '#fff' }]}>
                            {t('subscription.grace_msg', { date: graceEndDate ? new Date(graceEndDate).toLocaleDateString() : 'soon' })}
                        </Text>
                    </View>
                </View>
                <Button
                    mode="contained"
                    onPress={() => router.push('/subscription')}
                    style={styles.button}
                    buttonColor="#fff"
                    textColor="#f59e0b"
                >
                    {t('common.refresh')}
                </Button>
            </Surface>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 12,
        margin: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    textContainer: {
        marginLeft: 12,
        flex: 1,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    description: {
        color: '#fff',
        fontSize: 12,
    },
    button: {
        marginLeft: 8,
        borderRadius: 8,
    },
});
