import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, router } from 'expo-router';
import { setToken } from '../../src/api/http';
import http from '../../src/api/http';
import { ENDPOINTS } from '../../src/api/endpoints';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        setError(null);
        try {
            const response = await http.post(ENDPOINTS.AUTH.LOGIN, data);
            const { token } = response.data;

            await setToken(token);

            // Navigate to tabs
            router.replace('/(tabs)/home');
        } catch (err: any) {
            setError(err.response?.data || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                        CityOrders
                    </Text>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Customer Portal
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text variant="headlineSmall" style={styles.title}>Welcome back</Text>

                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Email"
                                    value={value}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    error={!!errors.email}
                                />
                                {errors.email && <HelperText type="error">{errors.email.message}</HelperText>}
                            </View>
                        )}
                    />

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Password"
                                    value={value}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    secureTextEntry
                                    error={!!errors.password}
                                />
                                {errors.password && <HelperText type="error">{errors.password.message}</HelperText>}
                            </View>
                        )}
                    />

                    {error && <HelperText type="error" style={styles.error}>{error}</HelperText>}

                    <Button
                        mode="contained"
                        onPress={handleSubmit(onSubmit)}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                    >
                        Login
                    </Button>

                    <View style={styles.footer}>
                        <Text variant="bodyMedium">Don't have an account? </Text>
                        <Link href="/(auth)/register" asChild>
                            <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                Register here
                            </Text>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    form: {
        gap: 12,
    },
    title: {
        marginBottom: 16,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 4,
    },
    button: {
        marginTop: 12,
        paddingVertical: 6,
    },
    error: {
        textAlign: 'center',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
});
