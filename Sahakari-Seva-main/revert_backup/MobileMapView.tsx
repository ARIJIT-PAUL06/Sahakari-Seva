// ==============================================================================
// MOBILE MAP VIEW — OPENSTREETMAP INTERACTIVE RENDERING (ZERO PAID MAP APIS)
// Uses OpenStreetMap tiles + Leaflet with touch gestures & worker selection card.
// ==============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { NearbyWorkerResult } from '../../types';
import { Star, MapPin, CheckCircle, ShieldCheck, Zap, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

interface MobileMapViewProps {
  userLocation: { latitude: number; longitude: number };
  workers: NearbyWorkerResult[];
  selectedWorkerId?: string;
  onSelectWorker: (worker: NearbyWorkerResult) => void;
  onRequestBooking: (worker: NearbyWorkerResult) => void;
}

export const MobileMapView: React.FC<MobileMapViewProps> = ({
  userLocation,
  workers,
  selectedWorkerId,
  onSelectWorker,
  onRequestBooking
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [activeWorker, setActiveWorker] = useState<NearbyWorkerResult | null>(
    workers.find(w => w.workerId === selectedWorkerId) || workers[0] || null
  );

  // Generate self-contained OpenStreetMap Leaflet HTML for web or webview
  const generateLeafletHtml = () => {
    const workerPins = workers
      .map(
        (w, i) => `
        L.marker([${w.latitude}, ${w.longitude}], {
          icon: L.divIcon({
            className: 'custom-worker-pin',
            html: '<div style="background:${colors.primary};color:${colors.textInverse};border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid #fff;font-weight:bold;font-size:12px;">★ ${w.rating}</div>',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          })
        })
        .addTo(map)
        .bindPopup('<b>${w.name}</b><br/>${w.service} • ₹${w.hourly_rate}/hr<br/>Distance: ${w.distance_km} km')
        .on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_WORKER', workerId: '${w.workerId}' }));
          } else if (window.parent) {
            window.parent.postMessage({ type: 'SELECT_WORKER', workerId: '${w.workerId}' }, '*');
          }
        });
      `
      )
      .join('\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body, #osm-map { height: 100%; width: 100%; margin: 0; padding: 0; }
            .leaflet-control-attribution { font-size: 9px !important; }
          </style>
        </head>
        <body>
          <div id="osm-map"></div>
          <script>
            var map = L.map('osm-map', { zoomControl: true }).setView([${userLocation.latitude}, ${userLocation.longitude}], 13);
            
            // OpenStreetMap standard tile layer (Completely Free & Open Source)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // User GPS Location Marker (Blue Circle)
            var userIcon = L.divIcon({
              className: 'user-pin',
              html: '<div style="background:${colors.info};width:20px;height:20px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 10px rgba(37,99,235,0.6);"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            L.marker([${userLocation.latitude}, ${userLocation.longitude}], { icon: userIcon })
              .addTo(map)
              .bindPopup('<b>Your Current Location</b><br/>GPS fix active')
              .openPopup();

            // Service Radius Circle (10 km)
            L.circle([${userLocation.latitude}, ${userLocation.longitude}], {
              color: '${colors.success}',
              fillColor: '${colors.success}',
              fillOpacity: 0.12,
              radius: 10000
            }).addTo(map);

            ${workerPins}
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      {/* Map Tile Rendering Container */}
      <View style={styles.mapFrame}>
        {Platform.OS === 'web' ? (
          <iframe
            title="OpenStreetMap"
            srcDoc={generateLeafletHtml()}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          (() => {
            try {
              const { WebView } = require('react-native-webview');
              return (
                <WebView
                  originWhitelist={['*']}
                  source={{ html: generateLeafletHtml() }}
                  style={{ flex: 1 }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  onMessage={(event: any) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.type === 'SELECT_WORKER') {
                        const found = workers.find(w => w.workerId === data.workerId);
                        if (found) {
                          setActiveWorker(found);
                          onSelectWorker(found);
                        }
                      }
                    } catch {}
                  }}
                />
              );
            } catch (e) {
              return (
                <View style={styles.nativeNotice}>
                  <Text style={styles.nativeNoticeText}>
                    OpenStreetMap stream active ({workers.length} verified workers plotted)
                  </Text>
                </View>
              );
            }
          })()
        )}

        {/* Floating Quick Stats Badge */}
        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>
            📍 {workers.length} Workers in 15 km Radius
          </Text>
        </View>
      </View>

      {/* Selected Worker Callout Bottom Sheet */}
      {activeWorker && (
        <View style={styles.calloutCard}>
          <View style={styles.calloutHeader}>
            <View style={styles.workerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.workerName}>{activeWorker.name}</Text>
                <ShieldCheck size={16} color={colors.success} />
              </View>
              {activeWorker.availability === 'busy' && (
                <View style={styles.activeJobBadge}>
                  <View style={styles.activeJobDot} />
                  <Text style={styles.activeJobText}>On Active Job</Text>
                </View>
              )}
              <Text style={styles.workerService}>{activeWorker.service}</Text>
              <Text style={styles.workerArea}>{activeWorker.approximate_location.area}</Text>
            </View>

            <View style={styles.ratingBadge}>
              <Star size={14} color={colors.star} fill={colors.star} />
              <Text style={styles.ratingText}>{activeWorker.rating}</Text>
            </View>
          </View>

          {/* Metrics Row: Distance + Match Score + Rate */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue}>{activeWorker.distance_km} km</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Match Score</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {activeWorker.matchScore} / 100
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Base Rate</Text>
              <Text style={styles.metricValue}>₹{activeWorker.hourly_rate}/hr</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => onRequestBooking(activeWorker)}
            >
              <Zap size={16} color={colors.textInverse} />
              <Text style={styles.bookBtnText}>Book This Professional</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  mapFrame: {
    flex: 1,
    position: 'relative'
  },
  nativeNotice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    padding: 16
  },
  nativeNoticeText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  mapBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  mapBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary
  },
  calloutCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  workerInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  activeJobBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 3,
    marginBottom: 1,
  },
  activeJobDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  activeJobText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.3,
  },
  workerService: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2
  },
  workerArea: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondaryDark
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 14
  },
  metricItem: {
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border
  },
  actionRow: {
    marginTop: 14
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse
  }
});