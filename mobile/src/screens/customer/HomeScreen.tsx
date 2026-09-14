// ==============================================================================
// CUSTOMER HOME SCREEN — SERVICE CATEGORIES, EMERGENCY BANNER & NEARBY MATCHES
// ==============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { rootNavigationRef } from '../../navigation/RootNavigator';
import { ApiClient } from '../../services/apiClient';
import { MobileLocationService } from '../../services/locationService';
import { ServiceCategory, NearbyWorkerResult, Worker } from '../../types';
import { MOCK_WORKERS, MOCK_CATEGORIES } from '../../services/mockDatabase';
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
  Search,
  ArrowRight,
  X,
  Star,
  ShieldCheck,
  CheckCircle,
  Phone,
  Calendar,
  HelpCircle,
  AlertTriangle,
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

const CATEGORY_PRICES: Record<string, string> = {
  'Electrical': 'From ₹299',
  'Plumbing': 'From ₹249',
  'Carpentry': 'From ₹299',
  'Painting': 'From ₹349',
  'Cleaning & Sanitization': 'From ₹199',
  'Gardening & Landscaping': 'From ₹249',
  'Appliance Repair': 'From ₹299',
  'AC Repair & Servicing': 'From ₹399',
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

// ==============================================================================
// QUICK SUGGESTION PILLS FOR DISCOVERY
// ==============================================================================
export const QUICK_SUGGESTIONS = [
  { label: '💳 Pay on Completion', query: 'pay on completion' },
  { label: '🛡️ Sign-Off & Pay', query: 'sign off' },
  { label: '⚡ Fan Repair', query: 'fan' },
  { label: '🚰 Tap Leak', query: 'tap' },
  { label: '❄️ AC Service', query: 'ac' },
  { label: '🚨 30-min Emergency', query: 'emergency' },
  { label: '🛋️ Sofa Cleaning', query: 'sofa' },
  { label: '🔨 Modular Kitchen', query: 'modular kitchen' },
  { label: '📍 Jaipur Workers', query: 'Jaipur' },
  { label: '🗺️ Live Map', query: 'map' },
  { label: '📅 My Bookings', query: 'bookings' },
  { label: '🤝 Worker Welfare', query: 'welfare' },
];

interface CategoryCardItemProps {
  cat: ServiceCategory;
  idx: number;
  navigation: any;
  colors: Palette;
  isDark: boolean;
  styles: any;
}

const CategoryCardItem: React.FC<CategoryCardItemProps> = ({
  cat,
  idx,
  navigation,
  colors,
  isDark,
  styles,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const catImg = CATEGORY_IMAGES[cat.name];
  const title = translateTrade(cat.name);
  const priceText = CATEGORY_PRICES[cat.name] || 'Fair Rates';

  return (
    <FadeInView
      delay={80 + idx * 25}
      distance={8}
      duration={240}
      style={styles.categoryCardWrap}
    >
      <ScalePressable
        onPress={() => navigation.navigate('Search', { selectedCategory: cat.name })}
        scaleTo={0.93}
        hoverLift={-3}
        hoverScale={1.02}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${priceText}`}
      >
        <View
          style={[
            styles.categoryCard,
            isHovered && styles.categoryCardHovered,
          ]}
          // @ts-ignore
          onMouseEnter={() => setIsHovered(true)}
          // @ts-ignore
          onMouseLeave={() => setIsHovered(false)}
        >
          <View style={[styles.catImageWrap, isHovered && styles.catImageWrapHovered]}>
            {catImg ? (
              <Image
                source={catImg}
                style={[styles.catImage, isHovered && styles.catImageHovered]}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ fontSize: 24 }}>🛠️</Text>
            )}
          </View>
          <Text
            style={[
              styles.catTitle,
              isHovered && { color: isDark ? '#34d399' : '#087F5B' },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <View
            style={[
              styles.catPriceChip,
              isHovered && styles.catPriceChipHovered,
            ]}
          >
            <Text
              style={[
                styles.catPriceText,
                isHovered && { color: '#FFFFFF' },
              ]}
            >
              {priceText}
            </Text>
          </View>
        </View>
      </ScalePressable>
    </FadeInView>
  );
};

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

  // Universal Search Engine state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const bannerScrollRef = useRef<ScrollView>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const isInteractingWithBanner = useRef(false);
  const bannerTimerRef = useRef<any>(null);
  const [bannerWidth, setBannerWidth] = useState(
    Math.max(Dimensions.get('window').width - 32, 280)
  );

  // Auto-scroll hero banners horizontally between each other in a brief period of time (4.2s)
  useEffect(() => {
    if (HERO_BANNERS.length <= 1 || bannerWidth <= 0) return;
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    bannerTimerRef.current = setInterval(() => {
      if (isInteractingWithBanner.current) return;
      setCurrentBannerIndex((prev) => {
        const nextIdx = (prev + 1) % HERO_BANNERS.length;
        bannerScrollRef.current?.scrollTo({
          x: nextIdx * bannerWidth,
          animated: true,
        });
        return nextIdx;
      });
    }, 4200);
    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
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

  // ==============================================================================
  // UNIVERSAL SEARCH ENGINE (Searches Services, Tasks, Workers, Areas, Features)
  // ==============================================================================
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { categories: [], workers: [], actions: [], totalCount: 0 };
    }

    // 1. Matched Categories & Specific Task / Issue Keywords
    const matchedCategories: { category: ServiceCategory; matchedSkill?: string }[] = [];
    const allCats = categories.length > 0 ? categories : MOCK_CATEGORIES;

    const taskDictionary: Record<string, string[]> = {
      'Electrical': ['fan', 'switch', 'switchboard', 'wiring', 'wire', 'mcb', 'fuse', 'short circuit', 'light', 'inverter', 'bulb', 'socket', 'power', 'electrician', 'बिजली', 'इलेक्ट्रीशियन'],
      'Plumbing': ['tap', 'leak', 'pipe', 'drain', 'blockage', 'water', 'tank', 'motor', 'flush', 'sink', 'faucet', 'sanitary', 'plumber', 'नल', 'प्लम्बर'],
      'Carpentry': ['door', 'lock', 'hinge', 'furniture', 'wood', 'almirah', 'wardrobe', 'kitchen', 'modular', 'drawer', 'drill', 'shelf', 'bed', 'sofa frame', 'carpenter', 'बढ़ई'],
      'Painting': ['paint', 'wall', 'texture', 'whitewash', 'distemper', 'primer', 'waterproof', 'dampness', 'ceiling', 'color', 'painter', 'पुताई', 'पेंट'],
      'Cleaning & Sanitization': ['clean', 'cleaning', 'sofa', 'carpet', 'bathroom', 'kitchen', 'deep cleaning', 'sanitize', 'sanitization', 'dust', 'mop', 'house cleaning', 'सफाई'],
      'Gardening & Landscaping': ['garden', 'gardening', 'plant', 'lawn', 'grass', 'pruning', 'pot', 'flower', 'tree', 'terrace garden', 'fertilizer', 'gardener', 'बागवानी'],
      'Appliance Repair': ['appliance', 'fridge', 'refrigerator', 'washing machine', 'microwave', 'geyser', 'mixer', 'grinder', 'oven', 'tv', 'उपकरण'],
      'AC Repair & Servicing': ['ac', 'air conditioner', 'cooling', 'gas', 'filter', 'compressor', 'split ac', 'window ac', 'foam jet', 'cooling issue', 'एसी'],
      'Driver Services': ['driver', 'car', 'chauffeur', 'vehicle', 'ड्राइवर'],
      'Caregiving & Nursing': ['nurse', 'nursing', 'care', 'elderly', 'patient', 'medical', 'physiotherapy', 'attendant', 'नर्सिंग'],
    };

    allCats.forEach((cat) => {
      const nameMatch = cat.name.toLowerCase().includes(q);
      const hindiMatch = cat.name_hi && cat.name_hi.toLowerCase().includes(q);
      const descMatch = cat.description && cat.description.toLowerCase().includes(q);
      const descHiMatch = cat.description_hi && cat.description_hi.toLowerCase().includes(q);

      const tasks = taskDictionary[cat.name] || [];
      const matchedTaskWord = tasks.find(word => {
        const wLower = word.toLowerCase();
        return q.split(/\s+/).some(term => term === wLower || (term.length >= 3 && wLower.startsWith(term)) || (wLower.length >= 3 && term.startsWith(wLower)));
      });

      if (nameMatch || hindiMatch || descMatch || descHiMatch || matchedTaskWord) {
        matchedCategories.push({
          category: cat,
          matchedSkill: matchedTaskWord ? `Matches: ${matchedTaskWord.toUpperCase()}` : undefined,
        });
      }
    });

    // 2. Matched Verified Workers / Professionals
    const matchedWorkers: {
      workerId: string;
      workerName: string;
      service: string;
      rating: number;
      serviceArea: string;
      hourlyRate: number;
      matchReason: string;
      rawWorker: any;
    }[] = [];

    const seenWorkerIds = new Set<string>();
    const candidateWorkers = [...nearbyWorkers, ...MOCK_WORKERS];
    const qTerms = q.split(/\s+/).filter(Boolean);

    candidateWorkers.forEach((w: any) => {
      const id = w.id || w.workerId;
      if (seenWorkerIds.has(id)) return;

      const name = (w.profile?.full_name || w.name || w.workerName || '').trim();
      const service = (w.skill_category || w.service || '').trim();
      const area = (w.service_area || w.serviceArea || w.approximate_location?.area || w.city || 'Jaipur').trim();
      const pincode = (w.pincode || w.approximate_location?.pincode || '').trim();
      const skills: string[] = w.skills || [];
      const bio = (w.bio || '').trim();
      const cert = (w.certification_name || '').trim();
      const welfare = (w.welfare_status || '').trim();

      let matchReason = '';

      if (name.toLowerCase().includes(q)) {
        matchReason = `Professional: ${name}`;
      } else if (service.toLowerCase().includes(q)) {
        matchReason = `Trade: ${service}`;
      } else if (skills.some(s => {
        const sLower = s.toLowerCase();
        return qTerms.some(term => 
          sLower.split(/[\s,/&-]+/).some(word => word.startsWith(term) || word === term)
        );
      })) {
        const found = skills.find(s => {
          const sLower = s.toLowerCase();
          return qTerms.some(term => 
            sLower.split(/[\s,/&-]+/).some(word => word.startsWith(term) || word === term)
          );
        });
        matchReason = `Skill: ${found}`;
      } else if (area.toLowerCase().includes(q)) {
        matchReason = `Area: ${area}`;
      } else if (pincode.includes(q)) {
        matchReason = `Pincode: ${pincode}`;
      } else if (service.toLowerCase().split(/\s+/).some((w: string) => qTerms.includes(w))) {
        matchReason = `Trade: ${service}`;
      } else if (cert.toLowerCase().includes(q)) {
        matchReason = `Certified: ${cert.split('(')[0]}`;
      } else if (welfare.toLowerCase().includes(q)) {
        matchReason = `Cooperative: ${welfare}`;
      }

      if (matchReason) {
        seenWorkerIds.add(id);
        matchedWorkers.push({
          workerId: id,
          workerName: name || 'Verified Artisan',
          service: service || 'Service Professional',
          rating: w.rating || w.average_rating || 4.8,
          serviceArea: area,
          hourlyRate: w.hourly_rate || w.hourly_or_base_rate || w.basePrice || 249,
          matchReason,
          rawWorker: w,
        });
      }
    });

    // 3. Matched Cooperative & Platform Features
    const matchedActions: {
      id: string;
      title: string;
      subtitle: string;
      badge?: string;
      badgeColor?: string;
      badgeBg?: string;
      icon: any;
      onPress: () => void;
    }[] = [];

    // Emergency Service
    if (
      ['emergency', 'urgent', '30 min', 'fast', 'sos', 'help', 'danger', 'now', 'quick', 'short circuit', 'breakdown', 'आपातकालीन'].some(k => q.includes(k))
    ) {
      matchedActions.push({
        id: 'action-emergency',
        title: '30-Minute Emergency Dispatch',
        subtitle: 'Priority rapid response for critical electrical, plumbing & AC repairs',
        badge: 'EMERGENCY',
        badgeColor: '#D92D4F',
        badgeBg: '#FDECEF',
        icon: Zap,
        onPress: () => navigation.navigate('Search', { emergencyOnly: true }),
      });
    }

    // Map Feature
    if (
      ['map', 'location', 'gps', 'nearby', 'radius', 'around', 'locate', 'track', 'workers near', 'नक्शा'].some(k => q.includes(k))
    ) {
      matchedActions.push({
        id: 'action-map',
        title: 'Interactive Worker Map',
        subtitle: 'Explore 16+ verified cooperative artisans live on OpenStreetMap in Jaipur',
        badge: 'MAP VIEW',
        badgeColor: '#087F5B',
        badgeBg: '#E8F7F1',
        icon: Map,
        onPress: () => navigation.navigate('Map'),
      });
    }

    // Bookings & Activity
    if (
      ['booking', 'bookings', 'order', 'status', 'history', 'appointment', 'active', 'pass', 'qr', 'बुक'].some(k => q.includes(k))
    ) {
      matchedActions.push({
        id: 'action-bookings',
        title: 'My Bookings & Activity',
        subtitle: 'Track requested, in-progress jobs and show Completion QR passes',
        badge: 'ACTIVITY',
        badgeColor: '#2563EB',
        badgeBg: '#EAF2FF',
        icon: Calendar,
        onPress: () => navigation.navigate('Bookings'),
      });
    }

    // Cooperative Welfare & Mission
    if (
      ['welfare', 'coop', 'cooperative', 'sahakari', 'pension', 'insurance', 'ayushman', 'member', 'union', 'mission', 'कल्याण'].some(k => q.includes(k))
    ) {
      matchedActions.push({
        id: 'action-welfare',
        title: 'Worker-Owned Cooperative Welfare',
        subtitle: 'Zero commission guarantee — 100% of fair wages go to local artisans & 10% solidarity corpus',
        badge: 'COOPERATIVE',
        badgeColor: '#087F5B',
        badgeBg: '#E8F7F1',
        icon: ShieldCheck,
        onPress: () => {
          try {
            navigation.navigate('WorkerWelfare');
          } catch (e) {
            if (rootNavigationRef.isReady()) {
              rootNavigationRef.navigate('WorkerWelfare');
            }
          }
        },
      });
    }

    // Transparent Pricing
    if (
      ['price', 'pricing', 'rate', 'cost', 'fee', 'charge', 'cheap', 'zero commission', 'bill', 'fair', 'मूल्य'].some(k => q.includes(k))
    ) {
      matchedActions.push({
        id: 'action-pricing',
        title: 'Transparent Fair Pricing Directory',
        subtitle: 'Standardized rates: Electrical ₹249, Plumbing ₹249, Carpentry ₹299, AC ₹399',
        badge: 'FAIR WAGE',
        badgeColor: '#B86A00',
        badgeBg: '#FFF4DD',
        icon: Zap,
        onPress: () => navigation.navigate('Search'),
      });
    }

    // Support & Helpline
    if (
      ['support', 'help', 'call', 'contact', 'phone', 'safety', 'complaint', 'grievance', 'helpline', 'मदद'].some(k => q.includes(k))
    ) {
      matchedActions.push({
        id: 'action-support',
        title: '24x7 Cooperative Safety Helpline',
        subtitle: 'Emergency helpline & government-registered grievance resolution',
        badge: 'SUPPORT',
        badgeColor: '#D92D4F',
        badgeBg: '#FDECEF',
        icon: Phone,
        onPress: () => navigation.navigate('CustomerProfile'),
      });
    }

    // Profile & Settings
    if (
      ['profile', 'account', 'settings', 'language', 'hindi', 'english', 'theme', 'dark', 'light'].some(k => q.includes(k))
    ) {
      matchedActions.push({
        id: 'action-profile',
        title: 'Customer Profile & Settings',
        subtitle: 'Manage saved addresses, change language, toggle dark/light theme',
        badge: 'ACCOUNT',
        badgeColor: '#667085',
        badgeBg: '#FAFBF8',
        icon: HelpCircle,
        onPress: () => navigation.navigate('CustomerProfile'),
      });
    }

    // Spare Parts & Materials Policy
    if (
      ['part', 'parts', 'spare', 'material', 'materials', 'component', 'estimate', 'quotation', 'diagnostic', 'descaling', 'acid wash', 'supplemental', 'switchboard cost', 'pipe cost', 'सामग्री'].some(k => q.includes(k))
    ) {
      matchedActions.push({
        id: 'action-parts',
        title: 'Zero-Markup Spare Parts & Estimates Guarantee',
        subtitle: 'Authentic parts and diagnostic items billed directly at transparent cooperative rates',
        badge: 'MATERIALS',
        badgeColor: '#087F5B',
        badgeBg: '#E8F7F1',
        icon: Wrench,
        onPress: () => navigation.navigate('Search'),
      });
    }

    // Work Completion Sign-Off & Verification Pass
    if (
      [
        'sign off',
        'sign-off',
        'signoff',
        'completion pin',
        'completion pass',
        'verify work',
        'verify and pay',
        'verification',
        'work pass',
        'otp',
        'pin',
        'qr pass',
        'सत्यापन',
      ].some(k => q.includes(k))
    ) {
      matchedActions.push({
        id: 'action-signoff',
        title: 'Work Completion Sign-Off & Verification Pass',
        subtitle: 'Inspect finished work, view 4-digit PIN / QR pass, and authorize payment to worker',
        badge: 'SIGN-OFF PASS',
        badgeColor: '#2B8A3E',
        badgeBg: '#EBFBEE',
        icon: ShieldCheck,
        onPress: () => navigation.navigate('Bookings'),
      });
    }

    // Pay on Service Completion (After Pay)
    if (
      [
        'after pay',
        'afterpay',
        'pay after',
        'pay worker',
        'pay on completion',
        'payment on completion',
        'pay bill',
        'pending payment',
        'due payment',
        'pay now',
        'settle payment',
        'upi pay',
        'cash to worker',
        'भुगतान',
      ].some(k => q.includes(k))
    ) {
      matchedActions.push({
        id: 'action-afterpay',
        title: 'Pay on Service Completion (After Pay)',
        subtitle: 'Settle service bills via UPI, RuPay card or cash only after inspecting finished work',
        badge: 'AFTER PAY',
        badgeColor: '#087F5B',
        badgeBg: '#E8F7F1',
        icon: CheckCircle,
        onPress: () => navigation.navigate('Bookings'),
      });
    }

    const totalCount = matchedCategories.length + matchedWorkers.length + matchedActions.length;
    return {
      categories: matchedCategories,
      workers: matchedWorkers,
      actions: matchedActions,
      totalCount,
    };
  }, [searchQuery, categories, nearbyWorkers]);

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor="#087F5B"
            colors={['#087F5B']}
          />
        }
      >
        {/* 1. Fully Functional Universal Search Field */}
        <FadeInView delay={0} distance={6} duration={240}>
          <View style={[styles.searchBarContainer, isSearchFocused && styles.searchBarContainerFocused]}>
            <View style={styles.searchIconWrap}>
              <Search size={18} color={isSearchFocused ? '#087F5B' : colors.textSecondary} />
            </View>
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search jobs, workers, tasks, areas..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="never"
              autoCorrect={false}
            />
            {searchQuery.trim().length > 0 ? (
              <ScalePressable
                onPress={() => {
                  setSearchQuery('');
                  searchInputRef.current?.blur();
                }}
                scaleTo={0.88}
                style={styles.clearSearchBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
              >
                <X size={15} color={colors.textSecondary} />
              </ScalePressable>
            ) : (
              <ScalePressable
                onPress={() => searchInputRef.current?.focus()}
                scaleTo={0.88}
                style={styles.searchCtaChip}
                accessibilityRole="button"
                accessibilityLabel="Focus search"
              >
                <ArrowRight size={13} color="#087F5B" />
              </ScalePressable>
            )}
          </View>
        </FadeInView>

        {/* SEARCH RESULTS VIEW (When query is present) OR NORMAL UNCLUTTERED HOME FEED */}
        {searchQuery.trim().length > 0 ? (
          <FadeInView delay={0} distance={6} duration={200} style={styles.searchResultsWrapper}>
            {/* Header summary: Results count + Clear button */}
            <View style={styles.resultsHeaderRow}>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>
                  {searchResults.totalCount} {searchResults.totalCount === 1 ? 'match' : 'matches'} for "{searchQuery.trim()}"
                </Text>
              </View>
              <ScalePressable
                scaleTo={0.92}
                onPress={() => {
                  setSearchQuery('');
                  searchInputRef.current?.blur();
                }}
                style={styles.clearAllLink}
                accessibilityRole="button"
                accessibilityLabel="Clear all search results"
              >
                <Text style={styles.clearAllLinkText}>Clear ✕</Text>
              </ScalePressable>
            </View>

            {searchResults.totalCount > 0 ? (
              <>
                {/* A. Services & Specific Tasks */}
                {searchResults.categories.length > 0 && (
                  <View style={styles.resultsGroup}>
                    <View style={styles.resultsGroupHeader}>
                      <Zap size={14} color="#087F5B" />
                      <Text style={styles.resultsGroupTitle}>
                        SERVICES & SKILLS ({searchResults.categories.length})
                      </Text>
                    </View>
                    <View style={styles.resultsGrid}>
                      {searchResults.categories.map((item) => {
                        const cat = item.category;
                        const title = translateTrade(cat.name);
                        const img = CATEGORY_IMAGES[cat.name];
                        const price = CATEGORY_PRICES[cat.name] || `From ₹${cat.base_price || 249}`;
                        return (
                          <ScalePressable
                            key={cat.id}
                            scaleTo={0.97}
                            hoverLift={-2}
                            onPress={() => navigation.navigate('Search', { selectedCategory: cat.name })}
                            style={styles.serviceResultCard}
                            accessibilityRole="button"
                            accessibilityLabel={`${title}, ${price}`}
                          >
                            <View style={styles.serviceResultLeft}>
                              {img ? (
                                <Image source={img} style={styles.serviceResultImg} resizeMode="contain" />
                              ) : (
                                <View style={styles.serviceResultIconFallback}>
                                  <Zap size={18} color="#087F5B" />
                                </View>
                              )}
                              <View style={styles.serviceResultInfo}>
                                <Text style={styles.serviceResultName}>{title}</Text>
                                <Text style={styles.serviceResultReason} numberOfLines={1}>
                                  {item.matchedSkill || cat.description}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.serviceResultRight}>
                              <View style={styles.catPriceChip}>
                                <Text style={styles.catPriceText}>{price}</Text>
                              </View>
                              <Text style={styles.viewWorkersText}>View →</Text>
                            </View>
                          </ScalePressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* B. Verified Professionals */}
                {searchResults.workers.length > 0 && (
                  <View style={styles.resultsGroup}>
                    <View style={styles.resultsGroupHeader}>
                      <ShieldCheck size={14} color="#087F5B" />
                      <Text style={styles.resultsGroupTitle}>
                        VERIFIED PROFESSIONALS ({searchResults.workers.length})
                      </Text>
                    </View>
                    <View style={styles.workersResultsList}>
                      {searchResults.workers.map((w) => (
                        <View key={w.workerId} style={styles.workerResultCard}>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('WorkerDetail', { workerId: w.workerId })}
                            style={styles.workerResultMain}
                            accessibilityRole="button"
                            accessibilityLabel={`View ${w.workerName}'s profile`}
                          >
                            <View style={styles.workerAvatarCircle}>
                              <Text style={styles.workerAvatarInitials}>
                                {w.workerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </Text>
                            </View>
                            <View style={styles.workerResultDetails}>
                              <View style={styles.workerNameRow}>
                                <Text style={styles.workerResultName}>{w.workerName}</Text>
                                <ShieldCheck size={14} color="#087F5B" />
                              </View>
                              <View style={styles.workerMetaRow}>
                                <View style={styles.tradeChip}>
                                  <Text style={styles.tradeChipText}>{w.service}</Text>
                                </View>
                                <View style={styles.searchRatingBadge}>
                                  <Star size={11} color="#B86A00" fill="#F39A24" />
                                  <Text style={styles.searchRatingText}>{w.rating.toFixed(1)}</Text>
                                </View>
                              </View>
                              <View style={styles.workerAreaRow}>
                                <MapPin size={11} color="#667085" />
                                <Text style={styles.workerAreaText}>{w.serviceArea}</Text>
                              </View>
                              {w.matchReason ? (
                                <View style={styles.matchReasonChip}>
                                  <Text style={styles.matchReasonText}>{w.matchReason}</Text>
                                </View>
                              ) : null}
                            </View>
                          </TouchableOpacity>
                          <ScalePressable
                            scaleTo={0.92}
                            hoverLift={-1}
                            onPress={() => {
                              navigation.navigate('BookingCreate', {
                                worker: {
                                  id: w.workerId,
                                  name: w.workerName,
                                  trade: w.service,
                                  hourly_rate: w.hourlyRate,
                                  rating: w.rating,
                                  latitude: w.rawWorker?.latitude || 26.9017,
                                  longitude: w.rawWorker?.longitude || 75.7925,
                                },
                              });
                            }}
                            style={styles.workerBookBtn}
                            accessibilityRole="button"
                            accessibilityLabel={`Book ${w.workerName}`}
                          >
                            <Text style={styles.workerBookBtnText}>⚡ Book ₹{w.hourlyRate} →</Text>
                          </ScalePressable>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* C. Cooperative Features & Actions */}
                {searchResults.actions.length > 0 && (
                  <View style={styles.resultsGroup}>
                    <View style={styles.resultsGroupHeader}>
                      <Sparkles size={14} color="#087F5B" />
                      <Text style={styles.resultsGroupTitle}>
                        COOPERATIVE FEATURES & ACTIONS ({searchResults.actions.length})
                      </Text>
                    </View>
                    <View style={styles.actionsResultsList}>
                      {searchResults.actions.map((act) => {
                        const IconComponent = act.icon;
                        return (
                          <ScalePressable
                            key={act.id}
                            scaleTo={0.98}
                            hoverLift={-2}
                            onPress={act.onPress}
                            accessibilityRole="button"
                            accessibilityLabel={act.title}
                            style={styles.actionResultCard}
                          >
                            <View style={[styles.actionIconWrap, { backgroundColor: act.badgeBg || '#E8F7F1' }]}>
                              <IconComponent size={18} color={act.badgeColor || '#087F5B'} />
                            </View>
                            <View style={styles.actionDetails}>
                              <View style={styles.actionTitleRow}>
                                <Text style={styles.actionTitle}>{act.title}</Text>
                                {act.badge ? (
                                  <View style={[styles.actionBadge, { backgroundColor: act.badgeBg || '#E8F7F1' }]}>
                                    <Text style={[styles.actionBadgeText, { color: act.badgeColor || '#087F5B' }]}>
                                      {act.badge}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                              <Text style={styles.actionSubtitle}>{act.subtitle}</Text>
                            </View>
                            <ChevronRight size={16} color="#667085" />
                          </ScalePressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </>
            ) : (
              /* No matches found: Friendly helper with suggested searches */
              <View style={styles.noResultsCard}>
                <View style={styles.noResultsIconWrap}>
                  <Search size={28} color="#087F5B" />
                </View>
                <Text style={styles.noResultsTitle}>No matches found for "{searchQuery}"</Text>
                <Text style={styles.noResultsSub}>
                  Try searching for a job task (e.g. fan repair, tap leak, ac service), an artisan name (e.g. Rajesh, Anita), or an area (e.g. Jaipur, C-Scheme).
                </Text>
                <View style={styles.suggestedPillsWrap}>
                  {QUICK_SUGGESTIONS.slice(0, 6).map((item, idx) => (
                    <ScalePressable
                      key={idx}
                      scaleTo={0.92}
                      hoverLift={-1}
                      style={styles.suggestedPill}
                      onPress={() => setSearchQuery(item.query)}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <Text style={styles.suggestedPillText}>{item.label}</Text>
                    </ScalePressable>
                  ))}
                </View>
              </View>
            )}
          </FadeInView>
        ) : (
          /* Normal Clean Home Feed */
          <>
            {/* 2. Hero Section with auto-scroll carousel, exact aspect ratio, and Primary CTA */}
            <FadeInView delay={40} distance={8} duration={280}>
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
                    onTouchStart={() => {
                      isInteractingWithBanner.current = true;
                    }}
                    onTouchEnd={() => {
                      setTimeout(() => {
                        isInteractingWithBanner.current = false;
                      }, 4000);
                    }}
                    onScrollBeginDrag={() => {
                      isInteractingWithBanner.current = true;
                    }}
                    onScrollEndDrag={() => {
                      setTimeout(() => {
                        isInteractingWithBanner.current = false;
                      }, 4000);
                    }}
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
                        accessibilityRole="button"
                        accessibilityLabel={banner.title || 'Cooperative Banner'}
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
                        {HERO_BANNERS.map((_, idx) => {
                          const isActive = idx === currentBannerIndex;
                          return (
                            <TouchableOpacity
                              key={idx}
                              activeOpacity={0.8}
                              accessibilityRole="button"
                              accessibilityLabel={`Carousel slide ${idx + 1}`}
                              onPress={() => {
                                isInteractingWithBanner.current = true;
                                bannerScrollRef.current?.scrollTo({
                                  x: idx * bannerWidth,
                                  animated: true,
                                });
                                setCurrentBannerIndex(idx);
                                setTimeout(() => {
                                  isInteractingWithBanner.current = false;
                                }, 4000);
                              }}
                              style={[
                                styles.paginationDot,
                                isActive
                                  ? styles.paginationDotActive
                                  : styles.paginationDotInactive,
                              ]}
                            />
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Tagline Card with Primary CTA */}
              <View style={styles.heroActionRow}>
                <View style={styles.heroActionTextWrap}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <PulseDot color="#087F5B" size={6} ringScale={2.2} duration={2000} />
                    <Text style={styles.heroActionTitle}>Trusted work. Shared prosperity.</Text>
                  </View>
                  <Text style={styles.heroActionSubtitle}>100% Worker-Owned Cooperative</Text>
                </View>
                <ScalePressable
                  onPress={() => navigation.navigate('Search')}
                  scaleTo={0.93}
                  hoverLift={-1}
                  accessibilityRole="button"
                  accessibilityLabel="Find a professional"
                  style={styles.heroCtaBtn}
                >
                  <Text style={styles.heroCtaBtnText}>Find a professional →</Text>
                </ScalePressable>
              </View>
            </FadeInView>

            {/* 3. Cooperative Certified Services (8 Categories) */}
            <FadeInView delay={100} distance={10} duration={280}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionAccentBar} />
                    <Text style={styles.sectionTitle}>What does your home need today?</Text>
                  </View>
                  <ScalePressable
                    onPress={() => navigation.navigate('Search')}
                    scaleTo={0.92}
                    hoverLift={-1}
                    accessibilityRole="button"
                    accessibilityLabel="See all services"
                    style={styles.seeAllBtn}
                  >
                    <Text style={styles.seeAllText}>See all →</Text>
                  </ScalePressable>
                </View>

                {/* 8 Category Grid */}
                <View style={styles.categoryGrid}>
                  {categories.slice(0, 8).map((cat, idx) => (
                    <CategoryCardItem
                      key={cat.id}
                      cat={cat}
                      idx={idx}
                      navigation={navigation}
                      colors={colors}
                      isDark={isDark}
                      styles={styles}
                    />
                  ))}
                </View>
              </View>
            </FadeInView>

            {/* 4. Emergency Service */}
            <FadeInView delay={160} distance={10} duration={280}>
              <ScalePressable
                onPress={() => navigation.navigate('Search', { emergencyOnly: true })}
                scaleTo={0.97}
                hoverLift={-2}
                accessibilityRole="button"
                accessibilityLabel="Need Emergency Repair? Get Help Now"
              >
                <View style={styles.emergencyBanner}>
                  <View style={styles.emergencyLeft}>
                    <PulseView scaleTo={1.14} duration={1200} style={styles.emergencyIconWrap}>
                      <Zap size={18} color="#D92D4F" />
                    </PulseView>
                    <View style={styles.emergencyTextWrap}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.emergencyHeadline}>Need Emergency Repair?</Text>
                        <View style={styles.emergencyPillTag}>
                          <Text style={styles.emergencyPillText}>30m SLA</Text>
                        </View>
                      </View>
                      <Text style={styles.emergencySupportText}>Electrical • Plumbing • AC</Text>
                    </View>
                  </View>
                  <View style={styles.emergencyCta}>
                    <Text style={styles.emergencyCtaText}>Get Help Now →</Text>
                  </View>
                </View>
              </ScalePressable>
            </FadeInView>

            {/* 5. Cooperative Transparency Footer */}
            <FadeInView delay={220} distance={10} duration={300}>
              <Footer />
            </FadeInView>
          </>
        )}
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
    paddingTop: 16,
    paddingBottom: 36,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E3E8E5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchBarContainerFocused: {
    borderColor: '#087F5B',
    shadowColor: '#087F5B',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  searchIconWrap: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: 4,
    outlineStyle: 'none' as any,
  },
  clearSearchBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F1F3F5',
  },
  searchCtaChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  heroShadowWrapper: {
    width: '100%',
    aspectRatio: 1024 / 402,
    borderRadius: 18,
    backgroundColor: isDark ? '#080d19' : '#FFFFFF',
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.60 : 0.08,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 8,
  },
  heroSection: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E3E8E5',
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
    backgroundColor: '#FFFFFF',
  },
  paginationDotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E3E8E5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 22,
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  heroActionTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  heroActionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  heroActionSubtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 1,
  },
  heroCtaBtn: {
    backgroundColor: '#087F5B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexShrink: 0,
    shadowColor: '#087F5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  heroCtaBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 22,
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
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#087F5B',
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
  },
  seeAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#087F5B',
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E3E8E5',
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.35 : 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryCardHovered: {
    borderColor: '#087F5B',
    shadowColor: '#087F5B',
    shadowOpacity: isDark ? 0.45 : 0.14,
    shadowRadius: 10,
    elevation: 4,
    backgroundColor: isDark ? '#111c30' : '#FFFFFF',
  },
  catImageWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  catImageWrapHovered: {
    transform: [{ scale: 1.06 }],
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  catImageHovered: {
    transform: [{ scale: 1.04 }],
  },
  catTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    minHeight: 26,
    lineHeight: 13,
    paddingHorizontal: 2,
  },
  catPriceChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 3,
  },
  catPriceChipHovered: {
    backgroundColor: '#087F5B',
  },
  catPriceText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#087F5B',
  },
  coopDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#087F5B',
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#2d0c14' : '#FDECEF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(217, 45, 79, 0.40)' : 'rgba(217, 45, 79, 0.22)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 22,
    shadowColor: '#D92D4F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  emergencyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(217, 45, 79, 0.25)' : 'rgba(217, 45, 79, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTextWrap: {
    flex: 1,
  },
  emergencyHeadline: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#D92D4F',
  },
  emergencyPillTag: {
    backgroundColor: isDark ? 'rgba(217, 45, 79, 0.35)' : '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  emergencyPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D92D4F',
  },
  emergencySupportText: {
    fontSize: 11,
    fontWeight: '500',
    color: isDark ? '#fda4af' : '#667085',
    marginTop: 1,
  },
  emergencyCta: {
    backgroundColor: '#D92D4F',
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: 8,
    flexShrink: 0,
  },
  emergencyCtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Search & Suggestions System Styles */
  quickSuggestionsBar: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  quickSuggestionsLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  quickPillsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  quickPill: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E3E8E5',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  searchResultsWrapper: {
    paddingBottom: 28,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsBadge: {
    backgroundColor: '#E8F7F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#087F5B',
  },
  clearAllLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearAllLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  resultsGroup: {
    marginBottom: 20,
  },
  resultsGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  resultsGroupTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  resultsGrid: {
    gap: 8,
  },

  serviceResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E3E8E5',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  serviceResultImg: {
    width: 44,
    height: 44,
  },
  serviceResultIconFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E8F7F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceResultInfo: {
    flex: 1,
  },
  serviceResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceResultReason: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  serviceResultRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  viewWorkersText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#087F5B',
  },

  workersResultsList: {
    gap: 10,
  },
  workerResultCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E3E8E5',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  workerResultMain: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  workerAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#087F5B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerAvatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workerResultDetails: {
    flex: 1,
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  workerResultName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  workerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tradeChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tradeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#087F5B',
  },
  searchRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  searchRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B86A00',
  },
  workerAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  workerAreaText: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  matchReasonChip: {
    alignSelf: 'flex-start',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  matchReasonText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#087F5B',
  },
  workerBookBtn: {
    backgroundColor: '#087F5B',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerBookBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  actionsResultsList: {
    gap: 8,
  },
  actionResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E3E8E5',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.3 : 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionDetails: {
    flex: 1,
    marginRight: 8,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },

  noResultsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E3E8E5',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noResultsIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F7F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noResultsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  noResultsSub: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  suggestedPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestedPill: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  suggestedPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#087F5B',
  },
});


