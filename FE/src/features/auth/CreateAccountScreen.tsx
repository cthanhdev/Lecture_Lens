import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, Button, TextField } from '../../shared/ui';
import { useAuth } from '../../core/auth';

export function CreateAccountScreen() {
  const navigation = useNavigation<any>();
  const { signUp, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    await signUp(fullName || 'Minh Nguyen', email || 'minh@lecturelens.edu.vn', password || '123456');
  };

  return (
    <Screen
      scrollable
      header={<AppHeader variant="detail" title="Create Account" />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text variant="h1" color="primary">
          Join LectureLens
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Transform your lectures into AI summaries and flashcards
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Full Name"
          placeholder="Minh Nguyen"
          value={fullName}
          onChangeText={setFullName}
          leftIcon={<Feather name="user" size={18} color={colors.text.muted} />}
        />

        <TextField
          label="University Email"
          placeholder="minh.nguyen@lecturelens.edu.vn"
          value={email}
          onChangeText={setEmail}
          leftIcon={<Feather name="mail" size={18} color={colors.text.muted} />}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextField
          label="Password"
          placeholder="Create password"
          value={password}
          onChangeText={setPassword}
          isPassword
          leftIcon={<Feather name="lock" size={18} color={colors.text.muted} />}
        />

        <Button
          title="Create Account"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleRegister}
          style={styles.submitBtn}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="bodySm" color="secondary">
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text variant="bodySemibold" color="coralDeep">
            Sign In
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
