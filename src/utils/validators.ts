// src/utils/validators.ts
import * as Yup from 'yup';

// Esquema de validação para transações
export const transactionSchema = Yup.object().shape({
  amount: Yup.number()
    .required('Valor é obrigatório')
    .moreThan(0, 'Valor deve ser maior que zero'),
  
  type: Yup.string()
    .oneOf(['income', 'expense'], 'Tipo deve ser receita ou despesa')
    .required('Tipo é obrigatório'),
  
  category: Yup.string()
    .required('Categoria é obrigatória'),
  
  description: Yup.string()
    .max(100, 'Descrição deve ter no máximo 100 caracteres'),
  
  date: Yup.date()
    .required('Data é obrigatória')
    .max(new Date(), 'Data não pode ser no futuro')
});

// Esquema de validação para categorias
export const categorySchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório')
    .max(30, 'Nome deve ter no máximo 30 caracteres'),
  
  color: Yup.string()
    .required('Cor é obrigatória'),
  
  icon: Yup.string()
    .required('Ícone é obrigatório'),
  
  type: Yup.string()
    .oneOf(['income', 'expense', 'both'], 'Tipo deve ser receita, despesa ou ambos')
    .required('Tipo é obrigatório')
});

// Esquema de validação para metas
export const goalSchema = Yup.object().shape({
  title: Yup.string()
    .required('Título é obrigatório')
    .max(50, 'Título deve ter no máximo 50 caracteres'),
  
  targetAmount: Yup.number()
    .required('Valor alvo é obrigatório')
    .moreThan(0, 'Valor alvo deve ser maior que zero'),
  
  currentAmount: Yup.number()
    .min(0, 'Valor atual não pode ser negativo')
    .default(0),
  
  deadline: Yup.date()
    .min(new Date(), 'Data limite deve ser no futuro'),
  
  color: Yup.string()
    .required('Cor é obrigatória')
});

// Validação para adicionar valor à meta
export const goalAddValueSchema = Yup.object().shape({
  amount: Yup.number()
    .required('Valor é obrigatório')
    .moreThan(0, 'Valor deve ser maior que zero')
});

export default {
  transactionSchema,
  categorySchema,
  goalSchema,
  goalAddValueSchema
};