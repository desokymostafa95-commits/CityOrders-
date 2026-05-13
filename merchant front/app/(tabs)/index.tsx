import React from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, Platform } from 'react-native';
import { Text, Card, Title, Button, ActivityIndicator, IconButton, Snackbar, useTheme as usePaperTheme, Portal, Dialog, TextInput } from 'react-native-paper';
import { useAuth } from '@/src/auth/context';
import { useSubscriptionStatus, useMyBrand, useMyProducts, useMyOrders } from '@/src/hooks/useMerchantData';
import SubscriptionBanner from '@/src/components/SubscriptionBanner';
import { LogOut, Package, ShoppingBag, Store } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';
import { Alert } from 'react-native';
import { Play, Square, Gift, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import { useActivateTrial, useMerchantProfile, useMerchantAvailability, useTemporaryClose, useTemporaryOpen } from '@/src/hooks/useMerchantData';
import { useCurrentShift, useShiftMutations } from '@/src/hooks/useInvoices';
import { useRenewOnly } from '@/src/hooks/useRenewOnly';
import { useActiveAnnouncements } from '@/src/hooks/useAnnouncements';
import AnnouncementsBanner from '@/src/components/AnnouncementsBanner';

export default function DashboardScreen() {
  const { signOut } = useAuth();
  const { isDark } = useTheme();
  const theme = usePaperTheme();
  const { success } = useLocalSearchParams<{ success?: string }>();
  const [snackbarVisible, setSnackbarVisible] = React.useState(!!success);

  const { token } = useAuth();
  const { data: brand, isLoading: brandLoading } = useMyBrand({ enabled: !!token });

  // Statistical hooks MUST wait for brand to be present to avoid 403s
  const isGated = !!token && !!brand;

  const { data: sub, isLoading: subLoading, refetch: refetchSub } = useSubscriptionStatus({ enabled: isGated });
  const { data: products } = useMyProducts({ enabled: isGated });
  const { data: orders } = useMyOrders(undefined, 1, { enabled: isGated });
  const { data: profile } = useMerchantProfile({ enabled: isGated });
  const { data: currentShift, isLoading: shiftLoading } = useCurrentShift({ enabled: isGated });
  const { data: availability } = useMerchantAvailability({ enabled: isGated });
  const { isRenewOnly } = useRenewOnly({ enabled: isGated });

  const { startShift, closeShift, isStarting, isClosing } = useShiftMutations();
  const activateTrialMutation = useActivateTrial();
  const temporaryCloseMutation = useTemporaryClose();
  const temporaryOpenMutation = useTemporaryOpen();
  const { data: announcements, refetch: refetchAnnouncements } = useActiveAnnouncements({ enabled: !!token });

  const [closeVisible, setCloseVisible] = React.useState(false);
  const [closeReason, setCloseReason] = React.useState('');

  const onRefresh = React.useCallback(() => {
    refetchSub();
    refetchAnnouncements();
  }, [refetchSub, refetchAnnouncements]);

  const handleToggleShift = () => {
    if (currentShift?.status === 'Open') {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(`${t('invoices.close_shift_confirm')}\n\n${t('invoices.close_shift_message')}`);
        if (confirmed) {
          closeShift();
        }
      } else {
        Alert.alert(
          t('invoices.close_shift_confirm'),
          t('invoices.close_shift_message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('invoices.close_generate'),
              onPress: () => closeShift()
            }
          ]
        );
      }
    } else {
      if (!profile?.isApproved) {
        if (Platform.OS === 'web') {
          window.alert(`${t('common.error')}: ${t('invoices.account_pending_approval')}`);
        } else {
          Alert.alert(t('common.error'), t('invoices.account_pending_approval'));
        }
        return;
      }
      if (sub?.isActive === false) {
        if (Platform.OS === 'web') {
          window.alert(`${t('common.error')}: ${t('invoices.account_deactivated')}`);
        } else {
          Alert.alert(t('common.error'), t('invoices.account_deactivated'));
        }
        return;
      }
      if (isRenewOnly) {
        if (Platform.OS === 'web') {
          window.alert(`${t('common.error')}: ${t('invoices.subscription_required_message')}`);
        } else {
          Alert.alert(t('common.error'), t('invoices.subscription_required_message'));
        }
        return;
      }
      startShift();
    }
  };

  const handleActivateTrial = () => {
    if (!profile?.isApproved) return;
    const days = sub?.freeTrialDays || 14;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${t('subscription.activate_trial_title')}\n\n${t('subscription.activate_trial_message', { days })}`);
      if (confirmed) {
        activateTrialMutation.mutate();
      }
    } else {
      Alert.alert(
        t('subscription.activate_trial_title'),
        t('subscription.activate_trial_message', { days }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('subscription.activate'),
            onPress: () => activateTrialMutation.mutate()
          }
        ]
      );
    }
  };

  if (subLoading || brandLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      >
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <View>
            <Text variant="headlineMedium" style={[styles.welcomeText, { color: theme.colors.onSurface }]}>
              {t('common.welcome', { name: brand?.name || t('common.merchant') })}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('common.manage_store')}
            </Text>
          </View>
          <IconButton
            icon={() => <LogOut size={24} color={theme.colors.onSurfaceVariant} />}
            onPress={signOut}
          />
        </View>

        {announcements && announcements.length > 0 && (
          <AnnouncementsBanner announcements={announcements} />
        )}

        {sub && sub.state !== 'Active' && (
          <SubscriptionBanner state={sub.state} graceEndDate={sub.graceEndDate} />
        )}

        {availability?.isTemporarilyClosed && (
          <View style={[styles.closedBanner, { backgroundColor: theme.colors.errorContainer }]}>
            <AlertCircle size={24} color={theme.colors.error} />
            <View style={styles.closedBannerText}>
              <Text variant="titleMedium" style={{ color: theme.colors.onErrorContainer, fontWeight: 'bold' }}>
                {t('dashboard.temporarily_closed')}
              </Text>
              {availability.temporaryCloseReason && (
                <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer }}>
                  {availability.temporaryCloseReason}
                </Text>
              )}
              {availability.temporaryCloseUntil && (
                <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer }}>
                  {t('dashboard.until')}: {new Date(availability.temporaryCloseUntil).toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.statusSection}>
          <Card style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.statusItem}>
                {profile?.isActive === false ? (
                  <AlertCircle size={20} color={theme.colors.error} />
                ) : profile?.isApproved ? (
                  <CheckCircle size={20} color={theme.colors.primary} />
                ) : (
                  <Clock size={20} color={theme.colors.error} />
                )}
                <Text variant="labelLarge" style={[styles.statusLabel, { color: profile?.isActive === false || !profile?.isApproved ? theme.colors.error : theme.colors.primary }]}>
                  {profile?.isActive === false ? t('statuses.deactivated') : (profile?.isApproved ? t('common.approved') : t('common.pending_approval'))}
                </Text>
              </View>

              <View style={styles.statusItem}>
                {currentShift?.status === 'Open' ? (
                  <Play size={20} color={theme.colors.primary} />
                ) : (
                  <Square size={20} color={theme.colors.outline} />
                )}
                <Text variant="labelLarge" style={[styles.statusLabel, { color: currentShift?.status === 'Open' ? theme.colors.primary : theme.colors.outline }]}>
                  {currentShift?.status === 'Open' ? t('dashboard.shift_open') : t('dashboard.shift_closed')}
                </Text>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button
                mode={currentShift?.status === 'Open' ? 'outlined' : 'contained'}
                onPress={handleToggleShift}
                loading={isStarting || isClosing}
                style={styles.flexBtn}
              >
                {currentShift?.status === 'Open' ? t('dashboard.close_shift') : t('dashboard.start_shift')}
              </Button>

              <Button
                mode={availability?.isTemporarilyClosed ? 'contained' : 'outlined'}
                textColor={availability?.isTemporarilyClosed ? '#fff' : theme.colors.error}
                buttonColor={availability?.isTemporarilyClosed ? theme.colors.primary : undefined}
                onPress={() => availability?.isTemporarilyClosed ? temporaryOpenMutation.mutate() : setCloseVisible(true)}
                style={[styles.flexBtn, !availability?.isTemporarilyClosed && { borderColor: theme.colors.error }]}
                loading={temporaryCloseMutation.isPending || temporaryOpenMutation.isPending}
                disabled={currentShift?.status !== 'Open'}
              >
                {availability?.isTemporarilyClosed ? t('dashboard.set_open') : t('dashboard.set_closed')}
              </Button>
            </Card.Actions>
          </Card>
        </View>

        {
          sub?.isFreeTrialEnabled && sub?.trialAvailable && !sub?.trialActivated && (
            <Card style={[styles.trialCard, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Card.Content style={styles.trialContent}>
                <Gift color={theme.colors.onSecondaryContainer} size={32} />
                <View style={styles.trialTextContainer}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                    {t('subscription.trial_available_title')}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
                    {t('subscription.trial_available_msg', { days: sub.freeTrialDays || 14 })}
                  </Text>
                </View>
                <Button
                  mode="contained"
                  onPress={handleActivateTrial}
                  loading={activateTrialMutation.isPending}
                  disabled={!profile?.isApproved}
                >
                  {t('subscription.activate')}
                </Button>
              </Card.Content>
            </Card>
          )
        }



        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <Package color={theme.colors.primary} size={32} />
              <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {products?.length || 0}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('common.products')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <ShoppingBag color={theme.colors.primary} size={32} />
              <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {orders?.total || 0}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('dashboard.total_orders')}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('dashboard.subscription_details')}
        </Title>
        <Card style={[styles.subCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.subInfoRow}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                {t('dashboard.status')}:
              </Text>
              <Text variant="titleMedium" style={{ color: sub?.state === 'Active' && sub?.isActive !== false ? theme.colors.primary : theme.colors.error }}>
                {sub?.isActive === false ? t('statuses.deactivated') : (sub?.state ? t(`statuses.${sub.state.toLowerCase()}`) : t('statuses.none'))}
              </Text>
            </View>
            {sub?.planName && (
              <View style={styles.subInfoRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {t('dashboard.current_plan')}:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {sub.planName === 'Free Trial' ? t('subscription.free_trial') : sub.planName}
                </Text>
              </View>
            )}
            {sub?.endDate && (
              <View style={styles.subInfoRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {t('dashboard.end_date')}:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {new Date(sub.endDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {sub?.daysRemaining !== undefined && (
              <View style={styles.subInfoRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {t('dashboard.days_remaining')}:
                </Text>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurfaceVariant }}>
                  {sub.daysRemaining}
                </Text>
              </View>
            )}
          </Card.Content>
          <Card.Actions>
            <Button mode="outlined" onPress={() => onRefresh()}>
              {t('common.refresh')}
            </Button>
            <Button mode="contained" onPress={() => router.push('/subscription')}>
              {t('dashboard.manage_subscription')}
            </Button>
          </Card.Actions>
        </Card>

        <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('dashboard.brand_info')}
        </Title>
        <Card style={[styles.brandCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.brandInfoRow}>
              <Store size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.brandText, { color: theme.colors.onSurface }]}>
                {brand?.address || t('dashboard.no_address')}
              </Text>
            </View>
            <View style={styles.brandInfoRow}>
              <IconButton icon="phone" size={20} style={{ margin: 0 }} iconColor={theme.colors.onSurfaceVariant} />
              <Text style={[styles.brandText, { color: theme.colors.onSurface }]}>
                {brand?.phone1 || t('dashboard.no_phone')}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView >

      <Portal>
        <Dialog visible={closeVisible} onDismiss={() => setCloseVisible(false)}>
          <Dialog.Title>{t('dashboard.temporary_close_title')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              {t('dashboard.temporary_close_msg')}
            </Text>
            <TextInput
              label={t('dashboard.close_reason')}
              value={closeReason}
              onChangeText={setCloseReason}
              mode="outlined"
              placeholder={t('dashboard.close_reason_placeholder')}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCloseVisible(false)}>{t('common.cancel')}</Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              onPress={() => {
                temporaryCloseMutation.mutate({ reason: closeReason });
                setCloseVisible(false);
                setCloseReason('');
              }}
            >
              {t('dashboard.confirm_close')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: t('common.ok'),
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {success || t('common.success')}
      </Snackbar>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  welcomeText: {
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 8,
    justifyContent: 'space-around',
  },
  statCard: {
    flex: 1,
    margin: 8,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  subCard: {
    marginHorizontal: 16,
  },
  subInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandCard: {
    marginHorizontal: 16,
  },
  brandInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    marginLeft: 8,
  },
  statusSection: {
    padding: 16,
    paddingTop: 8,
  },
  statusCard: {
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  shiftButton: {
    marginTop: 8,
  },
  trialCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trialTextContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  closedBanner: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closedBannerText: {
    flex: 1,
    marginHorizontal: 12,
  },
  flexBtn: {
    flex: 1,
  }
});
