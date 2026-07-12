import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, Fonts, Radius, ShadowPalette } from '../../constants/theme';
import { useThemedColors, useThemedShadows } from '../../hooks/useThemedColors';
import MetricCard from '../../components/MetricCard';
import { analyticsApi } from '../../lib/api/analytics';
import { bookingApi, toProviderAppointmentCard, ProviderAppointmentCard } from '../../lib/api/bookings';

const PERIODS = ['Week', 'Month', '3 Months'] as const;
type Period = typeof PERIODS[number];

const periodDaysMap: Record<Period, number> = {
  Week: 7,
  Month: 30,
  '3 Months': 90,
};

const getPeriodStart = (period: Period) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - periodDaysMap[period]);
  return start;
};

const buildChartBars = (bookings: ProviderAppointmentCard[], period: Period) => {
  if (period === 'Week') {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = new Array(7).fill(0);

    bookings.forEach((booking) => {
      const d = new Date(booking.scheduledAt);
      if (Number.isNaN(d.getTime())) {
        return;
      }
      const idx = (d.getDay() + 6) % 7;
      counts[idx] += 1;
    });

    const max = Math.max(...counts, 1);
    const bars = counts.map((count) => Math.max(8, Math.round((count / max) * 100)));
    return { labels, bars };
  }

  if (period === 'Month') {
    const labels = ['W1', 'W2', 'W3', 'W4', 'W5'];
    const counts = new Array(labels.length).fill(0);

    bookings.forEach((booking) => {
      const d = new Date(booking.scheduledAt);
      if (Number.isNaN(d.getTime())) {
        return;
      }
      const weekIndex = Math.min(4, Math.floor((d.getDate() - 1) / 7));
      counts[weekIndex] += 1;
    });

    const max = Math.max(...counts, 1);
    const bars = counts.map((count) => Math.max(8, Math.round((count / max) * 100)));
    return { labels, bars };
  }

  const labels = ['Month 1', 'Month 2', 'Month 3'];
  const counts = new Array(labels.length).fill(0);

  bookings.forEach((booking) => {
    const d = new Date(booking.scheduledAt);
    if (Number.isNaN(d.getTime())) {
      return;
    }

    const monthDiff = (new Date().getMonth() - d.getMonth() + 12) % 12;
    if (monthDiff <= 2) {
      const idx = 2 - monthDiff;
      counts[idx] += 1;
    }
  });

  const max = Math.max(...counts, 1);
  const bars = counts.map((count) => Math.max(8, Math.round((count / max) * 100)));
  return { labels, bars };
};

function createAnalyticsStyles(p: ColorPalette, s: ShadowPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heading: { flex: 1, textAlign: 'center', fontFamily: Fonts.serifMedium, fontSize: 20, color: p.textPrimary },
    spacer: { width: 40 },
    periodRow: {
      flexDirection: 'row',
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      padding: 4,
      marginHorizontal: 24,
      marginBottom: 24,
    },
    periodBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
    periodBtnActive: { backgroundColor: p.gold },
    periodText: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    periodTextActive: { color: p.bg, fontWeight: '700' },
    scroll: { paddingHorizontal: 24, paddingBottom: 40 },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24 },
    loadingText: { color: p.textSecondary, fontFamily: Fonts.sans, fontSize: 14 },
    metricsGrid: { gap: 12, marginBottom: 28 },
    metricsRow: { flexDirection: 'row', gap: 12 },
    section: { marginBottom: 28 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontFamily: Fonts.serifMedium, fontSize: 18, color: p.textPrimary },
    chartTotal: { color: p.gold, fontFamily: Fonts.sansBold, fontSize: 16 },
    chartWrap: {
      height: 140,
      backgroundColor: p.card,
      borderRadius: Radius.lg,
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 14,
      gap: 4,
      borderWidth: 1,
      borderColor: p.border,
    },
    barWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
    bar: { borderRadius: 4, width: '100%' },
    chartLegend: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4, marginTop: 8 },
    legendLabel: { color: p.textMuted, fontSize: 11 },
    emptyWrap: {
      backgroundColor: p.card,
      borderRadius: Radius.md,
      padding: 14,
      borderWidth: 1,
      borderColor: p.border,
    },
    emptyText: { color: p.textSecondary, fontSize: 13 },
    serviceRow: {
      backgroundColor: p.card,
      borderRadius: Radius.md,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: p.border,
    },
    serviceTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    serviceName: { color: p.textPrimary, fontFamily: Fonts.sansMedium, fontSize: 14 },
    progressBar: { height: 6, borderRadius: 3, backgroundColor: p.cardInner, marginBottom: 6, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: p.gold },
    serviceBookings: { color: p.textMuted, fontSize: 12 },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: p.card,
      borderRadius: Radius.md,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: p.border,
    },
    statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    statLabel: { color: p.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 14, flex: 1 },
    statValue: { color: p.textPrimary, fontFamily: Fonts.sansBold, fontSize: 15 },
  });
}

export default function AnalyticsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const palette = useThemedColors();
  const shadow = useThemedShadows();
  const styles = useMemo(() => createAnalyticsStyles(palette, shadow), [palette, shadow]);
  const [activePeriod, setActivePeriod] = useState<Period>('Month');
  const [allBookings, setAllBookings] = useState<ProviderAppointmentCard[]>([]);
  const [summary, setSummary] = useState<{
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    averageRating: number;
    reviewCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [analytics, bookings] = await Promise.all([
          analyticsApi.getMyProviderAnalytics(),
          bookingApi.listMyBookings(),
        ]);

        if (!active) {
          return;
        }

        setSummary(
          analytics
            ? {
                totalBookings: analytics.totalBookings,
                completedBookings: analytics.completedBookings,
                pendingBookings: analytics.pendingBookings,
                totalRevenue: analytics.totalRevenue,
                averageRating: analytics.averageRating,
                reviewCount: analytics.reviewCount,
              }
            : {
                totalBookings: 0,
                completedBookings: 0,
                pendingBookings: 0,
                totalRevenue: 0,
                averageRating: 0,
                reviewCount: 0,
              }
        );
        setAllBookings(bookings.map((booking) => toProviderAppointmentCard(booking)));
      } catch {
        if (active) {
          setSummary(null);
          setAllBookings([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      active = false;
    };
  }, []);

  const periodBookings = useMemo(() => {
    const start = getPeriodStart(activePeriod);
    return allBookings.filter((booking) => {
      const scheduled = new Date(booking.scheduledAt);
      return !Number.isNaN(scheduled.getTime()) && scheduled >= start;
    });
  }, [activePeriod, allBookings]);

  const completed = periodBookings.filter((booking) => booking.status === 'completed').length;
  const cancelled = periodBookings.filter(
    (booking) => booking.status === 'cancelled' || booking.status === 'declined'
  ).length;
  const completionRate =
    periodBookings.length > 0 ? `${Math.round((completed / periodBookings.length) * 100)}%` : '0%';
  const cancellationRate =
    periodBookings.length > 0 ? `${Math.round((cancelled / periodBookings.length) * 100)}%` : '0%';

  const topServices = useMemo(() => {
    const counts = new Map<string, number>();
    periodBookings.forEach((booking) => {
      counts.set(booking.service, (counts.get(booking.service) ?? 0) + 1);
    });

    const maxCount = Math.max(...Array.from(counts.values()), 1);
    return Array.from(counts.entries())
      .map(([name, bookings]) => ({
        name,
        bookings,
        pct: Math.round((bookings / maxCount) * 100),
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 4);
  }, [periodBookings]);

  const chartData = useMemo(() => buildChartBars(periodBookings, activePeriod), [periodBookings, activePeriod]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Analytics</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.periodRow}>
        {PERIODS.map((period) => (
          <TouchableOpacity
            key={period}
            onPress={() => setActivePeriod(period)}
            style={[styles.periodBtn, activePeriod === period && styles.periodBtnActive]}
          >
            <Text style={[styles.periodText, activePeriod === period && styles.periodTextActive]}>{period}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={palette.gold} />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            <View style={styles.metricsGrid}>
              <View style={styles.metricsRow}>
                <MetricCard
                  icon="calendar"
                  value={String(periodBookings.length)}
                  label={`${activePeriod} bookings`}
                />
                <MetricCard
                  icon="check-circle"
                  value={String(completed)}
                  label="Completed"
                />
              </View>
              <View style={styles.metricsRow}>
                <MetricCard
                  icon="credit-card"
                  value={`Ksh ${(summary?.totalRevenue ?? 0).toLocaleString()}`}
                  label="Revenue (all-time)"
                />
                <MetricCard
                  icon="star"
                  value={(summary?.averageRating ?? 0).toFixed(1)}
                  label={`${summary?.reviewCount ?? 0} reviews`}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Bookings Over Time</Text>
                <Text style={styles.chartTotal}>{periodBookings.length} bookings</Text>
              </View>
              <View style={styles.chartWrap}>
                {chartData.bars.map((height, index) => (
                  <View key={index} style={styles.barWrap}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${height}%`,
                          backgroundColor:
                            height === Math.max(...chartData.bars) ? palette.gold : palette.cardInner,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.chartLegend}>
                {chartData.labels.map((label) => (
                  <Text key={label} style={styles.legendLabel}>
                    {label}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Services</Text>
              {topServices.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No service activity in this period yet.</Text>
                </View>
              ) : (
                topServices.map((service) => (
                  <View key={service.name} style={styles.serviceRow}>
                    <View style={styles.serviceTop}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceBookings}>{service.bookings} bookings</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${service.pct}%` }]} />
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={[styles.section, { marginBottom: 32 }]}>
              <Text style={styles.sectionTitle}>Performance</Text>
              {[
                { label: 'Completion Rate', value: completionRate, icon: 'check-circle' as const, color: palette.success },
                { label: 'Cancellation Rate', value: cancellationRate, icon: 'x-circle' as const, color: palette.error },
                {
                  label: 'Pending Requests',
                  value: String(summary?.pendingBookings ?? 0),
                  icon: 'clock' as const,
                  color: palette.gold,
                },
                {
                  label: 'Total Bookings (All-time)',
                  value: String(summary?.totalBookings ?? 0),
                  icon: 'bar-chart-2' as const,
                  color: palette.gold,
                },
              ].map((stat) => (
                <View key={stat.label} style={styles.statRow}>
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}18` }]}>
                    <Feather name={stat.icon} size={16} color={stat.color} />
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}


