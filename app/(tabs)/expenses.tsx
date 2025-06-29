import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Text, FAB, Chip, Button, Portal, Modal, TextInput, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/services/AuthContext';
import { getUserProfile } from '@/services/authService';
import { getHouseholdExpenses, createExpense, calculateBalances } from '@/services/expenseService';
import { getHousehold } from '@/services/householdService';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react-native';

export default function ExpensesScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [household, setHousehold] = useState<any>(null);
  const [balances, setBalances] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'food',
    splitType: 'equal' as 'equal' | 'custom',
  });

  const categories = [
    { value: 'food', label: 'Food & Dining' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'rent', label: 'Rent & Housing' },
    { value: 'groceries', label: 'Groceries' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' },
  ];

  const loadData = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      if (profile?.householdId) {
        const [expenseData, householdData] = await Promise.all([
          getHouseholdExpenses(profile.householdId),
          getHousehold(profile.householdId),
        ]);
        setExpenses(expenseData);
        setHousehold(householdData);
        
        if (householdData) {
          const calculatedBalances = calculateBalances(expenseData, householdData.memberIds);
          setBalances(calculatedBalances);
        }
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
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

  const handleCreateExpense = async () => {
    if (!newExpense.title || !newExpense.amount || !household) return;

    try {
      await createExpense({
        title: newExpense.title,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        paidBy: user!.uid,
        householdId: household.id,
        category: newExpense.category,
        date: new Date(),
        splitBetween: household.memberIds,
        splitType: newExpense.splitType,
      });
      
      setShowModal(false);
      setNewExpense({
        title: '',
        description: '',
        amount: '',
        category: 'food',
        splitType: 'equal',
      });
      loadData();
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      food: '🍽️',
      utilities: '⚡',
      rent: '🏠',
      groceries: '🛒',
      entertainment: '🎬',
      other: '💰',
    };
    return icons[category] || '💰';
  };

  const userBalance = balances[user?.uid || '']?.netBalance || 0;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Expenses</Title>
        <Text style={styles.subtitle}>
          Total: ${totalExpenses.toFixed(2)} • Your balance: {userBalance >= 0 ? '+' : ''}${userBalance.toFixed(2)}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Summary */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Your Balance</Title>
            <View style={styles.balanceContainer}>
              {userBalance >= 0 ? (
                <TrendingUp size={24} color="#4CAF50" />
              ) : (
                <TrendingDown size={24} color="#F44336" />
              )}
              <Text style={[
                styles.balanceAmount,
                { color: userBalance >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                ${Math.abs(userBalance).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.balanceText}>
              {userBalance >= 0 
                ? 'You are owed this amount' 
                : 'You owe this amount'
              }
            </Text>
          </Card.Content>
        </Card>

        {/* Recent Expenses */}
        {expenses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <DollarSign size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Add your first shared expense</Text>
            </Card.Content>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} style={styles.expenseCard}>
              <Card.Content>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseTitle}>
                      {getCategoryIcon(expense.category)} {expense.title}
                    </Text>
                    <Text style={styles.expenseDescription}>
                      {expense.description}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>
                    ${expense.amount.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.expenseFooter}>
                  <Chip mode="outlined" compact>
                    {categories.find(c => c.value === expense.category)?.label}
                  </Chip>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.date.seconds * 1000).toLocaleDateString()}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
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
          <Title>Add New Expense</Title>
          
          <TextInput
            label="Expense Title"
            value={newExpense.title}
            onChangeText={(text) => setNewExpense({ ...newExpense, title: text })}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Amount"
            value={newExpense.amount}
            onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
          
          <TextInput
            label="Description (optional)"
            value={newExpense.description}
            onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
            mode="outlined"
            style={styles.input}
          />
          
          <Text style={styles.modalLabel}>Category</Text>
          <SegmentedButtons
            value={newExpense.category}
            onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
            buttons={categories.slice(0, 3).map(cat => ({ value: cat.value, label: cat.label }))}
            style={styles.segmentedButtons}
          />
          
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateExpense}>
              Add Expense
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
  balanceCard: {
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  balanceText: {
    opacity: 0.7,
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
  expenseCard: {
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 16,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseDescription: {
    opacity: 0.7,
    fontSize: 14,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseDate: {
    opacity: 0.5,
    fontSize: 12,
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