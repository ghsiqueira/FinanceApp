/**
 * Utilitários para sanitização de inputs do usuário
 */

/**
 * Remove caracteres especiais e HTML para prevenir XSS
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Remover tags HTML
  const withoutHtml = text.replace(/<[^>]*>?/gm, '');
  
  // Escapar caracteres especiais
  return withoutHtml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Sanitiza um objeto com strings
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const result = { ...obj } as T;
  
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = sanitizeText(result[key]) as unknown as T[typeof key];
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = sanitizeObject(result[key]) as unknown as T[typeof key];
    }
  }
  
  return result;
};

/**
 * Remove espaços em branco no início e fim de todas as strings em um objeto
 */
export const trimObjectStrings = <T extends Record<string, any>>(obj: T): T => {
  const result = { ...obj } as T;
  
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = result[key].trim() as unknown as T[typeof key];
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = trimObjectStrings(result[key]) as unknown as T[typeof key];
    }
  }
  
  return result;
};

export default {
  sanitizeText,
  sanitizeObject,
  trimObjectStrings
};