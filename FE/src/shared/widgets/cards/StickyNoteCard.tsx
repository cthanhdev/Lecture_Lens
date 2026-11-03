import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../../core/theme/ThemeContext';
import { AppColors } from '../../../core/theme/colors';
import { AppTypography } from '../../../core/theme/typography';
import { AppShadows } from '../../../core/theme/layout';
import { LlIcon } from '../icons/LlIcon';
import { WashiTapeAccent, WashiTapeColor } from '../washi_tape/WashiTapeAccent';

export type StickyVariant = 'yellow' | 'pink' | 'mint';

interface StickyNoteCardProps {
  children?: ReactNode;
  title?: string;
  text?: string;
  rotation?: string;
  showPin?: boolean;
  showTape?: boolean;
  tapeColor?: WashiTapeColor;
  variant?: StickyVariant;
  timestamp?: string;
  jumpLabel?: string;
  onJumpPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const StickyNoteCard = ({
  children,
  title,
  text,
  rotation = '-1deg',
  showPin = true,
  showTape = false,
  tapeColor = 'sakura',
  variant = 'yellow',
  timestamp,
  jumpLabel,
  onJumpPress,
  style,
}: StickyNoteCardProps) => {
  const { colors, isDark } = useAppTheme();
  const isPink = variant === 'pink';
  const isMint = variant === 'mint';

  const bgColor = isPink ? colors.stickyPinkBg : isMint ? colors.stickyMintBg : colors.stickyYellowBg;
  const textColor = isPink ? colors.stickyPinkText : isMint ? colors.stickyMintText : colors.stickyYellowText;
  const accentColor = isPink ? colors.stickyPinkAccent : isMint ? colors.stickyMintAccent : colors.stickyYellowAccent;
  const borderColor = isPink ? colors.stickyPinkBorder : isMint ? colors.stickyMintBorder : colors.stickyYellowBorder;

  return (
    <View style={[styles.container, { transform: [{ rotate: rotation }] }, style]}>
      {showTape && (
        <View style={styles.tapeContainer}>
          <WashiTapeAccent color={tapeColor} width={52} height={12} rotation="1deg" />
        </View>
      )}

      <View style={[styles.card, { backgroundColor: bgColor }, AppShadows.stickyNote]}>
        {/* Header with Title and Pin */}
        {(title || showPin || timestamp) && (
          <View style={styles.headerRow}>
            <View style={styles.titleWrapper}>
              {showPin && (
                <View style={styles.pinWrapper}>
                  <LlIcon name="push_pin" size={14} color={accentColor} />
                </View>
              )}
              {title && (
                <Text style={[AppTypography.labelMd, { color: accentColor, fontWeight: '700' }]}>
                  {title}
                </Text>
              )}
            </View>

            {timestamp && (
              <View style={[styles.timestampBadge, { backgroundColor: isDark ? colors.surfaceContainerHighest : AppColors.tertiaryFixed, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <LlIcon name="play_arrow" size={10} color={isDark ? colors.text : AppColors.onTertiaryFixed} filled />
                <Text style={[AppTypography.labelSm, { color: isDark ? colors.text : AppColors.onTertiaryFixed }]}>
                  {timestamp}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Content */}
        {text ? (
          <View style={[styles.quoteBlock, { borderLeftColor: borderColor }]}>
            <Text style={[AppTypography.bodyMedium, { color: textColor, lineHeight: 22 }]}>
              {text}
            </Text>
          </View>
        ) : (
          children
        )}

        {/* Audio Jump CTA */}
        {jumpLabel && onJumpPress && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onJumpPress}
            style={[
              styles.jumpButton,
              {
                backgroundColor: isDark ? accentColor : textColor,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              },
            ]}
          >
            <LlIcon name="headphones" size={14} color={isDark ? '#1D1831' : '#FFFFFF'} />
            <Text style={[AppTypography.labelMd, { color: isDark ? '#1D1831' : '#FFFFFF', fontWeight: '700' }]}>
              {jumpLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  tapeContainer: {
    alignSelf: 'center',
    marginBottom: -6,
    zIndex: 2,
  },
  card: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pinWrapper: {
    marginRight: 6,
  },
  timestampBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  quoteBlock: {
    borderLeftWidth: 2,
    paddingLeft: 8,
    marginVertical: 4,
  },
  jumpButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
