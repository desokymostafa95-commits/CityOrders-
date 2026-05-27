import React from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, Platform } from 'react-native';
import { Text, Card, Title, Button, ActivityIndicator, IconButton, Snackbar, useTheme as usePaperTheme, Portal, Dialog, TextInput } from 'react-native-paper';
import { useAuth } from '@/src/auth/context';
import { useSubscriptionStatus, useMyBrand, useMyProducts, useMyOrders, useNotifications, useMarkNotificationRead, useMerchantAdminChatThread, useMerchantAnalytics } from '@/src/hooks/useMerchantData';
import SubscriptionBanner from '@/src/components/SubscriptionBanner';
import { LogOut, Package, ShoppingBag, Store } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';
import { Alert } from 'react-native';
import { Play, Square, Gift, CheckCircle, Clock, AlertCircle, Bell, MessageCircle, Eye, MousePointerClick, TrendingUp, BarChart3, Search, ShoppingCart, CreditCard, Radio, Ticket, Star, AlertTriangle } from 'lucide-react-native';
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
  const [analyticsDays, setAnalyticsDays] = React.useState(30);

  const { token } = useAuth();
  const { data: brand, isLoading: brandLoading } = useMyBrand({ enabled: !!token });

  // Statistical hooks MUST wait for brand to be present to avoid 403s
  const isGated = !!token && !!brand;

  const { data: sub, isLoading: subLoading, refetch: refetchSub } = useSubscriptionStatus({ enabled: isGated });
  const { data: products } = useMyProducts({ enabled: isGated });
  const { data: orders } = useMyOrders(undefined, 1, { enabled: isGated });
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useMerchantAnalytics(analyticsDays, { enabled: isGated });
  const { data: profile } = useMerchantProfile({ enabled: isGated });
  const { data: currentShift, isLoading: shiftLoading } = useCurrentShift({ enabled: isGated });
  const { data: availability } = useMerchantAvailability({ enabled: isGated });
  const { isRenewOnly } = useRenewOnly({ enabled: isGated });
  const { data: notifications, refetch: refetchNotifications } = useNotifications({ enabled: !!token });
  const markNotificationRead = useMarkNotificationRead();
  const adminChat = useMerchantAdminChatThread();
  const latestUnreadNotification = React.useMemo(
    () => (notifications?.items || []).find((item) => !item.isRead),
    [notifications]
  );

  const { startShift, closeShift, isStarting, isClosing } = useShiftMutations();
  const activateTrialMutation = useActivateTrial();
  const temporaryCloseMutation = useTemporaryClose();
  const temporaryOpenMutation = useTemporaryOpen();
  const { data: announcements, refetch: refetchAnnouncements } = useActiveAnnouncements({ enabled: !!token });

  const [closeVisible, setCloseVisible] = React.useState(false);
  const [closeReason, setCloseReason] = React.useState('');

  const formatCount = (value?: number) => new Intl.NumberFormat().format(value || 0);
  const formatPercent = (value?: number) => `${Number(value || 0).toFixed(1)}%`;
  const formatMoney = (value?: number) => `${new Intl.NumberFormat().format(Math.round(value || 0))} EGP`;
  const formatDelta = (value?: number) => {
    const amount = Number(value || 0);
    if (amount === 0) return '0%';
    return `${amount > 0 ? '+' : ''}${amount.toFixed(1).replace('.0', '')}%`;
  };
  const maxProductViews = Math.max(1, ...(analytics?.products || []).map((product) => product.views));
  const maxFunnelCount = Math.max(1, ...(analytics?.funnel || []).map((step) => step.count));

  const onRefresh = React.useCallback(() => {
    refetchSub();
    refetchAnnouncements();
    refetchNotifications();
    refetchAnalytics();
  }, [refetchSub, refetchAnnouncements, refetchNotifications, refetchAnalytics]);

  const handleOpenNotification = () => {
    if (!latestUnreadNotification) return;
    markNotificationRead.mutate(latestUnreadNotification.id);
    if (latestUnreadNotification.relatedOrderId) {
      router.push('/(tabs)/orders');
    }
  };

  const handleOpenAdminChat = () => {
    adminChat.mutate(undefined, {
      onSuccess: (thread) => router.push({ pathname: '/chat/[threadId]', params: { threadId: String(thread.id) } }),
    });
  };

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

        {latestUnreadNotification && (
          <Card style={[styles.notificationCard, { backgroundColor: theme.colors.primaryContainer }]}>
            <Card.Content style={styles.notificationContent}>
              <View style={[styles.notificationIconWrap, { backgroundColor: theme.colors.surface }]}>
                <Bell size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.notificationText}>
                <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>
                  {latestUnreadNotification.title}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }} numberOfLines={2}>
                  {latestUnreadNotification.message}
                </Text>
              </View>
              <Button mode="contained-tonal" compact onPress={handleOpenNotification}>
                عرض
              </Button>
            </Card.Content>
          </Card>
        )}

        <Card style={[styles.supportCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.notificationContent}>
            <View style={[styles.notificationIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
              <MessageCircle size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.notificationText}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                محادثة الإدارة
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                تواصل مع الأدمن بخصوص الاشتراك أو حالة المتجر.
              </Text>
            </View>
            <Button mode="outlined" compact onPress={handleOpenAdminChat} loading={adminChat.isPending} disabled={adminChat.isPending}>
              فتح
            </Button>
          </Card.Content>
        </Card>

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
          {t('analytics.title')}
        </Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.analyticsFilters}>
          {[
            { days: 1, label: t('analytics.today') },
            { days: 7, label: t('analytics.days_7') },
            { days: 30, label: t('analytics.days_30') },
            { days: 90, label: t('analytics.days_90') },
          ].map((preset) => (
            <Button
              key={preset.days}
              mode={analyticsDays === preset.days ? 'contained' : 'outlined'}
              compact
              onPress={() => setAnalyticsDays(preset.days)}
              style={styles.analyticsFilterButton}
            >
              {preset.label}
            </Button>
          ))}
        </ScrollView>
        <Card style={[styles.analyticsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {analyticsLoading ? (
              <ActivityIndicator style={{ paddingVertical: 24 }} />
            ) : analytics ? (
              <>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                  {t('analytics.last_30_days')} . {formatDelta(analytics.comparison?.ordersDelta)} {t('analytics.vs_previous')}
                </Text>
                <View style={styles.analyticsGrid}>
                  <View style={[styles.analyticsMetric, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Eye size={20} color={theme.colors.primary} />
                    <Text variant="titleLarge" style={[styles.analyticsValue, { color: theme.colors.onSurface }]}>
                      {formatCount(analytics.uniqueStoreVisitors)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('analytics.store_visitors')}
                    </Text>
                  </View>
                  <View style={[styles.analyticsMetric, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <MousePointerClick size={20} color={theme.colors.primary} />
                    <Text variant="titleLarge" style={[styles.analyticsValue, { color: theme.colors.onSurface }]}>
                      {formatCount(analytics.productViews)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('analytics.product_views')}
                    </Text>
                  </View>
                  <View style={[styles.analyticsMetric, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <ShoppingCart size={20} color={theme.colors.primary} />
                    <Text variant="titleLarge" style={[styles.analyticsValue, { color: theme.colors.onSurface }]}>
                      {formatCount(analytics.addToCartEvents)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('analytics.cart_adds')}
                    </Text>
                  </View>
                  <View style={[styles.analyticsMetric, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <CreditCard size={20} color={theme.colors.primary} />
                    <Text variant="titleLarge" style={[styles.analyticsValue, { color: theme.colors.onSurface }]}>
                      {formatCount(analytics.checkoutStartedEvents)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('analytics.checkout_starts')}
                    </Text>
                  </View>
                  <View style={[styles.analyticsMetric, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <AlertCircle size={20} color={theme.colors.error} />
                    <Text variant="titleLarge" style={[styles.analyticsValue, { color: theme.colors.onSurface }]}>
                      {formatCount(analytics.abandonedCarts)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('analytics.abandoned_carts')}
                    </Text>
                  </View>
                  <View style={[styles.analyticsMetric, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <TrendingUp size={20} color={theme.colors.primary} />
                    <Text variant="titleLarge" style={[styles.analyticsValue, { color: theme.colors.onSurface }]}>
                      {formatPercent(analytics.productViewToOrderRate)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('analytics.conversion_rate')}
                    </Text>
                  </View>
                  <View style={[styles.analyticsMetric, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Search size={20} color={theme.colors.primary} />
                    <Text variant="titleLarge" style={[styles.analyticsValue, { color: theme.colors.onSurface }]}>
                      {formatCount(analytics.searches)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('analytics.searches')}
                    </Text>
                  </View>
                  <View style={[styles.analyticsMetric, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Ticket size={20} color={theme.colors.primary} />
                    <Text variant="titleLarge" style={[styles.analyticsValue, { color: theme.colors.onSurface }]}>
                      {formatMoney(analytics.revenue)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('analytics.revenue')}
                    </Text>
                  </View>
                </View>

                <View style={styles.analyticsHeaderRow}>
                  <View style={styles.statusItem}>
                    <BarChart3 size={18} color={theme.colors.primary} />
                    <Text variant="titleMedium" style={[styles.analyticsSubTitle, { color: theme.colors.onSurface }]}>
                      {t('analytics.funnel')}
                    </Text>
                  </View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatCount(analytics.orders)} {t('analytics.orders')}
                  </Text>
                </View>
                {(analytics.funnel || []).map((step) => (
                  <View key={step.key} style={styles.funnelRow}>
                    <View style={styles.productInsightTop}>
                      <Text variant="bodyMedium" style={[styles.productInsightName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {step.label}
                      </Text>
                      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatCount(step.count)} . {formatPercent(step.rateFromPrevious)}
                      </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: theme.colors.outlineVariant }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: theme.colors.primary,
                            width: `${Math.max(3, Math.min(100, (step.count / maxFunnelCount) * 100))}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}

                <View style={styles.analyticsHeaderRow}>
                  <View style={styles.statusItem}>
                    <AlertTriangle size={18} color={theme.colors.error} />
                    <Text variant="titleMedium" style={[styles.analyticsSubTitle, { color: theme.colors.onSurface }]}>
                      {t('analytics.alerts')}
                    </Text>
                  </View>
                </View>
                {(analytics.alerts || []).length === 0 ? (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t('analytics.no_alerts')}</Text>
                ) : (
                  (analytics.alerts || []).map((alert, index) => (
                    <View key={`${alert.type}-${index}`} style={[styles.alertRow, { borderColor: alert.severity === 'critical' ? theme.colors.error : theme.colors.outlineVariant }]}>
                      <Text variant="labelLarge" style={{ color: alert.severity === 'critical' ? theme.colors.error : theme.colors.onSurface, fontWeight: '800' }}>
                        {alert.title}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{alert.message}</Text>
                    </View>
                  ))
                )}

                {(analytics.products || []).length === 0 ? (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 16 }}>
                    {t('analytics.no_data')}
                  </Text>
                ) : (
                  (analytics.products || []).slice(0, 5).map((product) => (
                    <View key={product.productId} style={styles.productInsightRow}>
                      <View style={styles.productInsightTop}>
                        <Text variant="bodyMedium" style={[styles.productInsightName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                          {product.productName}
                        </Text>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                          {formatPercent(product.conversionRate)}
                        </Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: theme.colors.outlineVariant }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: theme.colors.primary,
                              width: `${Math.max(4, Math.min(100, (product.views / maxProductViews) * 100))}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatCount(product.views)} {t('analytics.views')} . {formatCount(product.addToCartCount)} {t('analytics.added_to_cart')} . {formatCount(product.abandonedCarts)} {t('analytics.abandoned_carts')} . {product.insight}
                      </Text>
                    </View>
                  ))
                )}

                <View style={styles.analyticsHeaderRow}>
                  <View style={styles.statusItem}>
                    <MousePointerClick size={18} color={theme.colors.primary} />
                    <Text variant="titleMedium" style={[styles.analyticsSubTitle, { color: theme.colors.onSurface }]}>
                      {t('analytics.opportunities')}
                    </Text>
                  </View>
                </View>
                {(analytics.opportunityProducts || []).length === 0 ? (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t('analytics.no_data')}</Text>
                ) : (
                  (analytics.opportunityProducts || []).map((product) => (
                    <View key={`opp-${product.productId}`} style={styles.compactRow}>
                      <Text variant="bodyMedium" style={[styles.productInsightName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {product.productName}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {product.insight} . {formatPercent(product.conversionRate)}
                      </Text>
                    </View>
                  ))
                )}

                <View style={styles.analyticsHeaderRow}>
                  <View style={styles.statusItem}>
                    <Search size={18} color={theme.colors.primary} />
                    <Text variant="titleMedium" style={[styles.analyticsSubTitle, { color: theme.colors.onSurface }]}>
                      {t('analytics.search_terms')}
                    </Text>
                  </View>
                </View>
                {(analytics.searchTerms || []).length === 0 ? (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t('analytics.no_searches')}</Text>
                ) : (
                  (analytics.searchTerms || []).map((term) => (
                    <View key={term.term} style={styles.compactRow}>
                      <Text variant="bodyMedium" style={[styles.productInsightName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {term.term}
                      </Text>
                      <Text variant="bodySmall" style={{ color: term.hasMatchingProduct ? theme.colors.primary : theme.colors.error }}>
                        {formatCount(term.count)} . {term.hasMatchingProduct ? t('analytics.matching_product') : t('analytics.missing_product')}
                      </Text>
                    </View>
                  ))
                )}

                <View style={styles.analyticsHeaderRow}>
                  <View style={styles.statusItem}>
                    <Ticket size={18} color={theme.colors.primary} />
                    <Text variant="titleMedium" style={[styles.analyticsSubTitle, { color: theme.colors.onSurface }]}>
                      {t('analytics.promos')}
                    </Text>
                  </View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatMoney(analytics.promoDiscount)} {t('analytics.promo_discount')}
                  </Text>
                </View>
                {(analytics.promos || []).length === 0 ? (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t('analytics.no_promos')}</Text>
                ) : (
                  (analytics.promos || []).map((promo) => (
                    <View key={promo.promoCodeId} style={styles.compactRow}>
                      <Text variant="bodyMedium" style={[styles.productInsightName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {promo.code}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatCount(promo.uses)} uses . {formatMoney(promo.revenue)} . {promo.status}
                      </Text>
                    </View>
                  ))
                )}

                <View style={styles.analyticsHeaderRow}>
                  <View style={styles.statusItem}>
                    <Star size={18} color={theme.colors.primary} />
                    <Text variant="titleMedium" style={[styles.analyticsSubTitle, { color: theme.colors.onSurface }]}>
                      {t('analytics.reviews')}
                    </Text>
                  </View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t('analytics.avg_rating')}: {Number(analytics.reviews?.averageRating || 0).toFixed(1)}
                  </Text>
                </View>
                {(analytics.reviews?.reviewsCount || 0) === 0 ? (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t('analytics.no_reviews')}</Text>
                ) : (
                  <View style={styles.compactRow}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                      {formatCount(analytics.reviews?.reviewsCount)} reviews . {formatCount(analytics.reviews?.lowRatingCount)} {t('analytics.low_ratings')}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {(analytics.reviews?.keywords || []).map((keyword) => keyword.word).slice(0, 5).join(', ')}
                    </Text>
                  </View>
                )}

                <View style={styles.analyticsHeaderRow}>
                  <View style={styles.statusItem}>
                    <Radio size={18} color={theme.colors.primary} />
                    <Text variant="titleMedium" style={[styles.analyticsSubTitle, { color: theme.colors.onSurface }]}>
                      {t('analytics.live_feed')}
                    </Text>
                  </View>
                </View>
                {(analytics.liveFeed || []).length === 0 ? (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t('analytics.no_live_feed')}</Text>
                ) : (
                  (analytics.liveFeed || []).slice(0, 8).map((event, index) => (
                    <View key={`${event.type}-${event.at}-${index}`} style={styles.liveRow}>
                      <View style={[styles.liveDot, { backgroundColor: theme.colors.primary }]} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                          {event.label}
                        </Text>
                        {!!event.detail && (
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                            {event.detail}
                          </Text>
                        )}
                      </View>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  ))
                )}
              </>
            ) : (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 16 }}>
                {t('analytics.no_data')}
              </Text>
            )}
          </Card.Content>
        </Card>

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
  notificationCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    flex: 1,
  },
  supportCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
  },
  flexBtn: {
    flex: 1,
  },
  analyticsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
  },
  analyticsFilters: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  analyticsFilterButton: {
    marginRight: 8,
    borderRadius: 999,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  analyticsMetric: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 112,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  analyticsValue: {
    fontWeight: '900',
    marginTop: 8,
  },
  analyticsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
    gap: 12,
  },
  analyticsSubTitle: {
    marginLeft: 8,
    fontWeight: '800',
  },
  productInsightRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(127,127,127,0.16)',
  },
  funnelRow: {
    paddingVertical: 8,
  },
  alertRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  compactRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(127,127,127,0.12)',
    gap: 4,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(127,127,127,0.12)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  productInsightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  productInsightName: {
    flex: 1,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
  }
});
