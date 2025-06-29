import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { Card, Title, Text, FAB, ProgressBar, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/services/AuthContext';
import { getUserProfile } from '@/services/authService';
import { getHousehold } from '@/services/householdService';
import { getHouseholdChores } from '@/services/choreService';
import { getHouseholdExpenses, calculateBalances } from '@/services/expenseService';
import { SquareCheck as CheckSquare, DollarSign, Users, TrendingUp, TriangleAlert as AlertTriangle, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [chores, setChores] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);

      if (profile?.householdId) {
        const [householdData, choreData, expenseData] = await Promise.all([
          getHousehold(profile.householdId),
          getHouseholdChores(profile.householdId),
          getHouseholdExpenses(profile.householdId),
        ]);

        setHousehold(householdData);
        setChores(choreData);
        setExpenses(expenseData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  if (!household) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#2196F3', '#21CBF3']}
          style={styles.noHouseholdGradient}
        >
          <View style={styles.noHouseholdContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' }}
              style={styles.noHouseholdLogo}
            />
            <Title style={styles.noHouseholdTitle}>Welcome to RoomSync!</Title>
            <Text style={styles.noHouseholdText}>
              You haven't joined a household yet. Create one or join an existing household to get started.
            </Text>
            <Button 
              mode="contained" 
              onPress={() => {}}
              style={styles.noHouseholdButton}
              buttonColor="white"
              textColor="#2196F3"
            >
              Setup Household
            </Button>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const pendingChores = chores.filter(chore => !chore.completed);
  const userChores = chores.filter(chore => chore.assignedTo === user?.uid && !chore.completed);
  const overdueChores = chores.filter(chore => 
    !chore.completed && new Date(chore.dueDate.seconds * 1000) < new Date()
  );

  const choreCompletionRate = chores.length > 0 
    ? (chores.filter(chore => chore.completed).length / chores.length) * 100 
    : 0;

  const balances = household ? calculateBalances(expenses, household.memberIds) : {};
  const userBalance = balances[user?.uid || '']?.netBalance || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={['#2196F3', '#21CBF3']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>Good morning,</Text>
            <Title style={styles.userName}>{user?.displayName}!</Title>
            <Text style={styles.householdName}>{household.name}</Text>
          </View>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, styles.primaryCard]}>
            <Card.Content style={styles.statContent}>
              <CheckSquare color="#2196F3" size={28} />
              <Text style={styles.statNumber}>{userChores.length}</Text>
              <Text style={styles.statLabel}>My Chores</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, styles.successCard]}>
            <Card.Content style={styles.statContent}>
              <DollarSign color="#009688" size={28} />
              <Text style={[styles.statNumber, { color: userBalance >= 0 ? '#009688' : '#F44336' }]}>
                ${Math.abs(userBalance).toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>
                {userBalance >= 0 ? 'Owed' : 'Owes'}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, styles.warningCard]}>
            <Card.Content style={styles.statContent}>
              <Users color="#FF9800" size={28} />
              <Text style={styles.statNumber}>{household.memberIds.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, styles.infoCard]}>
            <Card.Content style={styles.statContent}>
              <TrendingUp color="#4CAF50" size={28} />
              <Text style={styles.statNumber}>{choreCompletionRate.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.progressCard}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <Title style={styles.cardTitle}>Household Health</Title>
              <Chip 
                mode="outlined" 
                style={[styles.healthChip, choreCompletionRate >= 80 ? styles.healthGood : choreCompletionRate >= 60 ? styles.healthOk : styles.healthPoor]}
              >
                {choreCompletionRate >= 80 ? 'Excellent' : choreCompletionRate >= 60 ? 'Good' : 'Needs Work'}
              </Chip>
            </View>
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Chore Completion Rate</Text>
              <ProgressBar 
                progress={choreCompletionRate / 100} 
                color={choreCompletionRate >= 80 ? '#4CAF50' : choreCompletionRate >= 60 ? '#FF9800' : '#F44336'}
                style={styles.progressBar} 
              />
              <Text style={styles.progressText}>{choreCompletionRate.toFixed(0)}% completed this week</Text>
            </View>
          </Card.Content>
        </Card>

        {overdueChores.length > 0 && (
          <Card style={[styles.card, styles.alertCard]}>
            <Card.Content>
              <View style={styles.alertHeader}>
                <AlertTriangle size={24} color="#F57C00" />
                <Title style={styles.alertTitle}>Overdue Chores</Title>
              </View>
              <Text style={styles.alertText}>
                {overdueChores.length} chore{overdueChores.length > 1 ? 's are' : ' is'} overdue and need{overdueChores.length === 1 ? 's' : ''} attention!
              </Text>
              <View style={styles.overdueList}>
                {overdueChores.slice(0, 3).map((chore) => (
                  <View key={chore.id} style={styles.overdueItem}>
                    <Clock size={16} color="#F57C00" />
                    <Text style={styles.overdueText}>{chore.title}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            <View style={styles.quickActions}>
              <Button 
                mode="outlined" 
                icon="plus" 
                style={styles.quickActionButton}
                onPress={() => {}}
              >
                Add Chore
              </Button>
              <Button 
                mode="outlined" 
                icon="cash" 
                style={styles.quickActionButton}
                onPress={() => {}}
              >
                Add Expense
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {}}
        label="Quick Add"
      />
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
  noHouseholdGradient: {
    flex: 1,
  },
  noHouseholdContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noHouseholdLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 24,
  },
  noHouseholdTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noHouseholdText: {
    textAlign: 'center',
    marginVertical: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    lineHeight: 24,
  },
  noHouseholdButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  userName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  householdName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: -16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    elevation: 4,
  },
  primaryCard: {
    backgroundColor: '#E3F2FD',
  },
  successCard: {
    backgroundColor: '#E0F2F1',
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
  },
  infoCard: {
    backgroundColor: '#E8F5E8',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: '500',
  },
  card: {
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    elevation: 2,
  },
  progressCard: {
    margin: 16,
    marginTop: 24,
    borderRadius: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '600',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthChip: {
    height: 28,
  },
  healthGood: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  healthOk: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  healthPoor: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    marginVertical: 8,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
  },
  alertCard: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    color: '#F57C00',
    marginLeft: 8,
    fontSize: 18,
  },
  alertText: {
    marginBottom: 12,
    lineHeight: 20,
  },
  overdueList: {
    gap: 8,
  },
  overdueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  overdueText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});