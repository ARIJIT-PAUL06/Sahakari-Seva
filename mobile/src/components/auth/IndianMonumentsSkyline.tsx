// ==============================================================================
// INDIAN MONUMENTS SKYLINE & TRICOLOR WAVE COMPONENT — DUAL THEME
// Authentic vector panorama featuring India Gate, Qutub Minar, Red Fort,
// Taj Mahal, Lotus Temple, Gateway of India, Ashoka Chakra, flying birds,
// and edge-to-edge undulating Indian Tricolor ribbon wave.
// Perfectly adapts to Dark Theme (luminous slate-white) & Light Theme (sandstone slate).
// ==============================================================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  G,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface IndianMonumentsSkylineProps {
  isDark: boolean;
  width?: number | string;
  height?: number;
}

export const IndianMonumentsSkyline: React.FC<IndianMonumentsSkylineProps> = ({
  isDark,
  width = '100%',
  height,
}) => {
  // Theme-aware color tokens — architectural etching watermark aesthetic
  const monumentFill = isDark ? '#94a3b8' : '#475569';
  const monumentOpacity = isDark ? 0.24 : 0.18;
  const monumentAccent = isDark ? '#ffffff' : '#0f172a';
  const monumentAccentOpacity = isDark ? 0.18 : 0.12;

  const chakraStroke = isDark ? '#38bdf8' : '#0284c7';
  const chakraOpacity = isDark ? 0.14 : 0.10;

  const birdFill = isDark ? '#94a3b8' : '#64748b';
  const birdOpacity = isDark ? 0.30 : 0.22;

  // 24 spokes for the Ashoka Chakra (every 15 degrees)
  const chakraCX = 885;
  const chakraCY = 100;
  const chakraRadius = 80;
  const innerRadius = 14;

  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angleDeg = i * 15;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x1 = chakraCX + innerRadius * Math.cos(angleRad);
    const y1 = chakraCY + innerRadius * Math.sin(angleRad);
    const x2 = chakraCX + (chakraRadius - 4) * Math.cos(angleRad);
    const y2 = chakraCY + (chakraRadius - 4) * Math.sin(angleRad);
    return { x1, y1, x2, y2, key: `spoke-${i}` };
  });

  return (
    <View style={[styles.container, height ? { height } : { aspectRatio: 5.2 / 1 }]}>
      <Svg
        viewBox="0 0 1000 200"
        width={width}
        height="100%"
        preserveAspectRatio="xMidYMax meet"
        style={styles.svg}
      >
        <Defs>
          {/* Delicate architectural gradient fading out at top and base */}
          <SvgLinearGradient id="monumentGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={monumentFill} stopOpacity={monumentOpacity * 0.4} />
            <Stop offset="40%" stopColor={monumentFill} stopOpacity={monumentOpacity} />
            <Stop offset="85%" stopColor={monumentFill} stopOpacity={monumentOpacity * 0.75} />
            <Stop offset="100%" stopColor={monumentFill} stopOpacity={0.02} />
          </SvgLinearGradient>

          {/* Feathered Saffron Horizon Filament */}
          <SvgLinearGradient id="featheredSaffron" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FF9933" stopOpacity={0} />
            <Stop offset="15%" stopColor="#FF9933" stopOpacity={0.85} />
            <Stop offset="50%" stopColor="#FFAA44" stopOpacity={0.95} />
            <Stop offset="85%" stopColor="#FF7700" stopOpacity={0.85} />
            <Stop offset="100%" stopColor="#FF7700" stopOpacity={0} />
          </SvgLinearGradient>

          {/* Feathered White Luminous Horizon Filament */}
          <SvgLinearGradient id="featheredWhite" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="20%" stopColor="#FFFFFF" stopOpacity={isDark ? 0.85 : 0.95} />
            <Stop offset="80%" stopColor="#FFFFFF" stopOpacity={isDark ? 0.85 : 0.95} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </SvgLinearGradient>

          {/* Feathered Green Horizon Filament */}
          <SvgLinearGradient id="featheredGreen" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#138808" stopOpacity={0} />
            <Stop offset="15%" stopColor="#138808" stopOpacity={0.85} />
            <Stop offset="50%" stopColor="#159C0A" stopOpacity={0.95} />
            <Stop offset="85%" stopColor="#0B6B06" stopOpacity={0.85} />
            <Stop offset="100%" stopColor="#0B6B06" stopOpacity={0} />
          </SvgLinearGradient>

          {/* Soft ambient radial glow behind central skyline */}
          <RadialGradient id="centerGlow" cx="540" cy="110" r="180" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={isDark ? '#38bdf8' : '#0d9488'} stopOpacity={isDark ? 0.08 : 0.05} />
            <Stop offset="100%" stopColor={isDark ? '#38bdf8' : '#0d9488'} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* --- Background Ambient Glow behind central skyline --- */}
        <Circle cx={540} cy={90} r={140} fill="url(#centerGlow)" />

        {/* --- Background Ashoka Chakra Wheel (Right side behind skyline) --- */}
        <G opacity={chakraOpacity}>
          {/* Outer Ring */}
          <Circle
            cx={chakraCX}
            cy={chakraCY}
            r={chakraRadius}
            fill="none"
            stroke={chakraStroke}
            strokeWidth={2.8}
          />
          {/* Inner concentric rim */}
          <Circle
            cx={chakraCX}
            cy={chakraCY}
            r={chakraRadius - 5}
            fill="none"
            stroke={chakraStroke}
            strokeWidth={1.2}
          />
          {/* Central Hub */}
          <Circle
            cx={chakraCX}
            cy={chakraCY}
            r={innerRadius}
            fill="none"
            stroke={chakraStroke}
            strokeWidth={2}
          />
          <Circle
            cx={chakraCX}
            cy={chakraCY}
            r={4.5}
            fill={chakraStroke}
          />
          {/* 24 Radial Spokes */}
          {spokes.map((s) => (
            <Line
              key={s.key}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={chakraStroke}
              strokeWidth={1.4}
            />
          ))}
        </G>

        {/* --- Flying Birds in the Twilight Sky --- */}
        <G fill={birdFill} opacity={birdOpacity}>
          {/* Bird 1 (above Qutub/India Gate) */}
          <Path d="M 140 38 Q 148 30 156 38 Q 164 30 172 38 Q 164 34 156 36 Q 148 34 140 38 Z" />
          {/* Bird 2 (higher up) */}
          <Path d="M 270 24 Q 277 17 284 24 Q 291 17 298 24 Q 291 21 284 22 Q 277 21 270 24 Z" />
          {/* Bird 3 (center left) */}
          <Path d="M 360 42 Q 366 36 372 42 Q 378 36 384 42 Q 378 39 372 40 Q 366 39 360 42 Z" />
          {/* Bird 4 (above right skyline) */}
          <Path d="M 760 28 Q 768 20 776 28 Q 784 20 792 28 Q 784 24 776 26 Q 768 24 760 28 Z" />
          {/* Bird 5 (high right near Chakra) */}
          <Path d="M 830 18 Q 836 12 842 18 Q 848 12 854 18 Q 848 15 842 16 Q 836 15 830 18 Z" />
          {/* Bird 6 */}
          <Path d="M 920 32 Q 926 26 932 32 Q 938 26 944 32 Q 938 29 932 30 Q 926 29 920 32 Z" />
        </G>

        {/* ================================================================= */}
        {/* --- THE INDIAN MONUMENTS SKYLINE PANORAMA --- */}
        {/* ================================================================= */}

        <G fill="url(#monumentGrad)">
          {/* ------------------------------------------------------------- */}
          {/* 1. INDIA GATE (Delhi) — Left Flank (X: 30 to 145) */}
          {/* ------------------------------------------------------------- */}
          {/* Base stepped plinth */}
          <Path d="M 32 165 L 145 165 L 145 159 L 32 159 Z" />
          <Path d="M 36 159 L 141 159 L 141 154 L 36 154 Z" />

          {/* Left Main Pier */}
          <Path d="M 40 154 L 70 154 L 70 95 L 40 95 Z" />
          {/* Right Main Pier */}
          <Path d="M 107 154 L 137 154 L 137 95 L 107 95 Z" />

          {/* Central Triumphal Archway Opening & Arch curve */}
          <Path d="M 70 154 L 70 118 Q 70 102, 88.5 102 Q 107 102, 107 118 L 107 154 Z" />

          {/* Pier vertical accent bands & inner relief niches */}
          <Path
            d="M 48 144 L 62 144 L 62 126 Q 62 120, 55 120 Q 48 120, 48 126 Z"
            fill={monumentAccent}
            opacity={monumentAccentOpacity}
          />
          <Path
            d="M 115 144 L 129 144 L 129 126 Q 129 120, 122 120 Q 115 120, 115 126 Z"
            fill={monumentAccent}
            opacity={monumentAccentOpacity}
          />

          {/* Arch Cornice band */}
          <Path d="M 36 95 L 141 95 L 141 89 L 36 89 Z" />
          {/* Attic Story 1 */}
          <Path d="M 42 89 L 135 89 L 135 77 L 42 77 Z" />
          {/* Attic Cornice 2 */}
          <Path d="M 39 77 L 138 77 L 138 74 L 39 74 Z" />
          {/* Stepped Top / Dome Crest */}
          <Path d="M 52 74 L 125 74 L 125 67 L 52 67 Z" />
          <Path d="M 64 67 L 113 67 L 113 62 L 64 62 Z" />
          {/* Central Flaming Urn / Finial */}
          <Path d="M 83 62 Q 88.5 56, 94 62 Z" />

          {/* ------------------------------------------------------------- */}
          {/* 2. QUTUB MINAR (Delhi) — Tapering Fluted Victory Tower (X: 165 to 200) */}
          {/* ------------------------------------------------------------- */}
          {/* Base Story 1 */}
          <Path d="M 170 165 L 195 165 L 192 136 L 173 136 Z" />
          {/* Balcony 1 */}
          <Path d="M 169 136 L 196 136 L 196 133 L 169 133 Z" />

          {/* Story 2 */}
          <Path d="M 174 133 L 191 133 L 189 106 L 176 106 Z" />
          {/* Balcony 2 */}
          <Path d="M 172 106 L 193 106 L 193 103 L 172 103 Z" />

          {/* Story 3 */}
          <Path d="M 176 103 L 189 103 L 188 78 L 177 78 Z" />
          {/* Balcony 3 */}
          <Path d="M 174 78 L 191 78 L 191 75 L 174 75 Z" />

          {/* Story 4 */}
          <Path d="M 178 75 L 187 75 L 186 54 L 179 54 Z" />
          {/* Balcony 4 */}
          <Path d="M 176 54 L 189 54 L 189 51 L 176 51 Z" />

          {/* Story 5 (White marble & red sandstone top) */}
          <Path d="M 179 51 L 186 51 L 185 36 L 180 36 Z" />
          {/* Top Cupola & Finial */}
          <Path d="M 178 36 L 187 36 L 187 33 L 178 33 Z" />
          <Path d="M 180 33 Q 182.5 24, 185 33 Z" />
          <Line x1={182.5} y1={24} x2={182.5} y2={18} stroke={monumentFill} strokeWidth={1.2} />

          {/* ------------------------------------------------------------- */}
          {/* 3. RED FORT & HUMAYUN'S TOMB PAVILIONS (X: 215 to 380) */}
          {/* ------------------------------------------------------------- */}
          {/* Low wall with battlements / crenellations */}
          <Path d="M 200 165 L 390 165 L 390 148 L 200 148 Z" />
          {/* Battlements along parapet */}
          <Path d="M 205 148 L 209 148 L 209 144 L 213 144 L 213 148 L 217 148 L 217 144 L 221 144 L 221 148 L 225 148 L 225 144 L 229 144 L 229 148 L 233 148 Z" />

          {/* Octagonal Chhatri Tower 1 (Left) */}
          <Path d="M 240 148 L 260 148 L 259 116 L 241 116 Z" />
          {/* Chhatri Pillars & Dome */}
          <Path d="M 238 116 L 262 116 L 262 113 L 238 113 Z" />
          <Path d="M 240 113 L 242 102 L 246 102 L 246 113 Z" />
          <Path d="M 254 113 L 254 102 L 258 102 L 260 113 Z" />
          {/* Cupola Dome 1 */}
          <Path d="M 237 102 Q 250 88, 263 102 Z" />
          <Line x1={250} y1={88} x2={250} y2={82} stroke={monumentFill} strokeWidth={1.2} />

          {/* Central Red Fort / Delhi Gate Arched Portal */}
          <Path d="M 275 148 L 340 148 L 340 120 L 275 120 Z" />
          <Path d="M 290 148 L 290 128 Q 307.5 120, 325 128 L 325 148 Z" />
          {/* Scalloped Arch Accent */}
          <Path
            d="M 293 148 L 293 130 Q 307.5 124, 322 130 L 322 148 Z"
            fill={monumentAccent}
            opacity={monumentAccentOpacity}
          />
          {/* Jharokha Balcony on Portal */}
          <Path d="M 285 120 L 330 120 L 328 112 L 287 112 Z" />
          <Path d="M 295 112 Q 307.5 98, 320 112 Z" />

          {/* Octagonal Chhatri Tower 2 (Right) */}
          <Path d="M 355 148 L 375 148 L 374 116 L 356 116 Z" />
          <Path d="M 353 116 L 377 116 L 377 113 L 353 113 Z" />
          <Path d="M 355 113 L 357 102 L 361 102 L 361 113 Z" />
          <Path d="M 369 113 L 369 102 L 373 102 L 375 113 Z" />
          <Path d="M 352 102 Q 365 88, 378 102 Z" />
          <Line x1={365} y1={88} x2={365} y2={82} stroke={monumentFill} strokeWidth={1.2} />

          {/* ------------------------------------------------------------- */}
          {/* 4. TAJ MAHAL (Agra) — THE MAJESTIC CENTERPIECE (X: 395 to 685) */}
          {/* ------------------------------------------------------------- */}
          {/* Grand Marble Plinth / Terrace */}
          <Path d="M 395 165 L 685 165 L 685 156 L 395 156 Z" />
          <Path d="M 402 156 L 678 156 L 678 152 L 402 152 Z" />

          {/* --- Left Flanking Minaret (X: 412) --- */}
          {/* Base */}
          <Path d="M 406 152 L 418 152 L 417 125 L 407 125 Z" />
          {/* Balcony 1 */}
          <Path d="M 405 125 L 419 125 L 419 122 L 405 122 Z" />
          {/* Tier 2 */}
          <Path d="M 408 122 L 416 122 L 415 95 L 409 95 Z" />
          {/* Balcony 2 */}
          <Path d="M 406 95 L 418 95 L 418 92 L 406 92 Z" />
          {/* Tier 3 */}
          <Path d="M 409 92 L 415 92 L 414 68 L 410 68 Z" />
          {/* Balcony 3 */}
          <Path d="M 407 68 L 417 68 L 417 65 L 407 65 Z" />
          {/* Minaret Chhatri Kiosk */}
          <Path d="M 408 65 L 416 65 L 416 56 L 408 56 Z" />
          <Path d="M 406 56 Q 412 46, 418 56 Z" />
          <Line x1={412} y1={46} x2={412} y2={40} stroke={monumentFill} strokeWidth={1} />

          {/* --- Taj Mahal Main Body Block (X: 435 to 645) --- */}
          <Path d="M 435 152 L 645 152 L 645 106 L 435 106 Z" />

          {/* Left Wing Recessed Niches */}
          <Path d="M 445 146 L 472 146 L 472 130 Q 458.5 124, 445 130 Z" fill={monumentAccent} opacity={monumentAccentOpacity} />
          <Path d="M 445 126 L 472 126 L 472 112 Q 458.5 108, 445 112 Z" fill={monumentAccent} opacity={monumentAccentOpacity} />

          {/* Right Wing Recessed Niches */}
          <Path d="M 608 146 L 635 146 L 635 130 Q 621.5 124, 608 130 Z" fill={monumentAccent} opacity={monumentAccentOpacity} />
          <Path d="M 608 126 L 635 126 L 635 112 Q 621.5 108, 608 112 Z" fill={monumentAccent} opacity={monumentAccentOpacity} />

          {/* Grand Central Pishtaq (Main Portal Projecting Frame) */}
          <Path d="M 488 152 L 592 152 L 592 98 L 488 98 Z" />
          {/* Large Vaulted Iwan Arch Opening */}
          <Path d="M 505 152 L 505 118 Q 540 102, 575 118 L 575 152 Z" />
          {/* Inner Decorative Arch Layer */}
          <Path
            d="M 512 152 L 512 122 Q 540 108, 568 122 L 568 152 Z"
            fill={monumentAccent}
            opacity={monumentAccentOpacity}
          />

          {/* Left Subsidiary Chhatri Pavilion */}
          <Path d="M 462 106 L 482 106 L 482 92 L 462 92 Z" />
          <Path d="M 458 92 Q 472 78, 486 92 Z" />
          <Line x1={472} y1={78} x2={472} y2={72} stroke={monumentFill} strokeWidth={1} />

          {/* Right Subsidiary Chhatri Pavilion */}
          <Path d="M 598 106 L 618 106 L 618 92 L 598 92 Z" />
          <Path d="M 594 92 Q 608 78, 622 92 Z" />
          <Line x1={608} y1={78} x2={608} y2={72} stroke={monumentFill} strokeWidth={1} />

          {/* --- The Majestic Central Onion Dome (Amrud) --- */}
          {/* Cylindrical Drum Base */}
          <Path d="M 515 98 L 565 98 L 565 88 L 515 88 Z" />
          {/* Swelling Bulbous Dome Contour with Lotus Petal Neck */}
          <Path
            d="M 512 88 C 496 74, 498 52, 540 30 C 582 52, 584 74, 568 88 Z"
          />
          {/* Soaring Brass Kalash Finial */}
          <Line x1={540} y1={30} x2={540} y2={12} stroke={monumentFill} strokeWidth={1.8} />
          <Circle cx={540} cy={20} r={2.5} fill={monumentFill} />
          <Circle cx={540} cy={13} r={1.5} fill={monumentFill} />

          {/* --- Right Flanking Minaret (X: 668) --- */}
          {/* Base */}
          <Path d="M 662 152 L 674 152 L 673 125 L 663 125 Z" />
          {/* Balcony 1 */}
          <Path d="M 661 125 L 675 125 L 675 122 L 661 122 Z" />
          {/* Tier 2 */}
          <Path d="M 664 122 L 672 122 L 671 95 L 665 95 Z" />
          {/* Balcony 2 */}
          <Path d="M 662 95 L 674 95 L 674 92 L 662 92 Z" />
          {/* Tier 3 */}
          <Path d="M 665 92 L 671 92 L 670 68 L 666 68 Z" />
          {/* Balcony 3 */}
          <Path d="M 663 68 L 673 68 L 673 65 L 663 65 Z" />
          {/* Minaret Chhatri Kiosk */}
          <Path d="M 664 65 L 672 65 L 672 56 L 664 56 Z" />
          <Path d="M 662 56 Q 668 46, 674 56 Z" />
          <Line x1={668} y1={46} x2={668} y2={40} stroke={monumentFill} strokeWidth={1} />

          {/* ------------------------------------------------------------- */}
          {/* 5. LOTUS TEMPLE (New Delhi) — Blooming Petals (X: 695 to 780) */}
          {/* ------------------------------------------------------------- */}
          {/* Curved podium */}
          <Path d="M 695 165 L 780 165 L 775 152 L 700 152 Z" />
          {/* Outer Ring Petals */}
          <Path d="M 700 152 C 708 140, 715 135, 722 148 C 728 135, 735 140, 742 152 Z" />
          <Path d="M 738 152 C 745 140, 752 135, 759 148 C 765 135, 772 140, 778 152 Z" />
          {/* Inner Towering Arching Petals */}
          <Path d="M 714 152 C 718 116, 730 82, 738 72 C 746 82, 758 116, 762 152 Z" />
          {/* Central inner bloom petal */}
          <Path d="M 726 152 C 730 110, 735 88, 738 78 C 741 88, 746 110, 750 152 Z" fill={monumentAccent} opacity={monumentAccentOpacity} />

          {/* ------------------------------------------------------------- */}
          {/* 6. GATEWAY OF INDIA / CHARMINAR — Right Flank (X: 790 to 970) */}
          {/* ------------------------------------------------------------- */}
          {/* Grand Indo-Saracenic Podium */}
          <Path d="M 790 165 L 970 165 L 970 155 L 790 155 Z" />

          {/* Left Corner Minaret Tower */}
          <Path d="M 795 155 L 812 155 L 810 88 L 797 88 Z" />
          <Path d="M 793 88 L 814 88 L 814 85 L 793 85 Z" />
          <Path d="M 795 85 Q 803.5 74, 812 85 Z" />
          <Line x1={803.5} y1={74} x2={803.5} y2={68} stroke={monumentFill} strokeWidth={1} />

          {/* Central Monumental Archway Block */}
          <Path d="M 812 155 L 950 155 L 950 102 L 812 102 Z" />

          {/* Central Horseshoe Grand Arch */}
          <Path d="M 855 155 L 855 125 Q 881 108, 907 125 L 907 155 Z" />
          {/* Inner Arch Layer */}
          <Path
            d="M 862 155 L 862 128 Q 881 114, 900 128 L 900 155 Z"
            fill={monumentAccent}
            opacity={monumentAccentOpacity}
          />

          {/* Side Arches */}
          <Path d="M 822 155 L 822 135 Q 835 126, 848 135 L 848 155 Z" fill={monumentAccent} opacity={monumentAccentOpacity} />
          <Path d="M 914 155 L 914 135 Q 927 126, 940 135 L 940 155 Z" fill={monumentAccent} opacity={monumentAccentOpacity} />

          {/* Jali Parapet / Balcony Cornice */}
          <Path d="M 808 102 L 954 102 L 954 96 L 808 96 Z" />
          {/* Decorative Corner Domes */}
          <Path d="M 820 96 Q 835 84, 850 96 Z" />
          <Path d="M 912 96 Q 927 84, 942 96 Z" />

          {/* Right Corner Minaret Tower */}
          <Path d="M 950 155 L 967 155 L 965 88 L 952 88 Z" />
          <Path d="M 948 88 L 969 88 L 969 85 L 948 85 Z" />
          <Path d="M 950 85 Q 958.5 74, 967 85 Z" />
          <Line x1={958.5} y1={74} x2={958.5} y2={68} stroke={monumentFill} strokeWidth={1} />
        </G>

        {/* ================================================================= */}
        {/* --- ETHEREAL TRICOLOR HORIZON FILAMENTS (SLENDER & FEATHERED) --- */}
        {/* ================================================================= */}
        <G>
          {/* Top Saffron Filament */}
          <Path
            d="M 20 178 C 200 186, 440 174, 650 180 C 780 184, 880 182, 980 178"
            fill="none"
            stroke="url(#featheredSaffron)"
            strokeWidth={1.6}
          />

          {/* Middle Luminous White Filament */}
          <Path
            d="M 20 180.5 C 200 188.5, 440 176.5, 650 182.5 C 780 186.5, 880 184.5, 980 180.5"
            fill="none"
            stroke="url(#featheredWhite)"
            strokeWidth={1.2}
          />

          {/* Bottom Emerald Filament */}
          <Path
            d="M 20 183 C 200 191, 440 179, 650 185 C 780 189, 880 187, 980 183"
            fill="none"
            stroke="url(#featheredGreen)"
            strokeWidth={1.6}
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    alignSelf: 'center',
    opacity: 0.95,
  },
  svg: {
    width: '100%',
    height: '100%',
  },
});

export default IndianMonumentsSkyline;
