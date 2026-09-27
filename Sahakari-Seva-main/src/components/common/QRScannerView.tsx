// src/components/common/QRScannerView.tsx
// ==============================================================================
// SAHAKARI SEVA — CROSS-PLATFORM LIVE QR CAMERA SCANNER
// Mobile: expo-camera CameraView with native Barcode Scanning
// Web: HTML5 WebRTC MediaDevices + jsQR real-time frame decoder
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import jsQR from 'jsqr';
import { Camera, RefreshCw, AlertCircle, Zap, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../theme';

interface QRScannerViewProps {
  onScanned: (data: string) => void;
  active: boolean;
  width?: number;
  height?: number;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({
  onScanned,
  active,
  width = 220,
  height = 190,
}) => {
  const { colors, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  // Web-specific state & refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [webCameraError, setWebCameraError] = useState<string | null>(null);

  // Scanning laser beam animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      setHasScanned(false);
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.stopAnimation();
    }
  }, [active, laserAnim]);

  // Handle native barcode scan
  const handleNativeBarcodeScanned = (result: { data: string }) => {
    if (!active || hasScanned || !result.data) return;
    setHasScanned(true);
    onScanned(result.data);
  };

  // Web camera setup and jsQR decoding loop
  useEffect(() => {
    if (Platform.OS !== 'web' || !active) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    let isMounted = true;
    setWebCameraError(null);

    const startWebCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setWebCameraError('Web camera API not supported on this browser');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play().catch(() => undefined);
          requestAnimationFrame(scanWebFrame);
        }
      } catch (err: any) {
        if (isMounted) {
          setWebCameraError(err.message || 'Camera permission denied or camera in use');
        }
      }
    };

    const scanWebFrame = () => {
      if (!isMounted || !active || hasScanned) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            setHasScanned(true);
            onScanned(code.data);
            return;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(scanWebFrame);
    };

    startWebCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [active, hasScanned, onScanned]);

  const translateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, height - 20],
  });

  // Render Web implementation
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.viewfinder, { width, height }]}>
        {webCameraError ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={24} color="#f59e0b" />
            <Text style={styles.errorText}>Webcam not available</Text>
            <Text style={styles.errorSubText}>Use 4-digit PIN verification below</Text>
          </View>
        ) : (
          <View style={StyleSheet.absoluteFill}>
            {/* HTML5 Video element */}
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              muted
              playsInline
            />
            {/* Hidden canvas for jsQR analysis */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </View>
        )}

        {/* Viewfinder Overlays & Crosshairs */}
        <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} />
        <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} />
        <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} />
        <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} />

        {!webCameraError && active && !hasScanned && (
          <Animated.View
            style={[
              styles.laserBeam,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                transform: [{ translateY }],
              },
            ]}
          />
        )}
      </View>
    );
  }

  // Render Mobile (Expo) CameraView implementation
  if (!permission) {
    return (
      <View style={[styles.viewfinder, { width, height }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.hintText}>Checking camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.viewfinder, { width, height }]}>
        <Camera size={26} color={colors.textMuted} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <TouchableOpacity
          style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
          onPress={() => requestPermission()}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionBtnText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.viewfinder, { width, height }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={active && !hasScanned ? handleNativeBarcodeScanned : undefined}
      />

      {/* Viewfinder Overlays & Crosshairs */}
      <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} />
      <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} />
      <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} />
      <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} />

      {active && !hasScanned && (
        <Animated.View
          style={[
            styles.laserBeam,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              transform: [{ translateY }],
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  viewfinder: {
    backgroundColor: '#000000',
    borderRadius: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    zIndex: 10,
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  laserBeam: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2.5,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    zIndex: 9,
  },
  hintText: {
    marginTop: 8,
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  permissionTitle: {
    marginTop: 8,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionBtn: {
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  permissionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 12,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  errorSubText: {
    fontSize: 10.5,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
