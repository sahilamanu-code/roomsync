import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Text, FAB, Chip, Button, Portal, Modal, TextInput, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/services/AuthContext';
import { getUserProfile } from '@/services/authService';
import { getHouseholdChores, createChore, completeChore } from '@/services/choreService';
import { getHousehold } from '@/services/householdService';
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react-native';

export default function ChoresScreen() {
  const { user } = useAuth();
  const [chores, setChores] = useState<any[]>([]);
  const [household, setHousehold] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newChore, setNewChore] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: new Date(),
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const loadData = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      if (profile?.householdId) {
        const [choreData, householdData] = await Promise.all([
          getHouseholdChores(profile.householdId),
          getHousehold(profile.householdId),
        ]);
        setChores(choreData);
        setHousehold(householdData);
      }
    } catch (error) {
      console.error('Error loading chores:', error);
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

  const handleCompleteChore = async (choreId: string) => {
    try {
      await completeChore(choreId, user!.uid);
      loadData();
    } catch (error) {
      console.error('Error completing chore:', error);
    }
  };

  const handleCreateChore = async () => {
    if (!newChore.title || !household) return;

    try {
      await createChore({
        ...newChore,
        assignedBy: user!.uid,
        householdId: household.id,
        assignedTo: newChore.assignedTo || user!.uid,
        recurring: false,
      });
      setShowModal(false);
      setNewChore({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: new Date(),
        priority: 'medium',
      });
      loadData();
    } catch (error) {
      console.error('Error creating chore:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const isOverdue = (dueDate: any) => {
    const due = new Date(dueDate.seconds * 1000);
    return due < new Date();
  };

  const pendingChores = chores.filter(chore => !chore.completed);
  const completedChores = chores.filter(chore => chore.completed);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Chores</Title>
        <Text style={styles.subtitle}>
          {pendingChores.length} pending • {completedChores.length} completed
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pendingChores.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <CheckSquare size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>No pending chores!</Text>
              <Text style={styles.emptySubtext}>Everyone's caught up 🎉</Text>
            </Card.Content>
          </Card>
        ) : (
          pendingChores.map((chore) => (
            <Card key={chore.id} style={styles.choreCard}>
              <Card.Content>
                <View style={styles.choreHeader}>
                  <Text style={styles.choreTitle}>{chore.title}</Text>
                  <Chip
                    mode="outlined"
                    style={[styles.priorityChip, { borderColor: getPriorityColor(chore.priority) }]}
                    textStyle={{ color: getPriorityColor(chore.priority) }}
                  >
                    {chore.priority}
                  </Chip>
                </View>
                
                {chore.description && (
                  <Text style={styles.choreDescription}>{chore.description}</Text>
                )}
                
                <View style={styles.choreFooter}>
                  <View style={styles.choreInfo}>
                    {isOverdue(chore.dueDate) ? (
                      <View style={styles.overdueContainer}>
                        <AlertTriangle size={16} color="#F44336" />
                        <Text style={styles.overdueText}>Overdue</Text>
                      </View>
                    ) : (
                      <View style={styles.dueDateContainer}>
                        <Clock size={16} color="#757575" />
                        <Text style={styles.dueDateText}>
                          Due {new Date(chore.dueDate.seconds * 1000).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {chore.assignedTo === user?.uid && (
                    <Button
                      mode="contained"
                      onPress={() => handleCompleteChore(chore.id)}
                      style={styles.completeButton}
                    >
                      Mark Done
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        {completedChores.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recently Completed</Text>
            {completedChores.slice(0, 3).map((chore) => (
              <Card key={chore.id} style={[styles.choreCard, styles.completedCard]}>
                <Card.Content>
                  <Text style={[styles.choreTitle, styles.completedTitle]}>{chore.title}</Text>
                  <Text style={styles.completedText}>
                    Completed {new Date(chore.completedAt.seconds * 1000).toLocaleDateString()}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowModal(true)}
      />

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>Add New Chore</Title>
          
          <TextInput
            label="Chore Title"
            value={newChore.title}
            onChangeText={(text) => setNewChore({ ...newChore, title: text })}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Description (optional)"
            value={newChore.description}
            onChangeText={(text) => setNewChore({ ...newChore, description: text })}
            mode="outlined"
            multiline
            style={styles.input}
          />
          
          <Text style={styles.modalLabel}>Priority</Text>
          <SegmentedButtons
            value={newChore.priority}
            onValueChange={(value) => setNewChore({ ...newChore, priority: value as any })}
            buttons={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
            style={styles.segmentedButtons}
          />
          
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateChore}>
              Create Chore
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    opacity: 0.7,
    marginTop: 4,
  },
  choreCard: {
    marginBottom: 12,
  },
  completedCard: {
    opacity: 0.7,
  },
  choreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  priorityChip: {
    height: 28,
  },
  choreDescription: {
    opacity: 0.7,
    marginBottom: 12,
  },
  choreFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  choreInfo: {
    flex: 1,
  },
  overdueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueText: {
    color: '#F44336',
    marginLeft: 4,
    fontWeight: '600',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    color: '#757575',
    marginLeft: 4,
  },
  completeButton: {
    marginLeft: 16,
  },
  completedText: {
    opacity: 0.5,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});