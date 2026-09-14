// ==============================================================================
// MOBILE WORKER CARD COMPONENT — Localized, animated, haptic press feedback
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { NearbyWorkerResult } from '../../types';
import { Star, ShieldCheck, MapPin, Zap, Sparkles } from 'lucide-react-native';
import { FadeInView, ScalePressable } from '../../animations';
import { translateTrade } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { getTradeTheme } from '../../theme/tradeThemes';

interface WorkerCardProps {
  worker: NearbyWorkerResult;
  onPress: () => void;
  onBook: () => void;
  /** Index in a list — drives the staggered entrance delay. */
  index?: number;
  /** Whether the customer is in 24/7 Emergency SOS mode */
  emergencyOnly?: boolean;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onPress, onBook, index = 0, emergencyOnly = false }) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const tradeTheme = getTradeTheme(worker.service, isDark);
  const isEmergencyActive = emergencyOnly || worker.availability === 'emergency_only';
  const emergencyRate = Math.round(worker.hourly_rate * 1.25);

  return (
    <FadeInView delay={index * 60} distance={14} duration={320}>
      <ScalePressable onPress={onPress} scaleTo={0.98}>
        <View style={[styles.card, isEmergencyActive && styles.cardEmergency]}>
          <View style={styles.headerRow}>
            <View style={styles.leftMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <ShieldCheck size={16} color={colors.primary} />
              </View>

              {/* Status indicator directly under worker name */}
              {worker.availability === 'busy' && (
                <View style={styles.activeJobBadge}>
                  <View style={styles.activeJobPulseDot} />
                  <Text style={styles.activeJobText}>
                    {t('workerProfile.status_busy', 'On Active Job')}
                  </Text>
                </View>
              )}

              {/* Emergency On-Call Badge */}
              {isEmergencyActive && (
                <View style={styles.emergencyOnCallBadge}>
                  <Zap size={11} color="#e11d48" />
                  <Text style={styles.emergencyOnCallText}>
                    24/7 Emergency Dispatch (&lt; 15-30 min)
                  </Text>
                </View>
              )}

              {/* Vibrant Trade Category Chip */}
              <View style={[styles.tradeChip, { backgroundColor: tradeTheme.badgeBg, borderColor: tradeTheme.border }]}>
                <View style={[styles.tradeDot, { backgroundColor: tradeTheme.primary }]} />
                <Text style={[styles.tradeText, { color: tradeTheme.badgeText }]}>
                  {translateTrade(worker.service)}
                </Text>
              </View>
            </View>

              {/* Glowing Amber Rating Badge */}
            <View style={styles.ratingBadge}>
              <Star size={12} color="#F39A24" fill="#F39A24" />
              <Text style={styles.ratingText}>{worker.rating}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {worker.approximate_location.area}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.metricsBadge}>
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText} numberOfLines={1}>
                  {t('common.km_away', { km: worker.distance_km })}
                </Text>
              </View>
              {/* Soft Mint Match Score Chip */}
              <View style={styles.matchScoreBadge}>
                <Sparkles size={11} color="#087F5B" />
                <Text style={styles.scoreText} numberOfLines={1}>
                  {t('common.match', { score: worker.matchScore })}
                </Text>
              </View>
            </View>

            <ScalePressable onPress={onBook} scaleTo={0.93} style={styles.bookBtnWrap}>
              <View
                style={[styles.bookBtn, isEmergencyActive && styles.bookBtnEmergency]}
              >
                <Zap size={11} color="#ffffff" />
                <Text style={styles.bookBtnText} numberOfLines={1}>
                  {isEmergencyActive ? `Emergency ₹${emergencyRate} →` : `⚡ Book ₹${worker.hourly_rate} →`}
                </Text>
              </View>
            </ScalePressable>
          </View>
        </View>
      </ScalePressable>
    </FadeInView>
  );
};

const createStyles = (colors: Palette, isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E3E8E5',
    shadowColor: '#142238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.35 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workerName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activeJobBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: isDark ? 'rgba(243, 154, 36, 0.16)' : '#FFF4DD',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(243, 154, 36, 0.4)' : '#ffe5b4',
    marginTop: 4,
    marginBottom: 2,
  },
  activeJobPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F39A24',
  },
  activeJobText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : '#B86A00',
    letterSpacing: 0.2,
  },
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 5,
  },
  tradeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tradeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(243, 154, 36, 0.16)' : '#FFF4DD',
    borderWidth: 1,
    borderColor: isDark ? '#B86A00' : '#ffe5b4',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#fde68a' : '#B86A00',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E3E8E5',
  },
  metricsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  distanceBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  distanceText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: isDark ? 'rgba(8, 127, 91, 0.18)' : '#E8F7F1',
    borderWidth: 1,
    borderColor: isDark ? '#075C43' : '#c2edd8',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  scoreText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: isDark ? '#E8F7F1' : '#087F5B',
  },
  bookBtnWrap: {
    flexShrink: 0,
    marginLeft: 8,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#087F5B',
    paddingHorizontal: 12,
    paddingVertical: 7.5,
    borderRadius: 9,
    shadowColor: '#087F5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bookBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardEmergency: {
    borderColor: '#D92D4F',
    borderWidth: 1.4,
  },
  emergencyOnCallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? 'rgba(217, 45, 79, 0.15)' : '#FDECEF',
    borderWidth: 1,
    borderColor: isDark ? '#9F1239' : 'rgba(217, 45, 79, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 3,
    marginBottom: 4,
  },
  emergencyOnCallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D92D4F',
  },
  bookBtnEmergency: {
    backgroundColor: '#D92D4F',
    shadowColor: '#D92D4F',
  },
});

export default WorkerCard;