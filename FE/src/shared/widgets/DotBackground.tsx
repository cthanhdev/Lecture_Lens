import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Pattern, Rect, Defs } from 'react-native-svg';
import { useAppTheme } from '../../core/theme/ThemeContext';

interface DotBackgroundProps {
  children: ReactNode;
}

/**
 * Nền sổ tay chấm bi (Dot Grid Notebook Canvas)
 * Lưới chấm tròn step 16px, radius 1.1px trên tone kem pastel #FFFAF5 hoặc dark canvas.
 */
export const DotBackground = ({ children }: DotBackgroundProps) => {
  const { isDark, colors } = useAppTheme();

  const dotFill = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(234, 219, 206, 0.55)';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id="dotGrid"
              x="0"
              y="0"
              width={16}
              height={16}
              patternUnits="userSpaceOnUse"
            >
              <Circle cx={8} cy={8} r={1.1} fill={dotFill} />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#dotGrid)" />
        </Svg>
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
