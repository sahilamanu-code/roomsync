import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { TextInput, Button, Title, Text, Card, Snackbar, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/services/AuthContext';
import { createHousehold, joinHousehold } from '@/services/householdService';
import { LinearGradient } from 'expo-linear-gradient';
import { Chrome as Home, Users } from 'lucide-react-native';

export default function HouseholdSetupScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState('create');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      setError('Please enter a household name');
      return;
    }

    setLoading(true);
    try {
      await createHousehold(householdName, user!.uid);
      router.replace('/(tabs)');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      await joinHousehold(inviteCode.toUpperCase(), user!.uid);
      router.replace('/(tabs)');
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
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' }}
              style={styles.logo}
            />
            <Title style={styles.title}>Setup Your Household</Title>
            <Text style={styles.subtitle}>
              Create a new household or join an existing one
            </Text>
          </View>

          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <SegmentedButtons
                value={mode}
                onValueChange={setMode}
                buttons={[
                  { 
                    value: 'create', 
                    label: 'Create New',
                    icon: () => <Home size={16} color="#2196F3" />
                  },
                  { 
                    value: 'join', 
                    label: 'Join Existing',
                    icon: () => <Users size={16} color="#2196F3" />
                  },
                ]}
                style={styles.segmentedButtons}
              />

              {mode === 'create' ? (
                <View style={styles.modeContent}>
                  <Text style={styles.modeTitle}>Create New Household</Text>
                  <Text style={styles.modeDescription}>
                    Start fresh with your own household and invite others to join
                  </Text>
                  <TextInput
                    label="Household Name"
                    value={householdName}
                    onChangeText={setHouseholdName}
                    mode="outlined"
                    placeholder="e.g., The Smith Family"
                    style={styles.input}
                    left={<TextInput.Icon icon="home" />}
                  />
                  <Button
                    mode="contained"
                    onPress={handleCreateHousehold}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                  >
                    Create Household
                  </Button>
                </View>
              ) : (
                <View style={styles.modeContent}>
                  <Text style={styles.modeTitle}>Join Existing Household</Text>
                  <Text style={styles.modeDescription}>
                    Enter the invite code shared by a household member
                  </Text>
                  <TextInput
                    label="Invite Code"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    mode="outlined"
                    placeholder="e.g., ABC123"
                    autoCapitalize="characters"
                    style={styles.input}
                    left={<TextInput.Icon icon="ticket" />}
                  />
                  <Button
                    mode="contained"
                    onPress={handleJoinHousehold}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                  >
                    Join Household
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>

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
  segmentedButtons: {
    marginBottom: 24,
  },
  modeContent: {
    alignItems: 'stretch',
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modeDescription: {
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    marginBottom: 24,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  snackbar: {
    backgroundColor: '#F44336',
  },
});