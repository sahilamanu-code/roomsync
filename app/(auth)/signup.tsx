import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Title, Text, Snackbar, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { signUp } from '@/services/authService';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, displayName);
      router.replace('/(auth)/household-setup');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#2196F3', '#21CBF3']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' }}
                style={styles.logo}
              />
              <Title style={styles.title}>Join RoomSync</Title>
              <Text style={styles.subtitle}>Create your account to get started</Text>
            </View>

            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <TextInput
                  label="Full Name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="account" />}
                />

                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                />

                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  left={<TextInput.Icon icon="lock-check" />}
                />

                <Button
                  mode="contained"
                  onPress={handleSignup}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  Create Account
                </Button>

                <Link href="/(auth)/login" asChild>
                  <Button mode="text" style={styles.linkButton}>
                    Already have an account? Sign in
                  </Button>
                </Link>
              </Card.Content>
            </Card>
          </View>
        </KeyboardAvoidingView>

        <Snackbar
          visible={!!error}
          onDismiss={() => setError('')}
          duration={4000}
          style={styles.snackbar}
        >
          {error}
        </Snackbar>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  card: {
    borderRadius: 16,
    elevation: 8,
  },
  cardContent: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 8,
  },
  snackbar: {
    backgroundColor: '#F44336',
  },
});