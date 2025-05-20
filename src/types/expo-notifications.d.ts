// src/types/expo-notifications.d.ts
// Custom type definitions to fix the Expo Notifications trigger type issues

import * as Notifications from 'expo-notifications';

// Extend the Notifications namespace with our custom types
declare module 'expo-notifications' {
  namespace SchedulableTriggerInputTypes {
    // Ensure our types match the expected enumeration values
    export const DAILY: 'daily';
    export const DATE: 'date';
  }
  
  // Define the trigger input types more explicitly
  export interface DailyTriggerInput {
    type: SchedulableTriggerInputTypes.DAILY;
    hour: number;
    minute: number;
    repeats?: boolean;
  }

  export interface DateTriggerInput {
    type: SchedulableTriggerInputTypes.DATE;
    date: Date;
  }
}