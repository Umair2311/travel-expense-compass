
export interface Travel {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  participants: Participant[];
  expenses: Expense[];
  advanceContributions: AdvanceContribution[];
  created: Date;
  updated: Date;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  participationPeriods: ParticipationPeriod[];
}

export interface ParticipationPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
}

export type ExpenseType = 'Meal' | 'Fuel' | 'Hotel' | 'Custom';

export interface Expense {
  id: string;
  amount: number;
  date: Date;
  type: ExpenseType;
  customType?: string;
  paidBy: ExpensePayer[];
  paidFromFund: boolean;
  sharedAmong: ExpenseParticipant[];
  comment?: string;
  created: Date;
  updated: Date;
}

export interface ExpensePayer {
  participantId: string;
  amount: number;
}

export interface ExpenseParticipant {
  participantId: string;
  included: boolean;
  weight: number; // For unequal splits
}

export interface AdvanceContribution {
  id: string;
  participantId: string;
  amount: number;
  date: Date;
  comment?: string;
  created: Date;
}

export interface Settlement {
  participantId: string;
  name: string;
  advancePaid: number;
  personallyPaid: number;
  expenseShare: number;
  dueAmount: number;
  refundAmount: number;
  donated: boolean;
}

export interface DateRange {
  id?: string;
  startDate: Date;
  endDate: Date;
}
