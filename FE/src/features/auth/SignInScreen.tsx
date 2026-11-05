import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, Button, TextField, Divider } from '../../shared/ui';
import { useAuth } from '../../core/auth';

export function SignInScreen() {
  const navigation = useNavigation<any>();
  const { signIn, signInAsGuest, isLoading } = useAuth();
  const [email, setEmail] = useState('minh.nguyen@lecturelens.edu.vn');
  const [password, setPassword] = useState('123456');

  const handleLogin = async () => {
    await signIn(email, password);
  };

  const handleGuestLogin = async () => {
    await signInAsGuest();
  };

  return (
    <Screen
      scrollable
      header={<AppHeader variant="detail" title="Sign In" showBack={false} />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text variant="h1" color="primary">
          Welcome back
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Sign in to access your lecture notes & study decks
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="University Email"
          placeholder="your.name@lecturelens.edu.vn"
          value={email}
          onChangeText={setEmail}
          leftIcon={<Feather name="mail" size={18} color={colors.text.muted} />}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextField
          label="Password"
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
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

        <View style={styles.dividerRow}>
          <Divider style={styles.flexDivider} />
          <Text variant="caption" color="muted" style={styles.dividerText}>
            OR DEMO INSTANTLY
          </Text>
          <Divider style={styles.flexDivider} />
        </View>

        <Button
          title="Continue as Student Guest"
          variant="glass"
          size="md"
          fullWidth
          onPress={handleGuestLogin}
          icon={<Feather name="user-check" size={18} color={colors.text.primary} />}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="bodySm" color="secondary">
          Don&apos;t have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateAccount')}>
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
    marginBottom: spacing.xxl,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  form: {
    marginBottom: spacing.xxl,
  },
  submitBtn: {
    marginTop: spacing.md,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
