// src/components/common/RealQRCode.tsx
// ==============================================================================
// SAHAKARI SEVA — REAL ISO/IEC 18004 COMPLIANT QR CODE GENERATOR
// Produces genuine, scannable QR codes for UPI payments, completion tokens,
// and worker identity credentials across Mobile (Android/iOS) and Web.
// ==============================================================================

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import QRCode from 'qrcode';

interface RealQRCodeProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  centerBadge?: React.ReactNode;
  centerBadgeSize?: number;
}

export const RealQRCode: React.FC<RealQRCodeProps> = ({
  value,
  size = 200,
  color = '#0f172a',
  backgroundColor = '#ffffff',
  errorCorrectionLevel = 'M',
  centerBadge,
  centerBadgeSize = 38,
}) => {
  const { pathData, moduleCount } = useMemo(() => {
    if (!value) {
      return { pathData: '', moduleCount: 21 };
    }

    try {
      const qr = QRCode.create(value, {
        errorCorrectionLevel,
      });

      const count = qr.modules.size;
      const cellSize = size / count;
      let path = '';

      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.modules.get(r, c)) {
            const x = c * cellSize;
            const y = r * cellSize;
            // Draw square module
            path += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
          }
        }
      }

      return { pathData: path, moduleCount: count };
    } catch (err) {
      console.warn('[RealQRCode] Failed to generate QR matrix:', err);
      return { pathData: '', moduleCount: 21 };
    }
  }, [value, size, errorCorrectionLevel]);

  if (!value) {
    return <View style={{ width: size, height: size, backgroundColor }} />;
  }

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect width={size} height={size} fill={backgroundColor} rx={8} />
        {pathData ? <Path d={pathData} fill={color} /> : null}
      </Svg>

      {centerBadge && (
        <View
          style={[
            styles.badgeWrapper,
            {
              width: centerBadgeSize,
              height: centerBadgeSize,
              borderRadius: centerBadgeSize / 2,
              backgroundColor,
            },
          ]}
        >
          {centerBadge}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
