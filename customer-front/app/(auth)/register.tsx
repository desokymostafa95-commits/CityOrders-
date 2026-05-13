import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, router } from 'expo-router';
import http, { setToken } from '../../src/api/http';
import { ENDPOINTS } from '../../src/api/endpoints';

const registerSchema = z.object({
    name: z.string().min(3, 'Full name must be at least 3 characters'),
    phone: z.string().regex(/^01[0125][0-9]{8}$/, 'Invalid Egyptian phone number'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
    addressLine: z.string().min(5, 'Initial address is required'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            password: '',
            confirmPassword: '',
            addressLine: '',
        },
    });

    const onSubmit = async (data: RegisterForm) => {
        setLoading(true);
        setError(null);
        try {
            const response = await http.post(ENDPOINTS.AUTH.REGISTER, {
                name: data.name,
                email: data.email,
                password: data.password,
                addressLine: data.addressLine,
            });

            // Store token and go to home
            const { token } = response.data;
            await setToken(token);
            router.replace('/(tabs)/home');
        } catch (err: any) {
            // Parse backend error response for better display
            const res = err.response?.data;
            if (typeof res === 'string') {
                setError(res);
            } else if (res?.errors) {
                // Handle validation errors object
                const messages = Object.values(res.errors).flat().join(', ');
                setError(messages || 'Validation failed.');
            } else if (res?.title) {
                setError(res.title + (res.detail ? `: ${res.detail}` : ''));
            } else if (res?.message) {
                setError(res.message);
            } else {
                setError(`Registration failed (${err.response?.status || 'Network error'}). Please try again.`);
            }
            console.error('Registration error:', err.response?.data);
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
                        Join us today
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text variant="headlineSmall" style={styles.title}>Create Account</Text>

                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Full Name"
                                    value={value}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    error={!!errors.name}
                                />
                                {errors.name && <HelperText type="error">{errors.name.message}</HelperText>}
                            </View>
                        )}
                    />

                    <Controller
                        control={control}
                        name="phone"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Phone Number"
                                    value={value}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    keyboardType="phone-pad"
                                    error={!!errors.phone}
                                />
                                {errors.phone && <HelperText type="error">{errors.phone.message}</HelperText>}
                            </View>
                        )}
                    />

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
                        name="addressLine"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Initial Address"
                                    value={value}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    multiline
                                    numberOfLines={2}
                                    error={!!errors.addressLine}
                                />
                                {errors.addressLine && <HelperText type="error">{errors.addressLine.message}</HelperText>}
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

                    <Controller
                        control={control}
                        name="confirmPassword"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Confirm Password"
                                    value={value}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    secureTextEntry
                                    error={!!errors.confirmPassword}
                                />
                                {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword.message}</HelperText>}
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
                        Register
                    </Button>

                    <View style={styles.footer}>
                        <Text variant="bodyMedium">Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                Login here
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
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 48,
    },
    form: {
        gap: 8,
    },
    title: {
        marginBottom: 16,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 2,
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
        marginBottom: 48,
    },
});
