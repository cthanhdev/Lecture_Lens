import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { AppColors } from '../../core/theme/colors';
import { AppTypography } from '../../core/theme/typography';
import { AppShadows } from '../../core/theme/layout';
import { DotBackground } from '../../shared/widgets/DotBackground';
import { CuMeoWidget } from '../../shared/widgets/mascot/CuMeoWidget';
import { WashiTapeAccent } from '../../shared/widgets/washi_tape/WashiTapeAccent';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { LlIcon } from '../../shared/widgets/icons/LlIcon';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('minh.nguyen@hust.edu.vn');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { colors, borderRadius } = useAppTheme();
  const login = useAuthStore((state) => state.login);

  const handleLogin = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg('Vui lòng nhập email sinh viên!');
      return;
    }
    if (!trimmed.endsWith('.edu.vn')) {
      setErrorMsg('Email phải có định dạng trường học (.edu.vn)!');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu của bạn!');
      return;
    }

    setErrorMsg('');
    login();
    navigation.replace('MainTabs', { screen: 'Library' });
  };

  return (
    <DotBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
        {/* Mascot Greeting Area */}
        <View style={styles.mascotArea}>
          <View style={styles.cloudMascotWrapper}>
            <View style={styles.cloudBase} />
            <CuMeoWidget variant="happy" size={135} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <Text style={[AppTypography.headlineMd, styles.welcomeTitle, { color: colors.text, marginTop: 0 }]}>
              Mừng bạn quay lại!
            </Text>
            <LlIcon name="auto_awesome" size={20} color="#E5A800" filled />
          </View>
          <Text style={[AppTypography.bodyMedium, styles.welcomeSub, { color: colors.textSecondary }]}>
            Cùng ôn tập và khám phá bài giảng hôm nay nhé.
          </Text>
        </View>

        {/* Notebook Card Form */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.modal,
              borderColor: colors.border,
            },
            AppShadows.card,
          ]}
        >
          {/* Washi Tape */}
          <View style={styles.tapeAnchor}>
            <WashiTapeAccent color="sakura" width={56} height={12} rotation="-1deg" />
          </View>

          {/* Email field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]}>
                Email sinh viên
              </Text>
              <Text style={[AppTypography.labelSm, { color: AppColors.primary }]}>
                Đuôi .edu.vn
              </Text>
            </View>

            <View style={[styles.inputBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <View style={styles.iconWrap}>
                <LlIcon name="mail" size={18} color={colors.textSecondary} />
              </View>
              <TextInput
                style={[AppTypography.bodyMedium, styles.textInput, { color: colors.text }]}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMsg) setErrorMsg('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="vidu@daihoc.edu.vn"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Error Message Box */}
          {errorMsg ? (
            <View style={[styles.errorBox, { backgroundColor: AppColors.errorContainer }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <LlIcon name="error" size={14} color={AppColors.onErrorContainer} />
                <Text style={[AppTypography.bodySmall, { color: AppColors.onErrorContainer, fontWeight: '600' }]}>
                  {errorMsg}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Password field */}
          <View style={styles.inputGroup}>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]}>
              Mật khẩu
            </Text>

            <View style={[styles.inputBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <View style={styles.iconWrap}>
                <LlIcon name="lock" size={18} color={colors.textSecondary} />
              </View>
              <TextInput
                style={[AppTypography.bodyMedium, styles.textInput, { color: colors.text }]}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMsg) setErrorMsg('');
                }}
                secureTextEntry={!showPassword}
                placeholder="Nhập mật khẩu của bạn"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <LlIcon name="visibility" size={18} color={colors.textSecondary} filled={showPassword} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassBtn}>
              <Text style={[AppTypography.labelSm, { color: colors.primary, textAlign: 'right' }]}>
                Quên mật khẩu?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Submit CTA */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleLogin}
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primaryContainer },
              AppShadows.buttonPrimary,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={[AppTypography.labelLarge, { color: '#FFFFFF', fontWeight: '700' }]}>
                Đăng nhập
              </Text>
              <LlIcon name="arrow_forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Switch to Register */}
          <View style={styles.switchRow}>
            <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
              Chưa có tài khoản?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[AppTypography.labelSm, { color: AppColors.primary, fontWeight: '700' }]}>
                Đăng ký ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </DotBackground>
  );
};

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [name, setName] = useState('Nguyễn Nhật Minh');
  const [school, setSchool] = useState('ĐH Bách Khoa Hà Nội');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { colors, borderRadius } = useAppTheme();
  const login = useAuthStore((state) => state.login);

  const handleRegister = () => {
    login();
    navigation.replace('MainTabs', { screen: 'Library' });
  };

  return (
    <DotBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
        <View style={styles.mascotArea}>
          <CuMeoWidget variant="star_eyes" size={110} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <Text style={[AppTypography.headlineMd, styles.welcomeTitle, { color: colors.text, marginTop: 0 }]}>
              Ghi danh tài khoản mới
            </Text>
            <LlIcon name="auto_awesome" size={20} color="#E5A800" filled />
          </View>
          <Text style={[AppTypography.bodyMedium, styles.welcomeSub, { color: colors.textSecondary }]}>
            Tham gia giảng đường cùng trợ lý Cú Mèo AI
          </Text>
        </View>

        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.modal,
              borderColor: colors.border,
            },
            AppShadows.card,
          ]}
        >
          <View style={styles.tapeAnchor}>
            <WashiTapeAccent color="mint" width={56} height={12} rotation="1deg" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]}>
              Họ và tên sinh viên
            </Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <View style={styles.iconWrap}>
                <LlIcon name="person" size={18} color={colors.textSecondary} />
              </View>
              <TextInput
                style={[AppTypography.bodyMedium, styles.textInput, { color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Nhập họ và tên"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]}>
              Trường đại học / Học viện
            </Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <View style={styles.iconWrap}>
                <LlIcon name="account_balance" size={18} color={colors.textSecondary} />
              </View>
              <TextInput
                style={[AppTypography.bodyMedium, styles.textInput, { color: colors.text }]}
                value={school}
                onChangeText={setSchool}
                placeholder="Ví dụ: ĐH Bách Khoa"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]}>
              Email (.edu.vn)
            </Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <View style={styles.iconWrap}>
                <LlIcon name="mail" size={18} color={colors.textSecondary} />
              </View>
              <TextInput
                style={[AppTypography.bodyMedium, styles.textInput, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="minh.nguyen@hust.edu.vn"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]}>
              Mật khẩu
            </Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <View style={styles.iconWrap}>
                <LlIcon name="lock" size={18} color={colors.textSecondary} />
              </View>
              <TextInput
                style={[AppTypography.bodyMedium, styles.textInput, { color: colors.text }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleRegister}
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primaryContainer },
              AppShadows.buttonPrimary,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={[AppTypography.labelLarge, { color: '#FFFFFF', fontWeight: '700' }]}>
                Tạo tài khoản học tập
              </Text>
              <LlIcon name="arrow_forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
              Đã có tài khoản?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[AppTypography.labelSm, { color: AppColors.primary, fontWeight: '700' }]}>
                Đăng nhập ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </DotBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  mascotArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cloudMascotWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
  },
  cloudBase: {
    position: 'absolute',
    bottom: 0,
    width: 140,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE4FF',
    opacity: 0.7,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginTop: 8,
  },
  welcomeSub: {
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 270,
  },
  formCard: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderWidth: 1,
  },
  tapeAnchor: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EDE8F5',
  },
  fieldIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  iconWrap: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  errorBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  forgotPassBtn: {
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  submitBtn: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
});
