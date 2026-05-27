import React, { useState } from 'react';
import { StyleSheet, View, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, IconButton, Chip, useTheme as usePaperTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/src/auth/context';
import apiClient from '@/src/api/client';
import { router } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { t } from '@/src/i18n';
import { Sun, Moon, Languages } from 'lucide-react-native';

const schema = z.object({
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
    const { signIn } = useAuth();
    const { themeMode, language, setThemeMode, setLanguage, isDark } = useTheme();
    const theme = usePaperTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const handleLanguageChange = (lang: string) => {
        if (lang === language) return;

        if (Platform.OS === 'web') {
            setLanguage(lang);
            return;
        }

        Alert.alert(
            t('settings.title'),
            t('settings.restart_required'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.refresh'),
                    onPress: () => setLanguage(lang)
                }
            ]
        );
    };

    const toggleTheme = () => {
        setThemeMode(isDark ? 'light' : 'dark');
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post('/Auth/login', data);
            const { token, roles } = response.data;

            await signIn(token, roles);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data || err.message || 'فشل تسجيل الدخول.';
            setError(typeof msg === 'string' ? msg : (msg?.toString() || 'فشل تسجيل الدخول.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.settingsBar}>
                    <View style={styles.languageSelector}>
                        <Languages size={20} color={theme.colors.primary} />
                        <Chip
                            selected={language === 'en'}
                            onPress={() => handleLanguageChange('en')}
                            style={[styles.langChip, language === 'en' && { backgroundColor: theme.colors.primaryContainer }]}
                            textStyle={{ color: theme.colors.onSurface }}
                        >
                            EN
                        </Chip>
                        <Chip
                            selected={language === 'ar'}
                            onPress={() => handleLanguageChange('ar')}
                            style={[styles.langChip, language === 'ar' && { backgroundColor: theme.colors.primaryContainer }]}
                            textStyle={{ color: theme.colors.onSurface }}
                        >
                            AR
                        </Chip>
                    </View>
                    <IconButton
                        icon={() => isDark ? <Sun size={22} color={theme.colors.primary} /> : <Moon size={22} color={theme.colors.primary} />}
                        onPress={toggleTheme}
                        style={styles.themeToggle}
                    />
                </View>

                <View style={styles.header}>
                    <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.primary }]}>
                        {t('auth.city_orders')}
                    </Text>
                    <Text variant="titleMedium" style={[styles.subtitle, { color: theme.colors.onSurface }]}>
                        {t('auth.merchant_portal')}
                    </Text>
                </View>

                <View style={styles.form}>
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label={t('auth.email')}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                mode="outlined"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                error={!!errors.email}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.email && <HelperText type="error">{errors.email.message}</HelperText>}

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label={t('auth.password')}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                mode="outlined"
                                secureTextEntry
                                error={!!errors.password}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.password && <HelperText type="error">{errors.password.message}</HelperText>}

                    {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

                    <Button
                        mode="contained"
                        onPress={handleSubmit(onSubmit)}
                        loading={loading}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                    >
                        {t('auth.login')}
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => router.push('/register')}
                        style={styles.secondaryButton}
                    >
                        {t('auth.no_account')}
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    settingsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 16,
    },
    languageSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    langChip: {
        marginHorizontal: 4,
    },
    themeToggle: {
        margin: 0,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontWeight: 'bold',
    },
    subtitle: {
        marginTop: 4,
    },
    form: {
        width: '100%',
    },
    input: {
        marginBottom: 8,
    },
    button: {
        marginTop: 16,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    secondaryButton: {
        marginTop: 16,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 8,
    },
});
