import { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, Menu, Divider, Switch, SegmentedButtons, useTheme as usePaperTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, ChevronDown } from 'lucide-react-native';
import { useCategories } from '../hooks/useCategories';
import { t } from '../i18n';
import { useTheme } from '../theme/ThemeContext';

const schema = z.object({
    name: z.string().min(3, t('products.validation.name_min')),
    description: z.string().optional().nullable(),
    price: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, t('products.validation.price_positive')),
    categoryId: z.number().nullable().optional(),
    unitType: z.string().default('Unit'),
    quantityStep: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, t('products.validation.price_positive')),
    allowFractionalQuantity: z.boolean().default(false),
});

type ProductFormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
    initialData?: {
        name: string;
        description: string;
        price: number;
        primaryImageUrl?: string;
        categoryId?: number;
        unitType?: string;
        quantityStep?: number;
        allowFractionalQuantity?: boolean;
    };
    onSubmit: (data: any, imageUri: string | null) => Promise<void>;
    loading: boolean;
}

export default function ProductForm({ initialData, onSubmit, loading }: Props) {
    const { isDark } = useTheme();
    const theme = usePaperTheme();
    const [image, setImage] = useState<string | null>(initialData?.primaryImageUrl || null);
    const { categories } = useCategories();
    const [menuVisible, setMenuVisible] = useState(false);

    const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ProductFormInput, unknown, FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            price: initialData?.price?.toString() || '',
            categoryId: initialData?.categoryId || null,
            unitType: initialData?.unitType || 'Unit',
            quantityStep: initialData?.quantityStep?.toString() || '1',
            allowFractionalQuantity: initialData?.allowFractionalQuantity || false,
        }
    });

    useEffect(() => {
        if (initialData && !loading) {
            reset({
                name: initialData.name,
                description: initialData.description || '',
                price: initialData.price?.toString() || '',
                categoryId: initialData.categoryId || null,
                unitType: initialData.unitType || 'Unit',
                quantityStep: initialData.quantityStep?.toString() || '1',
                allowFractionalQuantity: !!initialData.allowFractionalQuantity,
            });
            setImage(initialData.primaryImageUrl || null);
        }
    }, [initialData, reset, loading]);

    const selectedCategoryId = watch('categoryId');
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleFormSubmit = (data: FormData) => {
        onSubmit({
            ...data,
            price: Number(data.price),
            quantityStep: Number(data.quantityStep)
        }, image);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity
                style={[styles.imageContainer, { backgroundColor: isDark ? theme.colors.surfaceVariant : '#f0f0f0' }]}
                onPress={pickImage}
            >
                {(image && image !== 'string') ? (
                    <Image source={{ uri: image }} style={styles.image} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Camera size={40} color={theme.colors.outline} />
                        <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>{t('products.add_photo')}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.form}>
                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            label={t('products.name')}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value ?? ''}
                            mode="outlined"
                            error={!!errors.name}
                            style={styles.input}
                        />
                    )}
                />
                {errors.name && <HelperText type="error">{errors.name.message}</HelperText>}

                <Controller
                    control={control}
                    name="price"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            label={t('products.price_egp')}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value ?? ''}
                            mode="outlined"
                            keyboardType="decimal-pad"
                            error={!!errors.price}
                            style={styles.input}
                        />
                    )}
                />
                {errors.price && <HelperText type="error">{errors.price.message}</HelperText>}

                <View style={styles.categoryPicker}>
                    <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{t('products.category')}</Text>
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        contentStyle={{ backgroundColor: theme.colors.surface }}
                        anchor={
                            <Button
                                mode="outlined"
                                onPress={() => setMenuVisible(true)}
                                style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
                                contentStyle={styles.pickerButtonContent}
                            >
                                <View style={styles.pickerInner}>
                                    <Text style={{ color: theme.colors.onSurface }}>{selectedCategory?.name || t('products.no_category')}</Text>
                                    <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
                                </View>
                            </Button>
                        }
                    >
                        <Menu.Item
                            onPress={() => {
                                setValue('categoryId', null);
                                setMenuVisible(false);
                            }}
                            title={t('products.no_category')}
                        />
                        <Divider />
                        {categories.map((cat) => (
                            <Menu.Item
                                key={cat.id}
                                onPress={() => {
                                    setValue('categoryId', cat.id);
                                    setMenuVisible(false);
                                }}
                                title={cat.name}
                            />
                        ))}
                    </Menu>
                </View>

                <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            label={t('products.description')}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value ?? ''}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            style={styles.input}
                        />
                    )}
                />

                <Divider style={{ marginVertical: 16 }} />
                <Text variant="titleMedium" style={{ marginBottom: 12 }}>{t('products.unit_settings')}</Text>

                <View style={styles.inputContainer}>
                    <Text variant="labelMedium" style={{ marginBottom: 8 }}>{t('products.unit_type')}</Text>
                    <Controller
                        control={control}
                        name="unitType"
                        render={({ field: { onChange, value } }) => (
                            <SegmentedButtons
                                value={value}
                                onValueChange={onChange}
                                buttons={[
                                    { value: 'Unit', label: t('products.unit_unit') },
                                    { value: 'Kg', label: t('products.unit_kg') },
                                ]}
                            />
                        )}
                    />
                </View>

                <View style={[styles.inputContainer, styles.rowBetween]}>
                    <Text variant="bodyMedium">{t('products.allow_fractional')}</Text>
                    <Controller
                        control={control}
                        name="allowFractionalQuantity"
                        render={({ field: { onChange, value } }) => (
                            <Switch value={value} onValueChange={onChange} />
                        )}
                    />
                </View>

                {watch('allowFractionalQuantity') && (
                    <View style={styles.inputContainer}>
                        <Controller
                            control={control}
                            name="quantityStep"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    label={t('products.quantity_step')}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    mode="outlined"
                                    keyboardType="decimal-pad"
                                    error={!!errors.quantityStep}
                                    style={styles.input}
                                />
                            )}
                        />
                        <HelperText type="info" visible={true}>
                            {t('products.step_help')}
                        </HelperText>
                        {errors.quantityStep && <HelperText type="error">{errors.quantityStep.message}</HelperText>}
                    </View>
                )}

                <Button
                    mode="contained"
                    onPress={handleSubmit(handleFormSubmit)}
                    loading={loading}
                    style={styles.submitButton}
                >
                    {initialData ? t('products.update_btn') : t('products.create_btn')}
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 24,
    },
    imageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 24,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        color: '#999',
    },
    form: {
        width: '100%',
    },
    input: {
        marginBottom: 8,
    },
    categoryPicker: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        color: '#666',
    },
    pickerButton: {
        borderRadius: 4,
        borderColor: '#ccc',
    },
    pickerButtonContent: {
        height: 50,
        justifyContent: 'flex-start',
    },
    pickerInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingRight: 8,
    },
    submitButton: {
        marginTop: 24,
        paddingVertical: 8,
        borderRadius: 8,
    },
    inputContainer: {
        marginBottom: 16,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    }
});
