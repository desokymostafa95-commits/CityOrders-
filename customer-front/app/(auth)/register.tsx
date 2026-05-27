import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, router } from 'expo-router';
import * as Location from 'expo-location';
import http, { setToken } from '../../src/api/http';
import { ENDPOINTS } from '../../src/api/endpoints';
import { MapLocationPicker } from '../../src/components/MapLocationPicker';
import { friendlyError } from '../../src/utils/messages';
import { Target } from 'lucide-react-native';

const registerSchema = z.object({
    name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
    phone: z.string().regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف المصري غير صحيح'),
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    confirmPassword: z.string().min(6, 'تأكيد كلمة المرور مطلوب'),
    addressLine: z.string().min(5, 'العنوان مطلوب'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);

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

    // Auto-detect location on mount
    useEffect(() => {
        detectLocation();
    }, []);

    const detectLocation = async () => {
        setLocating(true);
        try {
            if (Platform.OS === 'web') {
                // Use browser Geolocation API on web
                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            setSelectedLocation({
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                            });
                            setLocating(false);
                        },
                        () => {
                            // Permission denied or error — stay on default Cairo
                            setLocating(false);
                        },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                    );
                } else {
                    setLocating(false);
                }
            } else {
                // Use expo-location on native
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLocating(false);
                    return;
                }
                const loc = await Location.getCurrentPositionAsync({});
                setSelectedLocation({
                    lat: loc.coords.latitude,
                    lng: loc.coords.longitude,
                });
                setLocating(false);
            }
        } catch {
            setLocating(false);
        }
    };

    const onSubmit = async (data: RegisterForm) => {
        setLoading(true);
        setError(null);
        try {
            const response = await http.post(ENDPOINTS.AUTH.REGISTER, {
                name: data.name,
                email: data.email,
                password: data.password,
                addressLine: data.addressLine,
                lat: selectedLocation?.lat,
                lng: selectedLocation?.lng,
            });

            const { token } = response.data;
            await setToken(token);
            router.replace('/(tabs)/home');
        } catch (err: any) {
            setError(friendlyError(err, 'فشل إنشاء الحساب. حاول مرة أخرى.'));
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
                        أنشئ حسابك وسجل عنوانك
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text variant="headlineSmall" style={styles.title}>إنشاء حساب</Text>

                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="الاسم بالكامل"
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
                                    label="رقم الهاتف"
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
                                    label="البريد الإلكتروني"
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
                                    label="العنوان"
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

                    <View style={styles.inputContainer}>
                        <Text variant="titleSmall" style={styles.mapTitle}>حدد مكانك على الخريطة</Text>

                        <Button
                            mode="contained-tonal"
                            icon={() => <Target size={20} color={theme.colors.primary} />}
                            onPress={detectLocation}
                            loading={locating}
                            disabled={locating}
                            style={styles.locationBtn}
                        >
                            📍 استخدام موقعي الحالي
                        </Button>

                        {locating && (
                            <View style={styles.locatingRow}>
                                <ActivityIndicator size="small" color={theme.colors.primary} />
                                <Text variant="bodySmall" style={styles.locatingText}>جاري تحديد موقعك...</Text>
                            </View>
                        )}

                        <MapLocationPicker
                            latitude={selectedLocation?.lat ?? 30.0444}
                            longitude={selectedLocation?.lng ?? 31.2357}
                            onChange={setSelectedLocation}
                            height={220}
                        />
                        <HelperText type={selectedLocation ? 'info' : 'error'} visible>
                            {selectedLocation
                                ? `تم اختيار الموقع: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`
                                : 'اختيار الموقع يساعد التاجر على حساب التوصيل بدقة.'}
                        </HelperText>
                    </View>

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="كلمة المرور"
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
                                    label="تأكيد كلمة المرور"
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
                        إنشاء الحساب
                    </Button>

                    <View style={styles.footer}>
                        <Text variant="bodyMedium">لديك حساب بالفعل؟ </Text>
                        <Link href="/(auth)/login" asChild>
                            <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                تسجيل الدخول
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
    mapTitle: {
        fontWeight: '700',
        marginBottom: 8,
    },
    locationBtn: {
        marginBottom: 12,
        borderRadius: 10,
    },
    locatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    locatingText: {
        color: '#757575',
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
