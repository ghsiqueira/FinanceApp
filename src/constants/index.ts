// src/constants/index.ts (atualizado com DEFAULT_SETTINGS)

// Ícones disponíveis para categorias
export const CATEGORY_ICONS = [
  'home',
  'food',
  'cart',
  'car',
  'food-apple',
  'shopping',
  'medical-bag',
  'school',
  'bus',
  'airplane',
  'movie',
  'music',
  'beer',
  'gas-station',
  'wallet',
  'cash',
  'bank',
  'credit-card',
  'gift',
  'cake',
  'heart',
  'phone',
  'cellphone',
  'laptop',
  'television',
  'lightbulb',
  'water',
  'flash',
  'trash-can',
  'broom',
  'flower',
  'dog',
  'cat',
  'baby-carriage',
  'human-male',
  'human-female',
  'account',
  'account-group',
  'basketball',
  'soccer',
  'tennis',
  'swim',
  'bicycle',
  'dumbbell',
  'pill',
  'needle',
  'hospital-box',
  'briefcase',
  'chart-line',
  'chart-bar',
  'book',
  'bookshelf',
  'newspaper',
  'printer',
  'camera',
  'palette',
  'brush',
  'lead-pencil',
  'format-paint',
  'flag',
  'star',
  'alarm',
  'calendar',
  'map-marker',
  'earth',
  'umbrella',
  'beach',
  'sunglasses',
  'palm-tree',
  'tshirt-crew',
  'hanger',
  'shoe-formal',
  'bag-personal',
  'crown',
  'ring',
  'coffee',
  'pizza',
  'cake-variant',
  'fruit-watermelon',
  'cup',
  'bottle-wine',
  'bowl',
  'silverware-fork-knife',
  'cookie',
  'ice-cream',
  'candy',
];

// Cores disponíveis para categorias
export const CATEGORY_COLORS = [
  '#4CAF50', // Verde
  '#2196F3', // Azul
  '#9C27B0', // Roxo
  '#F44336', // Vermelho
  '#FF9800', // Laranja
  '#795548', // Marrom
  '#607D8B', // Cinza azulado
  '#E91E63', // Rosa
  '#009688', // Verde-água
  '#673AB7', // Roxo escuro
  '#3F51B5', // Índigo
  '#8BC34A', // Verde limão
  '#FFC107', // Amarelo
  '#FF5722', // Laranja escuro
  '#00BCD4', // Ciano
  '#CDDC39', // Lima
  '#9E9E9E', // Cinza
  '#FF4081', // Rosa claro
  '#7C4DFF', // Violeta
  '#536DFE', // Azul índigo
  '#FF6E40', // Coral
  '#69F0AE', // Verde claro
  '#FFD740', // Âmbar
  '#40C4FF', // Azul claro
];

// Categorias padrão para serem criadas inicialmente se o usuário não tiver categorias
export const DEFAULT_CATEGORIES = [
  // Categorias de receita
  {
    name: 'Salário',
    color: '#4CAF50',
    icon: 'cash',
    type: 'income'
  },
  {
    name: 'Freelance',
    color: '#8BC34A',
    icon: 'laptop',
    type: 'income'
  },
  {
    name: 'Investimentos',
    color: '#009688',
    icon: 'chart-line',
    type: 'income'
  },
  {
    name: 'Presente',
    color: '#E91E63',
    icon: 'gift',
    type: 'income'
  },
  
  // Categorias de despesa
  {
    name: 'Alimentação',
    color: '#FF5722',
    icon: 'food',
    type: 'expense'
  },
  {
    name: 'Transporte',
    color: '#3F51B5',
    icon: 'car',
    type: 'expense'
  },
  {
    name: 'Moradia',
    color: '#795548',
    icon: 'home',
    type: 'expense'
  },
  {
    name: 'Saúde',
    color: '#F44336',
    icon: 'hospital-box',
    type: 'expense'
  },
  {
    name: 'Educação',
    color: '#9C27B0',
    icon: 'school',
    type: 'expense'
  },
  {
    name: 'Lazer',
    color: '#FF9800',
    icon: 'movie',
    type: 'expense'
  },
  {
    name: 'Compras',
    color: '#2196F3',
    icon: 'cart',
    type: 'expense'
  },
  {
    name: 'Assinaturas',
    color: '#607D8B',
    icon: 'newspaper',
    type: 'expense'
  }
];

// Configurações padrão do aplicativo
export const DEFAULT_SETTINGS = {
  theme: 'light',
  currency: 'BRL',
  hideValues: false,
  notificationsEnabled: true,
};