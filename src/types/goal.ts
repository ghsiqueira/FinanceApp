// src/types/goal.ts
export interface Goal {
  id: string;
  userId: string;
  title: string; // Era 'name'
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'baixa' | 'media' | 'alta';
  isCompleted: boolean;
  isPaused: boolean;
  lastContribution?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgress {
  goal: Goal;
  percentage: number;
  remainingAmount: number;
  remainingDays: number;
  isCompleted: boolean;
  projectedCompletionDate: string | null;
  monthlyTarget: number;
  weeklyTarget: number;
  dailyTarget: number;
  onTrack: boolean;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
  category: string;
  priority: 'baixa' | 'media' | 'alta';
}