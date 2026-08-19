import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import type { AuthStackParamList } from '../../navigation/AppNavigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Sign Up'>;

export function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setMessage(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setMessage('Check your email to confirm your account.');
    navigation.navigate('Sign In');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium">Create your account</Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={styles.field}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
          style={styles.field}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {message && <Text style={styles.success}>{message}</Text>}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.field}
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </Button>

        <Text
          variant="bodyMedium"
          style={styles.link}
          onPress={() => navigation.navigate('Sign In')}
        >
          Already have an account? Sign in
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  field: {
    marginTop: 16,
  },
  error: {
    color: '#b3261e',
    marginTop: 8,
  },
  success: {
    color: '#1b5e20',
    marginTop: 8,
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
  },
});
