import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Title, Text, Snackbar, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { signIn } from '@/services/authService';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
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
              <Title style={styles.title}>Welcome to RoomSync</Title>
              <Text style={styles.subtitle}>Manage your household with ease</Text>
            </View>

            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
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

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  Sign In
                </Button>

                <Link href="/(auth)/signup" asChild>
                  <Button mode="text" style={styles.linkButton}>
                    Don't have an account? Sign up
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