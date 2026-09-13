// ==============================================================================
// CUSTOMER WORKER SEARCH SCREEN — TRADE FILTERS, RATINGS & DISTANCE SORT
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { WorkerCard } from '../../components/common/WorkerCard';
import { ApiClient } from '../../services/apiClient';
import { MobileLocationService } from '../../services/locationService';
import { NearbyWorkerResult, ServiceCategory } from '../../types';
import { Map, Zap } from 'lucide-react-native';
import { translateTrade } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const WorkerSearchScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { handleBack } = useAppBackHandler({ homeRouteName: 'Home', isHome: false });
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const initialCat = route.params?.selectedCategory || 'all';
  const initialEmergency = route.params?.emergencyOnly || false;

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>(initialCat);
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(initialEmergency);
  const [minRating, setMinRating] = useState<number>(0);
  const [workers, setWorkers] = useState<NearbyWorkerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({ latitude: 28.6315, longitude: 77.2167 });

  const fetchResults = async () => {
    setLoading(true);
    try {
      const loc = await MobileLocationService.requestCurrentPosition();
      setUserLocation(loc.coords);

      const [cats, results] = await Promise.all([
        ApiClient.getCategories(),
        ApiClient.getNearbyWorkers(
          loc.coords.latitude,
          loc.coords.longitude,
          20,
          selectedCat,
          emergencyOnly
        )
      ]);
      setCategories(cats);

      let filtered = results;
      if (minRating > 0) {
        filtered = filtered.filter(w => w.rating >= minRating);
      }
      setWorkers(filtered);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize route params dynamically when navigated from HomeScreen emergency banner
  useEffect(() => {
    if (route.params?.emergencyOnly !== undefined) {
      setEmergencyOnly(Boolean(route.params.emergencyOnly));
    }
    if (route.params?.selectedCategory !== undefined) {
      setSelectedCat(route.params.selectedCategory);
    }
  }, [route.params?.emergencyOnly, route.params?.selectedCategory]);

  useEffect(() => {
    fetchResults();
  }, [selectedCat, emergencyOnly, minRating]);

  return (
    <View style={styles.container}>
      <Header
        title={t('tabs.services')}
        subtitle={t('search.verified_nearby', { count: workers.length })}
        showBack={true}
        onBack={handleBack}
      />

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, selectedCat === 'all' && styles.activeChip]}
            onPress={() => setSelectedCat('all')}
          >
            <Text style={[styles.chipText, selectedCat === 'all' && styles.activeChipText]}>
              {t('map.filter_all')}
            </Text>
          </TouchableOpacity>

          {categories.map((c) => {
            const title = translateTrade(c.name);
            const isSelected = selectedCat === c.name;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => setSelectedCat(isSelected ? 'all' : c.name)}
              >
                <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                  {title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Secondary Controls: Emergency Toggle + Map Button */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.emergencyToggle, emergencyOnly && styles.emergencyToggleActive]}
          onPress={() => setEmergencyOnly(!emergencyOnly)}
        >
          <Zap size={14} color={emergencyOnly ? colors.textInverse : colors.danger} />
          <Text style={[styles.emergencyToggleText, emergencyOnly && { color: colors.textInverse }]}>
            {t('search.emergency_30min')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mapSwitchBtn}
          onPress={() => navigation.navigate('Map', { selectedCategory: selectedCat })}
        >
          <Map size={15} color={colors.primary} />
          <Text style={styles.mapSwitchBtnText}>{t('home.view_map')}</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Active Notice Banner */}
      {emergencyOnly && (
        <View style={styles.emergencyActiveBanner}>
          <View style={styles.emergencyActiveDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyActiveTitle}>
              🚨 24/7 Emergency Dispatch Priority
            </Text>
            <Text style={styles.emergencyActiveDesc}>
              Showing verified workers available for immediate &lt; 15–30 min response.
            </Text>
          </View>
        </View>
      )}

      {/* Results List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 40 }} />
        ) : workers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{t('search.no_results_title')}</Text>
            <Text style={styles.emptySubtitle}>{t('search.no_results_desc')}</Text>
          </View>
        ) : (
          workers.map((worker, idx) => (
            <WorkerCard
              key={worker.workerId}
              worker={worker}
              index={idx}
              emergencyOnly={emergencyOnly}
              onPress={() => navigation.navigate('WorkerDetail', { workerId: worker.workerId, isEmergency: emergencyOnly })}
              onBook={() => navigation.navigate('BookingCreate', { worker, isEmergency: emergencyOnly })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  filterBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10
  },
  chipScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  activeChipText: {
    color: colors.textInverse,
    fontWeight: '700'
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  emergencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight
  },
  emergencyToggleActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger
  },
  emergencyToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger
  },
  mapSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryLight
  },
  mapSwitchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  listContent: {
    padding: 16,
    paddingBottom: 32
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center'
  },
  emergencyActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  emergencyActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  emergencyActiveTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.danger,
  },
  emergencyActiveDesc: {
    fontSize: 11,
    color: colors.danger,
    opacity: 0.88,
    marginTop: 1,
  }
});
