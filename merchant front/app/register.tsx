import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, useTheme as usePaperTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/src/auth/context';
import apiClient from '@/src/api/client';
import { router } from 'expo-router';
import { t } from '@/src/i18n';

const schema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
    const { signIn } = useAuth();
    const theme = usePaperTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        }
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.post('/Auth/register/customer', {
                name: data.name,
                email: data.email,
                password: data.password
            });

            // Auto-login after registration
            const loginResponse = await apiClient.post('/Auth/login', {
                email: data.email,
                password: data.password
            });

            const { token, roles } = loginResponse.data;
            await signIn(token, roles);

            // Redirect based on roles (usually new users won't have Merchant role yet)
            await signIn(token, roles);
            // Redirection is now handled by RootLayoutNav in _layout.tsx
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Registration failed.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
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
                <View style={styles.header}>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                        {t('auth.join_city_orders')}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        {t('auth.create_account_subtitle')}
                    </Text>
                </View>

                <View style={styles.form}>
                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label={t('auth.full_name')}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                mode="outlined"
                                error={!!errors.name}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.name && <HelperText type="error">{errors.name.message}</HelperText>}

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

                    <Controller
                        control={control}
                        name="confirmPassword"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label={t('auth.confirm_password')}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                mode="outlined"
                                secureTextEntry
                                error={!!errors.confirmPassword}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword.message}</HelperText>}

                    {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

                    <Button
                        mode="contained"
                        onPress={handleSubmit(onSubmit)}
                        loading={loading}
                        style={styles.button}
                    >
                        {t('auth.register')}
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => router.back()}
                        style={styles.secondaryButton}
                    >
                        {t('auth.already_have_account')}
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
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontWeight: 'bold',
    },
    subtitle: {
        textAlign: 'center',
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
    secondaryButton: {
        marginTop: 16,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 8,
    },
});
