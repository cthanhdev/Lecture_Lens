import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');

    if (!fullName.trim()) {
      setNameError('Full name is required');
      valid = false;
    }

    if (!email.trim() || !email.includes('@')) {
      setEmailError('Please enter a valid university email');
      valid = false;
    }

    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await signUp(fullName, email, password);
    } catch {
      Alert.alert('Sign Up Failed', 'Could not create account. Please try again.');
    }
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
          Create an account to start transcribing lectures and building smart study decks.
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Full Name"
          placeholder="e.g. Minh Nguyen"
          value={fullName}
          onChangeText={(t) => {
            setFullName(t);
            if (nameError) setNameError('');
          }}
          error={nameError}
          leftIcon={<Feather name="user" size={18} color={colors.text.muted} />}
        />

        <TextField
          label="University Email"
          placeholder="minh.nguyen@lecturelens.edu.vn"
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
          placeholder="At least 6 characters"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (passwordError) setPasswordError('');
          }}
          error={passwordError}
          isPassword
          leftIcon={<Feather name="lock" size={18} color={colors.text.muted} />}
        />

        <TextField
          label="Confirm Password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          leftIcon={<Feather name="check" size={18} color={colors.text.muted} />}
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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('SignIn')}
        >
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
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.xs,
    lineHeight: 20,
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
    paddingBottom: spacing.lg,
  },
});
