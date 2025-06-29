import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Text, Button, List, Divider, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/services/AuthContext';
import { getUserProfile } from '@/services/authService';
import { getHousehold } from '@/services/householdService';
import { logOut } from '@/services/authService';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import { Settings as SettingsIcon, Users, Bell, LogOut, Share } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);

      if (profile?.householdId) {
        const householdData = await getHousehold(profile.householdId);
        setHousehold(householdData);
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => logOut()
        },
      ]
    );
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          // Store token in user profile or send to server
          console.log('Push notification token:', token);
        }
      } catch (error) {
        console.error('Error enabling notifications:', error);
        setNotificationsEnabled(false);
      }
    }
  };

  const shareInviteCode = () => {
    if (household?.inviteCode) {
      Alert.alert(
        'Invite Code',
        `Share this code with family members to join your household:\n\n${household.inviteCode}`,
        [
          { text: 'OK' }
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Settings</Title>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Profile</Title>
            <List.Item
              title={user?.displayName || 'User'}
              description={user?.email}
              left={(props) => <Users {...props} color="#2196F3" />}
            />
          </Card.Content>
        </Card>

        {/* Household Section */}
        {household && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Household</Title>
              <List.Item
                title={household.name}
                description={`${household.memberIds.length} members`}
                left={(props) => <Users {...props} color="#009688" />}
              />
              <Divider style={styles.divider} />
              <List.Item
                title="Share Invite Code"
                description="Invite new members to your household"
                left={(props) => <Share {...props} color="#FF9800" />}
                right={(props) => (
                  <Button mode="outlined" onPress={shareInviteCode}>
                    Share
                  </Button>
                )}
              />
            </Card.Content>
          </Card>
        )}

        {/* Notifications Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Notifications</Title>
            <List.Item
              title="Push Notifications"
              description="Get notified about chores and expenses"
              left={(props) => <Bell {...props} color="#4CAF50" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* App Info Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>About</Title>
            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => <SettingsIcon {...props} color="#757575" />}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Help & Support"
              description="Get help with RoomSync"
              onPress={() => {}}
            />
          </Card.Content>
        </Card>

        {/* Sign Out Section */}
        <Card style={[styles.card, styles.signOutCard]}>
          <Card.Content>
            <List.Item
              title="Sign Out"
              description="Sign out of your account"
              left={(props) => <LogOut {...props} color="#F44336" />}
              onPress={handleLogout}
              titleStyle={{ color: '#F44336' }}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  signOutCard: {
    marginBottom: 32,
  },
});