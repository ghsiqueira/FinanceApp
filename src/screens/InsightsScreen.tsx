// src/screens/InsightsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionContext';
import { useCategories } from '../context/CategoryContext';
import { useGoals } from '../context/GoalContext';
import AIInsightsService, { FinancialInsight } from '../services/aiInsightsService';

const InsightsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { goals } = useGoals();
  
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [transactions, categories, goals]);

  const loadInsights = async () => {
    if (transactions.length === 0) return;
    
    setLoading(true);
    try {
      const generatedInsights = await AIInsightsService.generateInsights(
        transactions,
        categories,
        goals
      );
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'spending_pattern': return 'chart-line';
      case 'saving_opportunity': return 'piggy-bank';
      case 'budget_warning': return 'alert-circle';
      case 'goal_suggestion': return 'flag';
      case 'trend_analysis': return 'trending-up';
      default: return 'lightbulb';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return theme.error;
      case 'medium': return theme.warning;
      case 'low': return theme.info;
      default: return theme.textSecondary;
    }
  };

  const renderInsightCard = (insight: FinancialInsight) => (
    <View key={insight.id} style={[styles.insightCard, { backgroundColor: theme.card }]}>
      <View style={styles.insightHeader}>
        <View style={styles.insightIconContainer}>
          <Icon 
            name={getInsightIcon(insight.type)} 
            size={24} 
            color={getImpactColor(insight.impact)} 
          />
          <View style={[
            styles.impactBadge,
            { backgroundColor: getImpactColor(insight.impact) + '20' }
          ]}>
            <Text style={[
              styles.impactText,
              { color: getImpactColor(insight.impact) }
            ]}>
              {insight.impact === 'high' ? 'Alta' : 
               insight.impact === 'medium' ? 'Média' : 'Baixa'}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.insightTitle, { color: theme.text }]}>
        {insight.title}
      </Text>
      
      <Text style={[styles.insightDescription, { color: theme.textSecondary }]}>
        {insight.description}
      </Text>
      
      {insight.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: theme.text }]}>
            Sugestões:
          </Text>
          {insight.suggestions.map((suggestion: string, index: number) => (
            <View key={index} style={styles.suggestionItem}>
              <Icon name="circle-small" size={16} color={theme.primary} />
              <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>
                {suggestion}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {insight.category && (
        <View style={styles.categoryTag}>
          <Icon name="tag" size={14} color={theme.primary} />
          <Text style={[styles.categoryText, { color: theme.primary }]}>
            {insight.category}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="lightbulb-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Aguardando dados
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Adicione algumas transações para receber insights personalizados
      </Text>
    </View>
  );

  const renderInsightsSummary = () => {
    const highImpactCount = insights.filter(i => i.impact === 'high').length;
    const actionableCount = insights.filter(i => i.actionable).length;

    return (
      <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.summaryTitle, { color: theme.text }]}>
          Resumo dos Insights
        </Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: theme.error }]}>
              {highImpactCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Alta Prioridade
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: theme.success }]}>
              {actionableCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Acionáveis
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && insights.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Analisando seus dados financeiros...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {insights.length > 0 ? (
          <>
            {renderInsightsSummary()}
            
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Seus Insights Financeiros
            </Text>
            
            {insights.map(renderInsightCard)}
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightHeader: {
    marginBottom: 12,
  },
  insightIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionsContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 13,
    flex: 1,
    marginLeft: 4,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default InsightsScreen;