// ==============================================================================
// CUSTOMER HOME SCREEN — SERVICE CATEGORIES, EMERGENCY BANNER & NEARBY MATCHES
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../../components/common/Header';
import { WorkerCard } from '../../components/common/WorkerCard';
import { Footer } from '../../components/common/Footer';
import { ApiClient } from '../../services/apiClient';
import { MobileLocationService } from '../../services/locationService';
import { ServiceCategory, NearbyWorkerResult } from '../../types';
import { FadeInView, PulseView, ScalePressable, PulseDot } from '../../animations';
import { translateTrade } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { getTradeTheme } from '../../theme/tradeThemes';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';
import {
  Zap,
  Wrench,
  Hammer,
  Paintbrush,
  Sparkles,
  AirVent,
  Tv,
  Car,
  HeartPulse,
  Flower2,
  MapPin,
  Map,
  Clock,
  ChevronRight,
} from 'lucide-react-native';

const categoryIcons: Record<string, any> = {
  Electrical: Zap,
  Plumbing: Wrench,
  Carpentry: Hammer,
  Painting: Paintbrush,
  'Cleaning & Sanitization': Sparkles,
  'Gardening & Landscaping': Flower2,
  'Appliance Repair': Tv,
  'AC Repair & Servicing': AirVent,
  'Driver Services': Car,
  'Caregiving & Nursing': HeartPulse,
};

// ==============================================================================
// 3D CATEGORY ASSETS MAP
// ==============================================================================
const CATEGORY_IMAGES: Record<string, any> = {
  'Electrical': require('../../../assets/categories/category-electrical.png'),
  'Plumbing': require('../../../assets/categories/category-plumbing.png'),
  'Carpentry': require('../../../assets/categories/category-carpentry.png'),
  'Painting': require('../../../assets/categories/category-painting.png'),
  'Cleaning & Sanitization': require('../../../assets/categories/category-cleaning.png'),
  'Gardening & Landscaping': require('../../../assets/categories/category-gardening.png'),
  'Appliance Repair': require('../../../assets/categories/category-appliance.png'),
  'AC Repair & Servicing': require('../../../assets/categories/category-ac.png'),
};

// ==============================================================================
// HERO BANNER SLIDER CONFIGURATION
// Add more banner objects here to automatically rotate them on the homepage.
// ==============================================================================
export interface HeroBannerItem {
  id: string;
  image: any;
  route?: string;
  title?: string;
}

export const HERO_BANNERS: HeroBannerItem[] = [
  {
    id: 'hero-1',
    image: require('../../../assets/hero-banner-1.png'),
    route: 'Search',
    title: 'Trusted work. Shared prosperity.',
  },
  // Additional banners provided by user will auto-cycle in this slider
];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  useAppBackHandler({ homeRouteName: 'Home', isHome: true });
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [nearbyWorkers, setNearbyWorkers] = useState<NearbyWorkerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: 26.9017, longitude: 75.7925 });
  const [locationName, setLocationName] = useState('C-Scheme, Jaipur (302001)');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Auto-change hero banner every 5 seconds if multiple banners exist
  useEffect(() => {
    if (HERO_BANNERS.length <= 1) return;
    const bannerTimer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 5000);
    return () => clearInterval(bannerTimer);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const loc = await MobileLocationService.requestCurrentPosition();
      setUserLocation(loc.coords);
      if (loc.coords.areaName) setLocationName(loc.coords.areaName);

      const [cats, workers] = await Promise.all([
        ApiClient.getCategories(),
        ApiClient.getNearbyWorkers(loc.coords.latitude, loc.coords.longitude, 15),
      ]);
      setCategories(cats);
      setNearbyWorkers(workers);
    } catch (err) {
      console.log('Load notice:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        {/* Full-width Hero Section in exact aspect ratio */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => {
            const route = HERO_BANNERS[currentBannerIndex]?.route || 'Search';
            navigation.navigate(route);
          }}
          style={styles.heroSection}
        >
          <Image
            source={HERO_BANNERS[currentBannerIndex]?.image}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Rest of page hanging just below the hero section */}
        <View style={styles.bodyContent}>

        {/* Categories Grid with Trade-Specific Vibrant Gradients */}
        <FadeInView delay={160} distance={14} duration={360}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionAccentBar, { backgroundColor: colors.primary }]} />
                <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                  {t('home.categories_title')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Search')}
                style={styles.seeAllBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllText}>{t('home.see_all')}</Text>
                <ChevronRight size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryGrid}>
              {categories.slice(0, 8).map((cat, idx) => {
                const catImg = CATEGORY_IMAGES[cat.name];
                const title = translateTrade(cat.name);

                return (
                  <FadeInView key={cat.id} delay={140 + idx * 35} distance={10} duration={260} style={styles.categoryCardWrap}>
                    <ScalePressable onPress={() => navigation.navigate('Search', { selectedCategory: cat.name })} scaleTo={0.93}>
                      <View style={styles.categoryCard}>
                        <View style={styles.catImageWrap}>
                          {catImg ? (
                            <Image
                              source={catImg}
                              style={styles.catImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={{ fontSize: 24 }}>🛠️</Text>
                          )}
                        </View>
                        <Text style={styles.catTitle} numberOfLines={2}>
                          {title}
                        </Text>
                      </View>
                    </ScalePressable>
                  </FadeInView>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Nearby Workers Section with Lively Match Badges */}
        <FadeInView delay={280} distance={14} duration={360}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionAccentBar, { backgroundColor: colors.secondary }]} />
                <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                  {t('home.nearby_title')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Map')}
                style={styles.seeAllBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllText}>{t('home.view_map')}</Text>
                <ChevronRight size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              nearbyWorkers.slice(0, 4).map((worker, idx) => (
                <WorkerCard
                  key={worker.workerId}
                  worker={worker}
                  index={idx}
                  onPress={() => navigation.navigate('WorkerDetail', { workerId: worker.workerId })}
                  onBook={() => navigation.navigate('BookingCreate', { worker })}
                />
              ))
            )}
          </View>
        </FadeInView>

        {/* Cooperative App Footer with Fair Wage Breakdown, Policies & Contacts */}
        <FadeInView delay={360} distance={14} duration={360}>
          <Footer />
        </FadeInView>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    width: '100%',
    aspectRatio: 1024 / 402,
    backgroundColor: isDark ? '#06130d' : '#f4fbf6',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    aspectRatio: 1024 / 402,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    marginRight: 10,
  },
  sectionAccentBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  categoryCardWrap: {
    width: '23%',
  },
  categoryCard: {
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.60)' : 'rgba(255, 255, 255, 0.82)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.90)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.35 : 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  catImageWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(241, 245, 249, 0.70)',
  },
  catImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  catTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    minHeight: 28,
    lineHeight: 14,
    paddingHorizontal: 2,
  },
});

