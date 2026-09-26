import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Filter icon removed — FilterBar uses text labels, not icons
import { useTheme } from '@/hooks/useTheme';
import { usePurchaseStore } from '@/store/purchaseStore';
import { PurchaseCard } from '@/features/purchases/PurchaseCard';
import { TechnicalDivider } from '@/components/ui/Badge';
import { spacing, typography } from '@/theme/tokens';
import type { Purchase, PurchaseStatus } from '@/types';

type FilterOption = 'all' | 'high_risk' | 'ready' | 'decided';

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'All',
  high_risk: 'High Risk',
  ready: 'Ready',
  decided: 'Decided',
};

export default function WaitingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterOption>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { purchases, loadPurchases, loadingState } = usePurchaseStore();

  useEffect(() => {
    loadPurchases();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPurchases();
    setRefreshing(false);
  };

  // Filter and group purchases
  const filtered = React.useMemo(() => {
    let list = purchases;

    switch (filter) {
      case 'high_risk':
        list = list.filter(p => p.impulseRisk === 'high' && p.status === 'waiting');
        break;
      case 'ready':
        list = list.filter(p => {
          if (p.status !== 'waiting' || !p.waitingUntil) return false;
          return new Date(p.waitingUntil) <= new Date();
        });
        break;
      case 'decided':
        list = list.filter(p => p.status === 'bought' || p.status === 'avoided' || p.status === 'expired');
        break;
      default:
        list = list.filter(p => p.status === 'waiting');
    }

    return list;
  }, [purchases, filter]);

  // Group into sections
  const sections = React.useMemo(() => {
    if (filter === 'decided') {
      const bought = filtered.filter(p => p.status === 'bought');
      const avoided = filtered.filter(p => p.status === 'avoided');
      const expired = filtered.filter(p => p.status === 'expired');

      return [
        ...(avoided.length > 0 ? [{ title: 'AVOIDED', data: avoided }] : []),
        ...(bought.length > 0 ? [{ title: 'BOUGHT', data: bought }] : []),
        ...(expired.length > 0 ? [{ title: 'EXPIRED', data: expired }] : []),
      ];
    }

    // Group waiting by risk
    const ready = filtered.filter(p => {
      if (!p.waitingUntil) return false;
      return new Date(p.waitingUntil) <= new Date();
    });
    const waiting = filtered.filter(p => {
      if (!p.waitingUntil) return true;
      return new Date(p.waitingUntil) > new Date();
    });

    return [
      ...(ready.length > 0 ? [{ title: 'READY TO DECIDE', data: ready }] : []),
      ...(waiting.length > 0 ? [{ title: 'WAITING', data: waiting }] : []),
    ];
  }, [filtered, filter]);

  const isLoading = loadingState === 'loading';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing[3], borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Pause List
          </Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {purchases.filter(p => p.status === 'waiting').length} waiting
          </Text>
        </View>
      </View>

      {/* Filter bar */}
      <FilterBar filter={filter} onFilter={setFilter} colors={colors} />

      {/* List */}
      {sections.length === 0 && !isLoading ? (
        <EmptySection filter={filter} colors={colors} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <TechnicalDivider
                label={`${section.title} · ${section.data.length}`}
                showStatusDot={section.title === 'READY TO DECIDE'}
              />
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <PurchaseCard purchase={item} />
            </View>
          )}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── FILTER BAR ───────────────────────────────────────────────────────────────

function FilterBar({ filter, onFilter, colors }: {
  filter: FilterOption;
  onFilter: (f: FilterOption) => void;
  colors: any;
}) {
  return (
    <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
      {(Object.keys(FILTER_LABELS) as FilterOption[]).map(key => (
        <TouchableOpacity
          key={key}
          onPress={() => onFilter(key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: filter === key }}
          style={[
            styles.filterTab,
            filter === key && [styles.filterTabActive, { borderBottomColor: colors.primary }],
          ]}
        >
          <Text
            style={[
              styles.filterLabel,
              { color: filter === key ? colors.primary : colors.textMuted },
            ]}
          >
            {FILTER_LABELS[key]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── EMPTY SECTION ────────────────────────────────────────────────────────────

function EmptySection({ filter, colors }: { filter: FilterOption; colors: any }) {
  const messages: Record<FilterOption, { title: string; sub: string }> = {
    all: { title: 'Nothing waiting', sub: 'Add a purchase before you buy it.' },
    high_risk: { title: 'No high-risk purchases', sub: 'Good. Keep it that way.' },
    ready: { title: 'Nothing ready yet', sub: 'Check back when your waiting periods end.' },
    decided: { title: 'No decisions yet', sub: 'Decided purchases will appear here.' },
  };

  const { title, sub } = messages[filter];

  return (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.emptySub, { color: colors.textMuted }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    letterSpacing: -0.8,
  },
  headerSub: {
    fontSize: typography.size.xs,
    fontFamily: 'Courier New',
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing[4],
  },
  filterTab: {
    paddingVertical: spacing[3],
    marginRight: spacing[4],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomWidth: 2,
  },
  filterLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[2],
  },
  sectionHeader: {
    marginBottom: spacing[3],
  },
  cardWrapper: {
    marginBottom: spacing[3],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[2],
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  emptySub: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
