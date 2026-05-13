import React, { useState, useCallback, useRef } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, TextInput as RNTextInput,
} from 'react-native';
import {
    Text, FAB, ActivityIndicator, useTheme, Divider,
    Portal, Modal, TextInput, HelperText, Button, Menu, Switch,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Percent, DollarSign, Calendar, Users, MoreVertical, Plus, Trash2, Power, Edit2, TrendingUp } from 'lucide-react-native';
import { promoCodesApi, PromoCodeDto, CreatePromoCodeDto } from '@/src/api/promoCodesApi';
import { formatCurrency } from '@/src/hooks/useInvoices';

const STATUS_COLORS: Record<string, string> = {
    Active:    '#2e7d32',
    Disabled:  '#757575',
    Expired:   '#c62828',
    Scheduled: '#1565c0',
    'Used Up': '#e65100',
};

function StatusBadge({ status }: { status: string }) {
    const color = STATUS_COLORS[status] ?? '#757575';
    return (
        <View style={[styles.badge, { backgroundColor: color + '18', borderColor: color + '44' }]}>
            <View style={[styles.badgeDot, { backgroundColor: color }]} />
            <Text style={[styles.badgeText, { color }]}>{status}</Text>
        </View>
    );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function PromoCard({
    promo, onToggle, onEdit, onDelete,
}: {
    promo: PromoCodeDto; onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
    const [menuVisible, setMenuVisible] = useState(false);
    const theme = useTheme();

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.codeRow}>
                    <Tag size={16} color={theme.colors.primary} />
                    <Text style={styles.codeText}>{promo.code}</Text>
                </View>
                <View style={styles.cardHeaderRight}>
                    <StatusBadge status={promo.status} />
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}>
                                <MoreVertical size={20} color="#757575" />
                            </TouchableOpacity>
                        }
                    >
                        <Menu.Item leadingIcon={() => <Edit2 size={16} color="#333" />} onPress={() => { setMenuVisible(false); onEdit(); }} title="Edit" />
                        <Menu.Item leadingIcon={() => <Power size={16} color="#333" />} onPress={() => { setMenuVisible(false); onToggle(); }} title={promo.isActive ? 'Disable' : 'Enable'} />
                        {promo.usageCount === 0 && (
                            <Menu.Item leadingIcon={() => <Trash2 size={16} color="#c62828" />} onPress={() => { setMenuVisible(false); onDelete(); }} title="Delete" titleStyle={{ color: '#c62828' }} />
                        )}
                    </Menu>
                </View>
            </View>

            <Divider style={{ marginVertical: 12 }} />

            <View style={styles.cardBody}>
                <View style={styles.discountDisplay}>
                    {promo.discountType === 'Percentage'
                        ? <Percent size={20} color={theme.colors.primary} />
                        : <DollarSign size={20} color={theme.colors.primary} />}
                    <Text style={[styles.discountValue, { color: theme.colors.primary }]}>
                        {promo.discountType === 'Percentage' ? `${promo.discountValue}% off` : `${formatCurrency(promo.discountValue)} off`}
                    </Text>
                    {promo.maxDiscountAmount && (
                        <Text style={styles.capText}>up to {formatCurrency(promo.maxDiscountAmount)}</Text>
                    )}
                </View>

                <View style={styles.metaRow}>
                    {promo.minOrderAmount && (
                        <View style={styles.metaChip}>
                            <Text style={styles.metaChipText}>Min {formatCurrency(promo.minOrderAmount)}</Text>
                        </View>
                    )}
                    {promo.usageLimit ? (
                        <View style={styles.metaChip}>
                            <Users size={11} color="#555" style={{ marginRight: 3 }} />
                            <Text style={styles.metaChipText}>{promo.usageCount}/{promo.usageLimit} uses</Text>
                        </View>
                    ) : (
                        <View style={styles.metaChip}>
                            <TrendingUp size={11} color="#555" style={{ marginRight: 3 }} />
                            <Text style={styles.metaChipText}>{promo.usageCount} uses</Text>
                        </View>
                    )}
                    {promo.expiresAt && (
                        <View style={styles.metaChip}>
                            <Calendar size={11} color="#555" style={{ marginRight: 3 }} />
                            <Text style={styles.metaChipText}>Exp {new Date(promo.expiresAt).toLocaleDateString()}</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

// ─── Inline Date/Time Input ───────────────────────────────────────────────────
// Works on web + native everywhere. No native picker dependency.

function parseDateInput(d: string, mo: string, y: string, h: string, mi: string): Date | null {
    const day = parseInt(d); const month = parseInt(mo); const year = parseInt(y);
    const hour = parseInt(h || '0'); const min = parseInt(mi || '0');
    if (!day || !month || !year) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2024) return null;
    if (hour < 0 || hour > 23 || min < 0 || min > 59) return null;
    const date = new Date(year, month - 1, day, hour, min);
    if (isNaN(date.getTime())) return null;
    return date;
}

function DateInput({
    label,
    value,
    onChange,
    onClear,
}: {
    label: string;
    value: Date | null;
    onChange: (d: Date | null) => void;
    onClear: () => void;
}) {
    const now = new Date();
    const [d, setD] = useState(value ? String(value.getDate()).padStart(2, '0') : '');
    const [mo, setMo] = useState(value ? String(value.getMonth() + 1).padStart(2, '0') : '');
    const [y, setY] = useState(value ? String(value.getFullYear()) : '');
    const [h, setH] = useState(value ? String(value.getHours()).padStart(2, '0') : '23');
    const [mi, setMi] = useState(value ? String(value.getMinutes()).padStart(2, '0') : '59');

    const moRef = useRef<any>(null);
    const yRef  = useRef<any>(null);
    const hRef  = useRef<any>(null);
    const miRef = useRef<any>(null);

    const update = (nd: string, nmo: string, ny: string, nh: string, nmi: string) => {
        const parsed = parseDateInput(nd, nmo, ny, nh, nmi);
        onChange(parsed);
    };

    const seg = (
        val: string, set: (v: string) => void,
        maxLen: number, nextRef?: any,
        other: [string, string, string, string, string] = [d, mo, y, h, mi],
        idx = 0
    ) => (v: string) => {
        const nums = v.replace(/\D/g, '').slice(0, maxLen);
        set(nums);
        const parts: [string, string, string, string, string] = [...other] as any;
        parts[idx] = nums;
        update(...parts);
        if (nums.length === maxLen && nextRef?.current) nextRef.current.focus();
    };

    return (
        <View style={di.container}>
            <View style={di.headerRow}>
                <Calendar size={14} color="#1565C0" />
                <Text style={di.label}>{label}</Text>
                {value && (
                    <TouchableOpacity onPress={() => { setD(''); setMo(''); setY(''); setH('23'); setMi('59'); onClear(); }}>
                        <Text style={di.clear}>✕ Clear</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={di.fieldsRow}>
                <View style={di.group}>
                    <RNTextInput
                        style={di.seg}
                        placeholder="DD"
                        value={d}
                        onChangeText={seg(d, setD, 2, moRef, [d, mo, y, h, mi], 0)}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholderTextColor="#BDBDBD"
                    />
                    <Text style={di.sep}>/</Text>
                    <RNTextInput
                        ref={moRef}
                        style={di.seg}
                        placeholder="MM"
                        value={mo}
                        onChangeText={seg(mo, setMo, 2, yRef, [d, mo, y, h, mi], 1)}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholderTextColor="#BDBDBD"
                    />
                    <Text style={di.sep}>/</Text>
                    <RNTextInput
                        ref={yRef}
                        style={[di.seg, { width: 56 }]}
                        placeholder="YYYY"
                        value={y}
                        onChangeText={seg(y, setY, 4, hRef, [d, mo, y, h, mi], 2)}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholderTextColor="#BDBDBD"
                    />
                </View>
                <View style={di.group}>
                    <RNTextInput
                        ref={hRef}
                        style={di.seg}
                        placeholder="HH"
                        value={h}
                        onChangeText={seg(h, setH, 2, miRef, [d, mo, y, h, mi], 3)}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholderTextColor="#BDBDBD"
                    />
                    <Text style={di.sep}>:</Text>
                    <RNTextInput
                        ref={miRef}
                        style={di.seg}
                        placeholder="MM"
                        value={mi}
                        onChangeText={seg(mi, setMi, 2, undefined, [d, mo, y, h, mi], 4)}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholderTextColor="#BDBDBD"
                    />
                </View>
            </View>
            {value && (
                <Text style={di.preview}>
                    ✓ {value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            )}
        </View>
    );
}

const di = StyleSheet.create({
    container: { marginBottom: 14, backgroundColor: '#F8FAFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#DBEAFE' },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    label: { fontSize: 13, fontWeight: '700', color: '#1565C0', flex: 1 },
    clear: { fontSize: 12, color: '#c62828', fontWeight: '600' },
    fieldsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
    group: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    seg: {
        width: 38, height: 38, borderRadius: 8, borderWidth: 1.5, borderColor: '#C5D8F8',
        backgroundColor: '#fff', textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#222',
    },
    sep: { fontSize: 18, fontWeight: '700', color: '#9E9E9E' },
    preview: { marginTop: 8, fontSize: 12, color: '#166534', fontWeight: '600' },
});

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

function PromoModal({
    visible,
    onDismiss,
    onSave,
    existing,
}: {
    visible: boolean;
    onDismiss: () => void;
    onSave: (data: CreatePromoCodeDto) => void;
    existing?: PromoCodeDto;
}) {
    const [code, setCode] = useState(existing?.code ?? '');
    const [type, setType] = useState<'Percentage' | 'Fixed'>(existing?.discountType ?? 'Percentage');
    const [value, setValue] = useState(existing ? String(existing.discountValue) : '');
    const [maxDiscount, setMaxDiscount] = useState(existing?.maxDiscountAmount ? String(existing.maxDiscountAmount) : '');
    const [minOrder, setMinOrder] = useState(existing?.minOrderAmount ? String(existing.minOrderAmount) : '');
    const [limit, setLimit] = useState(existing?.usageLimit ? String(existing.usageLimit) : '');
    const [active, setActive] = useState(existing?.isActive ?? true);
    const [startsAt, setStartsAt] = useState<Date | null>(existing?.startsAt ? new Date(existing.startsAt) : null);
    const [expiresAt, setExpiresAt] = useState<Date | null>(existing?.expiresAt ? new Date(existing.expiresAt) : null);
    const [error, setError] = useState('');

    const reset = () => {
        setCode(''); setType('Percentage'); setValue(''); setMaxDiscount('');
        setMinOrder(''); setLimit(''); setActive(true); setStartsAt(null); setExpiresAt(null); setError('');
    };

    const handleSave = () => {
        setError('');
        if (!existing && !code.trim()) { setError('Code is required'); return; }
        const val = parseFloat(value);
        if (isNaN(val) || val <= 0) { setError('Discount value must be > 0'); return; }
        if (type === 'Percentage' && val > 100) { setError('Percentage cannot exceed 100'); return; }
        if (expiresAt && startsAt && expiresAt <= startsAt) {
            setError('Expiry must be after the start date'); return;
        }

        onSave({
            code: code.trim().toUpperCase(),
            discountType: type,
            discountValue: val,
            maxDiscountAmount: maxDiscount ? parseFloat(maxDiscount) : undefined,
            minOrderAmount: minOrder ? parseFloat(minOrder) : undefined,
            usageLimit: limit ? parseInt(limit) : undefined,
            isActive: active,
            startsAt: startsAt ? startsAt.toISOString() : undefined,
            expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
        });
        reset();
    };

    const expiryCountdown = (() => {
        if (!expiresAt) return null;
        const diff = expiresAt.getTime() - Date.now();
        if (diff <= 0) return '⚠️ Already expired';
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        if (days > 0) return `Expires in ${days}d ${hours}h`;
        return `Expires in ${hours}h`;
    })();

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>{existing ? 'Edit Promo Code' : 'New Promo Code'}</Text>

                    {!existing && (
                        <TextInput
                            label="Code (e.g. SUMMER20)"
                            value={code}
                            onChangeText={t => setCode(t.toUpperCase())}
                            mode="outlined"
                            autoCapitalize="characters"
                            style={styles.input}
                        />
                    )}

                    <Text style={styles.label}>Discount Type</Text>
                    <View style={styles.typeRow}>
                        {(['Percentage', 'Fixed'] as const).map(t => (
                            <TouchableOpacity
                                key={t}
                                onPress={() => setType(t)}
                                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                            >
                                {t === 'Percentage' ? <Percent size={14} color={type === t ? '#fff' : '#555'} /> : <DollarSign size={14} color={type === t ? '#fff' : '#555'} />}
                                <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        label={type === 'Percentage' ? 'Discount %' : 'Amount (EGP)'}
                        value={value}
                        onChangeText={setValue}
                        mode="outlined"
                        keyboardType="decimal-pad"
                        style={styles.input}
                    />

                    {type === 'Percentage' && (
                        <TextInput
                            label="Max Discount (EGP) — optional"
                            value={maxDiscount}
                            onChangeText={setMaxDiscount}
                            mode="outlined"
                            keyboardType="decimal-pad"
                            style={styles.input}
                        />
                    )}

                    <TextInput
                        label="Min Order Amount (EGP) — optional"
                        value={minOrder}
                        onChangeText={setMinOrder}
                        mode="outlined"
                        keyboardType="decimal-pad"
                        style={styles.input}
                    />

                    <TextInput
                        label="Usage Limit — optional (blank = unlimited)"
                        value={limit}
                        onChangeText={setLimit}
                        mode="outlined"
                        keyboardType="number-pad"
                        style={styles.input}
                    />

                    {/* ── Validity Period ── */}
                    <Text style={[styles.label, { marginTop: 4 }]}>Validity Period</Text>

                    <DateInput
                        label="Starts at (optional)"
                        value={startsAt}
                        onChange={setStartsAt}
                        onClear={() => setStartsAt(null)}
                    />

                    <DateInput
                        label="Expires at (optional)"
                        value={expiresAt}
                        onChange={setExpiresAt}
                        onClear={() => setExpiresAt(null)}
                    />

                    {expiryCountdown && (
                        <View style={styles.countdownBadge}>
                            <Text style={styles.countdownText}>{expiryCountdown}</Text>
                        </View>
                    )}

                    <View style={styles.switchRow}>
                        <Text>Active immediately</Text>
                        <Switch value={active} onValueChange={setActive} />
                    </View>

                    {error ? <HelperText type="error" visible>{error}</HelperText> : null}

                    <View style={styles.modalBtns}>
                        <Button mode="outlined" onPress={() => { reset(); onDismiss(); }} style={{ flex: 1, marginRight: 8 }}>Cancel</Button>
                        <Button mode="contained" onPress={handleSave} style={{ flex: 1 }}>Save</Button>
                    </View>
                </ScrollView>
            </Modal>
        </Portal>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PromoCodesScreen() {
    const qc = useQueryClient();
    const theme = useTheme();

    const { data: promos = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['promoCodes'],
        queryFn: promoCodesApi.getAll,
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<PromoCodeDto | undefined>();

    const createMutation = useMutation({
        mutationFn: promoCodesApi.create,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['promoCodes'] }); setModalVisible(false); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => promoCodesApi.update(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['promoCodes'] }); setEditing(undefined); },
    });

    const toggleMutation = useMutation({
        mutationFn: promoCodesApi.toggle,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['promoCodes'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: promoCodesApi.delete,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['promoCodes'] }),
    });

    const handleSave = useCallback((data: CreatePromoCodeDto) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: { ...data, isActive: data.isActive ?? true } });
        } else {
            createMutation.mutate(data);
        }
    }, [editing]);

    const handleDelete = (promo: PromoCodeDto) => {
        Alert.alert('Delete Code', `Delete "${promo.code}"? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(promo.id) },
        ]);
    };

    const activeCount = promos.filter(p => p.status === 'Active').length;
    const totalUses = promos.reduce((s, p) => s + p.usageCount, 0);

    return (
        <View style={styles.container}>
            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>{promos.length}</Text>
                    <Text style={styles.statLabel}>Total Codes</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statNum, { color: '#2e7d32' }]}>{activeCount}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statNum, { color: theme.colors.primary }]}>{totalUses}</Text>
                    <Text style={styles.statLabel}>Total Uses</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            >
                {isLoading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} />
                ) : promos.length === 0 ? (
                    <View style={styles.empty}>
                        <Tag size={48} color="#ccc" />
                        <Text style={styles.emptyTitle}>No Promo Codes Yet</Text>
                        <Text style={styles.emptyText}>Create your first promo code to offer customers discounts.</Text>
                    </View>
                ) : (
                    promos.map(promo => (
                        <PromoCard
                            key={promo.id}
                            promo={promo}
                            onToggle={() => toggleMutation.mutate(promo.id)}
                            onEdit={() => setEditing(promo)}
                            onDelete={() => handleDelete(promo)}
                        />
                    ))
                )}
            </ScrollView>

            <FAB
                icon={({ size, color }) => <Plus size={size} color={color} />}
                style={styles.fab}
                onPress={() => { setEditing(undefined); setModalVisible(true); }}
                label="New Code"
            />

            <PromoModal
                visible={modalVisible || !!editing}
                onDismiss={() => { setModalVisible(false); setEditing(undefined); }}
                onSave={handleSave}
                existing={editing}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
        alignItems: 'center', elevation: 1,
    },
    statNum: { fontSize: 24, fontWeight: '900', color: '#222' },
    statLabel: { fontSize: 12, color: '#757575', marginTop: 2 },
    list: { padding: 16, paddingBottom: 120, gap: 12 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        elevation: 1, borderWidth: 1, borderColor: '#F0F0F0',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    codeText: { fontSize: 16, fontWeight: '900', letterSpacing: 1, fontFamily: 'monospace' },
    menuBtn: { padding: 4 },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1,
    },
    badgeDot: { width: 6, height: 6, borderRadius: 99 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    cardBody: { gap: 10 },
    discountDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    discountValue: { fontSize: 18, fontWeight: '800' },
    capText: { fontSize: 12, color: '#757575' },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    metaChip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 99, borderWidth: 1, borderColor: '#E0E0E0',
    },
    metaChipText: { fontSize: 11, color: '#555' },
    fab: { position: 'absolute', right: 20, bottom: 24 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    emptyText: { color: '#757575', textAlign: 'center', maxWidth: 260 },
    // Modal
    modal: {
        backgroundColor: '#fff', margin: 20, borderRadius: 20, padding: 20,
        maxHeight: '90%',
    },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 4 },
    input: { marginBottom: 12 },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    typeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#DDD',
    },
    typeBtnActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
    typeBtnText: { fontWeight: '600', color: '#555' },
    typeBtnTextActive: { color: '#fff' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalBtns: { flexDirection: 'row', marginTop: 12 },
    countdownBadge: {
        backgroundColor: '#FFF7ED', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
        borderWidth: 1, borderColor: '#FED7AA', marginBottom: 12, alignSelf: 'flex-start',
    },
    countdownText: { fontSize: 12, color: '#C2410C', fontWeight: '700' },
});
