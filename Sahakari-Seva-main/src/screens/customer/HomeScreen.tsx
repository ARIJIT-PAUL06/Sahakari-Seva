// ==============================================================================
// CUSTOMER HOME SCREEN — SERVICE CATEGORIES, EMERGENCY BANNER & NEARBY MATCHES
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
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
  {
    id: 'hero-2',
    image: require('../../../assets/hero-banner-2.png'),
    route: 'Search',
    title: 'Celebrating 75 Years of Independence - Viksit Bharat',
  },
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

  const bannerScrollRef = useRef<ScrollView>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerWidth, setBannerWidth] = useState(
    Math.max(Dimensions.get('window').width - 32, 280)
  );

  // Auto-scroll hero banners horizontally between each other in a brief period of time (4s)
  useEffect(() => {
    if (HERO_BANNERS.length <= 1 || bannerWidth <= 0) return;
    const bannerTimer = setInterval(() => {
      setCurrentBannerIndex((prev) => {
        const nextIdx = (prev + 1) % HERO_BANNERS.length;
        bannerScrollRef.current?.scrollTo({
          x: nextIdx * bannerWidth,
          animated: true,
        });
        return nextIdx;
      });
    }, 4000);
    return () => clearInterval(bannerTimer);
  }, [bannerWidth]);

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
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        {/* Hero Section with auto-scroll carousel, top gap, exact aspect ratio, and 3D floating shadow */}
        <FadeInView delay={0} distance={10} duration={320}>
          <View
            style={styles.heroShadowWrapper}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0 && Math.abs(w - bannerWidth) > 1) {
                setBannerWidth(w);
              }
            }}
          >
            <View style={styles.heroSection}>
              <ScrollView
                ref={bannerScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                  const offset = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(offset / (bannerWidth || 1));
                  if (idx !== currentBannerIndex) {
                    setCurrentBannerIndex(idx);
                  }
                }}
                style={styles.heroSliderScroll}
                contentContainerStyle={{ flexDirection: 'row' }}
              >
                {HERO_BANNERS.map((banner) => (
                  <TouchableOpacity
                    key={banner.id}
                    activeOpacity={0.94}
                    onPress={() => {
                      const route = banner.route || 'Search';
                      navigation.navigate(route);
                    }}
                    style={{ width: bannerWidth, height: '100%' }}
                  >
                    <Image
                      source={banner.image}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Indicator Pill Dots */}
              {HERO_BANNERS.length > 1 && (
                <View style={styles.paginationDotsContainer} pointerEvents="box-none">
                  <View style={styles.paginationPill}>
                    {HERO_BANNERS.map((_, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        onPress={() => {
                          bannerScrollRef.current?.scrollTo({
                            x: idx * bannerWidth,
                            animated: true,
                          });
                          setCurrentBannerIndex(idx);
                        }}
                        style={[
                          styles.paginationDot,
                          currentBannerIndex === idx
                            ? styles.paginationDotActive
                            : styles.paginationDotInactive,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </FadeInView>

        {/* Categories Grid with 3D Glassmorphic floating tiles */}
        <FadeInView delay={140} distance={12} duration={340}>
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
                  <FadeInView key={cat.id} delay={140 + idx * 30} distance={10} duration={260} style={styles.categoryCardWrap}>
                    <ScalePressable onPress={() => navigation.navigate('Search', { selectedCategory: cat.name })} scaleTo={0.93}>
                      <View style={styles.categoryCard}>
                        <View style={styles.catImageWrap}>
                          {catImg ? (
                            <Image
                              source={catImg}
                              style={styles.catImage}
                              resizeMode="contain"
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

        {/* Nearby Workers Section with 3D elevation */}
        <FadeInView delay={240} distance={14} duration={360}>
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
        <FadeInView delay={320} distance={14} duration={360}>
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
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
  },
  heroShadowWrapper: {
    width: '100%',
    aspectRatio: 1024 / 402,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: isDark ? '#080d19' : '#ffffff',
    shadowColor: isDark ? '#000000' : '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.70 : 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  heroSection: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.95)',
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.35)' : '#ffffff',
    borderBottomColor: isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(203, 213, 225, 0.60)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    aspectRatio: 1024 / 402,
  },
  heroSliderScroll: {
    width: '100%',
    height: '100%',
  },
  paginationDotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  paginationDot: {
    height: 4.5,
    borderRadius: 2.5,
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: '#ffffff',
  },
  paginationDotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  sectionAccentBar: {
    width: 4.5,
    height: 18,
    borderRadius: 3,
    flexShrink: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.08)',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  categoryCardWrap: {
    width: '23%',
  },
  categoryCard: {
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.76)' : 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.98)',
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.32)' : '#ffffff',
    borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.90)',
    borderRightColor: isDark ? 'rgba(0, 0, 0, 0.30)' : 'rgba(203, 213, 225, 0.60)',
    borderBottomColor: isDark ? 'rgba(0, 0, 0, 0.50)' : 'rgba(203, 213, 225, 0.70)',
    shadowColor: isDark ? '#000000' : '#0f172a',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: isDark ? 0.55 : 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
  catImageWrap: {
    width: 62,
    height: 62,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
    borderWidth: 1.2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(226, 232, 240, 0.90)',
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.20)' : '#ffffff',
    borderBottomColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(203, 213, 225, 0.50)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.40 : 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  catImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  catTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    minHeight: 28,
    lineHeight: 14,
    paddingHorizontal: 2,
    letterSpacing: 0.15,
  },
});

