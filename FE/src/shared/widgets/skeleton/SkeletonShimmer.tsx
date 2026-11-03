import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../../../core/theme/ThemeContext';

interface ShimmerPlaceholderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const ShimmerPlaceholder = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: ShimmerPlaceholderProps) => {
  const { isDark } = useAppTheme();
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [animatedValue]);

  const baseColor = isDark ? '#35304F' : '#EDE4FF';

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: baseColor,
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
};

export const LectureListSkeleton = () => {
  const { colors, borderRadius } = useAppTheme();

  return (
    <View style={styles.skeletonContainer}>
      {[1, 2].map((idx) => (
        <View
          key={idx}
          style={[
            styles.skeletonCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header row */}
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <ShimmerPlaceholder width={90} height={22} borderRadius={12} />
              <ShimmerPlaceholder width={140} height={22} borderRadius={12} style={{ marginLeft: 8 }} />
            </View>
            <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
          </View>

          {/* Title */}
          <ShimmerPlaceholder width="85%" height={22} borderRadius={8} style={{ marginTop: 12 }} />
          <ShimmerPlaceholder width="60%" height={18} borderRadius={8} style={{ marginTop: 8 }} />

          {/* Note snippet placeholder */}
          <ShimmerPlaceholder width="100%" height={56} borderRadius={16} style={{ marginTop: 12 }} />

          {/* Metrics & footer */}
          <View style={[styles.row, { marginTop: 16 }]}>
            <ShimmerPlaceholder width={70} height={16} borderRadius={6} />
            <ShimmerPlaceholder width={60} height={16} borderRadius={6} style={{ marginLeft: 12 }} />
            <ShimmerPlaceholder width={80} height={16} borderRadius={6} style={{ marginLeft: 12 }} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const LectureDetailSkeleton = () => {
  const { colors, borderRadius } = useAppTheme();

  return (
    <View style={styles.skeletonContainer}>
      {/* Top Meta Card Skeleton */}
      <View
        style={[
          styles.skeletonCard,
          {
            backgroundColor: colors.card,
            borderRadius: borderRadius.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.rowBetween}>
          <ShimmerPlaceholder width={120} height={24} borderRadius={12} />
          <View style={styles.row}>
            <ShimmerPlaceholder width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} />
            <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
          </View>
        </View>
        <ShimmerPlaceholder width="75%" height={24} borderRadius={8} style={{ marginTop: 12 }} />
        <ShimmerPlaceholder width="50%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
      </View>

      {/* Audio Capsule Skeleton */}
      <View
        style={[
          styles.skeletonCard,
          {
            backgroundColor: colors.card,
            borderRadius: borderRadius.card,
            borderColor: colors.border,
            marginTop: 12,
          },
        ]}
      >
        <ShimmerPlaceholder width="100%" height={8} borderRadius={4} />
        <View style={[styles.rowBetween, { marginTop: 10 }]}>
          <ShimmerPlaceholder width={40} height={14} borderRadius={6} />
          <ShimmerPlaceholder width={40} height={14} borderRadius={6} />
        </View>
        <View style={[styles.rowBetween, { marginTop: 16, alignItems: 'center' }]}>
          <ShimmerPlaceholder width={36} height={36} borderRadius={18} />
          <ShimmerPlaceholder width={120} height={44} borderRadius={22} />
          <ShimmerPlaceholder width={36} height={36} borderRadius={18} />
          <ShimmerPlaceholder width={50} height={32} borderRadius={16} />
        </View>
      </View>

      {/* Tabs placeholder */}
      <View style={[styles.row, { marginTop: 16, justifyContent: 'space-around' }]}>
        <ShimmerPlaceholder width="30%" height={36} borderRadius={12} />
        <ShimmerPlaceholder width="30%" height={36} borderRadius={12} />
        <ShimmerPlaceholder width="30%" height={36} borderRadius={12} />
      </View>

      {/* Content items */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.skeletonCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.card,
              borderColor: colors.border,
              marginTop: 12,
            },
          ]}
        >
          <ShimmerPlaceholder width={60} height={20} borderRadius={10} />
          <ShimmerPlaceholder width="90%" height={16} borderRadius={6} style={{ marginTop: 10 }} />
          <ShimmerPlaceholder width="70%" height={16} borderRadius={6} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skeletonCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
