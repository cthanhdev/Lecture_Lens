import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Linking } from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { AppColors } from '../../core/theme/colors';
import { AppTypography } from '../../core/theme/typography';
import { AppShadows } from '../../core/theme/layout';
import { DotBackground } from '../../shared/widgets/DotBackground';
import { LlAppBar } from '../../shared/widgets/navigation/LlAppBar';
import { WashiTapeAccent } from '../../shared/widgets/washi_tape/WashiTapeAccent';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useAppStore } from '../../shared/stores/useAppStore';
import { LlIcon, LlIconName } from '../../shared/widgets/icons/LlIcon';
import { AppConstants } from '../../core/constants/appConstants';

type SettingsScreenNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Settings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavProp;
}

export const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const { colors, mode, setThemeMode, borderRadius } = useAppTheme();
  const { user, logout } = useAuthStore();
  const { appLockEnabled, toggleAppLock } = useAppStore();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản sinh viên?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <DotBackground>
      <LlAppBar
        title="Cài Đặt"
        subtitle="Hồ sơ sinh viên & Bàn học"
        showNotifications={true}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* THẺ 1: TÀI KHOẢN SINH VIÊN */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.modal,
              borderColor: colors.border,
            },
            AppShadows.card,
          ]}
        >
          {/* Top Washi Tape */}
          <View style={styles.cardTape}>
            <WashiTapeAccent color="lavender" width={56} height={12} rotation="-1deg" />
          </View>

          <View style={styles.profileRow}>
            {/* Avatar + Huy hiệu Cú Mèo */}
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarCircle, { backgroundColor: AppColors.primaryFixed }]}>
                <LlIcon name="school" size={28} color={AppColors.primary} />
              </View>
              {/* Cú Mèo Mini Badge */}
              <View style={[styles.mascotMiniBadge, { backgroundColor: AppColors.tertiaryFixed }]}>
                <LlIcon name="pets" size={10} color={AppColors.onTertiaryFixed} filled />
              </View>
            </View>

            {/* Student Info */}
            <View style={styles.profileInfoCol}>
              <View style={styles.nameRow}>
                <Text style={[AppTypography.headlineSm, { color: colors.text, fontWeight: '700' }]}>
                  {user.name}
                </Text>
                <View style={[styles.idChip, { backgroundColor: AppColors.primaryFixed }]}>
                  <Text style={[AppTypography.labelSm, { color: AppColors.primary, fontWeight: '700' }]}>
                    K65 CNTT
                  </Text>
                </View>
              </View>

              <Text style={[AppTypography.bodyMedium, { color: colors.textSecondary }]}>
                {user.email}
              </Text>

              <View style={styles.schoolRow}>
                <LlIcon name="account_balance" size={14} color={AppColors.tertiary} style={{ marginRight: 4 }} />
                <Text style={[AppTypography.labelSm, { color: AppColors.tertiary, fontWeight: '700' }]}>
                  {user.school}
                </Text>
              </View>
            </View>
          </View>

          {/* Nút Đăng xuất Coral Dịu */}
          <View style={styles.logoutRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogout}
              style={[styles.logoutBtn, { backgroundColor: AppColors.errorContainer }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <LlIcon name="logout" size={16} color={AppColors.onErrorContainer} style={{ marginRight: 6 }} />
                <Text style={[AppTypography.labelMd, { color: AppColors.onErrorContainer, fontWeight: '700' }]}>
                  Đăng xuất tài khoản
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* THẺ 2: GIAO DIỆN & TRẢI NGHIỆM */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.modal,
              borderColor: colors.border,
            },
            AppShadows.card,
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: AppColors.surfaceContainerHigh }]}>
              <LlIcon name="palette" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[AppTypography.headlineSm, { color: colors.text, fontWeight: '700' }]}>
                Giao diện
              </Text>
              <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
                Tùy chỉnh chủ đề hiển thị
              </Text>
            </View>
          </View>

          <View style={styles.themeSelectorGroup}>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700', marginBottom: 8 }]}>
              Chủ đề
            </Text>

            <View style={[styles.themeButtonsGrid, { backgroundColor: AppColors.surfaceContainer }]}>
              {[
                { modeKey: 'light' as const, label: 'Sáng', icon: 'light_mode' as LlIconName, filled: false },
                { modeKey: 'dark' as const, label: 'Tối', icon: 'dark_mode' as LlIconName, filled: true },
                { modeKey: 'system' as const, label: 'Hệ thống', icon: 'contrast' as LlIconName, filled: true },
              ].map((item) => {
                const isActive = mode === item.modeKey;
                return (
                  <TouchableOpacity
                    key={item.modeKey}
                    activeOpacity={0.85}
                    onPress={() => setThemeMode(item.modeKey)}
                    style={[
                      styles.themeBtn,
                      isActive && [
                        styles.themeBtnActive,
                        { backgroundColor: colors.card },
                        AppShadows.card,
                      ],
                    ]}
                  >
                    <LlIcon
                      name={item.icon}
                      size={18}
                      color={isActive ? colors.primary : colors.textSecondary}
                      filled={item.filled}
                      style={{ marginBottom: 2 }}
                    />
                    <Text
                      style={[
                        AppTypography.labelSm,
                        {
                          color: isActive ? colors.primary : colors.textSecondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* THẺ 3: BẢO MẬT & SINH TRẮC HỌC */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.modal,
              borderColor: colors.border,
            },
            AppShadows.card,
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: AppColors.surfaceContainerHigh }]}>
              <LlIcon name="lock" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[AppTypography.headlineSm, { color: colors.text, fontWeight: '700' }]}>
                Bảo mật ứng dụng
              </Text>
              <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
                Bảo vệ tài liệu & bài giảng riêng tư
              </Text>
            </View>
          </View>

          <View style={styles.settingToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[AppTypography.labelLarge, { color: colors.text }]}>
                Khóa FaceID / Vân tay
              </Text>
              <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
                Yêu cầu xác thực khi mở LectureLens
              </Text>
            </View>
            <Switch
              value={appLockEnabled}
              onValueChange={toggleAppLock}
              trackColor={{ false: colors.border, true: AppColors.primaryLight }}
              thumbColor={appLockEnabled ? colors.primary : '#FFFFFF'}
            />
          </View>
        </View>

        {/* THẺ 4: VỀ ỨNG DỤNG LECTURELENS */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.modal,
              borderColor: colors.border,
            },
            AppShadows.card,
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: AppColors.surfaceContainer }]}>
              <LlIcon name="code" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[AppTypography.headlineSm, { color: colors.text, fontWeight: '700' }]}>
                Về ứng dụng
              </Text>
              <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
                Sổ tay thông minh LectureLens
              </Text>
            </View>
          </View>

          <View style={styles.aboutMetaRow}>
            <Text style={[AppTypography.bodyMedium, { color: colors.textSecondary }]}>Phiên bản</Text>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]}>v{AppConstants.appVersion}</Text>
          </View>

          <View style={styles.aboutMetaRow}>
            <Text style={[AppTypography.bodyMedium, { color: colors.textSecondary }]}>Bản quyền</Text>
            <View style={[styles.licenseBadge, { backgroundColor: AppColors.primaryFixed }]}>
              <Text style={[AppTypography.labelSm, { color: AppColors.primary, fontWeight: '700' }]}>
                Mã nguồn mở Apache-2.0
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => Linking.openURL('https://github.com/CThanhDev/LectureLens')}
            style={[styles.githubBtn, { backgroundColor: AppColors.surfaceContainerLow }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LlIcon name="code" size={18} color={colors.text} style={{ marginRight: 8 }} />
              <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]}>
                Đóng góp & Báo lỗi trên GitHub
              </Text>
            </View>
            <LlIcon name="open_in_new" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </DotBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 14,
  },
  sectionCard: {
    padding: 20,
    borderWidth: 1,
    position: 'relative',
  },
  cardTape: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  idChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  logoutRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDE8F5',
    alignItems: 'flex-end',
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  themeSelectorGroup: {
    marginTop: 4,
  },
  themeButtonsGrid: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  themeBtnActive: {},
  settingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  aboutMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  licenseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  githubBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 10,
  },
});
