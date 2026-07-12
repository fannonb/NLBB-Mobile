import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { adminApi, AdminRevenueReport } from '../../lib/api/admin';

const PERIODS = ['This Month', 'Last Month', '3 Months', 'This Year'];

const toPlanColor = (name: string) => {
  if (name.toLowerCase().includes('monthly')) return Colors.gold;
  if (name.toLowerCase().includes('quarter')) return Colors.success;
  if (name.toLowerCase().includes('annual')) return '#8B5CF6';
  return Colors.textSecondary;
};

export default function AdminRevenueScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activePeriod, setActivePeriod] = useState(0);
  const [report, setReport] = useState<AdminRevenueReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getRevenue();
      setReport(result);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRevenue();
    }, [loadRevenue])
  );

  const monthlyRevenue = report?.monthlyRevenue ?? [];

  const maxRevenue = Math.max(
    1,
    ...monthlyRevenue.map((item) => item.amount)
  );

  const growth = useMemo(() => {
    if (monthlyRevenue.length < 2) {
      return { pct: '0.0', positive: true };
    }

    const thisMonth = monthlyRevenue[monthlyRevenue.length - 1].amount;
    const lastMonth = monthlyRevenue[monthlyRevenue.length - 2].amount;

    if (lastMonth === 0) {
      return { pct: '0.0', positive: true };
    }

    const pct = (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1);
    return { pct, positive: thisMonth >= lastMonth };
  }, [monthlyRevenue]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Revenue</Text>
        <TouchableOpacity onPress={loadRevenue} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.periodRow}>
          {PERIODS.map((period, idx) => (
            <TouchableOpacity
              key={period}
              onPress={() => setActivePeriod(idx)}
              style={[styles.periodChip, activePeriod === idx && styles.periodChipActive]}
            >
              <Text style={[styles.periodText, activePeriod === idx && styles.periodTextActive]}>{period}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text style={styles.loadingText}>Loading revenue...</Text>
          </View>
        ) : null}

        {!loading && !report ? (
          <View style={styles.loadingWrap}>
            <Feather name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.loadingText}>Could not load revenue data.</Text>
          </View>
        ) : null}

        {report ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>Total Revenue</Text>
                  <Text style={styles.heroValue}>{report.summary.totalRevenue}</Text>
                </View>
                <View style={styles.heroBadge}>
                  <Feather name={growth.positive ? 'trending-up' : 'trending-down'} size={14} color={growth.positive ? Colors.success : Colors.error} />
                  <Text style={[styles.heroBadgeText, { color: growth.positive ? Colors.success : Colors.error }]}>
                    {growth.positive ? '+' : ''}{growth.pct}% MoM
                  </Text>
                </View>
              </View>

              <View style={styles.heroMetrics}>
                <View style={styles.heroMetricItem}>
                  <Text style={styles.heroMetricValue}>{report.summary.thisMonth}</Text>
                  <Text style={styles.heroMetricLabel}>This Month</Text>
                </View>
                <View style={styles.heroMetricDivider} />
                <View style={styles.heroMetricItem}>
                  <Text style={styles.heroMetricValue}>{report.summary.activeSubscribers}</Text>
                  <Text style={styles.heroMetricLabel}>Active Subs</Text>
                </View>
                <View style={styles.heroMetricDivider} />
                <View style={styles.heroMetricItem}>
                  <Text style={styles.heroMetricValue}>{report.plans.reduce((sum, plan) => sum + plan.count, 0)}</Text>
                  <Text style={styles.heroMetricLabel}>Plan Sales</Text>
                </View>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Revenue Trend</Text>
              <View style={styles.chart}>
                {monthlyRevenue.map((item, index) => (
                  <View key={`${item.month}-${index}`} style={styles.chartColumn}>
                    <Text style={styles.chartValue}>{(item.amount / 1000).toFixed(0)}K</Text>
                    <View style={styles.barWrap}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: (item.amount / maxRevenue) * 100,
                            backgroundColor: index === monthlyRevenue.length - 1 ? Colors.gold : Colors.cardInner,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{item.month}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription Plans</Text>
              {report.plans.map((plan) => {
                const color = toPlanColor(plan.name);
                return (
                  <View key={plan.name} style={styles.planCard}>
                    <View style={[styles.planColorBar, { backgroundColor: color }]} />
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                    </View>
                    <View style={styles.planStats}>
                      <View style={styles.planStat}>
                        <Text style={[styles.planStatValue, { color }]}>{plan.count}</Text>
                        <Text style={styles.planStatLabel}>Active</Text>
                      </View>
                      <View style={styles.planStatDivider} />
                      <View style={styles.planStat}>
                        <Text style={styles.planStatValue}>{plan.revenue}</Text>
                        <Text style={styles.planStatLabel}>Revenue</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Active Subscriptions</Text>
                <Text style={styles.summaryValue}>{report.summary.activeSubscribers}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Failed Amount</Text>
                <Text style={[styles.summaryValue, { color: Colors.error }]}>{report.summary.failedAmount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pending Amount</Text>
                <Text style={[styles.summaryValue, { color: Colors.warning }]}>{report.summary.pendingAmount}</Text>
              </View>
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 }]}>
                <Text style={[styles.summaryLabel, { color: Colors.textPrimary, fontFamily: Fonts.sansBold }]}>MRR</Text>
                <Text style={[styles.summaryValue, { color: Colors.gold, fontFamily: Fonts.sansBold, fontSize: 16 }]}>{report.summary.thisMonth}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Payments</Text>
              <View style={styles.paymentsCard}>
                {report.payments.map((payment, idx) => (
                  <View
                    key={payment.id}
                    style={[styles.paymentItem, idx < report.payments.length - 1 && styles.paymentBorder]}
                  >
                    <View
                      style={[
                        styles.paymentStatusDot,
                        {
                          backgroundColor:
                            payment.status === 'success'
                              ? Colors.success
                              : payment.status === 'pending'
                                ? Colors.warning
                                : Colors.error,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentProvider}>{payment.provider}</Text>
                      <Text style={styles.paymentMeta}>{payment.plan} - {payment.date}</Text>
                    </View>
                    <View style={styles.paymentRight}>
                      <Text style={styles.paymentAmount}>{payment.amount}</Text>
                      <Text
                        style={[
                          styles.paymentStatus,
                          {
                            color:
                              payment.status === 'success'
                                ? Colors.success
                                : payment.status === 'pending'
                                  ? Colors.warning
                                  : Colors.error,
                          },
                        ]}
                      >
                        {payment.status === 'success'
                          ? 'Paid'
                          : payment.status === 'pending'
                            ? 'Pending'
                            : 'Failed'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, textAlign: 'center', fontFamily: Fonts.serifMedium, fontSize: 18, color: Colors.textPrimary },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    backgroundColor: Colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  periodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  periodChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  periodText: { color: Colors.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 12 },
  periodTextActive: { color: Colors.bg, fontWeight: '700' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 16 },
  loadingText: { color: Colors.textSecondary, fontFamily: Fonts.sans, fontSize: 13 },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    ...Shadow.gold,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroLabel: { color: Colors.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 13, marginBottom: 6 },
  heroValue: { fontFamily: Fonts.serifMedium, fontSize: 34, color: Colors.textPrimary },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.cardInner, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  heroBadgeText: { fontFamily: Fonts.sansBold, fontSize: 13 },
  heroMetrics: { flexDirection: 'row', backgroundColor: Colors.cardInner, borderRadius: Radius.lg, padding: 16 },
  heroMetricItem: { flex: 1, alignItems: 'center' },
  heroMetricValue: { fontFamily: Fonts.sansBold, fontSize: 16, color: Colors.textPrimary, marginBottom: 4 },
  heroMetricLabel: { color: Colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroMetricDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.soft,
  },
  chartTitle: { fontFamily: Fonts.serifMedium, fontSize: 17, color: Colors.textPrimary, marginBottom: 20 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140 },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartValue: { color: Colors.textMuted, fontSize: 9, marginBottom: 6 },
  barWrap: { height: 100, justifyContent: 'flex-end', marginBottom: 8, width: '60%' },
  bar: { width: '100%', borderRadius: 6, minHeight: 6 },
  chartLabel: { color: Colors.textSecondary, fontSize: 11, fontFamily: Fonts.sansMedium },
  section: { marginBottom: 28 },
  sectionTitle: { fontFamily: Fonts.serifMedium, fontSize: 18, color: Colors.textPrimary, marginBottom: 16 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 14,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  planColorBar: { width: 4, height: 48, borderRadius: 2 },
  planInfo: { flex: 1 },
  planName: { color: Colors.textPrimary, fontFamily: Fonts.sansBold, fontSize: 14, marginBottom: 3 },
  planPrice: { color: Colors.textSecondary, fontSize: 12 },
  planStats: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  planStat: { alignItems: 'center' },
  planStatValue: { fontFamily: Fonts.sansBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 2 },
  planStatLabel: { color: Colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  planStatDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
    ...Shadow.soft,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: Colors.textSecondary, fontFamily: Fonts.sans, fontSize: 14 },
  summaryValue: { color: Colors.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
  paymentsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.soft,
  },
  paymentItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  paymentBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  paymentStatusDot: { width: 8, height: 8, borderRadius: 4 },
  paymentProvider: { color: Colors.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 13, marginBottom: 3 },
  paymentMeta: { color: Colors.textMuted, fontSize: 11 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { color: Colors.textPrimary, fontFamily: Fonts.sansBold, fontSize: 13, marginBottom: 3 },
  paymentStatus: { fontSize: 11, fontFamily: Fonts.sansMedium },
});

