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
        {/* Dynamic Hero Carousel Section (Auto-changing banners with tap action) */}
        <FadeInView delay={0} distance={10} duration={320}>
          <View style={styles.heroBannerContainer}>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => {
                const route = HERO_BANNERS[currentBannerIndex]?.route || 'Search';
                navigation.navigate(route);
              }}
              style={styles.heroBannerTouch}
            >
              <Image
                source={HERO_BANNERS[currentBannerIndex]?.image}
                style={styles.heroBannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {HERO_BANNERS.length > 1 && (
              <View style={styles.heroDotsContainer}>
                {HERO_BANNERS.map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setCurrentBannerIndex(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    style={[
                      styles.heroDot,
                      idx === currentBannerIndex && styles.heroDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </FadeInView>

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
                const IconComp = categoryIcons[cat.name] || Zap;
                const title = translateTrade(cat.name);
                const tradeTheme = getTradeTheme(cat.name, isDark);

                return (
                  <FadeInView key={cat.id} delay={180 + idx * 50} distance={10} duration={280} style={styles.categoryCardWrap}>
                    <ScalePressable onPress={() => navigation.navigate('Search', { selectedCategory: cat.name })} scaleTo={0.92}>
                      <View style={[styles.categoryCard, { borderColor: tradeTheme.border }]}>
                        <LinearGradient
                          colors={tradeTheme.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.iconCircle}
                        >
                          <IconComp size={18} color="#ffffff" />
                        </LinearGradient>
                        <Text style={styles.catTitle} numberOfLines={2}>
                          {title}
                        </Text>
                        <View style={[styles.catPriceBadge, { backgroundColor: tradeTheme.badgeBg }]}>
                          <Text style={[styles.catPrice, { color: tradeTheme.badgeText }]}>
                            ₹{cat.base_price}
                          </Text>
                        </View>
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
    padding: 16,
    paddingBottom: 32,
  },
  heroBannerContainer: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: isDark ? '#080d19' : '#ffffff',
    borderWidth: 1.2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.45 : 0.08,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
  },
  heroBannerTouch: {
    width: '100%',
  },
  heroBannerImage: {
    width: '100%',
    aspectRatio: 2.55,
    borderRadius: 17,
  },
  heroDotsContainer: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  heroDotActive: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
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
    rowGap: 11,
  },
  categoryCardWrap: {
    width: '23%',
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  catTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    minHeight: 28,
    lineHeight: 14,
    paddingHorizontal: 1,
  },
  catPriceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginTop: 4,
  },
  catPrice: {
    fontSize: 9.5,
    fontWeight: '800',
  },
});

