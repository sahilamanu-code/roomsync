import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/services/AuthContext';
import { getUserProfile } from '@/services/authService';
import { getHouseholdChores } from '@/services/choreService';
import { getHouseholdExpenses } from '@/services/expenseService';
import { Calendar as CalendarIcon, Clock, DollarSign } from 'lucide-react-native';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'chore' | 'expense';
  date: Date;
  priority?: string;
  amount?: number;
  completed?: boolean;
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      if (profile?.householdId) {
        const [chores, expenses] = await Promise.all([
          getHouseholdChores(profile.householdId),
          getHouseholdExpenses(profile.householdId),
        ]);

        const choreEvents: CalendarEvent[] = chores
          .filter(chore => !chore.completed)
          .map(chore => ({
            id: chore.id,
            title: chore.title,
            type: 'chore',
            date: new Date(chore.dueDate.seconds * 1000),
            priority: chore.priority,
            completed: chore.completed,
          }));

        const expenseEvents: CalendarEvent[] = expenses
          .slice(0, 10) // Show recent expenses
          .map(expense => ({
            id: expense.id,
            title: expense.title,
            type: 'expense',
            date: new Date(expense.date.seconds * 1000),
            amount: expense.amount,
          }));

        const allEvents = [...choreEvents, ...expenseEvents]
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        setEvents(allEvents);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
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

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      const dateKey = event.date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const isOverdue = (date: Date) => {
    return date < new Date() && !isToday(date);
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isOverdue(date)) return `Overdue - ${date.toLocaleDateString()}`;
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const groupedEvents = groupEventsByDate(events);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Calendar</Title>
        <Text style={styles.subtitle}>
          Upcoming chores and recent expenses
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.keys(groupedEvents).length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <CalendarIcon size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>No upcoming events</Text>
              <Text style={styles.emptySubtext}>All caught up!</Text>
            </Card.Content>
          </Card>
        ) : (
          Object.entries(groupedEvents).map(([dateString, dayEvents]) => (
            <View key={dateString} style={styles.daySection}>
              <Text style={[
                styles.dateHeader,
                isOverdue(new Date(dateString)) && styles.overdueHeader
              ]}>
                {formatDateHeader(dateString)}
              </Text>
              
              {dayEvents.map(event => (
                <Card key={event.id} style={styles.eventCard}>
                  <Card.Content>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventInfo}>
                        <View style={styles.eventTitleRow}>
                          {event.type === 'chore' ? (
                            <Clock size={16} color="#2196F3" />
                          ) : (
                            <DollarSign size={16} color="#009688" />
                          )}
                          <Text style={styles.eventTitle}>{event.title}</Text>
                        </View>
                        
                        <View style={styles.eventMeta}>
                          <Chip
                            mode="outlined"
                            compact
                            style={[
                              styles.typeChip,
                              event.type === 'chore' 
                                ? styles.choreChip 
                                : styles.expenseChip
                            ]}
                          >
                            {event.type === 'chore' ? 'Chore' : 'Expense'}
                          </Chip>
                          
                          {event.priority && (
                            <Chip
                              mode="outlined"
                              compact
                              style={[
                                styles.priorityChip,
                                { borderColor: getPriorityColor(event.priority) }
                              ]}
                              textStyle={{ color: getPriorityColor(event.priority) }}
                            >
                              {event.priority}
                            </Chip>
                          )}
                          
                          {event.amount && (
                            <Text style={styles.amount}>
                              ${event.amount.toFixed(2)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>
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
  daySection: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
    color: '#2196F3',
  },
  overdueHeader: {
    color: '#F44336',
  },
  eventCard: {
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    height: 24,
  },
  choreChip: {
    borderColor: '#2196F3',
  },
  expenseChip: {
    borderColor: '#009688',
  },
  priorityChip: {
    height: 24,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#009688',
  },
});