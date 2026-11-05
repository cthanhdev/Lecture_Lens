import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, Button, TextField, Divider, GlassCard } from '../../shared/ui';
import { useAuth } from '../../core/auth';

export function SignInScreen() {
  const navigation = useNavigation<any>();
  const { signIn, signInAsGuest, isLoading } = useAuth();
  const [email, setEmail] = useState('minh.nguyen@lecturelens.edu.vn');
  const [password, setPassword] = useState('123456');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('University email is required');
      valid = false;
    } else if (!email.includes('@')) {
      setEmailError('Please enter a valid university email');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await signIn(email, password);
    } catch {
      Alert.alert('Sign In Failed', 'Invalid credentials. Please try again.');
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAsGuest();
    } catch {
      Alert.alert('Demo Error', 'Could not start guest session.');
    }
  };

  return (
    <Screen
      scrollable
      header={<AppHeader variant="detail" title="Sign In" showBack={false} />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Feather name="shield" size={24} color={colors.brand.primary} />
        </View>
        <Text variant="h1" color="primary">
          Welcome back
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Sign in with your university account to access notes & flashcard decks.
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="University Email"
          placeholder="your.name@lecturelens.edu.vn"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (emailError) setEmailError('');
          }}
          error={emailError}
          leftIcon={<Feather name="mail" size={18} color={colors.text.muted} />}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextField
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(p) => {
            setPassword(p);
            if (passwordError) setPasswordError('');
          }}
          error={passwordError}
          isPassword
          leftIcon={<Feather name="lock" size={18} color={colors.text.muted} />}
        />

        <Button
          title="Sign In"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleLogin}
          style={styles.submitBtn}
        />

        {/* Quick Demo Switcher */}
        <View style={styles.dividerRow}>
          <Divider style={styles.flexDivider} />
          <Text variant="caption" color="muted" style={styles.dividerText}>
            OR DEMO INSTANTLY
          </Text>
          <Divider style={styles.flexDivider} />
        </View>

        <GlassCard
          variant="frosted"
          padding="base"
          style={styles.demoCard}
          onPress={handleGuestLogin}
        >
          <View style={styles.demoLeft}>
            <View style={styles.demoIconBox}>
              <Feather name="zap" size={18} color={colors.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="title" style={{ fontSize: 14 }}>
                Instant Student Guest Mode
              </Text>
              <Text variant="caption" color="muted">
                Explore all 27 screens with preloaded mock lectures
              </Text>
            </View>
          </View>
          <Feather name="arrow-right" size={16} color={colors.brand.primary} />
        </GlassCard>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySm" color="secondary">
          Don&apos;t have an account?{' '}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CreateAccount')}
        >
          <Text variant="bodySemibold" color="coralDeep">
            Create account
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  subtitle: {
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  form: {
    marginBottom: spacing.xxl,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  flexDivider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontWeight: '700',
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  demoIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
});
