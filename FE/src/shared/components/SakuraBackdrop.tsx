import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { palette } from '../../core/theme';

export interface SakuraBackdropProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  petalCount?: number;
}

// Deterministic petal positions and sizes
const PETALS = [
  { top: '8%', left: '12%', size: 14, rotate: '18deg', opacity: 0.45 },
  { top: '15%', right: '14%', size: 18, rotate: '-24deg', opacity: 0.5 },
  { top: '28%', left: '8%', size: 12, rotate: '36deg', opacity: 0.35 },
  { top: '35%', right: '10%', size: 20, rotate: '-12deg', opacity: 0.4 },
  { top: '52%', left: '15%', size: 16, rotate: '42deg', opacity: 0.45 },
  { top: '65%', right: '18%', size: 14, rotate: '-30deg', opacity: 0.35 },
  { top: '78%', left: '10%', size: 18, rotate: '15deg', opacity: 0.5 },
  { top: '85%', right: '12%', size: 12, rotate: '-45deg', opacity: 0.4 },
];

export function SakuraBackdrop({ children, style, petalCount = 8 }: SakuraBackdropProps) {
  const activePetals = PETALS.slice(0, petalCount);

  return (
    <View style={[styles.container, style]}>
      {activePetals.map((p, idx) => (
        <View
          key={idx}
          pointerEvents="none"
          style={[
            styles.petal,
            {
              top: p.top as any,
              left: (p as any).left,
              right: (p as any).right,
              width: p.size,
              height: p.size * 1.4,
              opacity: p.opacity,
              transform: [{ rotate: p.rotate }],
            },
          ]}
        />
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  petal: {
    position: 'absolute',
    backgroundColor: palette.sakuraLight,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
  },
});
