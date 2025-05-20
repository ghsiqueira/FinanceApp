// src/services/exportService.ts
import { Transaction, Category, Goal } from '../types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { formatCurrency } from '../utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Exporta transações para CSV
 */
export const exportTransactionsToCSV = async (
  transactions: Transaction[],
  fileName: string = 'transactions.csv'
): Promise<void> => {
  try {
    // Verificar disponibilidade de compartilhamento
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Compartilhamento não disponível neste dispositivo');
    }

    // Criar cabeçalho CSV
    let csvContent = 'Data,Tipo,Categoria,Descrição,Valor\n';

    // Adicionar linhas para cada transação
    transactions.forEach(transaction => {
      const date = new Date(
        typeof transaction.date === 'string'
          ? transaction.date
          : transaction.date.toString()
      );
      
      const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
      const type = transaction.type === 'income' ? 'Receita' : 'Despesa';
      
      const category = typeof transaction.category === 'object'
        ? transaction.category.name
        : 'Categoria';
        
      // Escapar aspas duplas e vírgulas para garantir formato CSV correto
      const description = transaction.description
        ? `"${transaction.description.replace(/"/g, '""')}"`
        : '';
        
      const amount = formatCurrency(transaction.amount).replace('R$', '').trim();
      
      csvContent += `${formattedDate},${type},${category},${description},${amount}\n`;
    });

    // Criar caminho do arquivo
    const fileUri = FileSystem.documentDirectory + fileName;
    
    // Escrever arquivo
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Compartilhar arquivo
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar Transações',
      UTI: 'public.comma-separated-values-text'
    });

  } catch (error) {
    console.error('Erro ao exportar transações:', error);
    throw error;
  }
};

/**
 * Exporta metas para CSV
 */
export const exportGoalsToCSV = async (
  goals: Goal[],
  fileName: string = 'goals.csv'
): Promise<void> => {
  try {
    // Verificar disponibilidade de compartilhamento
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Compartilhamento não disponível neste dispositivo');
    }

    // Criar cabeçalho CSV
    let csvContent = 'Título,Valor Alvo,Valor Atual,Progresso,Data Limite,Status,Categoria\n';

    // Adicionar linhas para cada meta
    goals.forEach(goal => {
      const title = `"${goal.title.replace(/"/g, '""')}"`;
      const targetAmount = formatCurrency(goal.targetAmount).replace('R$', '').trim();
      const currentAmount = formatCurrency(goal.currentAmount).replace('R$', '').trim();
      
      // Calcular progresso
      const progress = goal.targetAmount > 0
        ? Math.min(goal.currentAmount / goal.targetAmount * 100, 100).toFixed(1) + '%'
        : '0%';
        
      // Formatar data limite
      const deadline = goal.deadline
        ? format(new Date(goal.deadline), 'dd/MM/yyyy', { locale: ptBR })
        : 'Sem data';
        
      const status = goal.isCompleted ? 'Concluída' : 'Em andamento';
      
      // Pegar categoria
      const category = typeof goal.category === 'object'
        ? goal.category.name
        : '';
        
      csvContent += `${title},${targetAmount},${currentAmount},${progress},${deadline},${status},${category}\n`;
    });

    // Criar caminho do arquivo
    const fileUri = FileSystem.documentDirectory + fileName;
    
    // Escrever arquivo
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Compartilhar arquivo
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar Metas',
      UTI: 'public.comma-separated-values-text'
    });

  } catch (error) {
    console.error('Erro ao exportar metas:', error);
    throw error;
  }
};

/**
 * Exporta relatórios para HTML (para visualização como PDF)
 */
export const exportReportToHTML = async (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  fileName: string = 'report.html'
): Promise<void> => {
  try {
    // Verificar disponibilidade de compartilhamento
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Compartilhamento não disponível neste dispositivo');
    }

    // Calcular dados para o relatório
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const balance = income - expense;

    // Agrupar por categorias
    const categoryMap: Record<string, { 
      name: string; 
      color: string;
      type: 'income' | 'expense';
      amount: number; 
    }> = {};

    transactions.forEach(transaction => {
      const category = typeof transaction.category === 'object'
        ? transaction.category
        : null;
        
      if (!category) return;
      
      const categoryId = category._id || '';
      
      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          name: category.name,
          color: category.color,
          type: transaction.type,
          amount: 0
        };
      }
      
      categoryMap[categoryId].amount += transaction.amount;
    });

    // Separar categorias por tipo
    const expenseCategories = Object.values(categoryMap)
      .filter(c => c.type === 'expense')
      .sort((a, b) => b.amount - a.amount);
      
    const incomeCategories = Object.values(categoryMap)
      .filter(c => c.type === 'income')
      .sort((a, b) => b.amount - a.amount);

    // Período formatado
    const formattedStartDate = format(startDate, 'dd/MM/yyyy', { locale: ptBR });
    const formattedEndDate = format(endDate, 'dd/MM/yyyy', { locale: ptBR });
    const period = `${formattedStartDate} - ${formattedEndDate}`;

    // Criar conteúdo HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório Financeiro</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .summary {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            text-align: center;
          }
          .summary-item {
            flex: 1;
            padding: 15px;
            border-radius: 8px;
            margin: 0 5px;
          }
          .income {
            background-color: rgba(40, 167, 69, 0.1);
            color: #28a745;
          }
          .expense {
            background-color: rgba(220, 53, 69, 0.1);
            color: #dc3545;
          }
          .balance {
            background-color: rgba(0, 123, 255, 0.1);
            color: #0062cc;
          }
          .category-list {
            margin-bottom: 30px;
          }
          .category-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .category-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
          }
          .transactions {
            margin-top: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
          }
          .section-title {
            margin-top: 40px;
            margin-bottom: 15px;
            border-bottom: 2px solid #ddd;
            padding-bottom: 5px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }
          .amount {
            font-weight: bold;
          }
          .positive {
            color: #28a745;
          }
          .negative {
            color: #dc3545;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório Financeiro</h1>
          <p>Período: ${period}</p>
          <p>Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>
        
        <div class="summary">
          <div class="summary-item income">
            <h3>Receitas</h3>
            <p class="amount">${formatCurrency(income)}</p>
          </div>
          <div class="summary-item expense">
            <h3>Despesas</h3>
            <p class="amount">${formatCurrency(expense)}</p>
          </div>
          <div class="summary-item balance">
            <h3>Saldo</h3>
            <p class="amount ${balance >= 0 ? 'positive' : 'negative'}">${formatCurrency(balance)}</p>
          </div>
        </div>
        
        <h2 class="section-title">Receitas por Categoria</h2>
        <div class="category-list">
          ${incomeCategories.length > 0 ? incomeCategories.map(category => `
            <div class="category-item">
              <div>
                <span class="category-color" style="background-color: ${category.color}"></span>
                <span>${category.name}</span>
              </div>
              <div class="amount positive">${formatCurrency(category.amount)}</div>
            </div>
          `).join('') : '<p>Nenhuma receita no período selecionado</p>'}
        </div>
        
        <h2 class="section-title">Despesas por Categoria</h2>
        <div class="category-list">
          ${expenseCategories.length > 0 ? expenseCategories.map(category => `
            <div class="category-item">
              <div>
                <span class="category-color" style="background-color: ${category.color}"></span>
                <span>${category.name}</span>
              </div>
              <div class="amount negative">${formatCurrency(category.amount)}</div>
            </div>
          `).join('') : '<p>Nenhuma despesa no período selecionado</p>'}
        </div>
        
        <h2 class="section-title">Detalhamento de Transações</h2>
        <div class="transactions">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(transaction => {
                const date = new Date(
                  typeof transaction.date === 'string'
                    ? transaction.date
                    : transaction.date.toString()
                );
                
                const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
                const type = transaction.type === 'income' ? 'Receita' : 'Despesa';
                
                const category = typeof transaction.category === 'object'
                  ? transaction.category.name
                  : 'Categoria';
                  
                const description = transaction.description || '';
                const amount = formatCurrency(transaction.amount);
                const amountClass = transaction.type === 'income' ? 'positive' : 'negative';
                
                return `
                  <tr>
                    <td>${formattedDate}</td>
                    <td>${type}</td>
                    <td>${category}</td>
                    <td>${description}</td>
                    <td class="amount ${amountClass}">${amount}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Gerado pelo Finance App</p>
        </div>
      </body>
      </html>
    `;

    // Criar caminho do arquivo
    const fileUri = FileSystem.documentDirectory + fileName;
    
    // Escrever arquivo
    await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Compartilhar arquivo
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/html',
      dialogTitle: 'Exportar Relatório',
      UTI: 'public.html'
    });

  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    throw error;
  }
};

/**
 * Faz backup completo de todos os dados do usuário
 */
export const exportFullBackup = async (
  transactions: Transaction[],
  categories: Category[],
  goals: Goal[],
  fileName: string = 'finance_app_backup.json'
): Promise<void> => {
  try {
    // Verificar disponibilidade de compartilhamento
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Compartilhamento não disponível neste dispositivo');
    }

    // Criar objeto de backup
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        transactions,
        categories,
        goals
      }
    };

    // Converter para JSON
    const jsonContent = JSON.stringify(backupData, null, 2);

    // Criar caminho do arquivo
    const fileUri = FileSystem.documentDirectory + fileName;
    
    // Escrever arquivo
    await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Compartilhar arquivo
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Backup de Dados',
      UTI: 'public.json'
    });

  } catch (error) {
    console.error('Erro ao fazer backup de dados:', error);
    throw error;
  }
};

export default {
  exportTransactionsToCSV,
  exportGoalsToCSV,
  exportReportToHTML,
  exportFullBackup
};