import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, Transaction } from '../types';
import { format, addDays, isSameDay, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../utils/formatters';

// Chaves de armazenamento para configurações
const STORAGE_KEYS = {
  USER_SETTINGS: '@FinanceApp:userSettings',
};

// Configuração inicial das notificações
export const setupNotifications = async (): Promise<boolean> => {
  try {
    // Configurar como as notificações devem ser tratadas com o app em primeiro plano
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Pedir permissões em dispositivos iOS
    if (Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }

    return true;
  } catch (error) {
    console.error('Erro ao configurar notificações:', error);
    return false;
  }
};

// Verificar se as notificações estão habilitadas
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    // Verificar configuração do usuário
    const userSettings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (userSettings) {
      const settings = JSON.parse(userSettings);
      return settings.notificationsEnabled !== false; // Padrão é verdadeiro se não especificado
    }
    
    return true; // Padrão é habilitado
  } catch (error) {
    console.error('Erro ao verificar status das notificações:', error);
    return false;
  }
};

// Habilitar ou desabilitar notificações
export const setNotificationsEnabled = async (enabled: boolean): Promise<void> => {
  try {
    // Obter configurações atuais
    let settings: Record<string, any> = {};
    const userSettings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    
    if (userSettings) {
      settings = JSON.parse(userSettings);
    }
    
    // Atualizar configuração de notificações
    settings.notificationsEnabled = enabled;
    
    // Salvar configurações
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    
    // Se desabilitadas, cancelar todas as notificações agendadas
    if (!enabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } else {
      // Se habilitadas, reconfigurar notificações (opcional)
      // Você pode decidir recriar as notificações aqui
    }
  } catch (error) {
    console.error('Erro ao configurar notificações:', error);
    throw error;
  }
};

// Agendar notificações para lembretes de orçamento diário
export const scheduleDailyBudgetNotification = async (
  enabled: boolean = true
): Promise<string | null> => {
  try {
    if (!enabled) {
      // Cancelar notificações existentes com esta ID
      await Notifications.cancelScheduledNotificationAsync('daily-budget');
      return null;
    }

    // Verificar se notificações estão habilitadas
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) return null;

    // Cancelar notificações existentes com esta ID
    await Notifications.cancelScheduledNotificationAsync('daily-budget');

    // Configurar o gatilho para 8:00 AM diariamente
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
      repeats: true,
    };

    // Agendar a notificação
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lembrete de Orçamento',
        body: 'Não esqueça de acompanhar seu orçamento hoje!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'daily-budget' },
      },
      trigger,
      identifier: 'daily-budget',
    });

    return id;
  } catch (error) {
    console.error('Erro ao agendar notificação diária:', error);
    return null;
  }
};

// Agendar notificações para metas próximas do prazo
export const scheduleGoalDeadlineNotifications = async (
  goals: Goal[],
  enabled: boolean = true
): Promise<void> => {
  try {
    if (!enabled) {
      // Cancelar todas as notificações de metas
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      const goalNotifications = scheduledNotifications.filter(notification => {
        const data = notification.content.data as Record<string, any>;
        return data?.type && typeof data.type === 'string' && data.type.startsWith('goal-');
      });
      
      for (const notification of goalNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      
      return;
    }

    // Verificar se notificações estão habilitadas
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) return;

    // Filtrar metas com prazo e que não foram concluídas
    const goalsBefore = goals.filter(goal => {
      if (!goal.deadline || goal.isCompleted) return false;
      
      const deadline = new Date(goal.deadline);
      const today = new Date();
      
      // Verificar se o prazo é no futuro e dentro dos próximos 30 dias
      return isAfter(deadline, today) && 
             isAfter(addDays(today, 30), deadline);
    });

    // Cancelar notificações existentes de metas
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    const goalNotifications = scheduledNotifications.filter(notification => {
      const data = notification.content.data as Record<string, any>;
      return data?.type && typeof data.type === 'string' && data.type.startsWith('goal-');
    });
    
    for (const notification of goalNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    // Agendar novas notificações
    for (const goal of goalsBefore) {
      if (!goal._id || !goal.deadline) continue;
      
      const deadline = new Date(goal.deadline);
      
      // Notificação 3 dias antes do prazo
      const threeDaysBeforeDate = addDays(deadline, -3);
      if (isAfter(threeDaysBeforeDate, new Date())) {
        const trigger: Notifications.DateTriggerInput = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(
            threeDaysBeforeDate.getFullYear(),
            threeDaysBeforeDate.getMonth(),
            threeDaysBeforeDate.getDate(),
            9, // hora
            0, // minuto
            0  // segundo
          ),
        };
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Meta próxima do prazo',
            body: `Sua meta "${goal.title}" termina em 3 dias. Atual: ${(goal.currentAmount / goal.targetAmount * 100).toFixed(0)}%`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { type: `goal-${goal._id}-3days` },
          },
          trigger,
          identifier: `goal-${goal._id}-3days`,
        });
      }
      
      // Notificação 1 dia antes do prazo
      const oneDayBeforeDate = addDays(deadline, -1);
      if (isAfter(oneDayBeforeDate, new Date())) {
        const trigger: Notifications.DateTriggerInput = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(
            oneDayBeforeDate.getFullYear(),
            oneDayBeforeDate.getMonth(),
            oneDayBeforeDate.getDate(),
            9, // hora
            0, // minuto
            0  // segundo
          ),
        };
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Meta urgente!',
            body: `Sua meta "${goal.title}" termina amanhã. Atual: ${(goal.currentAmount / goal.targetAmount * 100).toFixed(0)}%`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { type: `goal-${goal._id}-1day` },
          },
          trigger,
          identifier: `goal-${goal._id}-1day`,
        });
      }
    }
  } catch (error) {
    console.error('Erro ao agendar notificações de metas:', error);
  }
};

// Agendar notificações para lembretes de transações recorrentes
export const scheduleRecurringTransactionNotifications = async (
  transactions: Transaction[],
  enabled: boolean = true
): Promise<void> => {
  try {
    if (!enabled) {
      // Cancelar todas as notificações de transações recorrentes
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      const transactionNotifications = scheduledNotifications.filter(notification => {
        const data = notification.content.data as Record<string, any>;
        return data?.type && typeof data.type === 'string' && data.type.startsWith('recurring-');
      });
      
      for (const notification of transactionNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      
      return;
    }

    // Verificar se notificações estão habilitadas
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) return;

    // Cancelar notificações existentes
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    const transactionNotifications = scheduledNotifications.filter(notification => {
      const data = notification.content.data as Record<string, any>;
      return data?.type && typeof data.type === 'string' && data.type.startsWith('recurring-');
    });
    
    for (const notification of transactionNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    // Identificar possíveis transações recorrentes
    // Por exemplo, identificamos transações com nomes semelhantes que ocorrem todo mês
    // Essa é uma lógica simplificada - você pode melhorá-la
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    // Criar um mapa para agrupar transações por data do mês e descrição
    const recurringMap: Record<string, Transaction[]> = {};
    
    transactions.forEach(transaction => {
      const transactionDate = new Date(
        typeof transaction.date === 'string'
          ? transaction.date
          : transaction.date.toString()
      );
      
      const dayOfMonth = transactionDate.getDate();
      const description = transaction.description || '';
      const category = typeof transaction.category === 'object'
        ? transaction.category.name
        : '';
        
      const key = `${dayOfMonth}-${category}-${description}`;
      
      if (!recurringMap[key]) {
        recurringMap[key] = [];
      }
      
      recurringMap[key].push(transaction);
    });
    
    // Considerar recorrente se tiver pelo menos 2 ocorrências
    const recurringTransactions = Object.values(recurringMap)
      .filter(group => group.length >= 2)
      .map(group => {
        // Pegar a transação mais recente
        return group.sort((a, b) => {
          const dateA = new Date(
            typeof a.date === 'string' ? a.date : a.date.toString()
          );
          const dateB = new Date(
            typeof b.date === 'string' ? b.date : b.date.toString()
          );
          
          return dateB.getTime() - dateA.getTime();
        })[0];
      });
    
    // Agendar notificações para transações recorrentes
    for (const transaction of recurringTransactions) {
      const transactionDate = new Date(
        typeof transaction.date === 'string'
          ? transaction.date
          : transaction.date.toString()
      );
      
      const dayOfMonth = transactionDate.getDate();
      const nextMonth = today.getMonth() + 1 > 11 ? 0 : today.getMonth() + 1;
      const nextYear = today.getMonth() + 1 > 11 ? today.getFullYear() + 1 : today.getFullYear();
      
      // Verificar se a data já passou este mês
      const notificationDate = new Date();
      notificationDate.setDate(dayOfMonth > daysInMonth ? daysInMonth : dayOfMonth);
      notificationDate.setFullYear(today.getFullYear());
      notificationDate.setMonth(today.getMonth());
      
      // Se a data já passou, programar para o próximo mês
      if (isAfter(startOfDay(today), startOfDay(notificationDate))) {
        notificationDate.setMonth(nextMonth);
        notificationDate.setFullYear(nextYear);
      }
      
      // Configurar para 2 dias antes
      const reminderDate = addDays(notificationDate, -2);
      
      // Não agendar se a data de lembrete já passou
      if (!isAfter(reminderDate, today)) continue;
      
      // Formatar data
      const formattedDate = format(notificationDate, 'dd/MM/yyyy', { locale: ptBR });
      
      // Descritivo amigável
      const description = transaction.description || 
        (typeof transaction.category === 'object' ? transaction.category.name : 'Transação');
      
      // Valor formatado  
      const amount = formatCurrency(transaction.amount);
      
      // Identificador único
      const identifier = `recurring-${transaction._id || Math.random().toString()}-${notificationDate.getTime()}`;
      
      // Agendar notificação
      const trigger: Notifications.DateTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(
          reminderDate.getFullYear(),
          reminderDate.getMonth(),
          reminderDate.getDate(),
          10, // hora
          0,  // minuto
          0   // segundo
        ),
      };
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: transaction.type === 'income' ? 'Receita Prevista' : 'Despesa Prevista',
          body: `Lembrete: ${description} de ${amount} previsto para ${formattedDate}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: { 
            type: 'recurring-transaction',
            transactionId: transaction._id,
            date: notificationDate.toISOString()
          },
        },
        trigger,
        identifier,
      });
    }
  } catch (error) {
    console.error('Erro ao agendar notificações de transações recorrentes:', error);
  }
};

// Notificação para orçamento mensal
export const scheduleMonthlyBudgetNotification = async (
  enabled: boolean = true
): Promise<string | null> => {
  try {
    if (!enabled) {
      await Notifications.cancelScheduledNotificationAsync('monthly-budget');
      return null;
    }

    // Verificar se notificações estão habilitadas
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) return null;

    // Cancelar notificações existentes com esta ID
    await Notifications.cancelScheduledNotificationAsync('monthly-budget');

    // Configurar para o último dia do mês às 18:00
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Se já estamos no último dia do mês, agendar para o mês seguinte
    if (today.getDate() === lastDayOfMonth.getDate()) {
      lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
    }
    
    const trigger: Notifications.DateTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(
        lastDayOfMonth.getFullYear(),
        lastDayOfMonth.getMonth(),
        lastDayOfMonth.getDate(),
        18, // hora
        0,  // minuto
        0   // segundo
      ),
    };

    // Agendar a notificação
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Revisão do Orçamento Mensal',
        body: 'O mês está terminando! Que tal revisar seu orçamento e planejar o próximo mês?',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'monthly-budget' },
      },
      trigger,
      identifier: 'monthly-budget',
    });

    return id;
  } catch (error) {
    console.error('Erro ao agendar notificação mensal:', error);
    return null;
  }
};

// Registrar handlers para quando o usuário interage com a notificação
export const registerNotificationHandlers = () => {
  // Permitir que o app seja aberto a partir de uma notificação
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Handler para quando o app é aberto a partir de uma notificação
  const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(response => {
    // Aqui você pode navegar para telas específicas do app
    // com base no tipo de notificação que foi tocada
    const data = response.notification.request.content.data as Record<string, any>;
    
    if (data.type === 'daily-budget') {
      // Por exemplo, navegar para a tela de transações
      // navigation.navigate('TransactionsTab');
      console.log('Notificação de orçamento diário tocada');
    } 
    else if (data.type && typeof data.type === 'string' && data.type.startsWith('goal-')) {
      // Navegar para a tela de detalhes da meta
      const goalId = data.type.split('-')[1];
      // navigation.navigate('GoalsTab', { screen: 'GoalDetails', params: { goalId } });
      console.log('Notificação de meta tocada:', goalId);
    }
    else if (data.type === 'recurring-transaction') {
      // Navegar para tela de adicionar transação
      // navigation.navigate('TransactionsTab', { screen: 'AddTransaction' });
      console.log('Notificação de transação recorrente tocada');
    }
  });

  // Retornar função de limpeza para uso em useEffect
  return () => {
    Notifications.removeNotificationSubscription(notificationResponseListener);
  };
};

// Função de configuração inicial de todas as notificações
export const initializeNotifications = async (
  transactions: Transaction[] = [],
  goals: Goal[] = []
): Promise<void> => {
  try {
    // Configurar notificações
    const permissionsGranted = await setupNotifications();
    if (!permissionsGranted) {
      console.log('Permissões de notificação não concedidas');
      return;
    }

    // Verificar se notificações estão habilitadas nas configurações do usuário
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) {
      console.log('Notificações desabilitadas nas configurações do usuário');
      return;
    }

    // Agendar todos os tipos de notificações
    await scheduleDailyBudgetNotification(true);
    await scheduleMonthlyBudgetNotification(true);
    await scheduleGoalDeadlineNotifications(goals, true);
    await scheduleRecurringTransactionNotifications(transactions, true);
    
    console.log('Todas as notificações foram configuradas com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar notificações:', error);
  }
};

export default {
  setupNotifications,
  areNotificationsEnabled,
  setNotificationsEnabled,
  scheduleDailyBudgetNotification,
  scheduleGoalDeadlineNotifications,
  scheduleRecurringTransactionNotifications,
  scheduleMonthlyBudgetNotification,
  registerNotificationHandlers,
  initializeNotifications
};