import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Transaction } from './transaction';
import { Budget } from './budget';
import { Goal } from './goal';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  AddTransaction: { transaction?: Transaction };
  Budget: undefined;
  AddBudget: { budget?: Budget };
  Goals: undefined;
  AddGoal: { goal?: Goal };
  Profile: undefined;
  EditProfile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainScreenProps<T extends keyof MainStackParamList> = 
  NativeStackScreenProps<MainStackParamList, T>;
